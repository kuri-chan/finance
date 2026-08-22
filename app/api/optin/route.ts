import { buildOptinEmail } from '@/lib/couple/optin-email';

/**
 * 読者所有（メール先行）の登録エンドポイント。
 * 正典：docs/手取りラボ_読者所有_設計と実装仕様.md（B-4 メール連携 / B-7 同意・最小保存）。
 *
 * 処理順（要件）：
 *   ① Brevo /v3/contacts で連絡先を upsert（updateEnabled=true, listIds[3], 属性6つ）
 *   ② Brevo /v3/smtp/email で「設計図＋最初の一手」メールを即時送信（A-3）
 * ②が失敗しても①は成立させる（取りこぼし防止）。その場合 emailSent:false を返し、
 * クライアントは「登録完了・迷惑メール確認」を表示する。
 *
 * 秘密鍵 BREVO_API_KEY はサーバー専用（NEXT_PUBLIC を付けない）。PIIは最小限
 * （email＋診断結果の分類値＋segment）。年収・支出等の生値は受け取らない。
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BREVO_BASE = 'https://api.brevo.com/v3';
const LIST_ID = 3; // 読者所有リスト（Brevo 側で作成済み）
const SENDER = { name: '手取りラボ（手取りの番人）', email: 'info@tedorilab.com' } as const;
const UNSUBSCRIBE = 'mailto:info@tedorilab.com?subject=%E9%85%8D%E4%BF%A1%E8%A7%A3%E9%99%A4'; // 件名=配信解除

const SEGMENTS = ['mamori_usui', 'hoken_slim', 'seme', 'balance'] as const;
type Segment = (typeof SEGMENTS)[number];

/** クライアントから受け取る登録ペイロード（生の金額は含めない） */
interface OptinBody {
  email?: unknown;
  consent?: unknown;
  type?: unknown; // 型名（例：バランス型）
  typeLabel?: unknown; // 型名＋フレーバー（例：バランス型・チーム派）
  flavor?: unknown; // チーム派 / 自立派 / なし
  firstMove?: unknown; // 最初の一手
  d?: unknown; // 守り 0-2
  o?: unknown; // 攻め 0-2
  kids?: unknown; // いる / 予定 / なし
  segment?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- 簡易レート制限（同一IP・短時間の連投を抑止。サーバーレスのため best-effort） ----
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  return arr.length > MAX_HITS;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://tedorilab.com';
  return raw.replace(/\/+$/, '');
}

export async function POST(req: Request): Promise<Response> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    // 設定漏れはユーザーには汎用文言で返し、詳細はログのみ
    console.error('[optin] BREVO_API_KEY is not set');
    return json({ ok: false, error: 'provider_error' }, 502);
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let body: OptinBody;
  try {
    body = (await req.json()) as OptinBody;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid_email' }, 400);
  if (body.consent !== true) return json({ ok: false, error: 'consent_required' }, 400);

  // 分類値の正規化（欠損しても登録は通す＝取りこぼし防止）
  const typeName = typeof body.type === 'string' ? body.type : '';
  const typeLabel = typeof body.typeLabel === 'string' && body.typeLabel ? body.typeLabel : typeName;
  const flavor = typeof body.flavor === 'string' ? body.flavor : 'なし';
  const firstMove = typeof body.firstMove === 'string' ? body.firstMove : '';
  const kids = typeof body.kids === 'string' ? body.kids : '';
  const d = Number.isFinite(Number(body.d)) ? Number(body.d) : 0;
  const o = Number.isFinite(Number(body.o)) ? Number(body.o) : 0;
  const segment: Segment = SEGMENTS.includes(body.segment as Segment)
    ? (body.segment as Segment)
    : 'balance';

  // ---- ① 連絡先を upsert（失敗したら登録自体が成立しないのでエラーを返す） ----
  try {
    const res = await fetch(`${BREVO_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        updateEnabled: true,
        listIds: [LIST_ID],
        attributes: {
          TYPE: typeName,
          FLAVOR: flavor,
          MAMORI_D: d,
          SEME_O: o,
          KIDS: kids,
          SEGMENT: segment,
        },
      }),
    });
    // 201=作成 / 204=更新 が正常。updateEnabled により重複はエラーにならない。
    if (!res.ok && res.status !== 204) {
      const detail = await res.text().catch(() => '');
      console.error('[optin] contacts upsert failed', res.status, detail);
      return json({ ok: false, error: 'provider_error' }, 502);
    }
  } catch (e) {
    console.error('[optin] contacts upsert threw', e);
    return json({ ok: false, error: 'provider_error' }, 502);
  }

  // ---- ② 設計図＋最初の一手メールを即時送信（失敗しても①は成立） ----
  let emailSent = false;
  try {
    const mail = buildOptinEmail({
      typeName,
      typeLabel,
      firstMove,
      diagnoseUrl: `${siteUrl()}/diagnose`,
      unsubscribeUrl: UNSUBSCRIBE,
    });
    const res = await fetch(`${BREVO_BASE}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email }],
        subject: mail.subject,
        htmlContent: mail.html,
        textContent: mail.text,
        headers: { 'List-Unsubscribe': `<${UNSUBSCRIBE}>` },
      }),
    });
    emailSent = res.ok;
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[optin] smtp/email failed', res.status, detail);
    }
  } catch (e) {
    console.error('[optin] smtp/email threw', e);
  }

  // 登録は成立。メール送信可否のみ emailSent で返す。
  return json({ ok: true, emailSent }, 200);
}

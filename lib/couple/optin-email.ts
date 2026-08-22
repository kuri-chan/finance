/**
 * 読者所有・メール先行の「設計図＋最初の一手」メール本文ビルダー（純関数）。
 * 正典：docs/手取りラボ_読者所有_設計と実装仕様.md A-3。
 * TYPE(型名)・最初の一手・診断リンク(/diagnose) を差し込み、件名・HTML・テキストを返す。
 * 差出人設定と実送信は API 側（app/api/optin/route.ts）。ここは文面生成のみでテスト可能に切り出す。
 * トーン：手取りの番人の「手紙」。売り込まない・正直（CLAUDE.md 舵⑤／docs/brand.md）。
 */

export interface OptinEmailInput {
  /** 型名（例：バランス型）。件名に使う */
  typeName: string;
  /** 型名＋フレーバー（例：バランス型・チーム派）。本文に使う */
  typeLabel: string;
  /** 最初の一手（例：配分を設計する） */
  firstMove: string;
  /** 改善余地診断への絶対URL（…/diagnose） */
  diagnoseUrl: string;
  /** 配信解除リンク（フッター必須・A-2/B-7） */
  unsubscribeUrl: string;
  /** 有料「深掘り版」note のURL（未設定なら本文に出さない） */
  noteUrl?: string;
}

export interface OptinEmail {
  subject: string;
  html: string;
  text: string;
}

/** HTML 差し込み用の最小エスケープ（動的値のみに適用） */
function esc(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOptinEmail(i: OptinEmailInput): OptinEmail {
  const subject = `【手取りラボ】あなたたちの設計図（${i.typeName}）と、最初の一手`;

  const text = [
    '手取りの番人です。診断おつかれさまでした。',
    `あなたたちは「${i.typeLabel}」。まずやると効くのは【最初の一手：${i.firstMove}】でした。`,
    '',
    '上から1つずつでOK。準備ができたら、そのつど“正直なやり方”だけお送りします。',
    '',
    '▼ もっと具体的に知りたい人へ',
    'あなたの世帯だと、保険・ふるさと納税・iDeCo・NISAで“いくら”手取りを増やせるか、円で出せます。',
    '→ 改善余地を円で診断する（1分）',
    i.diagnoseUrl,
    ...(i.noteUrl
      ? ['', '自分の数字で回したい人は、深掘り版（先行1,480円）も。', i.noteUrl]
      : []),
    '',
    '――――――――――',
    '手取りラボ（手取りの番人）',
    'info@tedorilab.com',
    `配信解除はこちら：${i.unsubscribeUrl}`,
  ].join('\n');

  // HTML は簡素な手紙調（インラインCSS・幅制限）。動的値は esc() 済み。
  const html = `<!doctype html>
<html lang="ja">
<body style="margin:0;padding:0;background:#f6f7f5;">
  <div style="max-width:560px;margin:0 auto;padding:28px 22px;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;color:#1f2a24;line-height:1.75;font-size:15px;">
    <p style="margin:0 0 14px;">手取りの番人です。診断おつかれさまでした。</p>
    <p style="margin:0 0 14px;">
      あなたたちは「<strong>${esc(i.typeLabel)}</strong>」。<br>
      まずやると効くのは【最初の一手：<strong>${esc(i.firstMove)}</strong>】でした。
    </p>
    <p style="margin:0 0 20px;">上から1つずつでOK。準備ができたら、そのつど“正直なやり方”だけお送りします。</p>

    <div style="border-top:1px solid #dfe3df;margin:22px 0;"></div>

    <p style="margin:0 0 6px;font-weight:700;">▼ もっと具体的に知りたい人へ</p>
    <p style="margin:0 0 16px;">
      あなたの世帯だと、保険・ふるさと納税・iDeCo・NISAで“いくら”手取りを増やせるか、円で出せます。
    </p>
    <p style="margin:0 0 24px;">
      <a href="${esc(i.diagnoseUrl)}"
         style="display:inline-block;background:#0f7a52;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">
        改善余地を“円”で診断する（1分）
      </a>
    </p>
${
  i.noteUrl
    ? `    <p style="margin:0 0 24px;font-size:14px;color:#55605a;">
      自分の数字で回したい人は、<a href="${esc(i.noteUrl)}" style="color:#0c5f40;">深掘り版（先行1,480円）</a>も。保険・ふるさと納税・iDeCo・NISA・住宅・家計を、あなたの数字で。
    </p>\n`
    : ''
}
    <div style="border-top:1px solid #dfe3df;margin:24px 0 14px;"></div>
    <p style="margin:0;font-size:12px;color:#7b857e;line-height:1.7;">
      手取りラボ（手取りの番人）｜info@tedorilab.com<br>
      配信はいつでも解除できます。<a href="${esc(i.unsubscribeUrl)}" style="color:#7b857e;">配信解除はこちら</a>
    </p>
  </div>
</body>
</html>`;

  return { subject, html, text };
}

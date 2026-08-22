'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { Diagnosis } from '@/lib/couple';

/**
 * 読者所有（メール/LINE）登録カード。設計図カードの直下に置く。
 * 正典：docs/手取りラボ_読者所有_設計と実装仕様.md（A-2 コピー／B-4 メール／B-6 計測／B-7 同意）。
 *
 * 現スコープ：メール先行で実稼働。メール入力＋同意チェック（/privacyリンク）＋送信で
 * /api/optin を呼び、Brevo に upsert ＋「設計図＋最初の一手」メールを即時送信する。
 * LINE は仕様上「主」だが実装はメール先行のため“近日公開”表示のまま据え置き（B-8 実装順）。
 * PIIは最小限：送るのは email＋診断の分類値のみ（年収・貯金などの生値は送らない）。
 */

type Status = 'idle' | 'submitting' | 'done' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OptinCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [emailSent, setEmailSent] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // カードが実際に表示されたタイミングで optin_card_view を1回だけ発火（B-6）。
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            trackEvent('optin_card_view', { segment: diagnosis.segment, type: diagnosis.type.typeName });
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [diagnosis.segment, diagnosis.type.typeName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    setErrorMsg('');

    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg('メールアドレスの形式をご確認ください。');
      return;
    }
    if (!consent) {
      setErrorMsg('プライバシーポリシーへの同意が必要です。');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/optin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          consent: true,
          type: diagnosis.type.typeName,
          typeLabel: diagnosis.typeLabel,
          // フレーバーは先頭「・」を除去し、空なら「なし」に正規化して送る
          flavor: diagnosis.flavor.replace(/^・/, '') || 'なし',
          firstMove: diagnosis.type.firstMove,
          d: diagnosis.d,
          o: diagnosis.o,
          kids: diagnosis.kids,
          segment: diagnosis.segment,
        }),
      });
      const data: { ok?: boolean; emailSent?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));

      if (res.ok && data.ok) {
        // 登録成立。opt-in 完了として計測（B-6）。
        trackEvent('optin_submit', { channel: 'email', segment: diagnosis.segment });
        if (data.emailSent !== false) trackEvent('plan_delivered', { channel: 'email' });
        setEmailSent(data.emailSent !== false);
        setStatus('done');
        return;
      }

      // 失敗（登録自体が不成立）
      setErrorMsg(
        data.error === 'invalid_email'
          ? 'メールアドレスの形式をご確認ください。'
          : data.error === 'rate_limited'
            ? '短時間に複数回送信されました。少し時間をおいてお試しください。'
            : '登録に失敗しました。時間をおいて再度お試しください。',
      );
      setStatus('error');
    } catch {
      setErrorMsg('通信に失敗しました。電波状況をご確認のうえ再度お試しください。');
      setStatus('error');
    }
  }

  return (
    <div ref={ref} className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/70 p-5">
      <p className="text-base font-bold text-brand-800">
        この設計図、保存して“実行”まで伴走します
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-900/80">
        あなたたちの【{diagnosis.typeLabel}】の設計図を保存。口座・保険・貯金・投資を、上から1つずつ整える手助けをします。
        売り込みはしません。制度が変わったら、あなたの数字への影響もお知らせします。
      </p>

      {status === 'done' ? (
        <div className="mt-4 rounded-xl border border-brand-300 bg-white p-4">
          <p className="text-sm font-bold text-brand-800">登録が完了しました。</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-900/80">
            {emailSent
              ? '「設計図＋最初の一手」メールをお送りしました。数分たっても届かない場合は、迷惑メールフォルダをご確認ください。'
              : '「設計図＋最初の一手」メールをお送りします。届かない場合は、迷惑メールフォルダをご確認ください。'}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-4">
          {/* LINE は仕様上「主」だが実装はメール先行のため“近日”据え置き */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#06C755]/90 px-4 py-2 text-sm font-semibold text-white opacity-60">
              LINEで受け取る（無料）
            </span>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              近日公開
            </span>
          </div>

          <label htmlFor="optin-email" className="mb-1.5 block text-sm font-medium text-brand-800">
            メールで受け取る
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="optin-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'submitting'}
              className="w-full rounded-lg border border-brand-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="shrink-0 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status === 'submitting' ? '送信中…' : '設計図を受け取る'}
            </button>
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-brand-800">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              disabled={status === 'submitting'}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
            />
            <span>
              診断結果の保存と設計図メールの受け取りに同意します（
              <Link href="/privacy" className="underline decoration-brand-300 underline-offset-2">
                プライバシーポリシー
              </Link>
              ）。いつでも解除できます。
            </span>
          </label>

          {errorMsg && (
            <p className="mt-2 text-xs font-medium text-red-600" role="alert">
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

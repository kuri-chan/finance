'use client';

import { getAffiliateById, getDisclosure } from '@/lib/affiliate';
import { trackEvent } from '@/lib/analytics';

/**
 * 「結婚したら診断」結果の“従”の一手＝保険の見直し・無料相談（life_review）への送客。
 * 正典：docs/手取りラボ_ClaudeCode実装パッケージ_第一弾.md（動線設計）／CLAUDE.md 舵⑤。
 *
 * 位置づけ：主は /diagnose への橋（全体最適・中立）。本CTAはその“下”に置く従の導線。
 * フレーム：子ども有無で出し分けない。「結婚を機に見直す（足りなければ足す・多ければ減らす）」で
 *   全カップルに正直に当てはめる（＝過剰保険の是正＝元損保の本丸）。
 * URL未設定（＝ASP未承認）の間は何も表示しない（ArticleConsultCta と同じ承認即効化）。
 * 景表法（ステマ規制）：PR明示＋中立性開示を必須。保険業法：募集はせず相談窓口へ送客のみ。
 */
export function CoupleConsultCta() {
  const cta = getAffiliateById('life_review');
  if (!cta || !cta.available) return null;

  const { destination, prLabel } = cta;
  const { disclosure } = getDisclosure();

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
          {prLabel}
        </span>
        <span className="text-sm font-medium text-slate-500">保険の見直し・無料相談</span>
      </div>
      <p className="mt-2 text-base font-bold text-slate-900">{destination.label}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        結婚を機に、二人の保険を棚卸し。足りなければ足す、多ければ減らす——過不足は無料相談で具体化できます。要らなければ「今のままでいい」で構いません。
      </p>
      <a
        href={destination.url}
        target="_blank"
        rel="sponsored noopener"
        onClick={() => trackEvent('affiliate_click', { from: 'couple', dest: 'life_review' })}
        className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
      >
        {destination.label} →
      </a>
      <p className="mt-3 text-xs text-slate-400">{disclosure}</p>
    </div>
  );
}

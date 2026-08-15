import { getAffiliateById, getDisclosure } from '@/lib/affiliate';

/**
 * NISA/iDeCo/家計カテゴリ記事の末尾に置く、資産形成・ライフリスク相談（life_review3）への送客CTA。
 * URLが未設定の間は何も表示しない（承認即効化の型はArticleConsultCtaと同じ）。
 * 保険カテゴリのArticleConsultCta（life_review）とは対象カテゴリを分け、重複表示しない。
 */
export function ArticleFpConsultCta() {
  const cta = getAffiliateById('life_review3');
  if (!cta || !cta.available) return null;

  const { destination, prLabel } = cta;
  const { disclosure } = getDisclosure();

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
          {prLabel}
        </span>
        <span className="text-sm font-medium text-slate-500">資産形成・ライフリスクの相談</span>
      </div>
      <p className="mt-2 text-base font-bold text-slate-900">{destination.label}</p>
      <p className="mt-1 text-sm text-slate-600">
        自分で試算した後、第三者に一度整理してもらいたい場合の無料相談窓口。要らなければ「今のままでいい」で構いません。
      </p>
      <a
        href={destination.url}
        target="_blank"
        rel="sponsored noopener"
        className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
      >
        {destination.label} →
      </a>
      <p className="mt-3 text-xs text-slate-400">{disclosure}</p>
    </div>
  );
}

import { getAffiliateById, getDisclosure } from '@/lib/affiliate';

/**
 * 保険カテゴリ記事の末尾に置く、保険相談（life_review）への送客CTA。
 * URLが未設定（＝ASP未承認）の間は何も表示しない → 承認でURLを入れた瞬間に
 * 保険カテゴリ全記事へ自動で出る（コード変更不要＝「承認即効化」）。
 * 景表法（ステマ規制）：PR明示＋中立性の開示を併記。診断（無料・中立）を主、相談は従。
 */
export function ArticleConsultCta() {
  const cta = getAffiliateById('life_review');
  if (!cta || !cta.available) return null;

  const { destination, prLabel } = cta;
  const { disclosure } = getDisclosure();

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
          {prLabel}
        </span>
        <span className="text-sm font-medium text-slate-500">保険の見直し・無料相談</span>
      </div>
      <p className="mt-2 text-base font-bold text-slate-900">{destination.label}</p>
      <p className="mt-1 text-sm text-slate-600">
        必要保障額の過不足を把握したら、複数社を比較できる無料相談で具体化を。要らなければ「今のままでいい」で構いません。
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

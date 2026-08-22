import Link from 'next/link';

/**
 * 結婚・同棲・出産・共働き系の記事末尾にだけ置く、「結婚したら診断」(/couple)への回遊導線。
 * 出し分けは記事ページ側（COUPLE_ARTICLE_SLUGS）で行う＝文脈が合う記事だけに限定し“アフィリ臭”を避ける。
 * 主CTA（ArticleCta＝/diagnose）とは見た目を分け、二人版は「入口」として静かに併置する。
 */
export function ArticleCoupleCta() {
  return (
    <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/70 p-6">
      <p className="text-sm font-medium text-brand-700">結婚・同棲する二人へ</p>
      <p className="mt-1 text-lg font-bold leading-snug text-brand-900">
        二人版の「お金の設計図」を、30秒で
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brand-900/80">
        二人のお金は、合算して初めて設計できます。まず30秒で“どうぶつタイプ”の設計図を。売り込みはありません。
      </p>
      <Link
        href="/couple"
        className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
      >
        二人版の診断をやってみる →
      </Link>
    </div>
  );
}

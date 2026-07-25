import Link from 'next/link';

/** 記事末尾に置く、診断ツールへの誘導CTA（内部リンク・回遊導線）。 */
export function ArticleCta() {
  return (
    <div className="mt-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-md">
      <p className="text-sm font-medium text-brand-100">手取りラボ</p>
      <p className="mt-1 text-xl font-bold leading-snug">
        あなたたち世帯の改善余地は、年いくら？
      </p>
      <p className="mt-2 text-sm text-brand-50">
        必要保障額の試算・過剰保険チェック・ふるさと納税・iDeCo・NISAの活用余地を、効果額順にまとめて見える化。ログイン不要・無料です。
      </p>
      <Link
        href="/diagnose"
        className="mt-4 inline-flex items-center rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        無料で診断する →
      </Link>
    </div>
  );
}

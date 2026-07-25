import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * シェアされた診断結果の着地ページ。
 * クエリの集約値からOGメタタグ（/api/og）を生成し、SNSにカード画像として展開される。
 * 生入力は受け取らず、改善余地の集約値と打ち手名のみを表示する。
 */

type SearchParams = { [key: string]: string | string[] | undefined };

function parse(searchParams: SearchParams) {
  const num = (v: string | string[] | undefined) => Math.max(0, Number(Array.isArray(v) ? v[0] : v) || 0);
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? '').slice(0, 40);
  const fy = num(searchParams.fy);
  const lt = num(searchParams.lt);
  const top = str(searchParams.top);
  return { fy, lt, top };
}

const man = (yen: number) => Math.round(yen / 10_000).toLocaleString();

export function generateMetadata({ searchParams }: { searchParams: SearchParams }): Metadata {
  const { fy, lt, top } = parse(searchParams);
  const ogUrl = `/api/og?fy=${fy}&lt=${lt}&top=${encodeURIComponent(top)}`;
  const title = `うちの世帯、改善余地は初年度 約${man(fy)}万円／年`;
  const description =
    `手取りラボの診断結果：初年度 約${man(fy)}万円、生涯 約${man(lt)}万円の改善余地。` +
    (top ? `No.1の打ち手は「${top}」。` : '') +
    'あなたたち世帯の改善余地も無料で診断（情報提供・シミュレーション）。';

  return {
    title,
    description,
    // 共有ごとに無数の薄いURLが生成されるため検索インデックスは避ける（SNS展開は可）
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default function SharePage({ searchParams }: { searchParams: SearchParams }) {
  const { fy, lt, top } = parse(searchParams);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-2 text-sm font-semibold text-brand-600">【手取りラボ】</p>
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-md">
        <p className="text-sm font-medium text-brand-100">ある世帯の改善余地</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          初年度 約{man(fy)}万円<span className="text-lg font-medium">／年</span>
        </p>
        <p className="mt-1 text-brand-100">生涯では 約{man(lt)}万円 の削減余地</p>
        {top && (
          <p className="mt-4 rounded-lg bg-white/15 px-4 py-2 text-sm">No.1の打ち手「{top}」</p>
        )}
      </div>

      <p className="mt-6 text-slate-600">
        あなたたち世帯の改善余地は？ 結婚・同棲を機に、二人のお金を合算して設計。
        必要保障額の試算と過剰保険チェックを、ログイン不要・無料で。
      </p>

      <div className="mt-6">
        <Link
          href="/diagnose"
          className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          自分の世帯を診断する
        </Link>
      </div>
    </main>
  );
}

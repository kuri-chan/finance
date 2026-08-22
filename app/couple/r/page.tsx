import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * 「結婚したら診断」結果のシェア着地ページ。
 * クエリの設計タイプ（type/animal/flavor）から動的OG（/api/og?v=couple）を生成。
 * 生入力（手取り・貯金など）は一切受け取らず、設計タイプ名のみ。/r と同じ作法。
 */

type SearchParams = { [key: string]: string | string[] | undefined };

/** エンブレムキーは公開ファイル名のみ許可（パストラバーサル防止） */
function parseEmblem(v: string | string[] | undefined): string {
  const raw = (Array.isArray(v) ? v[0] : (v ?? '')).slice(0, 32);
  return /^tedori_\d{2}_[a-z]+$/.test(raw) ? raw : '';
}

function parse(searchParams: SearchParams) {
  const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? '')).slice(0, 24);
  return {
    type: str(searchParams.type),
    animal: str(searchParams.animal),
    flavor: str(searchParams.flavor),
    emblem: parseEmblem(searchParams.e),
  };
}

export function generateMetadata({ searchParams }: { searchParams: SearchParams }): Metadata {
  const { type, animal, flavor, emblem } = parse(searchParams);
  const label = `${animal || '？'}／${type || 'お金の設計'}${flavor}`;
  const ogUrl =
    `/api/og?v=couple&type=${encodeURIComponent(type)}&animal=${encodeURIComponent(animal)}&flavor=${encodeURIComponent(flavor)}` +
    (emblem ? `&e=${encodeURIComponent(emblem)}` : '');
  const title = `我が家のお金の設計図は【${label}】`;
  const description =
    `手取りラボ「結婚したら診断」の結果：二人のタイプは【${label}】。` +
    '30秒5問で、あなたたちの設計図も無料でつくれます（ログイン不要）。';

  return {
    title,
    description,
    // 共有ごとに薄いURLが増えるため検索インデックスは避ける（SNS展開は可）
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogUrl] },
  };
}

export default function CoupleSharePage({ searchParams }: { searchParams: SearchParams }) {
  const { type, animal, flavor, emblem } = parse(searchParams);
  const label = `${type || 'お金の設計'}${flavor}`;

  return (
    <main className="mx-auto max-w-md px-5 py-14 text-center">
      <p className="mb-3 text-sm font-semibold text-brand-600">【手取りラボ】結婚したら診断</p>
      <div className="rounded-2xl border-2 border-emerald-800 bg-white p-7 shadow-sm">
        <p className="text-xs tracking-widest text-emerald-800">我が家の お金の設計図</p>
        {emblem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/caractors/${emblem}.png`}
            alt={`${animal}のエンブレム`}
            width={128}
            height={128}
            className="mx-auto mt-3 h-32 w-32 object-contain"
          />
        ) : (
          <p className="mt-3 text-5xl">🐾</p>
        )}
        <p className="mt-2 font-mincho text-2xl font-bold text-emerald-900">{animal ? `${animal}型` : 'お金の設計'}</p>
        <p className="mt-1 text-sm font-semibold text-emerald-700">{label}</p>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-600">
        結婚・同棲したら最初にやる、二人のお金の設計図。30秒5問で、あなたたちの“どうぶつタイプ”とお金の方針が一枚のカードに。ログイン不要・無料。
      </p>

      <Link
        href="/couple"
        className="mt-6 inline-flex items-center rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        二人の設計図をつくる →
      </Link>
    </main>
  );
}

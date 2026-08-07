import Link from 'next/link';

/** カスタム404。エディトリアルのトーンで統一し、診断・ガイドへ回遊させる。 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-bold tracking-[0.14em] text-brand-600">404 / NOT FOUND</p>
      <div className="mt-3 h-px bg-slate-200" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        ページが<span className="font-mincho">見つかりません</span>。
      </h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        お探しのページは、移動または削除された可能性があります。
        <br />
        下から、お金の見直しに戻れます。
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/diagnose"
          className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-700"
        >
          無料で診断する
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          >
            <path d="M4 10h11M11 5l5 5-5 5" />
          </svg>
        </Link>
        <Link
          href="/articles"
          className="inline-flex items-center rounded-xl border border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
        >
          お金のガイドを見る
        </Link>
      </div>

      <Link href="/" className="mt-6 text-sm font-semibold text-brand-600 hover:text-brand-700">
        ← 手取りラボ トップへ
      </Link>
    </main>
  );
}

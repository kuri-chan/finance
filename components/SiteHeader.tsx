import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME, TAGLINE } from '@/lib/site';

/** 全ページ共通ヘッダー。ロゴ画像＋サイト名＋タグライン。 */
export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/brand/logo_main_clear.png"
            alt={SITE_NAME}
            width={56}
            height={56}
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14"
          />
          <span className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-900">
            {SITE_NAME}
          </span>
          <span className="hidden text-xs text-slate-500 lg:inline">{TAGLINE}</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-3 text-sm sm:gap-4">
          <Link
            href="/articles"
            className="hidden whitespace-nowrap font-medium text-slate-700 hover:text-brand-700 min-[400px]:inline"
          >
            お金のガイド
          </Link>
          <Link
            href="/couple"
            className="hidden whitespace-nowrap font-medium text-slate-700 hover:text-brand-700 min-[480px]:inline"
          >
            二人版
          </Link>
          <Link
            href="/diagnose"
            className="whitespace-nowrap rounded-lg bg-brand-600 px-3.5 py-1.5 font-semibold text-white transition hover:bg-brand-700"
          >
            無料で診断
          </Link>
        </nav>
      </div>
    </header>
  );
}

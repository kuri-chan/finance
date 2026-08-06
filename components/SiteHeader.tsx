import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME, TAGLINE } from '@/lib/site';

/** 全ページ共通ヘッダー。ロゴ画像＋サイト名＋タグライン。 */
export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo_main_clear.png"
            alt={SITE_NAME}
            width={56}
            height={56}
            priority
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">{SITE_NAME}</span>
          <span className="hidden text-xs text-slate-500 sm:inline">{TAGLINE}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/articles" className="font-medium text-slate-700 hover:text-brand-700">
            お金のガイド
          </Link>
          <Link
            href="/diagnose"
            className="rounded-lg bg-brand-600 px-3.5 py-1.5 font-semibold text-white transition hover:bg-brand-700"
          >
            無料で診断
          </Link>
        </nav>
      </div>
    </header>
  );
}

import Link from 'next/link';
import { Disclaimer } from '@/components/Disclaimer';
import { NOTE_URL, PEN_NAME, SITE_NAME, TAGLINE, X_URL } from '@/lib/site';

/** 全ページ共通フッター。ブランド・運営者プロフィール抜粋・リンク・免責＋PR。 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-md">
            <p className="text-base font-bold text-slate-900">{SITE_NAME}</p>
            <p className="mt-0.5 text-sm text-brand-700">{TAGLINE}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              「{SITE_NAME}」の中の人＝{PEN_NAME}（元・大手損保の営業）。
              何も売らず、あなたのお金を丸ごと見て「手取りがいちばん増える順番」で打ち手を並べます。ひとりでも、夫婦でも。
            </p>
            <div className="mt-4 flex gap-3 text-sm">
              <a
                href={NOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 hover:text-brand-700"
              >
                note
              </a>
              <a
                href={X_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 hover:text-brand-700"
              >
                X
              </a>
            </div>
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/diagnose" className="text-slate-600 hover:text-slate-900">
              無料で診断する
            </Link>
            <Link href="/articles" className="text-slate-600 hover:text-slate-900">
              お金のガイド
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900">
              運営者情報
            </Link>
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
              プライバシーポリシー
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <Disclaimer />
          <p className="mt-4 text-xs text-slate-400">
            © {year} {SITE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}

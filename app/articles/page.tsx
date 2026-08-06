import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBrowser } from '@/components/ArticleBrowser';
import { BrushUnderline } from '@/components/BrushUnderline';
import { getAllArticleMeta } from '@/lib/content/articles';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'お金のガイド記事一覧',
  description:
    '保険・ふるさと納税・iDeCo・NISAなどのお金の基礎知識を、元保険会社の営業がやさしく解説（情報提供・シミュレーション）。ひとりでも、夫婦でも。',
  alternates: { canonical: '/articles' },
};

export default function ArticlesIndex() {
  const articles = getAllArticleMeta();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/" className="font-semibold text-brand-600">
          ← {SITE_NAME}
        </Link>
      </nav>

      <div className="flex items-baseline justify-between gap-4 text-xs tracking-[0.14em] text-slate-500">
        <span className="truncate">手取りラボ ── 記事一覧</span>
        <span className="shrink-0 font-bold text-brand-600">INDEX / GUIDE</span>
      </div>
      <div className="mt-3 h-px bg-slate-200" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
        お金の<BrushUnderline>ガイド</BrushUnderline>
      </h1>
      <p className="mt-3 text-slate-600">
        保険・税・投資のやさしい解説。気になるテーマから読めます（制度にもとづく情報提供）。
      </p>

      {articles.length > 0 ? (
        <ArticleBrowser articles={articles} />
      ) : (
        <p className="mt-8 text-slate-400">記事は準備中です。</p>
      )}
    </main>
  );
}

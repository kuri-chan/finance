import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBrowser } from '@/components/ArticleBrowser';
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

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">お金のガイド</h1>
      <p className="mt-2 text-slate-600">
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

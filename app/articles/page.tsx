import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticleMeta } from '@/lib/content/articles';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'お金のガイド記事一覧',
  description:
    '共働き夫婦のための、必要保障額・ふるさと納税・iDeCo・NISAなどのお金の基礎知識をやさしく解説（情報提供・シミュレーション）。',
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
        共働き夫婦のための、保険・税・投資のやさしい解説。制度にもとづく情報提供です。
      </p>

      <ul className="mt-8 divide-y divide-slate-200">
        {articles.map((a) => (
          <li key={a.slug} className="py-5">
            <Link href={`/articles/${a.slug}`} className="group block">
              {a.category && (
                <span className="text-xs font-medium text-brand-600">{a.category}</span>
              )}
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                {a.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{a.description}</p>
              {a.date && <time className="mt-1 block text-xs text-slate-400">{a.date}</time>}
            </Link>
          </li>
        ))}
      </ul>

      {articles.length === 0 && (
        <p className="mt-8 text-slate-400">記事は準備中です。</p>
      )}
    </main>
  );
}

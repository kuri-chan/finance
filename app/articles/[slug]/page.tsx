import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleCta } from '@/components/ArticleCta';
import { JsonLd } from '@/components/JsonLd';
import { getAllSlugs, getArticle } from '@/lib/content/articles';
import { PEN_NAME, SITE_NAME, SITE_URL } from '@/lib/site';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = getArticle(params.slug);
  if (!article) return {};
  const ogUrl = `/api/og?t=${encodeURIComponent(article.title)}`;
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.description,
      url: `${SITE_URL}/articles/${article.slug}`,
      publishedTime: article.date,
      modifiedTime: article.updated ?? article.date,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [ogUrl],
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    inLanguage: 'ja',
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    author: { '@type': 'Person', name: PEN_NAME, description: '元・大手損害保険会社の営業出身' },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    keywords: article.keywords.join(', '),
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <nav className="mb-6 text-sm">
        <Link href="/articles" className="font-semibold text-brand-600">
          ← お金のガイド
        </Link>
      </nav>

      <article>
        <header className="mb-6">
          {article.category && (
            <span className="text-xs font-medium text-brand-600">{article.category}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
            {article.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>文：{PEN_NAME}（元・大手損保の営業）</span>
            {article.date && <time>{article.date}</time>}
            <span>約{article.readingMinutes}分で読めます</span>
          </div>
        </header>

        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-brand-700 prose-a:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      <ArticleCta />

      <JsonLd data={jsonLd} />
    </main>
  );
}

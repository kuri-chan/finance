import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArticleConsultCta } from '@/components/ArticleConsultCta';
import { ArticleCta } from '@/components/ArticleCta';
import { ArticleFpConsultCta } from '@/components/ArticleFpConsultCta';
import { JsonLd } from '@/components/JsonLd';
import { getAllArticleMeta, getAllSlugs, getArticle } from '@/lib/content/articles';
import { PEN_NAME, SITE_NAME, SITE_URL } from '@/lib/site';

/** 同カテゴリを優先に関連記事を最大4件（自身を除く・不足分は新着で補完） */
function relatedArticles(slug: string, category?: string) {
  const others = getAllArticleMeta().filter((m) => m.slug !== slug);
  const sameCat = category ? others.filter((m) => m.category === category) : [];
  const rest = others.filter((m) => !sameCat.includes(m));
  return [...sameCat, ...rest].slice(0, 4);
}

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

  const related = relatedArticles(article.slug, article.category);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    inLanguage: 'ja',
    mainEntityOfPage: `${SITE_URL}/articles/${article.slug}`,
    author: { '@type': 'Person', name: PEN_NAME, description: '元・大手保険会社の営業出身' },
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
        <header className="mb-8">
          <div className="flex items-baseline justify-between gap-4 text-xs tracking-[0.12em] text-slate-500">
            <span className="truncate">
              お金のガイド{article.category ? ` ── ${article.category}` : ''}
            </span>
            {article.date && <time className="shrink-0">{article.date}</time>}
          </div>
          <div className="mt-3 h-px bg-slate-200" />
          <h1 className="mt-6 text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[2rem]">
            {article.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>文：{PEN_NAME}（元・大手保険会社の営業）</span>
            <span>約{article.readingMinutes}分で読めます</span>
          </div>
        </header>

        <div
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-brand-700 prose-a:underline-offset-2"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </article>

      {related.length > 0 && (
        <section className="reveal-on-scroll mt-12 border-t border-slate-100 pt-8">
          <h2 className="text-base font-bold text-slate-800">あわせて読みたい</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                {a.category && (
                  <span className="text-xs font-medium text-brand-600">{a.category}</span>
                )}
                <h3 className="mt-0.5 text-sm font-bold leading-snug text-slate-800">{a.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {article.category === '保険' && <ArticleConsultCta />}
      {(article.category === 'NISA' ||
        article.category === 'iDeCo' ||
        article.category === '家計') && <ArticleFpConsultCta />}
      <ArticleCta />

      <JsonLd data={jsonLd} />
    </main>
  );
}

import type { MetadataRoute } from 'next';
import { getAllArticleMeta } from '@/lib/content/articles';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/diagnose`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/articles`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const articlePages: MetadataRoute.Sitemap = getAllArticleMeta().map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.updated ?? a.date ? new Date(a.updated ?? a.date) : now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticPages, ...articlePages];
}

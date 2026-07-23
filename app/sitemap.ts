import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // 現状はツールの中核ページのみ。制度キーワードの記事ページは追加時にここへ足す。
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/diagnose`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];
}

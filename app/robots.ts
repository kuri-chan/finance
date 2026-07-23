import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    // 共有着地(/r)はSNSクローラが読めるよう許可しつつ、検索インデックスは各ページの
    // metadata robots(noindex)で制御する。/api は組織的に除外。
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

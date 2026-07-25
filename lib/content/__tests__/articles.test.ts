import { describe, expect, it } from 'vitest';
import { getAllArticleMeta, getAllSlugs, getArticle } from '../articles';

describe('記事コンテンツ ローダ', () => {
  it('記事スラッグを読み込める（1件以上）', () => {
    const slugs = getAllSlugs();
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('メタ情報は公開日の新しい順で、必須項目が揃う', () => {
    const metas = getAllArticleMeta();
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m.title.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(m.keywords)).toBe(true);
    }
    // 降順ソート
    for (let i = 1; i < metas.length; i++) {
      expect(metas[i - 1].date >= metas[i].date).toBe(true);
    }
  });

  it('個別記事は本文HTMLと読了時間を返す', () => {
    const slug = getAllSlugs()[0];
    const article = getArticle(slug);
    expect(article).not.toBeNull();
    expect(article!.html).toContain('<');
    expect(article!.readingMinutes).toBeGreaterThan(0);
    // 診断ツールへの内部リンクを含む（回遊導線）
    expect(article!.html).toContain('/diagnose');
  });

  it('存在しないスラッグは null', () => {
    expect(getArticle('does-not-exist-xyz')).toBeNull();
  });
});

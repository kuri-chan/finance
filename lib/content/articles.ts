import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * 記事（SEOコンテンツ）のローダ。content/articles/*.md を読み、
 * frontmatter をメタ情報として、本文を Markdown → HTML に変換する。
 * すべてビルド時（SSG）に実行される。記事本文は開発者が書く信頼済みコンテンツ。
 */

const ARTICLES_DIR = path.join(process.cwd(), 'content/articles');

marked.setOptions({ gfm: true, breaks: false });

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  /** 公開日（ISO: YYYY-MM-DD） */
  date: string;
  /** 更新日（省略時は date） */
  updated?: string;
  keywords: string[];
  category?: string;
}

export interface Article extends ArticleMeta {
  html: string;
  /** 想定読了時間（分） */
  readingMinutes: number;
}

function readFileSafe(slug: string): string | null {
  const file = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8');
}

/** frontmatter の日付を YYYY-MM-DD 文字列に正規化（YAMLがDate型に変換する場合に対応） */
function normalizeDate(v: unknown): string {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return (v as Date).toISOString().slice(0, 10);
  }
  return String(v ?? '').slice(0, 10);
}

function toMeta(slug: string, data: Record<string, unknown>): ArticleMeta {
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ''),
    date: normalizeDate(data.date),
    updated: data.updated ? normalizeDate(data.updated) : undefined,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    category: data.category ? String(data.category) : undefined,
  };
}

/** 記事スラッグ一覧（.md を除いたファイル名） */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

/** 全記事のメタ情報（公開日の新しい順） */
export function getAllArticleMeta(): ArticleMeta[] {
  return getAllSlugs()
    .map((slug) => {
      const raw = readFileSafe(slug);
      if (!raw) return null;
      const { data } = matter(raw);
      return toMeta(slug, data);
    })
    .filter((m): m is ArticleMeta => m !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** 1記事（本文HTML込み）。無ければ null。 */
export function getArticle(slug: string): Article | null {
  const raw = readFileSafe(slug);
  if (!raw) return null;
  const { data, content } = matter(raw);
  const html = marked.parse(content, { async: false }) as string;
  // 日本語は約500字/分で読了時間を概算
  const charCount = content.replace(/\s/g, '').length;
  const readingMinutes = Math.max(1, Math.ceil(charCount / 500));
  return { ...toMeta(slug, data), html, readingMinutes };
}

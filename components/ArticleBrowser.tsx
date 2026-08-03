'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ArticleMeta } from '@/lib/content/articles';

/** カテゴリの表示順（未定義カテゴリは後ろに自動追加） */
const CATEGORY_ORDER = ['保険', 'NISA', 'iDeCo', 'ふるさと納税', '住宅', '家計'];

/** お金のガイド一覧：カテゴリタブで絞り込み表示（#2 フィードバック対応）。 */
export function ArticleBrowser({ articles }: { articles: ArticleMeta[] }) {
  const present = Array.from(new Set(articles.map((a) => a.category).filter((c): c is string => !!c)));
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => present.includes(c)),
    ...present.filter((c) => !CATEGORY_ORDER.includes(c)),
  ];
  const tabs = ['すべて', ...ordered];

  const [active, setActive] = useState('すべて');
  const filtered = active === 'すべて' ? articles : articles.filter((a) => a.category === active);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`rounded-full border px-3.5 py-1 text-sm font-medium transition ${
              active === c
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-slate-200">
        {filtered.map((a) => (
          <li key={a.slug} className="py-5">
            <Link href={`/articles/${a.slug}`} className="group block">
              {a.category && <span className="text-xs font-medium text-brand-600">{a.category}</span>}
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                {a.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{a.description}</p>
              {a.date && <time className="mt-1 block text-xs text-slate-400">{a.date}</time>}
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="mt-8 text-slate-400">このカテゴリの記事は準備中です。</p>}
    </>
  );
}

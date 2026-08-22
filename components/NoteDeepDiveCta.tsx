'use client';

import { trackEvent } from '@/lib/analytics';

/**
 * 有料「深掘り版」（note記事）への送客CTA。無料診断のバックエンド商品。
 * NEXT_PUBLIC_NOTE_FUKABORI_URL が未設定なら非表示（note公開後にVercelでURLを入れるだけで出る＝公開即効化）。
 * 自社商品のため rel は通常リンク（アフィリではない）。クリックは note_click で計測（from＝出所）。
 */
export function NoteDeepDiveCta({ from }: { from: 'couple' | 'diagnose' }) {
  const url = process.env.NEXT_PUBLIC_NOTE_FUKABORI_URL;
  if (!url) return null;

  return (
    <div className="mt-4 rounded-2xl border border-brand-300 bg-white p-5">
      <p className="text-sm font-medium text-brand-700">深掘り版（先行 1,480円）</p>
      <p className="mt-1 text-base font-bold text-slate-900">
        自分の数字で回す、我が家のお金の設計図
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        保険・ふるさと納税・iDeCo・NISA・住宅・家計を、あなたの数字で。効果額の大きい順に、上から一つずつ整えるスプレッドシートと手順書です。売り込みはありません。
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener"
        onClick={() => trackEvent('note_click', { from })}
        className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white transition hover:bg-brand-700"
      >
        深掘り版を見る（note）→
      </a>
    </div>
  );
}

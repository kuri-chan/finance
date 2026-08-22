'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { type Diagnosis, fmtMan } from '@/lib/couple';
import { OptinCard } from './OptinCard';
import s from './Result.module.css';

/**
 * 「結婚したら診断」の結果＝設計図シート。
 * 正典：docs/手取りラボ_スマホ無料診断_プロトタイプ.html の renderResult()。
 * 動物は絵文字を仮置き（PNG差し替えは lib/couple の emblem キーで1箇所差し替え）。
 * デザインは緑ブループリント調を Result.module.css でスコープ適用。
 */
export default function Result({ diagnosis, onReset }: { diagnosis: Diagnosis; onReset: () => void }) {
  const d = diagnosis;
  const sheetRef = useRef<HTMLDivElement>(null);
  const cliffRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // 結果表示（result_view）を1回発火
  useEffect(() => {
    trackEvent('result_view', { type: d.type.typeName, flavor: d.flavor, segment: d.segment });
  }, [d.type.typeName, d.flavor, d.segment]);

  // クリフハンガーが見えたら cliffhanger_view を1回発火
  useEffect(() => {
    const el = cliffRef.current;
    if (!el) return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !fired) {
            fired = true;
            trackEvent('cliffhanger_view', { type: d.type.typeName });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [d.type.typeName]);

  // シェア用URL（/couple/r）。PIIは載せず、設計タイプ・動物名・フレーバーのみ。
  const shareUrl = useMemo(() => {
    const params = new URLSearchParams({
      type: d.type.typeName,
      animal: d.type.animal,
      flavor: d.flavor,
      e: d.type.emblem,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/couple/r?${params.toString()}`;
  }, [d.type.typeName, d.type.animal, d.flavor, d.type.emblem]);

  const shareText = `我が家のお金の設計図は【${d.type.animal}／${d.typeLabel}】でした｜手取りラボ #結婚したら診断 #手取りラボ`;

  const xShareHref = `https://twitter.com/intent/tweet?${new URLSearchParams({ text: shareText, url: shareUrl }).toString()}`;
  const lineShareHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;

  const short = d.short;
  const futureBig = d.future > 0 ? `10年で ${fmtMan(d.future)}` : '収支の黒字化から';

  // 設計図カードを画像化して保存／シェア（save_image_click＝シェア意図）
  async function saveCard() {
    const el = sheetRef.current;
    if (!el) return;
    trackEvent('save_image_click', { type: d.type.typeName });
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('toBlob failed');
      const file = new File([blob], '我が家の設計図.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: '我が家のお金の設計図｜手取りラボ' });
        trackEvent('share_success', { method: 'image' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '我が家の設計図.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      alert('この環境では保存できませんでした。スクリーンショットで保存してください。');
    }
    setSaving(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* クリップボード不可の環境では無視 */
    }
  }

  return (
    <div className={s.scope}>
      {/* 設計図シート（html2canvasで画像化する範囲） */}
      <div className={s.sheet} ref={sheetRef}>
        <span className={`${s.corner} ${s.c1}`} />
        <span className={`${s.corner} ${s.c2}`} />
        <span className={`${s.corner} ${s.c3}`} />
        <span className={`${s.corner} ${s.c4}`} />
        <h2 className={s.title}>我が家の お金の設計図</h2>

        <div className={s.type}>
          {/* 動物エンブレム（枠込みで完成・背景透過）。html2canvas対策で素のimg＋eager読込 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.emblem}
            src={`/caractors/${d.type.emblem}.png`}
            alt={`${d.type.animal}のエンブレム`}
            width={128}
            height={128}
            loading="eager"
          />
          <div className={s.name}>{d.type.animal}型</div>
          <div className={s.sub2}>{d.typeLabel}</div>
          <div className={s.desc}>{d.type.desc}</div>
        </div>

        <div className={s.move}>
          <span className={s.moveTag}>最初の一手</span>
          <span className={s.moveTxt}>{d.type.firstMove}</span>
        </div>

        <div className={s.rule} />

        <div className={s.row}>
          <div className={s.k}>世帯の手取り</div>
          <div className={s.v}>
            <span className={s.fig}>{fmtMan(d.income)}</span>
            <small>／月</small>
          </div>
        </div>
        <div className={s.row}>
          <div className={s.k}>口座の型</div>
          <div className={s.v}>
            {d.account}
            <small>{d.accountNote}</small>
          </div>
        </div>
        <div className={s.row}>
          <div className={s.k}>毎月の余力</div>
          <div className={s.v}>
            <span className={s.fig}>{fmtMan(Math.max(0, d.surplus))}</span>
            <small>使い道を設計できるお金</small>
          </div>
        </div>
        <div className={s.row}>
          <div className={s.k}>生活防衛資金</div>
          <div className={s.v}>
            {short >= 0 ? (
              <span className={s.flagOk}>確保できています</span>
            ) : (
              <span className={s.flagWarn}>
                あと <span className={s.fig}>{fmtMan(-short)}</span>
              </span>
            )}
            <small>
              目安 <span className={s.fig}>{fmtMan(d.target)}</span>（生活費6ヶ月）
            </small>
          </div>
        </div>
        <div className={s.row}>
          <div className={s.k}>保険</div>
          <div className={s.v} style={{ fontSize: 13, lineHeight: 1.55 }}>
            {d.insur}
          </div>
        </div>

        <div className={s.future}>
          <div className={s.futureCap}>{d.future > 0 ? '今の余力を活かせば' : 'まずは'}</div>
          <div className={s.futureBig} style={d.future > 0 ? undefined : { fontSize: 16 }}>
            {futureBig}
          </div>
          <small>
            {d.future > 0
              ? '毎月の余力を貯める・投資に回した場合の目安（利回り0で試算）'
              : '支出を見直して、設計しろをつくりましょう'}
          </small>
        </div>

        <div className={s.seal}>
          <span>設計：手取りの番人 ｜ 手取りラボ</span>
          <span className={s.stamp}>正直</span>
        </div>
      </div>

      <button type="button" className={s.savebtn} onClick={saveCard} disabled={saving}>
        {saving ? '画像を準備中…' : '🖼 設計図を画像で保存・シェア'}
      </button>

      {/* リンクでシェア（動的OGPが展開される /couple/r へ） */}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={xShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Xでポスト
        </a>
        <a
          href={lineShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[#06C755] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
        >
          LINEで送る
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          {copied ? 'リンクをコピーしました' : 'リンクをコピー'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        シェアリンクに含まれるのは設計タイプ名だけです（手取り・貯金などの入力内容は含まれません）。
      </p>

      {/* 読者所有カード（設計図の直下） */}
      <OptinCard diagnosis={d} />

      {/* クリフハンガー＋ぼかしプレビュー */}
      <div className={s.scope}>
        <div className={s.cliff} ref={cliffRef}>
          <div className={s.cliffT}>この設計図は、まだ“下書き”です。</div>
          <div className={s.cliffL}>
            深掘り版では、あなたの数字で〈保険の要否と見直し額〉〈毎月の投資配分〉〈30年後の資産グラフ〉まで、一枚の完成版に。
            {short < 0
              ? `特に${d.type.animal}のあなたは、守りの埋め方で将来が大きく変わります。`
              : '余力の攻め方次第で、30年後の資産に差が出ます。'}
          </div>
          <div className={s.preview}>
            <div className={s.pvCard}>
              <h3>完成版：我が家の設計図</h3>
              <div className={s.pvRow}>
                <span>保険の見直しで浮くお金</span>
                <span className={s.pvV}>年 ◯◯万円</span>
              </div>
              <div className={s.pvRow}>
                <span>毎月の投資配分（新NISA）</span>
                <span className={s.pvV}>◯◯,◯◯◯円</span>
              </div>
              <div className={s.pvRow}>
                <span>30年後の資産（目安）</span>
                <span className={s.pvV}>◯,◯◯◯万円</span>
              </div>
              <div className={s.pvBars}>
                {[35, 48, 40, 62, 78, 70, 92].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className={s.pvLock}>
              <span className={s.pvLockK}>🔒</span>
              <span className={s.pvLockT}>深掘り版で解錠</span>
              <span className={s.pvLockS}>数値・グラフはここに</span>
            </div>
          </div>
        </div>

        {/* CTA：第一弾は改善余地診断（/diagnose）への橋渡しに一本化 */}
        <Link
          href="/diagnose"
          className={s.cta}
          onClick={() => trackEvent('cta_click', { to: 'diagnose', type: d.type.typeName })}
        >
          改善余地を“円”で診断する
          <small>保険・ふるさと納税・iDeCo・NISAを横断｜無料・ログイン不要</small>
        </Link>

        <div className={s.sharehint}>保存した画像を、二人で共有・SNSでシェア</div>
        <button type="button" className={s.again} onClick={onReset}>
          最初からやり直す
        </button>
      </div>
    </div>
  );
}

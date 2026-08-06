'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ヒーロー右の“生きた”改善余地カード。
 * 例の人物（世帯／ひとり／新婚）を数秒ごとに循環し、数字はカウントアップ。
 * ツールの守備範囲（個人も世帯も）を、動きで伝える。
 * SSRは先頭プロファイルの実数字を描画＝SEO/no-JSでも内容が見える。
 * 表示はすべて「入力例のイメージ」（断定・推奨ではない）。
 */

type Action = { rank: number; domain: string; title: string; yen: string };
type Profile = { persona: string; firstYear: number; lifetime: number; actions: Action[] };

const PROFILES: Profile[] = [
  {
    persona: '共働き世帯の例',
    firstYear: 24,
    lifetime: 720,
    actions: [
      { rank: 1, domain: 'iDeCo', title: 'iDeCo満額で節税', yen: '+8.4万' },
      { rank: 2, domain: '保険', title: '医療保険の重複を解消', yen: '+3.6万' },
      { rank: 3, domain: 'ふるさと納税', title: '限度額をフル活用', yen: '+3.4万' },
    ],
  },
  {
    persona: 'ひとり暮らしの例',
    firstYear: 12,
    lifetime: 360,
    actions: [
      { rank: 1, domain: 'NISA', title: 'つみたてを少額から開始', yen: '+4.2万' },
      { rank: 2, domain: '保険', title: '手厚すぎる医療保険を見直し', yen: '+2.4万' },
      { rank: 3, domain: 'ふるさと納税', title: '自分の枠を使い切る', yen: '+1.8万' },
    ],
  },
  {
    persona: '新婚カップルの例',
    firstYear: 18,
    lifetime: 540,
    actions: [
      { rank: 1, domain: '保険', title: '独身時代の死亡保障を最適化', yen: '+6.0万' },
      { rank: 2, domain: 'NISA', title: '二人分の非課税枠を活用', yen: '+4.8万' },
      { rank: 3, domain: 'iDeCo', title: '二人でiDeCoを始める', yen: '+3.0万' },
    ],
  },
];

/** 前回値→今回値へカウントアップ（初回マウントは静止＝チラつき・SSRズレなし） */
function useCountUp(target: number, reduce: boolean) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (reduce || from === target) {
      setVal(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return val;
}

export function HeroDemoCard() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(m.matches);
    apply();
    m.addEventListener?.('change', apply);
    return () => m.removeEventListener?.('change', apply);
  }, []);

  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setI((v) => (v + 1) % PROFILES.length), 4200);
    return () => clearInterval(id);
  }, [reduce, paused]);

  const p = PROFILES[i];
  const fy = useCountUp(p.firstYear, reduce);
  const lt = useCountUp(p.lifetime, reduce);

  return (
    <div
      className="relative animate-fade-up [animation-delay:120ms]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* グロー */}
      <div
        aria-hidden
        className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/25 to-emerald-300/20 blur-2xl"
      />
      {/* 背面カード（積層） */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rotate-3 rounded-2xl bg-brand-100/70 ring-1 ring-brand-100"
      />

      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-xl ring-1 ring-brand-700/20">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-brand-100">【手取りラボ診断】改善余地</p>
          <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
            {p.persona}
          </span>
        </div>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          初年度 約{fy}万円<span className="text-base font-medium">／年</span>
        </p>
        <p className="text-sm text-brand-100 tabular-nums">生涯では 約{lt}万円 の改善余地</p>

        <div key={i} className="mt-4 animate-fade-up space-y-2">
          {p.actions.map((a) => (
            <div key={a.rank} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold">
                {a.rank}
              </span>
              <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">
                {a.domain}
              </span>
              <span className="flex-1 truncate text-sm">{a.title}</span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-200">
                {a.yen}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] text-brand-200">※ 表示は入力例のイメージです</p>
          <div className="flex gap-1.5" aria-hidden>
            {PROFILES.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 浮遊バッジ：No.1の打ち手 */}
      <div className="absolute -right-3 -top-4 animate-float rounded-xl bg-white px-3 py-2 shadow-card ring-1 ring-slate-100">
        <p className="text-[10px] font-medium text-slate-500">No.1の打ち手</p>
        <p className="text-sm font-bold tabular-nums text-emerald-600">
          {p.actions[0].yen}
          <span className="text-[10px] font-medium text-slate-400">／年</span>
        </p>
      </div>
    </div>
  );
}

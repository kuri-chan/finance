'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { type Answers, type Kids, type Stance, diagnose, man } from '@/lib/couple';
import Result from './Result';

/**
 * 「結婚したら診断」5問ウィザード。
 * 正典：docs/手取りラボ_スマホ無料診断_プロトタイプ.html（5問フロー・バリデーション・コピー）。
 * ウィザードの外枠は既存サイト（青系Tailwind）に合わせ、結果シートのみ緑（Result.module.css）。
 */

const TOTAL = 5;
const emptyAnswers: Answers = { a: '', b: '', stance: '', spend: '', cash: '', kids: '' };

const STANCE_OPTIONS: { value: Stance; title: string; sub: string }[] = [
  { value: '一緒', title: 'できるだけ一緒に管理したい', sub: 'ふたつの収入をまとめて考えたい' },
  { value: '自由', title: 'ある程度は各自の自由を残したい', sub: '生活費は共通、残りは各自で' },
  { value: '未定', title: 'まだ決めていない', sub: 'これから二人で相談する' },
];
const KIDS_OPTIONS: { value: Kids; title: string }[] = [
  { value: 'いる', title: 'もう子どもがいる' },
  { value: '予定', title: '子どもを持つ予定' },
  { value: 'なし', title: '予定なし・まだ未定' },
];

export default function CoupleClient() {
  const [step, setStep] = useState(0);
  const [S, setS] = useState<Answers>(emptyAnswers);
  const started = useRef(false);

  const set = (patch: Partial<Answers>) => setS((prev) => ({ ...prev, ...patch }));

  // 初回表示で diagnosis_start を1回だけ
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      trackEvent('diagnosis_start');
    }
  }, []);

  // ステップ遷移で最上部へ＋ step_view 発火（結果ステップは除く）
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step < TOTAL) trackEvent('step_view', { step: step + 1 });
  }, [step]);

  const valid = useMemo(() => {
    switch (step) {
      case 0:
        return man(S.a) > 0 && S.b !== '';
      case 1:
        return !!S.stance;
      case 2:
        return man(S.spend) > 0;
      case 3:
        return S.cash !== '';
      case 4:
        return !!S.kids;
      default:
        return true;
    }
  }, [step, S]);

  const diagnosis = useMemo(() => (step >= TOTAL ? diagnose(S) : null), [step, S]);

  const goNext = () => {
    if (!valid) return;
    trackEvent('step_complete', { step: step + 1 });
    if (step === TOTAL - 1) {
      const dg = diagnose(S);
      trackEvent('diagnosis_complete', { type: dg.type.typeName, flavor: dg.flavor, segment: dg.segment });
    }
    setStep((n) => n + 1);
  };
  const goBack = () => setStep((n) => Math.max(0, n - 1));
  const restart = () => {
    setS(emptyAnswers);
    setStep(0);
  };

  if (step >= TOTAL && diagnosis) {
    return (
      <main className="mx-auto max-w-md px-4 py-8">
        <Result diagnosis={diagnosis} onReset={restart} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      {/* イントロ（step0のみ） */}
      {step === 0 && (
        <div className="mb-5">
          <h1 className="font-mincho text-2xl font-bold leading-snug text-slate-900">
            結婚したら、最初にやる
            <br />
            お金の設計図。
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            30秒の質問に答えるだけ。二人の“どうぶつタイプ”と、お金の方針が一枚の設計図になります。——売り込みは、一切なし。
          </p>
        </div>
      )}

      {/* 進捗バー */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-brand-600' : i === step ? 'bg-brand-400' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-semibold tracking-widest text-slate-400">
          {step + 1} / {TOTAL}
        </span>
      </div>

      <div key={step} className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <>
            <Eyebrow>Step 1 / 5</Eyebrow>
            <Q>二人の手取り、月にいくら？</Q>
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              単位は「万円」です。手取り30万円なら「30」と入力してください（下に円で確認できます）。
            </div>
            <ManField id="a" label="あなたの手取り月収" value={S.a} onChange={(v) => set({ a: v })} />
            <ManField id="b" label="パートナーの手取り月収" value={S.b} onChange={(v) => set({ b: v })} />
          </>
        )}

        {step === 1 && (
          <>
            <Eyebrow>Step 2 / 5</Eyebrow>
            <Q>二人のお金、どう管理したい？</Q>
            <div className="flex flex-col gap-2.5">
              {STANCE_OPTIONS.map((o) => (
                <OptionButton
                  key={o.value}
                  selected={S.stance === o.value}
                  onClick={() => set({ stance: o.value })}
                  title={o.title}
                  sub={o.sub}
                />
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Eyebrow>Step 3 / 5</Eyebrow>
            <Q>毎月、だいたいいくら出ていく？</Q>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              家賃・光熱・通信・食費・娯楽など、月の支出の合計をざっくりで（万円）。
            </p>
            <ManField id="spend" label="毎月の支出（ざっくり）" value={S.spend} onChange={(v) => set({ spend: v })} />
          </>
        )}

        {step === 3 && (
          <>
            <Eyebrow>Step 4 / 5</Eyebrow>
            <Q>いまの貯金、ふたり合わせていくら？</Q>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">
              投資は含めず、すぐ使える現金・預金だけで（万円）。
            </p>
            <ManField id="cash" label="現金・預金（二人合計）" value={S.cash} onChange={(v) => set({ cash: v })} />
          </>
        )}

        {step === 4 && (
          <>
            <Eyebrow>Step 5 / 5</Eyebrow>
            <Q>子どもの予定は？</Q>
            <p className="mb-3 text-xs leading-relaxed text-slate-500">保険の考え方が変わる大事な質問です。</p>
            <div className="flex flex-col gap-2.5">
              {KIDS_OPTIONS.map((o) => (
                <OptionButton
                  key={o.value}
                  selected={S.kids === o.value}
                  onClick={() => set({ kids: o.value })}
                  title={o.title}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ナビ */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 disabled:opacity-0"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!valid}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {step === TOTAL - 1 ? '設計図をつくる' : 'つぎへ'}
        </button>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        一般的な考え方の整理です。特定の金融商品の推奨・勧誘ではありません。
      </p>
    </main>
  );
}

/* ---------- 小さな表示部品（この画面ローカル） ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">{children}</div>;
}
function Q({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-2 font-mincho text-lg font-bold leading-snug text-slate-900">{children}</h2>;
}

/** 万円入力＋「＝◯◯円」ライブ表示（プロトの moneyField 相当） */
function ManField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const raw = value.replace(/[^\d.]/g, '');
  return (
    <div className="mb-3.5">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <input
          id={id}
          inputMode="numeric"
          placeholder="例）30"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
          className="w-full bg-white px-3 py-3 text-right text-xl font-bold tabular-nums text-slate-900 outline-none"
        />
        <span className="shrink-0 border-l border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">万円</span>
      </div>
      <div className="mt-1 min-h-4 text-right text-xs tabular-nums text-slate-400">
        {raw ? `＝ ${man(raw).toLocaleString('ja-JP')}円` : ''}
      </div>
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${
        selected ? 'border-brand-600 bg-brand-50' : 'border-slate-300 bg-white hover:border-brand-300'
      }`}
    >
      <span
        className={`h-4.5 w-4.5 shrink-0 rounded-full border-2 ${
          selected ? 'border-brand-600 bg-brand-600 ring-2 ring-inset ring-white' : 'border-slate-300'
        }`}
        style={{ width: 18, height: 18 }}
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        {sub && <span className="mt-0.5 block text-xs text-slate-500">{sub}</span>}
      </span>
    </button>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CoverageCaseResult } from '@/lib/insurance';
import type { HouseholdOptimization, LeverDomain } from '@/lib/optimize';
import { Card } from '@/components/ui';
import {
  getAffiliateForDomain,
  getAffiliateForGap,
  getDisclosure,
  type AffiliateCTA,
} from '@/lib/affiliate';
import { formatMan } from './model';

/** 打ち手・保障不足に接続する送客導線（PR明示・景表法対応）。未提携時は非リンク表示。 */
function Cta({ cta }: { cta: AffiliateCTA | null }) {
  if (!cta) return null;
  const { destination, available, prLabel } = cta;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">
        {prLabel}
      </span>
      {available ? (
        <a
          href={destination.url}
          target="_blank"
          rel="sponsored noopener"
          className="text-sm font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
        >
          {destination.label} →
        </a>
      ) : (
        <span className="text-sm text-slate-400">{destination.label}（提携準備中）</span>
      )}
    </div>
  );
}

const DOMAIN_LABEL: Record<LeverDomain, string> = {
  life: '生命保険',
  medical: '医療保険',
  savings_insurance: '貯蓄性保険',
  fire: '火災保険',
  auto: '自動車保険',
  furusato: 'ふるさと納税',
  ideco: 'iDeCo',
  nisa: 'NISA',
};

/** #5：打ち手ごとの「次にやること」（具体アクション。CTAへの橋渡し） */
const DOMAIN_ACTION: Record<LeverDomain, string> = {
  life: '必要保障額と今の保障を照らし、過剰な掛け捨て分を見直す',
  medical: '医療保険を最も手厚い1本に集約する',
  savings_insurance: '保障と貯蓄を分け、貯蓄性保険を見直す',
  fire: '同じ補償で他社の保険料を一括見積もりで比較する',
  auto: '運転者範囲・等級を見直し、一括見積もりで比較する',
  furusato: 'ポータルで寄附し、ワンストップ特例か確定申告で控除手続き',
  ideco: 'iDeCo口座を開き、無理のない掛金を設定する',
  nisa: 'NISA口座で、まずは少額のつみたてを設定する',
};

const DOMAIN_COLOR: Record<LeverDomain, string> = {
  life: 'bg-blue-50 text-blue-700',
  medical: 'bg-emerald-50 text-emerald-700',
  savings_insurance: 'bg-violet-50 text-violet-700',
  fire: 'bg-orange-50 text-orange-700',
  auto: 'bg-cyan-50 text-cyan-700',
  furusato: 'bg-rose-50 text-rose-700',
  ideco: 'bg-amber-50 text-amber-700',
  nisa: 'bg-teal-50 text-teal-700',
};

/** 内訳ミニグラフ用の塗り色 */
const DOMAIN_BAR: Record<LeverDomain, string> = {
  life: 'bg-blue-500',
  medical: 'bg-emerald-500',
  savings_insurance: 'bg-violet-500',
  fire: 'bg-orange-500',
  auto: 'bg-cyan-500',
  furusato: 'bg-rose-500',
  ideco: 'bg-amber-500',
  nisa: 'bg-teal-500',
};

const SHIELD = 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z';
const DOMAIN_ICON: Record<LeverDomain, string> = {
  life: SHIELD,
  medical: SHIELD,
  savings_insurance: SHIELD,
  fire: SHIELD,
  auto: SHIELD,
  furusato: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7',
  ideco: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  nisa: 'M3 17l6-6 4 4 8-8M21 7v5h-5',
};

function DomainIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d={path} />
    </svg>
  );
}

/** 目標値まで滑らかにカウントアップ（easeOutCubic）。target<=0 は0固定。 */
function useCountUp(target: number, durationMs = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setVal(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

function BarRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right text-sm tabular-nums text-slate-700">{value}</span>
    </div>
  );
}

function CaseCard({ c, single }: { c: CoverageCaseResult; single?: boolean }) {
  const who = single ? 'あなた' : c.deceased === 'husband' ? '夫' : '妻';
  const shortfall = c.additionalNeeded > 0;
  const max = Math.max(c.requiredCoverage, c.existingDeathBenefit, 1);
  const reqPct = Math.round((c.requiredCoverage / max) * 100);
  const havePct = Math.round((c.existingDeathBenefit / max) * 100);
  return (
    <Card className="flex-1">
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold text-slate-800">{who}が亡くなった場合</h4>
        <span className="text-xs text-slate-400">{c.coverageYears}年で試算</span>
      </div>
      <div className="mt-3 space-y-2">
        <BarRow label="必要保障額" value={formatMan(c.requiredCoverage)} pct={reqPct} color="bg-slate-400" />
        <BarRow
          label="今の保障"
          value={formatMan(c.existingDeathBenefit)}
          pct={havePct}
          color={shortfall ? 'bg-rose-400' : 'bg-emerald-400'}
        />
      </div>
      <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm">
        {shortfall ? (
          <>
            <span className="font-medium text-rose-600">不足</span>
            <span className="font-bold tabular-nums text-rose-600">{formatMan(c.additionalNeeded)}</span>
          </>
        ) : (
          <>
            <span className="font-medium text-emerald-600">過剰（見直し余地）</span>
            <span className="font-bold tabular-nums text-emerald-600">{formatMan(c.surplusCoverage)}</span>
          </>
        )}
      </div>
    </Card>
  );
}

export default function Result({
  optimization,
  onReset,
}: {
  optimization: HouseholdOptimization;
  onReset: () => void;
}) {
  // HouseholdOptimization は改善余地・打ち手・保障不足・免責を保持する。coverage は過不足カード用。
  const summary = optimization;
  const coverage = optimization.coverage;
  const single = coverage.cases.length === 1;
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  const hasSaving = summary.firstYearImprovement > 0;
  const topAction = summary.actions[0];
  const disclosure = getDisclosure();

  // ヒーロー数字のカウントアップ（万円単位）と、打ち手バーの相対幅の基準
  const animatedMan = useCountUp(Math.round(summary.firstYearImprovement / 10000));
  const maxImpact = summary.actions.reduce((m, a) => Math.max(m, a.annualImpact), 1);
  // 内訳ミニグラフ用：確定的（試算=illustrativeを除く）な打ち手のみ
  const deterministicActions = summary.actions.filter((a) => !a.illustrative && a.annualImpact > 0);

  const subjectLabel = single ? 'あなたの改善余地' : 'あなたたち世帯の改善余地';
  const shareText =
    `【手取りラボ】${single ? '私の改善余地は' : 'うちの世帯、改善余地は'}初年度 約${formatMan(summary.firstYearImprovement)}／年。` +
    (topAction ? `No.1の打ち手は「${topAction.title}」。` : '') +
    `生涯では約${formatMan(summary.lifetimeImprovement)}。`;

  // シェアURL（集約値のみ。生入力は載せない）
  const shareUrl = useMemo(() => {
    const params = new URLSearchParams({
      fy: String(Math.round(summary.firstYearImprovement)),
      lt: String(Math.round(summary.lifetimeImprovement)),
      top: topAction?.title ?? '',
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/r?${params.toString()}`;
  }, [summary.firstYearImprovement, summary.lifetimeImprovement, topAction]);

  // X（旧Twitter）・LINE への直接シェア（PC・モバイルとも確実に動く導線）
  const xShareHref = useMemo(() => {
    const params = new URLSearchParams({ text: `${shareText} #手取りラボ`, url: shareUrl });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareText, shareUrl]);

  const lineShareHref = useMemo(
    () => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`,
    [shareUrl],
  );

  const flash = (which: 'text' | 'link') => {
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      flash('text');
    } catch {
      /* クリップボード不可の環境では無視 */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash('link');
    } catch {
      /* 無視 */
    }
  };

  const nativeShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({ text: shareText, url: shareUrl });
      } else {
        await copyLink();
      }
    } catch {
      /* ユーザーがキャンセルした場合等は無視 */
    }
  };

  return (
    <div className="space-y-6">
      {/* 改善余地ヒーロー */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-md">
        <p className="text-sm font-medium text-brand-100">{subjectLabel}</p>
        {hasSaving ? (
          <>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              初年度 約{animatedMan.toLocaleString()}万円
              <span className="text-lg font-medium">／年</span>
            </p>
            <p className="mt-1 text-brand-100">
              生涯では 約{formatMan(summary.lifetimeImprovement)} の削減余地
            </p>
          </>
        ) : (
          <p className="mt-1 text-2xl font-bold">見直せる大きなムダ・使い残しは見つかりませんでした</p>
        )}
      </div>

      {/* 改善余地の内訳（レバー別・確定分） */}
      {hasSaving && deterministicActions.length > 0 && (
        <div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {deterministicActions.map((a) => (
              <div
                key={a.rank}
                className={DOMAIN_BAR[a.domain]}
                style={{ width: `${(a.annualImpact / summary.firstYearImprovement) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {deterministicActions.map((a) => (
              <span key={a.rank} className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className={`h-2 w-2 rounded-full ${DOMAIN_BAR[a.domain]}`} />
                {DOMAIN_LABEL[a.domain]}
                <span className="tabular-nums text-slate-400">+{formatMan(a.annualImpact)}</span>
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            この合計が「初年度 約{formatMan(summary.firstYearImprovement)}」の内訳です（試算のNISAは含みません）。
          </p>
        </div>
      )}

      {/* 保障の過不足 */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-500">保障の過不足（万一のとき）</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          {coverage.cases.map((c) => (
            <CaseCard key={c.deceased} c={c} single={single} />
          ))}
        </div>
        {single && (
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            扶養する家族がいない場合、必要な死亡保障は葬儀費用程度で、大きな生命保険は基本的に不要です。今入っている死亡保険があれば、見直し余地として上に表示しています。
          </p>
        )}
      </section>

      {/* 世帯モードへの誘導（個人モードのとき） */}
      {single && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-800">パートナーがいる場合は、二人で診断するとさらに正確に</p>
          <p className="mt-1 text-xs text-brand-700">
            生命保険の必要保障額は、パートナーの収入や遺族年金で変わります。二人分を合算すると、世帯まるごとの最適化（ふるさと納税・iDeCo・NISAの二人分枠など）が見えます。
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            ふたりで診断する →
          </button>
        </div>
      )}

      {/* 打ち手リスト */}
      {summary.actions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-500">効果額の大きい順・打ち手リスト</h3>
          <ol className="space-y-2">
            {summary.actions.map((a) => (
              <li key={a.rank}>
                <Card className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {a.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${DOMAIN_COLOR[a.domain]}`}>
                        <DomainIcon path={DOMAIN_ICON[a.domain]} />
                        {DOMAIN_LABEL[a.domain]}
                      </span>
                      {a.illustrative && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                          試算・前提あり
                        </span>
                      )}
                      <span className="font-semibold text-slate-800">{a.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{a.detail}</p>
                    {/* 効果額バー（相対的な大きさを可視化） */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${a.illustrative ? 'bg-slate-300' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.max(6, Math.round((a.annualImpact / maxImpact) * 100))}%` }}
                      />
                    </div>
                    {/* #5：次にやること（具体アクション）＋CTA */}
                    <p className="mt-2.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">次にやること：</span>
                      {DOMAIN_ACTION[a.domain]}
                    </p>
                    <Cta cta={getAffiliateForDomain(a.domain)} />
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold tabular-nums text-emerald-600">
                      {a.illustrative ? '目安 ' : '+'}
                      {a.annualImpact.toLocaleString()}円
                    </div>
                    <div className="text-xs text-slate-400">／年{a.illustrative ? '〜' : ''}</div>
                  </div>
                </Card>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{disclosure.disclosure}</p>
        </section>
      )}

      {/* ムダが見つからなかった場合の正直な案内（舵⑤：売らない） */}
      {summary.actions.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          見直せる大きなムダや使い残しは見つかりませんでした。無理に変える必要はなく、今のままで問題ない可能性が高いです。
        </div>
      )}

      {/* 保障不足の注意喚起 */}
      {summary.coverageGaps.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-500">
            ⚠ 保障が不足している可能性（増やす方向の注意）
          </h3>
          <div className="space-y-2">
            {summary.coverageGaps.map((g) => (
              <div
                key={g.role}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
              >
                {g.detail}
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Cta cta={getAffiliateForGap()} />
          </div>
        </section>
      )}

      {/* シェアカード */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-500">結果をシェア</h3>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {/* OGカードのプレビュー（実際のSNS展開画像と同じ内容） */}
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <p className="text-xs opacity-90">【手取りラボ】{subjectLabel}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              初年度 約{formatMan(summary.firstYearImprovement)}
              <span className="text-sm font-medium">／年</span>
            </p>
            <p className="text-sm opacity-95">生涯では 約{formatMan(summary.lifetimeImprovement)} の削減余地</p>
            {topAction && (
              <p className="mt-2 inline-block rounded-md bg-white/15 px-2.5 py-1 text-xs">
                No.1の打ち手「{topAction.title}」
              </p>
            )}
          </div>

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
              onClick={nativeShare}
              className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
            >
              その他でシェア
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {copied === 'link' ? 'リンクをコピーしました' : 'リンクをコピー'}
            </button>
            <button
              type="button"
              onClick={copyText}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {copied === 'text' ? 'コピーしました' : 'テキストをコピー'}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            シェアリンクには改善余地の金額と打ち手名のみが含まれます（年収・年齢などの入力内容は含まれません）。
          </p>
        </div>
      </section>

      {/* 免責・出典 */}
      <details className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">前提・免責・出典</summary>
        <p className="mt-2 leading-relaxed">{summary.disclaimer}</p>
        <p className="mt-3 font-medium text-slate-600">主な出典</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {summary.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="mt-3 text-slate-400">
          前提: 遺族の生活費は現在の{Math.round(coverage.assumptions.livingRatioWithChild * 100)}%（子がいる間）／
          {Math.round(coverage.assumptions.livingRatioNoChild * 100)}%（子独立後）、
          survivor の平均余命 夫{coverage.assumptions.survivorLifeExpectancyAge.husband}歳・妻
          {coverage.assumptions.survivorLifeExpectancyAge.wife}歳、生涯効果は{coverage.assumptions.savingHorizonYears}年で概算。
          割引率・インフレは未考慮（名目値）。
        </p>
      </details>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        入力をやり直す
      </button>
    </div>
  );
}

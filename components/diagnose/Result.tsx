'use client';

import { useMemo, useState } from 'react';
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
          rel="sponsored noopener noreferrer"
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

function CaseCard({ c }: { c: CoverageCaseResult }) {
  const who = c.deceased === 'husband' ? '夫' : '妻';
  return (
    <Card className="flex-1">
      <div className="flex items-baseline justify-between">
        <h4 className="font-semibold text-slate-800">{who}が亡くなった場合</h4>
        <span className="text-xs text-slate-400">{c.coverageYears}年で試算</span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">必要保障額</dt>
          <dd className="font-semibold tabular-nums">{formatMan(c.requiredCoverage)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">今の死亡保障</dt>
          <dd className="tabular-nums">{formatMan(c.existingDeathBenefit)}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-slate-100 pt-2">
          {c.additionalNeeded > 0 ? (
            <>
              <dt className="font-medium text-rose-600">不足</dt>
              <dd className="font-bold tabular-nums text-rose-600">{formatMan(c.additionalNeeded)}</dd>
            </>
          ) : (
            <>
              <dt className="font-medium text-emerald-600">過剰（見直し余地）</dt>
              <dd className="font-bold tabular-nums text-emerald-600">{formatMan(c.surplusCoverage)}</dd>
            </>
          )}
        </div>
      </dl>
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
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  const hasSaving = summary.firstYearImprovement > 0;
  const topAction = summary.actions[0];
  const disclosure = getDisclosure();

  const shareText =
    `【二人のお金診断】うちの世帯、改善余地は初年度 約${formatMan(summary.firstYearImprovement)}／年。` +
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
        <p className="text-sm font-medium text-brand-100">あなたたち世帯の改善余地</p>
        {hasSaving ? (
          <>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              初年度 約{formatMan(summary.firstYearImprovement)}
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

      {/* 保障の過不足 */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-500">保障の過不足（万一のとき）</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <CaseCard c={coverage.husbandDies} />
          <CaseCard c={coverage.wifeDies} />
        </div>
      </section>

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
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${DOMAIN_COLOR[a.domain]}`}>
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
            <p className="text-xs opacity-90">【二人のお金診断】あなたたち世帯の改善余地</p>
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
            <button
              type="button"
              onClick={nativeShare}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              シェアする
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
            >
              {copied === 'link' ? 'リンクをコピーしました' : 'シェアリンクをコピー'}
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

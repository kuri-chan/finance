/**
 * ③ summarize — 必要保障額と過剰保険チェックを束ね、
 * 「改善余地（初年度/生涯）」と、効果額の大きい順の打ち手リストを返す。
 *
 * 初年度改善余地 = 過剰保険チェックの想定削減額合計（円/年）
 * 生涯改善余地   = 各打ち手の年額 × savingHorizonYears（前提年数）
 *
 * 保障の「不足」は削減余地ではないため coverageGaps として別立てで注意喚起する
 * （増やす方向の指摘を、改善余地の金額に混ぜない）。
 */
import { resolveAssumptions } from './constants';
import { DISCLAIMER, SOURCES } from './disclaimer';
import { checkOverInsurance } from './overInsurance';
import type { HouseholdInput, OptimizationAction, SummarizeOutput } from './types';

export function summarize(input: HouseholdInput): SummarizeOutput {
  const a = resolveAssumptions(input.assumptions);
  const over = checkOverInsurance(input);
  const horizon = a.savingHorizonYears;

  // findings は既に効果額の降順。ランク付けして打ち手化。
  const actions: OptimizationAction[] = over.findings.map((f, i) => ({
    rank: i + 1,
    domain: f.domain,
    title: f.title,
    detail: f.detail,
    annualImpact: f.estimatedAnnualSaving,
    lifetimeImpact: f.estimatedAnnualSaving * horizon,
  }));

  const firstYearImprovement = over.totalEstimatedAnnualSaving;
  const lifetimeImprovement = firstYearImprovement * horizon;

  return {
    firstYearImprovement,
    lifetimeImprovement,
    actions,
    coverageGaps: over.underInsured,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

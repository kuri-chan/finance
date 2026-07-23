/**
 * NISA（少額投資非課税制度）レバー。
 *
 * 他の確定的レバー（保険・ふるさと納税・iDeco）と異なり、NISAの便益は
 * 「将来の運用益への非課税」であり、想定利回り・保有期間に依存する試算（illustrative）である。
 * したがって:
 * - 便益は「投資している／する予定の額」にのみ計算し、枠全額を投資する前提の誇張はしない。
 * - 特定の銘柄・商品・金融機関は推奨せず、制度の枠の活用に徹する（金商法）。
 * - 将来の運用成果は保証しない旨を明記する。
 */
import nisa from '@/lib/data/nisa.json';
import type { NisaInput, NisaResult } from './types';

export const DISCLAIMER =
  'NISAの非課税メリットは、想定利回りにもとづく試算であり、将来の運用成果を保証するものではありません。' +
  '元本割れの可能性があります。特定の銘柄・商品・金融機関を推奨するものではなく、制度（非課税枠）の一般的な情報提供です。' +
  '投資判断はご自身の責任で行ってください。';

export const SOURCES: string[] = nisa._meta.sources;

function resolveAssumptions(override?: Partial<NisaInput['assumptions']>) {
  return {
    assumedAnnualReturn: nisa.assumedAnnualReturn,
    taxExemptRate: nisa.taxExemptRate,
    horizonYears: 30,
    ...override,
  };
}

/** 積立（毎年一定額）の将来価値（期末払い） */
function annuityFutureValue(annual: number, rate: number, years: number): number {
  if (rate === 0) return annual * years;
  return (annual * ((1 + rate) ** years - 1)) / rate;
}

export function calcNisa(input: NisaInput): NisaResult {
  const a = resolveAssumptions(input.assumptions);
  const adults = Math.max(1, input.adults);

  const householdAnnualCapacity = nisa.annualLimit.total * adults;
  const householdLifetimeCapacity = nisa.lifetimeLimit * adults;

  const plannedAnnualInvestment = Math.max(0, input.monthlyInvestment) * 12;

  // すでにNISAで使っている額：明示があればそれ、なければ usingNisa から推定
  const alreadyInNisaAnnual = input.usingNisa
    ? Math.min(
        input.currentAnnualNisaUsed ?? plannedAnnualInvestment,
        householdAnnualCapacity,
      )
    : 0;

  const outsideNisa = Math.max(0, plannedAnnualInvestment - alreadyInNisaAnnual);
  const remainingCapacity = Math.max(0, householdAnnualCapacity - alreadyInNisaAnnual);
  const eligibleForNisaAnnual = Math.min(outsideNisa, remainingCapacity);

  // 1年分の運用益にかかる税金相当（保守的な年次の目安）
  const annualImprovement = Math.round(
    eligibleForNisaAnnual * a.assumedAnnualReturn * a.taxExemptRate,
  );

  // 生涯の非課税メリット（複利・試算）
  const fv = annuityFutureValue(eligibleForNisaAnnual, a.assumedAnnualReturn, a.horizonYears);
  const contributions = eligibleForNisaAnnual * a.horizonYears;
  const gains = Math.max(0, fv - contributions);
  const illustrativeLifetimeBenefit = Math.round(gains * a.taxExemptRate);

  return {
    householdAnnualCapacity,
    householdLifetimeCapacity,
    plannedAnnualInvestment,
    alreadyInNisaAnnual,
    eligibleForNisaAnnual,
    annualImprovement,
    illustrativeLifetimeBenefit,
    assumptions: a,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

export type { NisaInput, NisaResult, NisaAssumptions } from './types';

/**
 * JSONデータのローダと、既定 assumptions の解決。
 * 制度定数は必ずここ経由で参照し、関数本体に数値を直書きしない。
 */
import pension from '../data/survivor-pension.json';
import living from '../data/living-cost.json';
import education from '../data/education-cost.json';
import benchmark from '../data/insurance-benchmark.json';
import type { CoverageAssumptions, EducationPath, Role } from './types';

export const PENSION = pension;
export const LIVING = living;
export const EDUCATION = education;
export const BENCHMARK = benchmark;

/** すべての出典を集約 */
export const ALL_SOURCES: string[] = [
  ...pension._meta.sources,
  ...living._meta.sources,
  ...education._meta.sources,
  ...benchmark._meta.sources,
];

/** 既定の前提（data/living-cost.json 由来） */
export const DEFAULT_ASSUMPTIONS: CoverageAssumptions = {
  livingRatioWithChild: living.livingRatioWithChild,
  livingRatioNoChild: living.livingRatioNoChild,
  funeralCost: living.funeralCost,
  childIndependenceAge: living.childIndependenceAge,
  ownedMaintenanceAnnual: living.ownedMaintenanceAnnual,
  livingCostIncomeRatio: living.livingCostIncomeRatio,
  careerStartAge: living.careerStartAge,
  retirementAge: living.retirementAge,
  survivorLifeExpectancyAge: living.survivorLifeExpectancyAge as Record<Role, number>,
  educationPath: living.educationPath as EducationPath,
  savingHorizonYears: living.savingHorizonYears,
};

/** 入力の assumptions で既定を上書きして完全な前提を得る */
export function resolveAssumptions(
  override?: Partial<CoverageAssumptions>,
): CoverageAssumptions {
  return {
    ...DEFAULT_ASSUMPTIONS,
    ...override,
    survivorLifeExpectancyAge: {
      ...DEFAULT_ASSUMPTIONS.survivorLifeExpectancyAge,
      ...(override?.survivorLifeExpectancyAge ?? {}),
    },
  };
}

/** 額面年収から手取り率を引く（data のブラケット表） */
export function takeHomeRatio(annualIncome: number): number {
  const band = living.takeHomeRatioByIncome.find((b) => annualIncome <= b.maxIncome);
  return band ? band.ratio : living.takeHomeRatioByIncome[living.takeHomeRatioByIncome.length - 1].ratio;
}

/** 進路・年齢から その年の教育費（円）を引く。就学年齢外は0。 */
export function educationCostForAge(age: number, path: EducationPath): number {
  const stage = education.stages.find((s) => age >= s.ageFrom && age <= s.ageTo);
  if (!stage) return 0;
  return path === 'private' ? stage.private : stage.public;
}

/** 年齢から 定期保険 1,000万円あたりの年間保険料（円）を引く */
export function termAnnualPremiumPer10Million(age: number): number {
  const band = benchmark.term.annualPremiumPer10MillionByAgeBand.find((b) => age <= b.maxAge);
  return band
    ? band.premium
    : benchmark.term.annualPremiumPer10MillionByAgeBand[
        benchmark.term.annualPremiumPer10MillionByAgeBand.length - 1
      ].premium;
}

/** 円あたりの定期保険料率 */
export function termPremiumRatePerYen(age: number): number {
  return termAnnualPremiumPer10Million(age) / 10_000_000;
}

/**
 * iDeCo（個人型確定拠出年金）レバー。
 * 掛金は全額所得控除 → 節税額 = 掛金 ×(所得税限界税率×1.021 + 住民税率)。
 * 改善余地は「未使用枠を満額拠出した場合の年間節税額」。
 *
 * 重要な前提（舵⑤：正直に）:
 * - 掛金は原則60歳まで引き出せない。これは節税と引き換えの制約で、
 *   節税額は「老後資金として拠出できる範囲で」得られる確定的メリットである。
 * - これは情報提供・シミュレーションであり、特定の金融機関・商品の推奨ではない。
 */
import ideco from '@/lib/data/ideco.json';
import tax from '@/lib/data/tax.json';
import {
  RECONSTRUCTION_SURTAX_RATE,
  RESIDENT_TAX_RATE,
  marginalIncomeTaxRate,
  taxableIncome,
} from '@/lib/tax';
import type { IdecoInput, IdecoPerson, IdecoPersonResult, IdecoResult } from './types';

export const DISCLAIMER =
  'iDeCoの節税額は、一般的な制度と概算にもとづくシミュレーションです。' +
  '掛金は原則60歳まで引き出せません（老後資金の先取り）。実際の掛金上限・節税額は' +
  '加入区分・企業年金の状況・他の控除により変わります。特定の金融機関・商品を勧めるものではありません。';

export const SOURCES: string[] = [...ideco._meta.sources, ...tax._meta.sources];

function resolveAssumptions(override?: Partial<IdecoInput['assumptions']>) {
  return { horizonYears: 30, ...override };
}

/** 加入区分に応じた掛金上限（円/月） */
export function idecoMonthlyLimit(person: IdecoPerson): number {
  if (person.employmentType === 'self_employed') return ideco.monthlyLimit.self_employed;
  return person.hasCorporateDC
    ? ideco.monthlyLimit.employee_with_corporate_dc
    : ideco.monthlyLimit.employee_no_corporate_pension;
}

function calcPerson(person: IdecoPerson, spouseIncome: number): IdecoPersonResult {
  const monthlyLimit = idecoMonthlyLimit(person);
  const currentMonthly = Math.max(0, person.currentMonthlyContribution ?? 0);
  const unusedAnnual = Math.max(0, (monthlyLimit - currentMonthly) * 12);

  // 課税所得（iDeco控除前）。ここから拠出額を控除して節税が生じる。
  const taxableForIncomeTax = taxableIncome(
    person.annualIncome,
    person.employmentType,
    spouseIncome,
    'incomeTax',
  );

  // 課税所得がなければ節税は生じない（例：収入のない配偶者）
  const marginalRate = taxableForIncomeTax > 0 ? marginalIncomeTaxRate(taxableForIncomeTax) : 0;
  const taxReductionRate =
    taxableForIncomeTax > 0 ? marginalRate * RECONSTRUCTION_SURTAX_RATE + RESIDENT_TAX_RATE : 0;

  // 控除額は課税所得を超えられない
  const deductible = Math.min(unusedAnnual, taxableForIncomeTax);
  const annualTaxSaving = Math.max(0, Math.round(deductible * taxReductionRate));

  return {
    role: person.role,
    annualIncome: person.annualIncome,
    monthlyLimit,
    currentMonthly,
    unusedAnnual,
    taxReductionRate,
    annualTaxSaving,
  };
}

export function calcIdeco(input: IdecoInput): IdecoResult {
  const a = resolveAssumptions(input.assumptions);

  const perPerson = input.persons.map((p, i) => {
    const spouseIncome = input.persons.length === 2 ? input.persons[1 - i].annualIncome : Infinity;
    return calcPerson(p, spouseIncome);
  });

  const householdMonthlyLimit = perPerson.reduce((s, p) => s + p.monthlyLimit, 0);
  const annualImprovement = perPerson.reduce((s, p) => s + p.annualTaxSaving, 0);

  return {
    perPerson,
    householdMonthlyLimit,
    annualImprovement,
    assumptions: a,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

export type { IdecoInput, IdecoResult, IdecoPerson, IdecoPersonResult, IdecoAssumptions } from './types';

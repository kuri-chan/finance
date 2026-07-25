/**
 * 所得税・住民税の簡易計算（共有）。ふるさと納税・iDeco 等の各レバーが利用する。
 * 制度定数は lib/data/tax.json 由来（直書き禁止）。
 *
 * 前提・簡易化:
 * - 会社員は給与所得控除を適用。個人事業主は入力年収を事業所得とみなす（給与所得控除なし）。
 * - 社会保険料は概算率（会社員 約15%）で推定。
 * - 所得控除は 社会保険料控除 + 基礎控除 + 配偶者控除（一般・満額のみ）に限定。
 *   医療費控除・生命保険料控除・iDeco掛金控除等は未考慮（各レバー側で扱う）。
 */
import tax from '@/lib/data/tax.json';

export type EmploymentType = 'employee' | 'self_employed';

/** 給与所得控除（円） */
export function salaryIncomeDeduction(income: number): number {
  const b = tax.salaryDeduction.brackets.find((x) => income <= x.maxIncome);
  if (!b) return tax.salaryDeduction.brackets[tax.salaryDeduction.brackets.length - 1].amount ?? 0;
  if (b.type === 'flat') return b.amount ?? 0;
  return Math.max(0, income * (b.rate ?? 0) + (b.add ?? 0));
}

/** 給与所得（会社員）または事業所得（個人事業主・簡易化で入力年収そのもの） */
export function earnedIncome(income: number, employment: EmploymentType): number {
  if (employment === 'self_employed') return income;
  return Math.max(0, income - salaryIncomeDeduction(income));
}

/**
 * 社会保険料控除の概算（円）。
 * 会社員は健保・厚生年金の標準報酬上限（キャップ）を反映し、高所得での過大計上を防ぐ。
 * age を渡すと40歳以上で介護保険料を加算する（省略時は加算しない）。
 * 個人事業主は概算率（国民年金＋国保）。
 */
export function socialInsurance(
  income: number,
  employment: EmploymentType,
  age?: number,
): number {
  if (employment === 'self_employed') {
    return income * tax.socialInsurance.selfEmployedRate;
  }
  const e = tax.socialInsurance.employee;
  const monthly = income / 12;
  const pensionBase = Math.min(monthly, e.pensionMonthlyCap);
  const healthBase = Math.min(monthly, e.healthMonthlyCap);
  const healthRate = e.healthRate + (age != null && age >= e.longTermCareMinAge ? e.longTermCareRate : 0);
  const monthlyPremium =
    healthBase * healthRate + pensionBase * e.pensionRate + monthly * e.employmentRate;
  return Math.round(monthlyPremium * 12);
}

/** 配偶者控除（円）。一般・満額のみ（段階減額は未考慮）。 */
export function spouseDeduction(
  taxpayerIncome: number,
  spouseIncome: number,
  kind: 'incomeTax' | 'residentTax',
): number {
  const s = tax.spouseDeduction;
  const eligible = spouseIncome <= s.spouseIncomeLimit && taxpayerIncome <= s.taxpayerIncomeLimit;
  if (!eligible) return 0;
  return kind === 'incomeTax' ? s.incomeTax : s.residentTax;
}

/** 課税所得（円）。kind により基礎控除・配偶者控除の額が変わる。age は介護保険の判定に使う。 */
export function taxableIncome(
  income: number,
  employment: EmploymentType,
  spouseIncome: number,
  kind: 'incomeTax' | 'residentTax',
  age?: number,
): number {
  const earned = earnedIncome(income, employment);
  const social = socialInsurance(income, employment, age);
  const basic = kind === 'incomeTax' ? tax.basicDeduction.incomeTax : tax.basicDeduction.residentTax;
  const spouse = spouseDeduction(income, spouseIncome, kind);
  return Math.max(0, earned - social - basic - spouse);
}

/** 所得税の限界税率（復興特別所得税は含めない素の税率） */
export function marginalIncomeTaxRate(taxableForIncomeTax: number): number {
  const b = tax.incomeTaxBrackets.find((x) => taxableForIncomeTax <= x.maxTaxable);
  return b ? b.rate : tax.incomeTaxBrackets[tax.incomeTaxBrackets.length - 1].rate;
}

/** 住民税の所得割額（円） */
export function residentTaxIncomeLevy(taxableForResident: number): number {
  return taxableForResident * tax.residentTaxRate;
}

export const RECONSTRUCTION_SURTAX_RATE = tax.reconstructionSurtaxRate;
export const RESIDENT_TAX_RATE = tax.residentTaxRate;

/**
 * 遺族年金の「その年の年額」を計算する内部ヘルパ。
 *
 * 遺族基礎年金（国民年金）:
 *   子のある配偶者に支給。年額 = 基本額 + 子加算（第1・2子/第3子以降で単価が違う）。
 *   子は 18歳到達年度末まで（本エンジンでは 18歳未満を「対象の子」とみなす簡易化）。
 *
 * 遺族厚生年金（厚生年金・会社員のみ）:
 *   = 報酬比例部分 × 3/4
 *   報酬比例部分 = 平均標準報酬額 × (5.481/1000) × 被保険者月数
 *   短期要件では被保険者月数は最低 300月みなし。
 *   夫が受給者の場合、遺族基礎年金を受けられない期間は原則60歳から（簡易反映）。
 *
 * 中高齢寡婦加算:
 *   夫死亡・妻が40〜65歳・遺族基礎年金を受けられない期間に加算。
 *
 * すべての制度定数は data/survivor-pension.json 由来（直書き禁止）。
 */
import { PENSION } from './constants';
import type { EmploymentType, Role } from './types';

export interface YearlyPensionInput {
  deceasedEmployment: EmploymentType;
  /** 平均標準報酬額（月・円、上限は data の standardRewardMonthlyCap で頭打ち） */
  deceasedAvgStandardRewardMonthly: number;
  /** 死亡者の被保険者月数（300月みなしは内部で適用） */
  deceasedInsuredMonths: number;
  survivorRole: Role;
  survivorAge: number;
  /** 遺された配偶者の年収（円）。生計維持要件（850万円未満）の判定に使う。 */
  survivorAnnualIncome: number;
  /** その年に遺族基礎年金の対象となる子（到達年度末までの近似）の人数 */
  dependentChildrenCount: number;
  /**
   * 中高齢寡婦加算の基礎要件を満たすか。
   * 「夫死亡時に妻が40歳以上」または「子がいた（＝遺族基礎年金を受けていた）」場合に true。
   * 夫死亡時に40歳未満かつ子なしの妻は、その後40歳を超えても対象外なので false。
   */
  widowMidAdditionBaseEligible: boolean;
}

export interface YearlyPensionBreakdown {
  basic: number;
  employees: number;
  midWidow: number;
  total: number;
}

/** 遺族基礎年金の年額（子加算含む） */
function basicPensionAnnual(dependentChildrenCount: number): number {
  if (dependentChildrenCount <= 0) return 0;
  const bp = PENSION.basicPension;
  let amount = bp.annualAmount;
  for (let i = 1; i <= dependentChildrenCount; i++) {
    amount += i <= 2 ? bp.childAddition.firstSecond : bp.childAddition.thirdOnward;
  }
  return amount;
}

/** 遺族厚生年金の年額（会社員のみ・受給資格の簡易判定込み） */
function employeesPensionAnnual(input: YearlyPensionInput): number {
  if (input.deceasedEmployment !== 'employee') return 0;
  const ep = PENSION.employeesPension;

  // 夫が受給者で遺族基礎年金の対象となる子がいない期間は原則60歳から（簡易反映）。
  const husbandNotYetEligible =
    input.survivorRole === 'husband' &&
    input.dependentChildrenCount === 0 &&
    input.survivorAge < ep.husbandSurvivorStartAge;
  if (husbandNotYetEligible) return 0;

  const months = Math.max(input.deceasedInsuredMonths, ep.minInsuredMonths);
  const reportProportional =
    input.deceasedAvgStandardRewardMonthly * (ep.multiplierPerMille / 1000) * months;
  return reportProportional * ep.survivorRatio;
}

/** 中高齢寡婦加算の年額 */
function midWidowAdditionAnnual(input: YearlyPensionInput): number {
  const mw = PENSION.midAgeWidowAddition;
  const eligible =
    input.survivorRole === 'wife' &&
    input.deceasedEmployment === 'employee' &&
    input.widowMidAdditionBaseEligible &&
    input.dependentChildrenCount === 0 &&
    input.survivorAge >= mw.minAge &&
    input.survivorAge < mw.maxAge;
  return eligible ? mw.annualAmount : 0;
}

/** 生計維持要件：遺族の収入が基準額以上なら遺族年金は受けられない */
function meetsSurvivorIncomeRequirement(survivorAnnualIncome: number): boolean {
  return survivorAnnualIncome < PENSION.eligibility.survivorAnnualIncomeThreshold;
}

export function annualSurvivorPension(input: YearlyPensionInput): YearlyPensionBreakdown {
  // 生計維持要件を満たさない遺族には遺族年金は支給されない
  if (!meetsSurvivorIncomeRequirement(input.survivorAnnualIncome)) {
    return { basic: 0, employees: 0, midWidow: 0, total: 0 };
  }
  const basic = basicPensionAnnual(input.dependentChildrenCount);
  const employees = employeesPensionAnnual(input);
  const midWidow = midWidowAdditionAnnual(input);
  return { basic, employees, midWidow, total: basic + employees + midWidow };
}

/** 額面年収から平均標準報酬額（月）を推定（上限で頭打ち） */
export function estimateStandardRewardMonthly(annualIncome: number): number {
  return Math.min(annualIncome / 12, PENSION.employeesPension.standardRewardMonthlyCap);
}

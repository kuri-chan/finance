export type EmploymentType = 'employee' | 'self_employed';

export interface FurusatoPerson {
  role?: string;
  annualIncome: number;
  employmentType: EmploymentType;
}

export interface FurusatoAssumptions {
  selfPay: number;
  returnRate: number;
  /** 生涯効果の概算年数 */
  horizonYears: number;
}

export interface FurusatoInput {
  /** 世帯の2人。各人の限度額は自分の税額で決まる。 */
  persons: FurusatoPerson[];
  /** 現在ふるさと納税をしているか */
  doing: boolean;
  /** 現在の年間寄附額（世帯合計・円）。doing=true のとき有効。 */
  currentAnnualDonation?: number;
  assumptions?: Partial<FurusatoAssumptions>;
}

export interface FurusatoPersonResult {
  role?: string;
  annualIncome: number;
  /** 自己負担2,000円で寄附できる上限（円） */
  limit: number;
  /** 返礼品価値が自己負担を上回り、実施する意味があるか */
  meaningful: boolean;
}

export interface FurusatoResult {
  perPerson: FurusatoPersonResult[];
  /** 世帯の限度額合計（円） */
  householdLimit: number;
  /** 現在の年間寄附額（円） */
  currentDonation: number;
  /** 未使用の枠（円） */
  unusedLimit: number;
  /**
   * 改善余地（円/年）。未実施なら「上限まで寄附した場合の返礼品価値 − 自己負担」、
   * 実施中なら「未使用枠 × 返礼品還元率」。
   */
  annualImprovement: number;
  assumptions: FurusatoAssumptions;
  disclaimer: string;
  sources: string[];
}

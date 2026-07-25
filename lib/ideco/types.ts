export type EmploymentType = 'employee' | 'self_employed';

export interface IdecoPerson {
  role?: string;
  annualIncome: number;
  employmentType: EmploymentType;
  /** 年齢（介護保険料の判定に使用。省略可） */
  age?: number;
  /** 企業型DCに加入しているか（会社員の掛金上限に影響） */
  hasCorporateDC?: boolean;
  /** 現在のiDeCo掛金（円/月）。未加入は0。 */
  currentMonthlyContribution?: number;
}

export interface IdecoAssumptions {
  /** 生涯効果の概算年数 */
  horizonYears: number;
}

export interface IdecoInput {
  persons: IdecoPerson[];
  assumptions?: Partial<IdecoAssumptions>;
}

export interface IdecoPersonResult {
  role?: string;
  annualIncome: number;
  /** 掛金上限（円/月） */
  monthlyLimit: number;
  /** 現在の掛金（円/月） */
  currentMonthly: number;
  /** まだ拠出できる年間額（円） */
  unusedAnnual: number;
  /** 適用される軽減率（所得税×復興＋住民税） */
  taxReductionRate: number;
  /** 未使用枠を満額拠出した場合の年間節税額（円） */
  annualTaxSaving: number;
}

export interface IdecoResult {
  perPerson: IdecoPersonResult[];
  /** 世帯の掛金上限合計（円/月） */
  householdMonthlyLimit: number;
  /** 改善余地（円/年）＝ 未使用枠を満額拠出した場合の世帯の節税額合計 */
  annualImprovement: number;
  assumptions: IdecoAssumptions;
  disclaimer: string;
  sources: string[];
}

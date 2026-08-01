/**
 * 保険エンジンの入出力型。
 * すべて「情報提供・シミュレーション」用途。商品の推奨や断定は行わない。
 */

export type Role = 'husband' | 'wife';
export type EmploymentType = 'employee' | 'self_employed';
export type EducationPath = 'public' | 'private';
export type LifePolicyType = 'term' | 'whole' | 'endowment';

/** 世帯の1人（夫 or 妻） */
export interface Person {
  role: Role;
  age: number;
  /** 額面年収（円） */
  annualIncome: number;
  /** 会社員=厚生年金加入、個人事業主=国民年金のみ */
  employmentType: EmploymentType;
}

/**
 * 子。現在いる子は age を、出産予定の子は bornInYears（何年後に生まれるか）を指定。
 * 少なくとも一方は必須。
 */
export interface Child {
  age?: number;
  bornInYears?: number;
}

export type Housing =
  | { type: 'rent'; monthlyRent: number }
  | {
      type: 'owned';
      /** ローン返済額（円/月）。団信で消滅する対象。 */
      monthlyPayment: number;
      hasMortgage: boolean;
      /** 団体信用生命保険への加入。加入者死亡時に住宅ローンが消滅。 */
      groupCreditLife: boolean;
      /** 主債務者。省略時は世帯の主たる稼ぎ手を主債務者とみなす。 */
      mortgageHolder?: Role;
    };

export interface Assets {
  /** 世帯の現在の金融資産（円） */
  savings: number;
}

export interface LifePolicy {
  insured: Role;
  /** 死亡保険金（円） */
  deathBenefit: number;
  /** 年間保険料（円） */
  annualPremium: number;
  type: LifePolicyType;
  label?: string;
}

export interface MedicalPolicy {
  insured: Role;
  annualPremium: number;
  /** 入院日額（円）。重複時にどれを残すかの判定に使用。 */
  dailyHospitalBenefit?: number;
  label?: string;
}

export interface FirePolicy {
  annualPremium: number;
  /** 建物の付保額（円） */
  buildingCoverage: number;
  /** 家財の付保額（円） */
  contentsCoverage: number;
  /** 付帯特約のキー（例: 'water_leak_extended','theft_high','accidental_damage'） */
  riders: string[];
}

export interface AutoPolicy {
  annualPremium: number;
  vehicleAgeYears: number;
  /** 車両価値（時価・円） */
  vehicleValue: number;
  hasVehicleCoverage: boolean;
  /** 車両保険部分の保険料（円/年）。不明なら省略（推定する）。 */
  vehicleCoveragePremium?: number;
  /** 人身傷害補償の有無 */
  hasPersonalInjuryCoverage: boolean;
  /** 付帯特約のキー（例: 'passenger_injury','legal'） */
  riders: string[];
  label?: string;
}

/** エンジン全体の前提。既定値は lib/data/*.json 由来。任意で上書き可能。 */
export interface CoverageAssumptions {
  livingRatioWithChild: number;
  livingRatioNoChild: number;
  funeralCost: number;
  childIndependenceAge: number;
  ownedMaintenanceAnnual: number;
  livingCostIncomeRatio: number;
  careerStartAge: number;
  retirementAge: number;
  survivorLifeExpectancyAge: Record<Role, number>;
  educationPath: EducationPath;
  savingHorizonYears: number;
}

export interface HouseholdInput {
  /** 世帯の人（ふたり=世帯モード / ひとり=個人モード）。1〜2人。 */
  persons: Person[];
  children: Child[];
  housing: Housing;
  assets: Assets;
  lifePolicies: LifePolicy[];
  medicalPolicies: MedicalPolicy[];
  firePolicy?: FirePolicy;
  autoPolicies?: AutoPolicy[];
  /** 住居費を除く世帯の月間生活費（円）。省略時は収入から推定。 */
  monthlyLivingExpense?: number;
  /** 前提の上書き（任意） */
  assumptions?: Partial<CoverageAssumptions>;
}

/** 片方が死亡したケースの必要保障額 */
export interface CoverageCaseResult {
  /** 死亡した人 */
  deceased: Role;
  /** 遺された人 */
  survivor: Role;
  /** 遺族の生計を見込む年数 */
  coverageYears: number;
  expenses: {
    living: number;
    housing: number;
    education: number;
    funeral: number;
    total: number;
  };
  incomes: {
    /** 遺族年金（遺族基礎＋遺族厚生＋中高齢寡婦加算）総額 */
    survivorPension: number;
    /** 遺された配偶者の手取り収入 総額 */
    survivorEmploymentIncome: number;
    /** 現有資産 */
    existingAssets: number;
    /** 既加入保険を除いた収入合計 */
    total: number;
  };
  /** 必要保障額 = max(0, 支出総額 − 収入総額) */
  requiredCoverage: number;
  /** 既加入の死亡保険金（被保険者=deceased） */
  existingDeathBenefit: number;
  /** 追加で必要な保障額 = max(0, 必要保障額 − 既加入保険金) */
  additionalNeeded: number;
  /** 過剰な保障額 = max(0, 既加入保険金 − 必要保障額) */
  surplusCoverage: number;
}

export interface RequiredCoverageOutput {
  /** 各人が亡くなったケース。世帯モード=2件（夫死亡・妻死亡の順）／個人モード=1件。 */
  cases: CoverageCaseResult[];
  assumptions: CoverageAssumptions;
  disclaimer: string;
  sources: string[];
}

export type OverInsuranceDomain =
  | 'life'
  | 'medical'
  | 'savings_insurance'
  | 'fire'
  | 'auto';

export interface OverInsuranceFinding {
  domain: OverInsuranceDomain;
  role?: Role;
  title: string;
  detail: string;
  /** 想定削減額（円/年）。断定ではなく目安。 */
  estimatedAnnualSaving: number;
}

export interface UnderInsuredNote {
  role: Role;
  /** 保障の不足額（円）。削減ではなくリスクとして提示。 */
  shortfall: number;
  detail: string;
}

export interface OverInsuranceOutput {
  findings: OverInsuranceFinding[];
  /** 想定削減額の合計（円/年） */
  totalEstimatedAnnualSaving: number;
  /** 保障不足（増やす方向の注意喚起） */
  underInsured: UnderInsuredNote[];
  disclaimer: string;
  sources: string[];
}

export interface OptimizationAction {
  rank: number;
  domain: OverInsuranceDomain;
  title: string;
  detail: string;
  /** 初年度インパクト（円/年） */
  annualImpact: number;
  /** 生涯インパクト（円） */
  lifetimeImpact: number;
}

export interface SummarizeOutput {
  /** 改善余地：初年度（円/年） */
  firstYearImprovement: number;
  /** 改善余地：生涯（円） */
  lifetimeImprovement: number;
  /** 効果額の大きい順の打ち手リスト */
  actions: OptimizationAction[];
  /** 保障不足の注意喚起（削減ではない） */
  coverageGaps: UnderInsuredNote[];
  disclaimer: string;
  sources: string[];
}

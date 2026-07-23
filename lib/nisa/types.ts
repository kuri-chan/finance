export interface NisaAssumptions {
  /** 試算用の想定年利（保守的な仮定・将来を保証しない） */
  assumedAnnualReturn: number;
  /** 上場株式等の譲渡益等への税率 */
  taxExemptRate: number;
  /** 生涯効果の試算年数 */
  horizonYears: number;
}

export interface NisaInput {
  /** 世帯の成人数（通常2）。年間・生涯枠は人数分。 */
  adults: number;
  /** 世帯の毎月の投資額（円/月）。投資していなければ0。 */
  monthlyInvestment: number;
  /** その投資をNISA口座で行っているか */
  usingNisa: boolean;
  /** すでにNISAで使っている年間額（円）。省略時は usingNisa から推定。 */
  currentAnnualNisaUsed?: number;
  assumptions?: Partial<NisaAssumptions>;
}

export interface NisaResult {
  /** 世帯の年間非課税投資枠（円） */
  householdAnnualCapacity: number;
  /** 世帯の生涯非課税保有限度額（円） */
  householdLifetimeCapacity: number;
  /** 年間の投資予定額（円） */
  plannedAnnualInvestment: number;
  /** すでにNISAで投資している年間額（円） */
  alreadyInNisaAnnual: number;
  /** NISAに回せる余地のある年間額（円） */
  eligibleForNisaAnnual: number;
  /**
   * 改善余地（円/年・試算）＝ NISAに回せる額の1年分の運用益にかかる税金相当。
   * 前提依存の試算であり、確定的な節約ではない（illustrative）。
   */
  annualImprovement: number;
  /** 生涯の非課税メリットの試算（複利・円）。前提依存。 */
  illustrativeLifetimeBenefit: number;
  assumptions: NisaAssumptions;
  disclaimer: string;
  sources: string[];
}

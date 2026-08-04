import type {
  HouseholdInput,
  OverInsuranceDomain,
  RequiredCoverageOutput,
  UnderInsuredNote,
} from '@/lib/insurance';
import type { FurusatoResult } from '@/lib/furusato';
import type { IdecoResult } from '@/lib/ideco';
import type { NisaResult } from '@/lib/nisa';

/** レバーの領域。保険の各領域＋ふるさと納税＋iDeco＋NISA。 */
export type LeverDomain = OverInsuranceDomain | 'furusato' | 'ideco' | 'nisa';

export type LeverCategory = 'insurance' | 'furusato' | 'ideco' | 'nisa';

/** 世帯全体の打ち手（レバー横断） */
export interface HouseholdAction {
  rank: number;
  domain: LeverDomain;
  category: LeverCategory;
  title: string;
  detail: string;
  /** 初年度インパクト（円/年） */
  annualImpact: number;
  /** 生涯インパクト（円） */
  lifetimeImpact: number;
  /**
   * 前提依存の試算か（例：NISAは想定利回りに依存）。
   * true の打ち手は確定的な「改善余地」合計には含めず、UIで「試算」と明示する。
   */
  illustrative?: boolean;
}

/** レバー横断の入力（保険の世帯入力＋各レバー固有の入力） */
export interface OptimizeInput extends HouseholdInput {
  furusato?: {
    doing: boolean;
    currentAnnualDonation?: number;
  };
  /** iDeCoの各人固有情報（persons と同じ並び順） */
  ideco?: {
    persons: { hasCorporateDC?: boolean; currentMonthlyContribution?: number }[];
  };
  /** NISAの世帯情報 */
  nisa?: {
    monthlyInvestment: number;
    usingNisa: boolean;
  };
}

/** 参考平均との比較（生命・医療保険料）。参考値であり確定的な比較ではない。 */
export interface InsuranceBenchmark {
  /** あなたの生命＋医療保険料の年間合計（円） */
  userAnnual: number;
  /** 参考平均（円） */
  avgAnnual: number;
  /** 差（円）＝ あなた − 平均。正なら平均より高い。 */
  diffAnnual: number;
  /** あなた ÷ 平均 */
  ratio: number;
  /** high=平均より高め / average=平均的 / low=平均より低め */
  verdict: 'high' | 'average' | 'low';
  mode: 'single' | 'household';
  /** 出典（参考値の根拠） */
  source: string;
}

export interface HouseholdOptimization {
  /** 改善余地：初年度（円/年） */
  firstYearImprovement: number;
  /** 改善余地：生涯（円） */
  lifetimeImprovement: number;
  /** 効果額の大きい順の打ち手（レバー横断） */
  actions: HouseholdAction[];
  /** 保障不足の注意喚起（削減ではない） */
  coverageGaps: UnderInsuredNote[];
  /** 保険の必要保障額（過不足カード用） */
  coverage: RequiredCoverageOutput;
  /** ふるさと納税の詳細 */
  furusato: FurusatoResult;
  /** iDeCoの詳細 */
  ideco: IdecoResult;
  /** NISAの詳細（試算） */
  nisa: NisaResult;
  /** 生命・医療保険料の参考平均との比較（保険料未入力なら null） */
  insuranceBenchmark: InsuranceBenchmark | null;
  disclaimer: string;
  sources: string[];
}

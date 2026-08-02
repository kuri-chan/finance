import type { LifePolicyType, Role } from '@/lib/insurance';
import type { OptimizeInput } from '@/lib/optimize';

/**
 * 診断ウィザードのフォーム状態と、エンジン入力(HouseholdInput)への変換。
 * 金額はユーザーが入力しやすい単位（年収・保障額・貯蓄・家財・車両=万円、保険料・家賃・生活費=円）。
 */

export const MAN = 10_000;

export interface PersonForm {
  age: number;
  /** 年収（万円/年） */
  income: number;
  employmentType: 'employee' | 'self_employed';
  /** 企業型DCに加入しているか（iDeCoの掛金上限に影響） */
  hasCorporateDC: boolean;
  /** 現在のiDeCo掛金（円/月）。未加入は0。 */
  idecoMonthly: number;
}

export interface LifeForm {
  insured: Role;
  /** 死亡保険金（万円） */
  deathBenefit: number;
  /** 年間保険料（円） */
  annualPremium: number;
  type: LifePolicyType;
}

export interface MedicalForm {
  insured: Role;
  annualPremium: number;
  /** 入院日額（円） */
  dailyHospitalBenefit: number;
}

export interface FireForm {
  enabled: boolean;
  annualPremium: number;
  /** 家財の付保額（万円） */
  contentsCoverage: number;
  riders: string[];
}

export interface AutoForm {
  annualPremium: number;
  vehicleAgeYears: number;
  /** 車両価値（万円） */
  vehicleValue: number;
  hasVehicleCoverage: boolean;
  /** 車両保険部分の保険料（円/年、0なら推定） */
  vehicleCoveragePremium: number;
  hasPersonalInjuryCoverage: boolean;
  riders: string[];
}

export interface FormState {
  /** couple=ふたりで診断（世帯・北極星）／single=ひとりで診断（個人モード） */
  mode: 'couple' | 'single';
  husband: PersonForm;
  wife: PersonForm;
  housingType: 'rent' | 'owned';
  monthlyRent: number;
  monthlyPayment: number;
  groupCreditLife: boolean;
  mortgageHolder: Role;
  /** 現在の子の年齢 */
  childrenAges: number[];
  /** 出産予定（何年後）。なしは null */
  plannedChildInYears: number | null;
  monthlyLivingExpense: number;
  /** 貯蓄（万円） */
  savings: number;
  /** 生命保険に加入しているか（トグル。offなら life は診断に使わない） */
  hasLife: boolean;
  life: LifeForm[];
  /** 医療保険に加入しているか */
  hasMedical: boolean;
  medical: MedicalForm[];
  fire: FireForm;
  /** 自動車保険に加入しているか */
  hasAuto: boolean;
  autos: AutoForm[];
  /** ふるさと納税をしているか */
  furusatoDoing: boolean;
  /** 現在の年間寄附額（円・世帯合計） */
  furusatoCurrentDonation: number;
  /** 毎月の投資額（円・世帯） */
  nisaMonthlyInvestment: number;
  /** その投資をNISA口座で行っているか */
  nisaUsing: boolean;
}

export const FIRE_RIDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'water_leak_extended', label: '水濡れ拡張' },
  { value: 'theft_high', label: '盗難（高額）' },
  { value: 'accidental_damage', label: '破損・汚損' },
];

export const AUTO_RIDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'passenger_injury', label: '搭乗者傷害' },
  { value: 'legal', label: '弁護士特約' },
];

export function defaultForm(): FormState {
  return {
    mode: 'couple',
    husband: { age: 32, income: 750, employmentType: 'employee', hasCorporateDC: false, idecoMonthly: 0 },
    wife: { age: 30, income: 550, employmentType: 'employee', hasCorporateDC: false, idecoMonthly: 0 },
    housingType: 'rent',
    monthlyRent: 180_000,
    monthlyPayment: 130_000,
    groupCreditLife: true,
    mortgageHolder: 'husband',
    childrenAges: [],
    plannedChildInYears: null,
    monthlyLivingExpense: 300_000,
    savings: 500,
    hasLife: false,
    life: [],
    hasMedical: false,
    medical: [],
    fire: { enabled: false, annualPremium: 20_000, contentsCoverage: 600, riders: [] },
    hasAuto: false,
    autos: [],
    furusatoDoing: false,
    furusatoCurrentDonation: 0,
    nisaMonthlyInvestment: 0,
    nisaUsing: false,
  };
}

export function buildOptimizeInput(f: FormState): OptimizeInput {
  const children = [
    ...f.childrenAges.map((age) => ({ age })),
    ...(f.plannedChildInYears != null ? [{ bornInYears: f.plannedChildInYears }] : []),
  ];

  const housing: OptimizeInput['housing'] =
    f.housingType === 'rent'
      ? { type: 'rent', monthlyRent: f.monthlyRent }
      : {
          type: 'owned',
          monthlyPayment: f.monthlyPayment,
          hasMortgage: true,
          groupCreditLife: f.groupCreditLife,
          mortgageHolder: f.mortgageHolder,
        };

  const isSingle = f.mode === 'single';
  // 個人モードでは husband スロットを「あなた」として使い、1人分のみをエンジンへ渡す。
  const persons = isSingle
    ? [
        {
          role: 'husband' as const,
          age: f.husband.age,
          annualIncome: f.husband.income * MAN,
          employmentType: f.husband.employmentType,
        },
      ]
    : [
        {
          role: 'husband' as const,
          age: f.husband.age,
          annualIncome: f.husband.income * MAN,
          employmentType: f.husband.employmentType,
        },
        {
          role: 'wife' as const,
          age: f.wife.age,
          annualIncome: f.wife.income * MAN,
          employmentType: f.wife.employmentType,
        },
      ];

  return {
    persons,
    children,
    housing,
    assets: { savings: f.savings * MAN },
    monthlyLivingExpense: f.monthlyLivingExpense,
    lifePolicies: (f.hasLife ? f.life : []).map((l) => ({
      insured: isSingle ? ('husband' as const) : l.insured,
      deathBenefit: l.deathBenefit * MAN,
      annualPremium: l.annualPremium,
      type: l.type,
    })),
    medicalPolicies: (f.hasMedical ? f.medical : []).map((m) => ({
      insured: isSingle ? ('husband' as const) : m.insured,
      annualPremium: m.annualPremium,
      dailyHospitalBenefit: m.dailyHospitalBenefit,
    })),
    firePolicy: f.fire.enabled
      ? {
          annualPremium: f.fire.annualPremium,
          buildingCoverage: 0,
          contentsCoverage: f.fire.contentsCoverage * MAN,
          riders: f.fire.riders,
        }
      : undefined,
    autoPolicies: (f.hasAuto ? f.autos : []).map((a) => ({
      annualPremium: a.annualPremium,
      vehicleAgeYears: a.vehicleAgeYears,
      vehicleValue: a.vehicleValue * MAN,
      hasVehicleCoverage: a.hasVehicleCoverage,
      vehicleCoveragePremium: a.vehicleCoveragePremium || undefined,
      hasPersonalInjuryCoverage: a.hasPersonalInjuryCoverage,
      riders: a.riders,
    })),
    furusato: {
      doing: f.furusatoDoing,
      currentAnnualDonation: f.furusatoDoing ? f.furusatoCurrentDonation : 0,
    },
    ideco: {
      // persons と同じ並び順（husband[, wife]）
      persons: isSingle
        ? [{ hasCorporateDC: f.husband.hasCorporateDC, currentMonthlyContribution: f.husband.idecoMonthly }]
        : [
            { hasCorporateDC: f.husband.hasCorporateDC, currentMonthlyContribution: f.husband.idecoMonthly },
            { hasCorporateDC: f.wife.hasCorporateDC, currentMonthlyContribution: f.wife.idecoMonthly },
          ],
    },
    nisa: {
      monthlyInvestment: f.nisaMonthlyInvestment,
      usingNisa: f.nisaUsing,
    },
  };
}

/** 円を「◯◯万円」表記に */
export function formatMan(yen: number): string {
  const man = Math.round(yen / MAN);
  return `${man.toLocaleString()}万円`;
}

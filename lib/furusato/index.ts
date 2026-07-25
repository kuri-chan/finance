/**
 * ふるさと納税レバー。
 * 限度額 = 住民税所得割額 × 20% ÷ (90% − 所得税率×1.021) + 2,000
 * 改善余地は「実質2,000円で受け取れる返礼品価値」をベースに算出する（節税ではなく実質メリット）。
 * これは情報提供・シミュレーションであり、寄附や特定ポータルの推奨・断定ではない。
 */
import furusato from '@/lib/data/furusato.json';
import tax from '@/lib/data/tax.json';
import {
  RECONSTRUCTION_SURTAX_RATE,
  marginalIncomeTaxRate,
  residentTaxIncomeLevy,
  taxableIncome,
} from '@/lib/tax';
import type {
  FurusatoAssumptions,
  FurusatoInput,
  FurusatoPerson,
  FurusatoPersonResult,
  FurusatoResult,
} from './types';

export const DISCLAIMER =
  'ふるさと納税の限度額・改善余地は、一般的な制度と概算にもとづくシミュレーションです。' +
  '医療費控除・住宅ローン控除等の他の控除や個別事情により実際の限度額は変わります。' +
  '寄附や特定ポータルサイトの利用を勧めるものではありません。正確な限度額は寄附前にご確認ください。';

export const SOURCES: string[] = [...furusato._meta.sources, ...tax._meta.sources];

function resolveAssumptions(override?: Partial<FurusatoAssumptions>): FurusatoAssumptions {
  return {
    selfPay: furusato.selfPay,
    returnRate: furusato.returnRate,
    horizonYears: 30,
    ...override,
  };
}

/** 1人分の限度額（円）。配偶者の収入は配偶者控除の判定に使う。 */
export function furusatoLimit(person: FurusatoPerson, spouseIncome: number): number {
  const taxableIncomeTax = taxableIncome(
    person.annualIncome,
    person.employmentType,
    spouseIncome,
    'incomeTax',
    person.age,
  );
  const taxableResident = taxableIncome(
    person.annualIncome,
    person.employmentType,
    spouseIncome,
    'residentTax',
    person.age,
  );

  const incomeLevy = residentTaxIncomeLevy(taxableResident);
  const marginalRate = marginalIncomeTaxRate(taxableIncomeTax);

  const denominator = 0.9 - marginalRate * RECONSTRUCTION_SURTAX_RATE;
  if (incomeLevy <= 0 || denominator <= 0) return 0;

  const limit =
    (incomeLevy * furusato.residentTaxSpecialRatio) / denominator + furusato.selfPay;
  return Math.max(0, Math.round(limit));
}

export function calcFurusato(input: FurusatoInput): FurusatoResult {
  const a = resolveAssumptions(input.assumptions);

  const perPerson: FurusatoPersonResult[] = input.persons.map((p, i) => {
    // 配偶者は「もう一方」とみなす（2人世帯前提）。単身なら配偶者収入は無限大扱いで控除なし。
    const spouseIncome = input.persons.length === 2 ? input.persons[1 - i].annualIncome : Infinity;
    const limit = furusatoLimit(p, spouseIncome);
    return {
      role: p.role,
      annualIncome: p.annualIncome,
      limit,
      meaningful: limit * a.returnRate > a.selfPay,
    };
  });

  const householdLimit = perPerson.reduce((s, p) => s + p.limit, 0);
  const currentDonation = input.doing ? Math.max(0, input.currentAnnualDonation ?? 0) : 0;
  const unusedLimit = Math.max(0, householdLimit - currentDonation);

  let annualImprovement: number;
  if (!input.doing) {
    // 未実施：上限まで使った場合の「返礼品価値 − 自己負担」。実施する意味のある人数分だけ自己負担を差し引く。
    const meaningfulCount = perPerson.filter((p) => p.meaningful).length;
    annualImprovement = Math.max(
      0,
      Math.round(householdLimit * a.returnRate - a.selfPay * meaningfulCount),
    );
  } else {
    // 実施中：未使用枠を埋めた場合の追加返礼品価値（自己負担は既に支払い済みとみなす）。
    annualImprovement = Math.max(0, Math.round(unusedLimit * a.returnRate));
  }

  return {
    perPerson,
    householdLimit,
    currentDonation,
    unusedLimit,
    annualImprovement,
    assumptions: a,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

export type {
  FurusatoInput,
  FurusatoResult,
  FurusatoPerson,
  FurusatoPersonResult,
  FurusatoAssumptions,
} from './types';

/**
 * ① calcRequiredCoverage — 世帯の必要保障額を算出する。
 *
 * 必要保障額 = 遺族の必要総支出 − 遺族の総収入
 *   必要総支出 = 生活費 + 住居費 + 教育費 + 葬儀費
 *   総収入     = 遺族年金 + 遺された配偶者の手取り収入 + 現有資産（既加入保険は別枠）
 *
 * 遺族年金・子加算・中高齢寡婦加算は子や配偶者の年齢で毎年変わるため、
 * survivor が生きる各年をループして積み上げる（年次シミュレーション）。
 *
 * 住居費: 賃貸は家賃を継続計上。持ち家＋団信で主債務者が死亡した場合は
 *   住宅ローンが消滅するため、維持費（固定資産税等の目安）のみ計上。
 *
 * 夫死亡ケースと妻死亡ケースを別々に返す。
 */
import {
  educationCostForAge,
  PENSION,
  resolveAssumptions,
  takeHomeRatio,
} from './constants';
import { DISCLAIMER, SOURCES } from './disclaimer';
import {
  annualSurvivorPension,
  estimateStandardRewardMonthly,
} from './survivorPension';
import type {
  Child,
  CoverageAssumptions,
  CoverageCaseResult,
  HouseholdInput,
  Housing,
  Person,
  RequiredCoverageOutput,
  Role,
} from './types';

/** 投影 t 年目における子の満年齢。まだ生まれていなければ null。 */
function childAgeAtYear(child: Child, t: number): number | null {
  if (child.bornInYears != null) {
    if (t < child.bornInYears) return null;
    return t - child.bornInYears;
  }
  if (child.age != null) return child.age + t;
  return null;
}

/** 主たる稼ぎ手（年収が高い方）の役割 */
function primaryEarner(persons: Person[]): Role {
  if (persons.length === 1) return persons[0].role;
  return persons[0].annualIncome >= persons[1].annualIncome ? persons[0].role : persons[1].role;
}

/** その年の住居費（円） */
function housingCostForYear(
  housing: Housing,
  deceasedRole: Role,
  primaryEarnerRole: Role,
  a: CoverageAssumptions,
): number {
  if (housing.type === 'rent') return housing.monthlyRent * 12;
  // 持ち家
  const holder = housing.mortgageHolder ?? primaryEarnerRole;
  const loanExtinguished =
    housing.hasMortgage && housing.groupCreditLife && holder === deceasedRole;
  if (loanExtinguished) return a.ownedMaintenanceAnnual; // 団信でローン消滅 → 維持費のみ
  return housing.monthlyPayment * 12;
}

/** 住居費を除く月間生活費（未指定なら世帯年収から推定） */
function baseMonthlyLiving(input: HouseholdInput, a: CoverageAssumptions): number {
  if (input.monthlyLivingExpense != null) return input.monthlyLivingExpense;
  const householdGross = input.persons.reduce((sum, p) => sum + p.annualIncome, 0);
  return (householdGross * a.livingCostIncomeRatio) / 12;
}

function computeCase(
  input: HouseholdInput,
  deceased: Person,
  survivor: Person,
  a: CoverageAssumptions,
): CoverageCaseResult {
  const primaryRole = primaryEarner(input.persons);
  const survivorLifeExp = a.survivorLifeExpectancyAge[survivor.role];
  const coverageYears = Math.max(0, survivorLifeExp - survivor.age);

  const monthlyLiving = baseMonthlyLiving(input, a);
  const deceasedReward = estimateStandardRewardMonthly(deceased.annualIncome);
  const deceasedInsuredMonths = Math.max(0, deceased.age - a.careerStartAge) * 12;
  const survivorAnnualTakeHome = survivor.annualIncome * takeHomeRatio(survivor.annualIncome);

  // 中高齢寡婦加算の基礎要件：夫死亡時に妻が40歳以上、または子がいた（＝遺族基礎年金を受けた）こと。
  const widowMidAdditionBaseEligible =
    survivor.age >= PENSION.midAgeWidowAddition.minAge || input.children.length > 0;

  let living = 0;
  let housing = 0;
  let education = 0;
  let survivorPension = 0;
  let survivorEmploymentIncome = 0;

  for (let t = 0; t < coverageYears; t++) {
    const survivorAge = survivor.age + t;

    // 子の年齢を集計
    const childAges = input.children
      .map((c) => childAgeAtYear(c, t))
      .filter((age): age is number => age != null);
    const dependentForPension = childAges.filter(
      // 遺族基礎年金の対象（18歳到達年度末までを『満年齢 <= childEligibleUntilAge』で近似）
      (age) => age <= PENSION.basicPension.childEligibleUntilAge,
    ).length;
    const supportedForLiving = childAges.filter((age) => age < a.childIndependenceAge);

    // 生活費：子が生計内にいる間は割合が高い
    const ratio = supportedForLiving.length > 0 ? a.livingRatioWithChild : a.livingRatioNoChild;
    living += monthlyLiving * 12 * ratio;

    // 住居費
    housing += housingCostForYear(input.housing, deceased.role, primaryRole, a);

    // 教育費
    for (const age of supportedForLiving) {
      education += educationCostForAge(age, a.educationPath);
    }

    // 遺された配偶者の手取り収入（退職年齢まで）
    if (survivorAge < a.retirementAge) survivorEmploymentIncome += survivorAnnualTakeHome;

    // 遺族年金
    survivorPension += annualSurvivorPension({
      deceasedEmployment: deceased.employmentType,
      deceasedAvgStandardRewardMonthly: deceasedReward,
      deceasedInsuredMonths,
      survivorRole: survivor.role,
      survivorAge,
      survivorAnnualIncome: survivor.annualIncome,
      dependentChildrenCount: dependentForPension,
      widowMidAdditionBaseEligible,
    }).total;
  }

  const funeral = a.funeralCost;
  const expensesTotal = living + housing + education + funeral;

  const existingAssets = input.assets.savings;
  const incomeTotal = survivorPension + survivorEmploymentIncome + existingAssets;

  const requiredCoverage = Math.max(0, Math.round(expensesTotal - incomeTotal));

  const existingDeathBenefit = input.lifePolicies
    .filter((p) => p.insured === deceased.role)
    .reduce((sum, p) => sum + p.deathBenefit, 0);

  const additionalNeeded = Math.max(0, requiredCoverage - existingDeathBenefit);
  const surplusCoverage = Math.max(0, existingDeathBenefit - requiredCoverage);

  return {
    deceased: deceased.role,
    survivor: survivor.role,
    coverageYears,
    expenses: {
      living: Math.round(living),
      housing: Math.round(housing),
      education: Math.round(education),
      funeral,
      total: Math.round(expensesTotal),
    },
    incomes: {
      survivorPension: Math.round(survivorPension),
      survivorEmploymentIncome: Math.round(survivorEmploymentIncome),
      existingAssets,
      total: Math.round(incomeTotal),
    },
    requiredCoverage,
    existingDeathBenefit,
    additionalNeeded,
    surplusCoverage,
  };
}

/**
 * 個人（単身）モードの必要保障額。
 * 配偶者の遺族ではなく「扶養する子」の視点で算出する。
 *   扶養する子がいなければ、必要総支出は葬儀費のみ → 必要保障 ≈ max(0, 葬儀費 − 資産)（＝多くは0）。
 *   子がいる（ひとり親）場合のみ、子の生活・教育・住居を、子の遺族年金＋資産で差し引く。
 * 配偶者収入・中高齢寡婦加算は発生しない。
 */
function computeSingleCase(
  input: HouseholdInput,
  person: Person,
  a: CoverageAssumptions,
): CoverageCaseResult {
  const monthlyLiving = baseMonthlyLiving(input, a);
  const deceasedReward = estimateStandardRewardMonthly(person.annualIncome);
  const deceasedInsuredMonths = Math.max(0, person.age - a.careerStartAge) * 12;
  const primaryRole = primaryEarner(input.persons);

  // 扶養する子が生計内にいる年数だけ投影
  let coverageYears = 0;
  for (const child of input.children) {
    for (let t = 1; t <= 30; t++) {
      const age = childAgeAtYear(child, t - 1);
      if (age != null && age < a.childIndependenceAge) coverageYears = Math.max(coverageYears, t);
    }
  }

  let living = 0;
  let housing = 0;
  let education = 0;
  let survivorPension = 0;

  for (let t = 0; t < coverageYears; t++) {
    const childAges = input.children
      .map((c) => childAgeAtYear(c, t))
      .filter((age): age is number => age != null);
    const dependentForPension = childAges.filter(
      (age) => age <= PENSION.basicPension.childEligibleUntilAge,
    ).length;
    const supportedForLiving = childAges.filter((age) => age < a.childIndependenceAge);

    if (supportedForLiving.length > 0) {
      // 親不在で遺された子の生活費（世帯生活費に「子あり割合」を適用）＋教育費＋住居費
      living += monthlyLiving * 12 * a.livingRatioWithChild;
      housing += housingCostForYear(input.housing, person.role, primaryRole, a);
      for (const age of supportedForLiving) {
        education += educationCostForAge(age, a.educationPath);
      }
    }

    // 遺族年金：子の遺族基礎年金＋（会社員なら）遺族厚生年金。配偶者不在のため寡婦加算なし。
    survivorPension += annualSurvivorPension({
      deceasedEmployment: person.employmentType,
      deceasedAvgStandardRewardMonthly: deceasedReward,
      deceasedInsuredMonths,
      survivorRole: person.role,
      survivorAge: person.age + t,
      survivorAnnualIncome: 0,
      dependentChildrenCount: dependentForPension,
      widowMidAdditionBaseEligible: false,
    }).total;
  }

  const funeral = a.funeralCost;
  const expensesTotal = living + housing + education + funeral;

  const existingAssets = input.assets.savings;
  const incomeTotal = survivorPension + existingAssets; // 配偶者収入はなし

  const requiredCoverage = Math.max(0, Math.round(expensesTotal - incomeTotal));

  const existingDeathBenefit = input.lifePolicies
    .filter((p) => p.insured === person.role)
    .reduce((sum, p) => sum + p.deathBenefit, 0);

  const additionalNeeded = Math.max(0, requiredCoverage - existingDeathBenefit);
  const surplusCoverage = Math.max(0, existingDeathBenefit - requiredCoverage);

  return {
    deceased: person.role,
    survivor: person.role, // 単身のため配偶者なし（UIは「あなた」と表示）
    coverageYears,
    expenses: {
      living: Math.round(living),
      housing: Math.round(housing),
      education: Math.round(education),
      funeral,
      total: Math.round(expensesTotal),
    },
    incomes: {
      survivorPension: Math.round(survivorPension),
      survivorEmploymentIncome: 0,
      existingAssets,
      total: Math.round(incomeTotal),
    },
    requiredCoverage,
    existingDeathBenefit,
    additionalNeeded,
    surplusCoverage,
  };
}

export function calcRequiredCoverage(input: HouseholdInput): RequiredCoverageOutput {
  const a = resolveAssumptions(input.assumptions);

  let cases: CoverageCaseResult[];
  if (input.persons.length === 1) {
    cases = [computeSingleCase(input, input.persons[0], a)];
  } else {
    const [p0, p1] = input.persons;
    const husband = p0.role === 'husband' ? p0 : p1;
    const wife = p0.role === 'wife' ? p0 : p1;
    cases = [computeCase(input, husband, wife, a), computeCase(input, wife, husband, a)];
  }

  return {
    cases,
    assumptions: a,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

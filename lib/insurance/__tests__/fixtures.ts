import type { HouseholdInput } from '../types';

/**
 * 代表3世帯（仕様書 §テスト）。
 * (A) 世帯年収1500万・共働き・子なし・賃貸 … 過剰保険が出やすい高所得DINKS
 * (B) 世帯年収1000万・共働き・子1人予定・賃貸
 * (C) 世帯年収900万・片働き・子あり・持ち家（団信あり）
 */

/** (A) 高所得DINKS・共働き・子なし・賃貸 */
export function householdA(): HouseholdInput {
  return {
    persons: [
      { role: 'husband', age: 33, annualIncome: 7_500_000, employmentType: 'employee' },
      { role: 'wife', age: 31, annualIncome: 7_500_000, employmentType: 'employee' },
    ],
    children: [],
    housing: { type: 'rent', monthlyRent: 200_000 },
    assets: { savings: 8_000_000 },
    monthlyLivingExpense: 350_000,
    // わざと過大な死亡保障を持たせる（過剰保険の検出を確認するため）
    lifePolicies: [
      { insured: 'husband', deathBenefit: 30_000_000, annualPremium: 60_000, type: 'term' },
      { insured: 'wife', deathBenefit: 30_000_000, annualPremium: 55_000, type: 'term' },
    ],
    medicalPolicies: [
      { insured: 'husband', annualPremium: 36_000, dailyHospitalBenefit: 10_000 },
      // 夫の医療保険が重複
      { insured: 'husband', annualPremium: 30_000, dailyHospitalBenefit: 5_000 },
      { insured: 'wife', annualPremium: 30_000, dailyHospitalBenefit: 5_000 },
    ],
    firePolicy: {
      annualPremium: 20_000,
      buildingCoverage: 0,
      contentsCoverage: 12_000_000, // 世帯2人の目安(400万)を大きく超過
      riders: ['water_leak_extended', 'accidental_damage'],
    },
    autoPolicies: [
      {
        annualPremium: 90_000,
        vehicleAgeYears: 9, // 車齢オーバー → 車両保険の要否
        vehicleValue: 400_000,
        hasVehicleCoverage: true,
        vehicleCoveragePremium: 40_000,
        hasPersonalInjuryCoverage: true,
        riders: ['passenger_injury', 'legal'], // 搭乗者傷害が重複
        label: '1台目',
      },
    ],
  };
}

/** (B) 共働き・子1人予定・賃貸 */
export function householdB(): HouseholdInput {
  return {
    persons: [
      { role: 'husband', age: 30, annualIncome: 6_000_000, employmentType: 'employee' },
      { role: 'wife', age: 29, annualIncome: 4_000_000, employmentType: 'employee' },
    ],
    children: [{ bornInYears: 2 }], // 2年後に出産予定
    housing: { type: 'rent', monthlyRent: 150_000 },
    assets: { savings: 4_000_000 },
    monthlyLivingExpense: 280_000,
    lifePolicies: [
      { insured: 'husband', deathBenefit: 10_000_000, annualPremium: 24_000, type: 'term' },
    ],
    medicalPolicies: [
      { insured: 'husband', annualPremium: 30_000, dailyHospitalBenefit: 5_000 },
      { insured: 'wife', annualPremium: 30_000, dailyHospitalBenefit: 5_000 },
    ],
  };
}

/** (C) 片働き・子2人・持ち家（団信あり） */
export function householdC(): HouseholdInput {
  return {
    persons: [
      { role: 'husband', age: 38, annualIncome: 9_000_000, employmentType: 'employee' },
      { role: 'wife', age: 36, annualIncome: 0, employmentType: 'employee' },
    ],
    children: [{ age: 5 }, { age: 2 }],
    housing: {
      type: 'owned',
      monthlyPayment: 150_000,
      hasMortgage: true,
      groupCreditLife: true,
      mortgageHolder: 'husband',
    },
    assets: { savings: 5_000_000 },
    monthlyLivingExpense: 350_000,
    // 保障が薄い（不足が出るはず）
    lifePolicies: [
      { insured: 'husband', deathBenefit: 10_000_000, annualPremium: 30_000, type: 'term' },
    ],
    medicalPolicies: [
      { insured: 'husband', annualPremium: 36_000, dailyHospitalBenefit: 10_000 },
    ],
    firePolicy: {
      annualPremium: 30_000,
      buildingCoverage: 20_000_000,
      contentsCoverage: 8_000_000, // 世帯4人の目安(800万)以内 → 過大ではない
      riders: [],
    },
  };
}

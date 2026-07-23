import { describe, expect, it } from 'vitest';
import { calcFurusato, furusatoLimit } from '../index';
import type { FurusatoPerson } from '../types';

const employee = (income: number): FurusatoPerson => ({
  annualIncome: income,
  employmentType: 'employee',
});

describe('furusatoLimit — 限度額の精度', () => {
  it('年収500万・会社員・配偶者なしは実勢値（約61,000円）に近い', () => {
    const limit = furusatoLimit(employee(5_000_000), Infinity);
    expect(limit).toBeGreaterThan(55_000);
    expect(limit).toBeLessThan(68_000);
  });

  it('年収750万・会社員・配偶者なしは実勢値（約12万円）に近い', () => {
    const limit = furusatoLimit(employee(7_500_000), Infinity);
    expect(limit).toBeGreaterThan(110_000);
    expect(limit).toBeLessThan(128_000);
  });

  it('年収が高いほど限度額は大きい', () => {
    const l500 = furusatoLimit(employee(5_000_000), Infinity);
    const l750 = furusatoLimit(employee(7_500_000), Infinity);
    const l1000 = furusatoLimit(employee(10_000_000), Infinity);
    expect(l750).toBeGreaterThan(l500);
    expect(l1000).toBeGreaterThan(l750);
  });

  it('配偶者控除があると（片働き）限度額はやや下がる', () => {
    const withoutSpouse = furusatoLimit(employee(9_000_000), 5_000_000); // 共働き相当（控除なし）
    const withSpouse = furusatoLimit(employee(9_000_000), 0); // 片働き（配偶者控除あり）
    expect(withSpouse).toBeLessThan(withoutSpouse);
  });

  it('課税所得が生じない低収入は限度額0', () => {
    expect(furusatoLimit(employee(800_000), Infinity)).toBe(0);
  });
});

describe('calcFurusato — 世帯の改善余地', () => {
  it('共働き・未実施は世帯限度額の返礼品価値ベースで正の改善余地が出る', () => {
    const r = calcFurusato({
      persons: [employee(7_500_000), employee(7_500_000)],
      doing: false,
    });
    // 世帯限度額 ≈ 24万、返礼品30% − 自己負担2000×2 ≈ 6.5万前後
    expect(r.householdLimit).toBeGreaterThan(200_000);
    expect(r.annualImprovement).toBeGreaterThan(50_000);
    expect(r.perPerson.every((p) => p.meaningful)).toBe(true);
  });

  it('実施中で上限まで使っていれば改善余地はほぼ0', () => {
    const full = calcFurusato({
      persons: [employee(7_500_000), employee(7_500_000)],
      doing: true,
      currentAnnualDonation: 240_000,
    });
    expect(full.annualImprovement).toBeLessThan(10_000);
  });

  it('実施中でも未使用枠があれば、その分だけ改善余地が出る', () => {
    const partial = calcFurusato({
      persons: [employee(7_500_000), employee(7_500_000)],
      doing: true,
      currentAnnualDonation: 50_000,
    });
    expect(partial.unusedLimit).toBeGreaterThan(0);
    expect(partial.annualImprovement).toBeGreaterThan(0);
    // 未使用枠 × 還元率 に一致
    expect(partial.annualImprovement).toBe(Math.round(partial.unusedLimit * partial.assumptions.returnRate));
  });

  it('返り値に免責と出典が付く', () => {
    const r = calcFurusato({ persons: [employee(6_000_000), employee(4_000_000)], doing: false });
    expect(r.disclaimer).toMatch(/シミュレーション|推奨するものではありません|勧める/);
    expect(r.sources.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { calcIdeco, idecoMonthlyLimit } from '../index';
import type { IdecoPerson } from '../types';

const employee = (income: number, opts: Partial<IdecoPerson> = {}): IdecoPerson => ({
  annualIncome: income,
  employmentType: 'employee',
  ...opts,
});

describe('idecoMonthlyLimit — 掛金上限', () => {
  it('会社員・企業年金なしは23,000円/月', () => {
    expect(idecoMonthlyLimit(employee(6_000_000))).toBe(23_000);
  });
  it('会社員・企業型DCありは20,000円/月', () => {
    expect(idecoMonthlyLimit(employee(6_000_000, { hasCorporateDC: true }))).toBe(20_000);
  });
  it('個人事業主は68,000円/月', () => {
    expect(idecoMonthlyLimit({ annualIncome: 6_000_000, employmentType: 'self_employed' })).toBe(68_000);
  });
});

describe('calcIdeco — 節税額（改善余地）', () => {
  it('年収750万・会社員・未加入の満額節税は実勢値（約8.4万円）に近い', () => {
    const r = calcIdeco({ persons: [employee(7_500_000)] });
    // 276,000 ×(0.20×1.021 + 0.10) ≈ 83,959
    expect(r.perPerson[0].annualTaxSaving).toBeGreaterThan(78_000);
    expect(r.perPerson[0].annualTaxSaving).toBeLessThan(90_000);
  });

  it('年収500万・会社員・未加入の満額節税は実勢値（約5.6万円）に近い', () => {
    const r = calcIdeco({ persons: [employee(5_000_000)] });
    // 276,000 ×(0.10×1.021 + 0.10) ≈ 55,779
    expect(r.perPerson[0].annualTaxSaving).toBeGreaterThan(50_000);
    expect(r.perPerson[0].annualTaxSaving).toBeLessThan(62_000);
  });

  it('収入のない配偶者は課税所得がなく節税ゼロ', () => {
    const r = calcIdeco({ persons: [employee(0)] });
    expect(r.perPerson[0].annualTaxSaving).toBe(0);
  });

  it('既に満額拠出していれば改善余地はゼロ', () => {
    const r = calcIdeco({ persons: [employee(7_500_000, { currentMonthlyContribution: 23_000 })] });
    expect(r.perPerson[0].unusedAnnual).toBe(0);
    expect(r.annualImprovement).toBe(0);
  });

  it('一部拠出なら未使用枠分だけ改善余地が出る', () => {
    const full = calcIdeco({ persons: [employee(7_500_000)] });
    const partial = calcIdeco({ persons: [employee(7_500_000, { currentMonthlyContribution: 10_000 })] });
    expect(partial.perPerson[0].annualTaxSaving).toBeGreaterThan(0);
    expect(partial.perPerson[0].annualTaxSaving).toBeLessThan(full.perPerson[0].annualTaxSaving);
  });

  it('世帯の改善余地は各人の節税額の合計', () => {
    const r = calcIdeco({ persons: [employee(7_500_000), employee(5_000_000)] });
    expect(r.annualImprovement).toBe(
      r.perPerson.reduce((s, p) => s + p.annualTaxSaving, 0),
    );
    expect(r.annualImprovement).toBeGreaterThan(100_000);
  });

  it('返り値に免責（60歳まで引き出せない旨）と出典が付く', () => {
    const r = calcIdeco({ persons: [employee(6_000_000)] });
    expect(r.disclaimer).toMatch(/60歳/);
    expect(r.sources.length).toBeGreaterThan(0);
  });
});

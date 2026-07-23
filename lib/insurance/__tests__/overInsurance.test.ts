import { describe, expect, it } from 'vitest';
import { checkOverInsurance } from '../overInsurance';
import { householdA, householdC } from './fixtures';

describe('checkOverInsurance — 過剰保険チェック', () => {
  it('全指摘に想定削減額（円/年・正の値）が付き、効果額の降順である', () => {
    const r = checkOverInsurance(householdA());
    expect(r.findings.length).toBeGreaterThan(0);
    for (const f of r.findings) {
      expect(f.estimatedAnnualSaving).toBeGreaterThan(0);
    }
    for (let i = 1; i < r.findings.length; i++) {
      expect(r.findings[i - 1].estimatedAnnualSaving).toBeGreaterThanOrEqual(
        r.findings[i].estimatedAnnualSaving,
      );
    }
    // 合計は各指摘の和
    const sum = r.findings.reduce((s, f) => s + f.estimatedAnnualSaving, 0);
    expect(r.totalEstimatedAnnualSaving).toBe(sum);
  });

  it('(A) 生保の過剰保障を検出する', () => {
    const r = checkOverInsurance(householdA());
    const life = r.findings.filter((f) => f.domain === 'life');
    expect(life.length).toBeGreaterThan(0);
    expect(life[0].estimatedAnnualSaving).toBeGreaterThan(0);
  });

  it('(A) 医療保険の重複を検出する（夫の2本目）', () => {
    const r = checkOverInsurance(householdA());
    const medical = r.findings.filter((f) => f.domain === 'medical');
    expect(medical.length).toBe(1);
    expect(medical[0].role).toBe('husband');
    // 手厚い1本(日額1万)を残し、2本目(3万円/年)が削減候補
    expect(medical[0].estimatedAnnualSaving).toBe(30_000);
  });

  it('(A) 火災保険の家財過大・重複特約を検出する', () => {
    const r = checkOverInsurance(householdA());
    const fire = r.findings.filter((f) => f.domain === 'fire');
    expect(fire.length).toBeGreaterThanOrEqual(2);
    expect(fire.some((f) => /特約/.test(f.title))).toBe(true);
    expect(fire.some((f) => /家財/.test(f.title))).toBe(true);
  });

  it('(A) 自動車保険：搭乗者傷害の重複と車両保険の要否を検出する', () => {
    const r = checkOverInsurance(householdA());
    const auto = r.findings.filter((f) => f.domain === 'auto');
    expect(auto.some((f) => /重複/.test(f.title))).toBe(true);
    expect(auto.some((f) => /車両保険/.test(f.title))).toBe(true);
    const vehicle = auto.find((f) => /車両保険/.test(f.title));
    expect(vehicle?.estimatedAnnualSaving).toBe(40_000); // vehicleCoveragePremium
  });

  it('(A) 合計削減額は火災+医療+自動車+生保の効果を積み上げて正になる', () => {
    const r = checkOverInsurance(householdA());
    expect(r.totalEstimatedAnnualSaving).toBeGreaterThan(50_000);
  });

  it('(C) 保障不足（世帯主）を underInsured として検出し、削減額には混ぜない', () => {
    const r = checkOverInsurance(householdC());
    expect(r.underInsured.length).toBeGreaterThan(0);
    const husbandGap = r.underInsured.find((u) => u.role === 'husband');
    expect(husbandGap).toBeDefined();
    expect(husbandGap!.shortfall).toBeGreaterThan(0);
    // 不足は「削減額」ではないので findings 側に生保の過剰は出ない
    expect(r.findings.some((f) => f.domain === 'life')).toBe(false);
  });

  it('貯蓄性保険（終身）があれば非効率を指摘する', () => {
    const h = householdA();
    h.lifePolicies.push({
      insured: 'wife',
      deathBenefit: 5_000_000,
      annualPremium: 180_000, // 定期換算より高い
      type: 'whole',
    });
    const r = checkOverInsurance(h);
    const savings = r.findings.filter((f) => f.domain === 'savings_insurance');
    expect(savings.length).toBe(1);
    expect(savings[0].estimatedAnnualSaving).toBeGreaterThan(0);
    expect(savings[0].detail).toMatch(/解約返戻金/); // 断定しない注記
  });

  it('返り値に免責と出典が付く', () => {
    const r = checkOverInsurance(householdA());
    expect(r.disclaimer).toMatch(/推奨|断定/);
    expect(r.sources.length).toBeGreaterThan(0);
  });
});

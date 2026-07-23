import { describe, expect, it } from 'vitest';
import { calcNisa } from '../index';

describe('calcNisa — NISA枠と非課税メリット（試算）', () => {
  it('世帯の年間枠は 360万×人数、生涯枠は 1800万×人数', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 0, usingNisa: false });
    expect(r.householdAnnualCapacity).toBe(7_200_000);
    expect(r.householdLifetimeCapacity).toBe(36_000_000);
  });

  it('投資していなければ改善余地はゼロ（便益を捏造しない）', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 0, usingNisa: false });
    expect(r.annualImprovement).toBe(0);
    expect(r.eligibleForNisaAnnual).toBe(0);
  });

  it('課税口座で投資している分はNISAに回す余地として便益が出る', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 50_000, usingNisa: false });
    // 年60万 × 3% × 20.315% ≈ 3,657円/年
    expect(r.eligibleForNisaAnnual).toBe(600_000);
    expect(r.annualImprovement).toBeGreaterThan(3_000);
    expect(r.annualImprovement).toBeLessThan(4_500);
    // 生涯は複利で年次よりずっと大きい
    expect(r.illustrativeLifetimeBenefit).toBeGreaterThan(r.annualImprovement * 30);
  });

  it('すでにNISAで投資していれば追加の改善余地はゼロ', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 50_000, usingNisa: true });
    expect(r.eligibleForNisaAnnual).toBe(0);
    expect(r.annualImprovement).toBe(0);
  });

  it('投資額が世帯の年間枠を超えても、便益は枠の範囲に制限される', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 1_000_000, usingNisa: false }); // 年1,200万
    expect(r.eligibleForNisaAnnual).toBe(7_200_000); // 枠上限
  });

  it('想定利回りは上書きできる', () => {
    const low = calcNisa({ adults: 2, monthlyInvestment: 50_000, usingNisa: false, assumptions: { assumedAnnualReturn: 0.01 } });
    const high = calcNisa({ adults: 2, monthlyInvestment: 50_000, usingNisa: false, assumptions: { assumedAnnualReturn: 0.05 } });
    expect(high.annualImprovement).toBeGreaterThan(low.annualImprovement);
  });

  it('免責に運用成果の非保証・元本割れ・非推奨が含まれる', () => {
    const r = calcNisa({ adults: 2, monthlyInvestment: 50_000, usingNisa: false });
    expect(r.disclaimer).toMatch(/保証するものではありません/);
    expect(r.disclaimer).toMatch(/元本割れ/);
    expect(r.disclaimer).toMatch(/推奨するものではなく|推奨するものではありません/);
  });
});

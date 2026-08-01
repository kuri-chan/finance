import { describe, expect, it } from 'vitest';
import { calcRequiredCoverage } from '../requiredCoverage';
import type { CoverageCaseResult, RequiredCoverageOutput } from '../types';
import { householdA, householdB, householdC } from './fixtures';

/** テスト用ヘルパ：世帯モードの結果から夫死亡/妻死亡ケースを取り出す（cases順: 夫→妻） */
const hd = (r: RequiredCoverageOutput): CoverageCaseResult => r.cases[0];
const wd = (r: RequiredCoverageOutput): CoverageCaseResult => r.cases[1];

describe('calcRequiredCoverage — 必要保障額', () => {
  it('両ケース（夫死亡/妻死亡）を別々に返し、免責と出典を添える', () => {
    const r = calcRequiredCoverage(householdA());
    expect(hd(r).deceased).toBe('husband');
    expect(hd(r).survivor).toBe('wife');
    expect(wd(r).deceased).toBe('wife');
    expect(wd(r).survivor).toBe('husband');
    expect(r.disclaimer).toMatch(/募集|助言|税務相談/);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('必要保障額・追加必要額・過剰額は非負である', () => {
    for (const h of [householdA(), householdB(), householdC()]) {
      const r = calcRequiredCoverage(h);
      for (const c of r.cases) {
        expect(c.requiredCoverage).toBeGreaterThanOrEqual(0);
        expect(c.additionalNeeded).toBeGreaterThanOrEqual(0);
        expect(c.surplusCoverage).toBeGreaterThanOrEqual(0);
        // 追加必要額と過剰額は同時に正にならない
        expect(Math.min(c.additionalNeeded, c.surplusCoverage)).toBe(0);
      }
    }
  });

  it('(A) 高所得DINKS・子なしは、遺族年金に遺族基礎年金が乗らない（子加算ゼロ）', () => {
    const r = calcRequiredCoverage(householdA());
    // 子がいないため遺族基礎年金は発生せず、遺族厚生年金＋中高齢寡婦加算のみ。
    // 妻(survivor)には中高齢寡婦加算が乗るが、夫(survivor)には乗らない → 妻死亡時の年金は小さい
    expect(hd(r).incomes.survivorPension).toBeGreaterThan(wd(r).incomes.survivorPension);
  });

  it('(A) 共働きで survivor 収入が厚く、必要保障額は小さめ（過剰保険が出やすい）', () => {
    const r = calcRequiredCoverage(householdA());
    // survivor の手取り収入が総収入の主柱
    expect(hd(r).incomes.survivorEmploymentIncome).toBeGreaterThan(100_000_000);
    // 3000万の保障に対し必要保障額は十分小さく、過剰が出る
    expect(hd(r).requiredCoverage).toBeLessThan(hd(r).existingDeathBenefit);
    expect(hd(r).surplusCoverage).toBeGreaterThan(0);
  });

  it('(C) 片働き・子ありの世帯主(夫)死亡は、必要保障額が大きい', () => {
    const r = calcRequiredCoverage(householdC());
    // 世帯主の死亡は遺族の収入が細るため必要保障が大きい
    expect(hd(r).requiredCoverage).toBeGreaterThan(30_000_000);
    // 収入のない妻の死亡より、稼ぎ手の夫の死亡の方が必要保障は大きい
    expect(hd(r).requiredCoverage).toBeGreaterThan(wd(r).requiredCoverage);
    // 10百万の保障では不足
    expect(hd(r).additionalNeeded).toBeGreaterThan(0);
  });

  it('(C) 団信ありの持ち家：主債務者(夫)死亡で住居費が消滅（維持費のみ）', () => {
    const r = calcRequiredCoverage(householdC());
    // 夫死亡 → ローン消滅 → 住居費は維持費(20万/年)×年数のみ
    const years = hd(r).coverageYears;
    expect(hd(r).expenses.housing).toBeLessThanOrEqual(200_000 * years + 1);
    // 妻(非主債務者)死亡 → ローンは残る → 住居費は返済(150万/年)ベースで夫死亡時より大きい
    expect(wd(r).expenses.housing).toBeGreaterThan(hd(r).expenses.housing);
  });

  it('(C) 子ありは教育費が計上され、子なし(A)ではゼロ', () => {
    const c = calcRequiredCoverage(householdC());
    const a = calcRequiredCoverage(householdA());
    expect(hd(c).expenses.education).toBeGreaterThan(0);
    expect(hd(a).expenses.education).toBe(0);
  });

  it('(B) 出産予定の子は将来年から教育費・子加算に反映される', () => {
    const r = calcRequiredCoverage(householdB());
    // 2年後に子が生まれる → いずれ教育費が発生
    expect(hd(r).expenses.education).toBeGreaterThan(0);
    // 子が生まれた後は遺族基礎年金が発生 → 年金総額は子なしの前提より増える
    expect(hd(r).incomes.survivorPension).toBeGreaterThan(0);
  });

  it('生計維持要件：遺された配偶者が高収入(850万円以上)だと遺族年金が消え、必要保障額が上がる', () => {
    const low = householdA(); // 妻750万 → 遺族年金あり
    const high = householdA();
    // 妻の年収を850万円以上に引き上げ → 夫死亡時に妻は遺族年金を受けられない
    const wife = high.persons[0].role === 'wife' ? high.persons[0] : high.persons[1];
    wife.annualIncome = 9_000_000;

    const rLow = calcRequiredCoverage(low);
    const rHigh = calcRequiredCoverage(high);

    expect(hd(rLow).incomes.survivorPension).toBeGreaterThan(0);
    expect(hd(rHigh).incomes.survivorPension).toBe(0);
    // 年金が消えた分、必要保障額は増える方向
    expect(hd(rHigh).requiredCoverage).toBeGreaterThan(hd(rLow).requiredCoverage);
  });

  it('世帯主死亡の必要保障額は B < C の向き（子数・住居・収入構成を反映）', () => {
    const b = calcRequiredCoverage(householdB());
    const c = calcRequiredCoverage(householdC());
    // 子2人・片働きのCの方が、子1人予定・共働きのBより世帯主死亡の必要保障が大きい
    expect(hd(c).requiredCoverage).toBeGreaterThan(hd(b).requiredCoverage);
  });
});

describe('calcRequiredCoverage — 個人（単身）モード', () => {
  const single = (over: Partial<Parameters<typeof calcRequiredCoverage>[0]> = {}) =>
    calcRequiredCoverage({
      persons: [{ role: 'husband', age: 30, annualIncome: 5_000_000, employmentType: 'employee' }],
      children: [],
      housing: { type: 'rent', monthlyRent: 90_000 },
      assets: { savings: 3_000_000 },
      lifePolicies: [],
      medicalPolicies: [],
      monthlyLivingExpense: 180_000,
      ...over,
    });

  it('単身は1ケースのみ返す', () => {
    const r = single();
    expect(r.cases).toHaveLength(1);
    expect(r.cases[0].deceased).toBe('husband');
  });

  it('扶養家族がいなければ必要保障はほぼ0（葬儀費 − 資産）', () => {
    // 資産300万 > 葬儀費 → 必要保障0
    const r = single();
    expect(r.cases[0].requiredCoverage).toBe(0);
    expect(r.cases[0].expenses.education).toBe(0);
    expect(r.cases[0].incomes.survivorEmploymentIncome).toBe(0);
  });

  it('扶養家族なしで死亡保険に入っていれば、全額が過剰（見直し余地）になる', () => {
    const r = single({
      lifePolicies: [
        { insured: 'husband', deathBenefit: 10_000_000, annualPremium: 30_000, type: 'term' },
      ],
    });
    expect(r.cases[0].requiredCoverage).toBe(0);
    expect(r.cases[0].surplusCoverage).toBe(10_000_000);
    expect(r.cases[0].additionalNeeded).toBe(0);
  });

  it('子がいる（ひとり親）と、教育費が計上され必要保障が発生しうる', () => {
    const r = single({ children: [{ age: 3 }], assets: { savings: 500_000 } });
    expect(r.cases[0].expenses.education).toBeGreaterThan(0);
    expect(r.cases[0].requiredCoverage).toBeGreaterThan(0);
    // 子の遺族基礎年金が収入に計上される
    expect(r.cases[0].incomes.survivorPension).toBeGreaterThan(0);
  });
});

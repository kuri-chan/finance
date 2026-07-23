import { describe, expect, it } from 'vitest';
import {
  annualSurvivorPension,
  estimateStandardRewardMonthly,
  type YearlyPensionInput,
} from '../survivorPension';

/** 会社員の夫が死亡し、妻(35歳・年収400万・子1人が対象)が受給する標準ケース */
function base(): YearlyPensionInput {
  return {
    deceasedEmployment: 'employee',
    deceasedAvgStandardRewardMonthly: estimateStandardRewardMonthly(6_000_000),
    deceasedInsuredMonths: 156, // 13年 → 300月みなしが効く
    survivorRole: 'wife',
    survivorAge: 35,
    survivorAnnualIncome: 4_000_000,
    dependentChildrenCount: 1,
    widowMidAdditionBaseEligible: true,
  };
}

describe('annualSurvivorPension — 遺族年金の年額', () => {
  it('遺族基礎年金：子1人で基本額＋第1子加算', () => {
    const r = annualSurvivorPension(base());
    // 816,000 + 234,800 = 1,050,800
    expect(r.basic).toBe(816_000 + 234_800);
  });

  it('遺族基礎年金：子3人で第3子は加算単価が下がる', () => {
    const r = annualSurvivorPension({ ...base(), dependentChildrenCount: 3 });
    // 816,000 + 234,800 + 234,800 + 78,300
    expect(r.basic).toBe(816_000 + 234_800 * 2 + 78_300);
  });

  it('子がいなければ遺族基礎年金は出ない', () => {
    const r = annualSurvivorPension({ ...base(), dependentChildrenCount: 0 });
    expect(r.basic).toBe(0);
  });

  it('遺族厚生年金：報酬比例×3/4、被保険者月数は300月みなし', () => {
    const r = annualSurvivorPension(base());
    const reward = estimateStandardRewardMonthly(6_000_000); // 500,000
    const expected = reward * (5.481 / 1000) * 300 * 0.75;
    expect(r.employees).toBeCloseTo(expected, 3);
  });

  it('個人事業主（国民年金のみ）の死亡は遺族厚生年金なし', () => {
    const r = annualSurvivorPension({ ...base(), deceasedEmployment: 'self_employed' });
    expect(r.employees).toBe(0);
    // 遺族基礎年金は国民年金なので出る
    expect(r.basic).toBeGreaterThan(0);
  });

  it('生計維持要件：遺族の年収が850万円以上なら遺族年金はゼロ', () => {
    const r = annualSurvivorPension({ ...base(), survivorAnnualIncome: 8_500_000 });
    expect(r.total).toBe(0);
    // 850万円未満なら支給される
    const ok = annualSurvivorPension({ ...base(), survivorAnnualIncome: 8_499_999 });
    expect(ok.total).toBeGreaterThan(0);
  });

  it('中高齢寡婦加算：妻40〜65歳・子なし・基礎要件ありで加算', () => {
    const r = annualSurvivorPension({
      ...base(),
      survivorAge: 45,
      dependentChildrenCount: 0,
      widowMidAdditionBaseEligible: true,
    });
    expect(r.midWidow).toBe(612_000);
  });

  it('中高齢寡婦加算：夫死亡時40歳未満かつ子なしの妻は基礎要件を満たさず対象外', () => {
    // widowMidAdditionBaseEligible=false（40歳未満・子なしで死別）→ 45歳になっても加算されない
    const r = annualSurvivorPension({
      ...base(),
      survivorAge: 45,
      dependentChildrenCount: 0,
      widowMidAdditionBaseEligible: false,
    });
    expect(r.midWidow).toBe(0);
  });

  it('中高齢寡婦加算：夫が受給者（男性）には加算されない', () => {
    const r = annualSurvivorPension({
      ...base(),
      survivorRole: 'husband',
      survivorAge: 45,
      dependentChildrenCount: 0,
      widowMidAdditionBaseEligible: true,
    });
    expect(r.midWidow).toBe(0);
  });

  it('夫が受給者：遺族基礎年金の対象の子がいない期間は60歳まで遺族厚生年金が出ない', () => {
    const under60 = annualSurvivorPension({
      ...base(),
      survivorRole: 'husband',
      survivorAge: 50,
      dependentChildrenCount: 0,
    });
    expect(under60.employees).toBe(0);

    const at60 = annualSurvivorPension({
      ...base(),
      survivorRole: 'husband',
      survivorAge: 60,
      dependentChildrenCount: 0,
    });
    expect(at60.employees).toBeGreaterThan(0);

    // 対象の子がいれば60歳未満でも出る（遺族基礎年金と併給）
    const withChild = annualSurvivorPension({
      ...base(),
      survivorRole: 'husband',
      survivorAge: 50,
      dependentChildrenCount: 1,
    });
    expect(withChild.employees).toBeGreaterThan(0);
  });
});

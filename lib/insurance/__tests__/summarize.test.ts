import { describe, expect, it } from 'vitest';
import { summarize } from '../summarize';
import { checkOverInsurance } from '../overInsurance';
import { resolveAssumptions } from '../constants';
import { householdA, householdC } from './fixtures';

describe('summarize — 改善余地と打ち手リスト', () => {
  it('初年度改善余地 = 過剰保険チェックの想定削減額合計', () => {
    const h = householdA();
    const over = checkOverInsurance(h);
    const s = summarize(h);
    expect(s.firstYearImprovement).toBe(over.totalEstimatedAnnualSaving);
  });

  it('生涯改善余地 = 初年度 × 前提年数（savingHorizonYears）', () => {
    const h = householdA();
    const a = resolveAssumptions(h.assumptions);
    const s = summarize(h);
    expect(s.lifetimeImprovement).toBe(s.firstYearImprovement * a.savingHorizonYears);
  });

  it('打ち手は効果額の降順で、rank が 1 から連番', () => {
    const s = summarize(householdA());
    expect(s.actions.length).toBeGreaterThan(0);
    for (let i = 0; i < s.actions.length; i++) {
      expect(s.actions[i].rank).toBe(i + 1);
      if (i > 0) {
        expect(s.actions[i - 1].annualImpact).toBeGreaterThanOrEqual(s.actions[i].annualImpact);
      }
    }
    // 各打ち手の生涯インパクトは 年額×前提年数
    const a = resolveAssumptions(householdA().assumptions);
    for (const act of s.actions) {
      expect(act.lifetimeImpact).toBe(act.annualImpact * a.savingHorizonYears);
    }
  });

  it('(A) 高所得DINKSは改善余地が正（打ち手が並ぶ）', () => {
    const s = summarize(householdA());
    expect(s.firstYearImprovement).toBeGreaterThan(0);
    expect(s.actions.length).toBeGreaterThanOrEqual(4);
  });

  it('(C) 保障不足は coverageGaps に出て、改善余地（削減）とは分離される', () => {
    const s = summarize(householdC());
    expect(s.coverageGaps.length).toBeGreaterThan(0);
    // 不足の金額は改善余地(削減)には計上されない
    expect(s.firstYearImprovement).toBeGreaterThanOrEqual(0);
  });

  it('免責・出典を添える（募集・助言・税務相談ではない旨）', () => {
    const s = summarize(householdA());
    expect(s.disclaimer).toMatch(/保険の募集|投資助言|税務相談/);
    expect(s.sources.length).toBeGreaterThan(0);
  });
});

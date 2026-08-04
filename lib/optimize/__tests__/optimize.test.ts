import { describe, expect, it } from 'vitest';
import type { HouseholdInput } from '@/lib/insurance';
import { optimizeHousehold } from '../index';
import type { OptimizeInput } from '../types';

/** 保険未加入・共働きDINKS（30代前後の典型：保険にムダはないがふるさと納税で余地が出る） */
function dinksNoInsurance(furusatoDoing = false): OptimizeInput {
  const base: HouseholdInput = {
    persons: [
      { role: 'husband', age: 32, annualIncome: 7_500_000, employmentType: 'employee' },
      { role: 'wife', age: 30, annualIncome: 7_500_000, employmentType: 'employee' },
    ],
    children: [],
    housing: { type: 'rent', monthlyRent: 180_000 },
    assets: { savings: 5_000_000 },
    monthlyLivingExpense: 300_000,
    lifePolicies: [],
    medicalPolicies: [],
  };
  return { ...base, furusato: { doing: furusatoDoing } };
}

describe('optimizeHousehold — レバー横断の統合', () => {
  it('保険にムダがなくても、ふるさと納税で正の改善余地が出る（空振り解消）', () => {
    const r = optimizeHousehold(dinksNoInsurance());
    // 保険の過剰指摘は無い（未加入）
    expect(r.actions.some((a) => a.category === 'insurance')).toBe(false);
    // ふるさと納税の打ち手が出る
    const furusatoAction = r.actions.find((a) => a.domain === 'furusato');
    expect(furusatoAction).toBeDefined();
    expect(furusatoAction!.annualImpact).toBeGreaterThan(0);
    // 改善余地は正
    expect(r.firstYearImprovement).toBeGreaterThan(0);
  });

  it('打ち手は効果額の降順・rankは連番・生涯=年額×年数', () => {
    const r = optimizeHousehold(dinksNoInsurance());
    for (let i = 0; i < r.actions.length; i++) {
      expect(r.actions[i].rank).toBe(i + 1);
      if (i > 0) {
        expect(r.actions[i - 1].annualImpact).toBeGreaterThanOrEqual(r.actions[i].annualImpact);
      }
      expect(r.actions[i].lifetimeImpact).toBe(r.actions[i].annualImpact * 30);
    }
    expect(r.firstYearImprovement).toBe(r.actions.reduce((s, a) => s + a.annualImpact, 0));
  });

  it('ふるさと納税を上限まで実施済みなら、その打ち手は出ない', () => {
    const input = dinksNoInsurance(true);
    // 世帯限度額（約24〜25万円）を確実に上回る額を寄付済みとする
    input.furusato = { doing: true, currentAnnualDonation: 300_000 };
    const r = optimizeHousehold(input);
    expect(r.actions.some((a) => a.domain === 'furusato')).toBe(false);
  });

  it('保険の過不足カード（coverage）と保障不足（coverageGaps）を保持する', () => {
    const r = optimizeHousehold(dinksNoInsurance());
    expect(r.coverage.cases).toHaveLength(2);
    expect(r.coverage.cases[0].deceased).toBe('husband');
    expect(r.coverage.cases[1].deceased).toBe('wife');
    expect(Array.isArray(r.coverageGaps)).toBe(true);
  });

  it('片働き・子ありは保障不足（coverageGaps）が出る', () => {
    const input = dinksNoInsurance();
    input.persons = [
      { role: 'husband', age: 38, annualIncome: 9_000_000, employmentType: 'employee' },
      { role: 'wife', age: 36, annualIncome: 0, employmentType: 'employee' },
    ];
    input.children = [{ age: 3 }];
    const r = optimizeHousehold(input);
    expect(r.coverageGaps.length).toBeGreaterThan(0);
  });

  it('保険＋ふるさと納税の両方の打ち手が効果額順に統合される', () => {
    const input = dinksNoInsurance();
    // 医療重複を追加（保険の打ち手を発生させる）
    input.medicalPolicies = [
      { insured: 'husband', annualPremium: 36_000, dailyHospitalBenefit: 10_000 },
      { insured: 'husband', annualPremium: 30_000, dailyHospitalBenefit: 5_000 },
    ];
    const r = optimizeHousehold(input);
    expect(r.actions.some((a) => a.category === 'insurance')).toBe(true);
    expect(r.actions.some((a) => a.domain === 'furusato')).toBe(true);
    // 出典は保険・ふるさと納税の両方を含む
    expect(r.sources.length).toBeGreaterThan(3);
  });

  it('保険未加入・未実施の共働きは、ふるさと納税とiDeCoの両方の打ち手が出る', () => {
    const r = optimizeHousehold(dinksNoInsurance());
    expect(r.actions.some((a) => a.domain === 'furusato')).toBe(true);
    expect(r.actions.some((a) => a.domain === 'ideco')).toBe(true);
    // iDeCoの詳細も保持
    expect(r.ideco.annualImprovement).toBeGreaterThan(0);
  });

  it('iDeCoを満額拠出済みなら、その打ち手は出ない', () => {
    const input = dinksNoInsurance();
    input.ideco = {
      persons: [
        { currentMonthlyContribution: 23_000 },
        { currentMonthlyContribution: 23_000 },
      ],
    };
    const r = optimizeHousehold(input);
    expect(r.actions.some((a) => a.domain === 'ideco')).toBe(false);
  });

  it('NISAは試算(illustrative)として打ち手に出るが、確定的な改善余地の合計には含めない', () => {
    const input = dinksNoInsurance();
    input.nisa = { monthlyInvestment: 50_000, usingNisa: false };
    const r = optimizeHousehold(input);

    const nisaAction = r.actions.find((a) => a.domain === 'nisa');
    expect(nisaAction).toBeDefined();
    expect(nisaAction!.illustrative).toBe(true);

    // 見出しの改善余地は確定的な打ち手のみの合計（NISAを含まない）
    const deterministicSum = r.actions
      .filter((a) => !a.illustrative)
      .reduce((s, a) => s + a.annualImpact, 0);
    const allSum = r.actions.reduce((s, a) => s + a.annualImpact, 0);
    expect(r.firstYearImprovement).toBe(deterministicSum);
    // NISAの試算分は見出し合計に含まれない
    expect(r.firstYearImprovement).toBeLessThan(allSum);
  });

  it('返り値に免責と出典が付く', () => {
    const r = optimizeHousehold(dinksNoInsurance());
    expect(r.disclaimer).toMatch(/募集|助言|税務相談/);
    expect(r.sources.length).toBeGreaterThan(0);
  });

  it('保険料ベンチマーク：未入力ならnull、高額な生命保険料ならhigh判定', () => {
    expect(optimizeHousehold(dinksNoInsurance()).insuranceBenchmark).toBeNull();

    const input = dinksNoInsurance();
    input.lifePolicies = [
      { insured: 'husband', deathBenefit: 30_000_000, annualPremium: 600_000, type: 'whole' },
    ];
    const r = optimizeHousehold(input);
    expect(r.insuranceBenchmark).not.toBeNull();
    expect(r.insuranceBenchmark!.mode).toBe('household');
    expect(r.insuranceBenchmark!.verdict).toBe('high');
    expect(r.insuranceBenchmark!.diffAnnual).toBeGreaterThan(0);
    expect(r.insuranceBenchmark!.source).toMatch(/生命保険文化センター/);
  });
});

describe('optimizeHousehold — 個人（単身）モード', () => {
  function single(over: Partial<OptimizeInput> = {}): OptimizeInput {
    const base: OptimizeInput = {
      persons: [{ role: 'husband', age: 30, annualIncome: 6_000_000, employmentType: 'employee' }],
      children: [],
      housing: { type: 'rent', monthlyRent: 100_000 },
      assets: { savings: 3_000_000 },
      monthlyLivingExpense: 200_000,
      lifePolicies: [],
      medicalPolicies: [],
      furusato: { doing: false },
    };
    return { ...base, ...over };
  }

  it('単身の必要保障カードは1件のみ', () => {
    const r = optimizeHousehold(single());
    expect(r.coverage.cases).toHaveLength(1);
    expect(r.coverage.cases[0].deceased).toBe('husband');
  });

  it('単身でもふるさと納税・iDeCoの打ち手が出る（1人分）', () => {
    const r = optimizeHousehold(single());
    expect(r.actions.some((a) => a.domain === 'furusato')).toBe(true);
    expect(r.actions.some((a) => a.domain === 'ideco')).toBe(true);
    expect(r.firstYearImprovement).toBeGreaterThan(0);
  });

  it('NISA枠は単身では1人分（同条件の2人世帯より小さい）', () => {
    const singleR = optimizeHousehold(single({ nisa: { monthlyInvestment: 30_000, usingNisa: false } }));
    const coupleR = optimizeHousehold({
      ...single({ nisa: { monthlyInvestment: 30_000, usingNisa: false } }),
      persons: [
        { role: 'husband', age: 30, annualIncome: 6_000_000, employmentType: 'employee' },
        { role: 'wife', age: 30, annualIncome: 6_000_000, employmentType: 'employee' },
      ],
    });
    expect(singleR.nisa.householdAnnualCapacity).toBeLessThan(coupleR.nisa.householdAnnualCapacity);
  });
});

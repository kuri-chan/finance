/**
 * レバー横断の世帯最適化。各レバーの純粋関数を束ね、効果額順の打ち手に統合する。
 * 各レバーエンジン（lib/insurance, lib/furusato, …）はここに集約するだけで統合できる。
 */
import {
  calcRequiredCoverage,
  checkOverInsurance,
  resolveAssumptions,
} from '@/lib/insurance';
import { calcFurusato } from '@/lib/furusato';
import { calcIdeco } from '@/lib/ideco';
import { calcNisa } from '@/lib/nisa';
import benchmarkData from '@/lib/data/benchmark.json';
import type {
  HouseholdAction,
  HouseholdOptimization,
  InsuranceBenchmark,
  OptimizeInput,
} from './types';

/**
 * 生命・医療保険料の「参考平均」との比較（#3 ベンチマーク）。
 * 参考値（出典明示）であり確定的な比較ではない。保険料未入力なら null。
 * 高め/低めの判定は 1.3倍以上/0.7倍以下（境界のブレを避ける）。損保は含めない。
 */
function computeInsuranceBenchmark(input: OptimizeInput): InsuranceBenchmark | null {
  const userAnnual =
    input.lifePolicies.reduce((s, p) => s + p.annualPremium, 0) +
    input.medicalPolicies.reduce((s, p) => s + p.annualPremium, 0);
  if (userAnnual <= 0) return null;

  const single = input.persons.length === 1;
  const b = single
    ? benchmarkData.lifeMedicalAnnualPremium.single
    : benchmarkData.lifeMedicalAnnualPremium.household;
  const avgAnnual = b.avg;
  const ratio = userAnnual / avgAnnual;
  const verdict: InsuranceBenchmark['verdict'] =
    ratio >= 1.3 ? 'high' : ratio <= 0.7 ? 'low' : 'average';

  return {
    userAnnual,
    avgAnnual,
    diffAnnual: userAnnual - avgAnnual,
    ratio,
    verdict,
    mode: single ? 'single' : 'household',
    source: b.source,
  };
}

const yen = (n: number) => Math.round(n).toLocaleString();
const man = (n: number) => Math.round(n / 10_000).toLocaleString();

export function optimizeHousehold(input: OptimizeInput): HouseholdOptimization {
  const horizon = resolveAssumptions(input.assumptions).savingHorizonYears;

  // --- 保険レバー ---
  const coverage = calcRequiredCoverage(input);
  const over = checkOverInsurance(input);

  const actions: HouseholdAction[] = over.findings.map((f) => ({
    rank: 0,
    domain: f.domain,
    category: 'insurance' as const,
    title: f.title,
    detail: f.detail,
    annualImpact: f.estimatedAnnualSaving,
    lifetimeImpact: f.estimatedAnnualSaving * horizon,
  }));

  // --- ふるさと納税レバー ---
  const furusato = calcFurusato({
    persons: input.persons.map((p) => ({
      role: p.role,
      annualIncome: p.annualIncome,
      employmentType: p.employmentType,
      age: p.age,
    })),
    doing: input.furusato?.doing ?? false,
    currentAnnualDonation: input.furusato?.currentAnnualDonation,
    assumptions: { horizonYears: horizon },
  });

  if (furusato.annualImprovement > 0) {
    const doing = input.furusato?.doing ?? false;
    actions.push({
      rank: 0,
      domain: 'furusato',
      category: 'furusato',
      title: doing
        ? 'ふるさと納税の枠に使い残しがあります'
        : 'ふるさと納税で世帯の手取りを底上げできます',
      detail:
        `世帯の限度額は約${man(furusato.householdLimit)}万円/年。` +
        (doing
          ? `未使用の枠 約${yen(furusato.unusedLimit)}円を使い切ると、`
          : '上限まで活用すると、') +
        `実質2,000円の負担で約${yen(furusato.annualImprovement)}円相当の返礼品を受け取れます。`,
      annualImpact: furusato.annualImprovement,
      lifetimeImpact: furusato.annualImprovement * horizon,
    });
  }

  // --- iDeCoレバー ---
  const ideco = calcIdeco({
    persons: input.persons.map((p, i) => ({
      role: p.role,
      annualIncome: p.annualIncome,
      employmentType: p.employmentType,
      age: p.age,
      hasCorporateDC: input.ideco?.persons?.[i]?.hasCorporateDC,
      currentMonthlyContribution: input.ideco?.persons?.[i]?.currentMonthlyContribution,
    })),
    assumptions: { horizonYears: horizon },
  });

  if (ideco.annualImprovement > 0) {
    actions.push({
      rank: 0,
      domain: 'ideco',
      category: 'ideco',
      title: 'iDeCoの所得控除で税負担を減らせます',
      detail:
        `掛金は全額が所得控除の対象。世帯であと月最大 約${man(
          ideco.perPerson.reduce((s, p) => s + (p.monthlyLimit * 12 - p.currentMonthly * 12), 0) / 12,
        )}万円まで拠出でき、満額なら年約${yen(ideco.annualImprovement)}円の節税になります。` +
        '※掛金は原則60歳まで引き出せません（老後資金の先取り）。',
      annualImpact: ideco.annualImprovement,
      lifetimeImpact: ideco.annualImprovement * horizon,
    });
  }

  // --- NISAレバー（試算・前提依存）---
  const nisa = calcNisa({
    adults: input.persons.length,
    monthlyInvestment: input.nisa?.monthlyInvestment ?? 0,
    usingNisa: input.nisa?.usingNisa ?? false,
    assumptions: { horizonYears: horizon },
  });

  if (nisa.annualImprovement > 0) {
    const returnPct = Math.round(nisa.assumptions.assumedAnnualReturn * 100);
    actions.push({
      rank: 0,
      domain: 'nisa',
      category: 'nisa',
      illustrative: true,
      title: 'NISAで運用益を非課税にできます',
      detail:
        `毎月の投資をNISA（世帯の年間枠 約${man(nisa.householdAnnualCapacity)}万円）に回すと、通常約20.3%かかる運用益への税金が非課税に。` +
        `年利${returnPct}%で${horizon}年続けた場合、約${yen(nisa.illustrativeLifetimeBenefit)}円の非課税メリットになる試算です。` +
        '※将来の運用成果を保証するものではありません（元本割れの可能性あり）。',
      annualImpact: nisa.annualImprovement,
      lifetimeImpact: nisa.illustrativeLifetimeBenefit,
    });
  }

  // --- 効果額順に統合 ---
  actions.sort((a, b) => b.annualImpact - a.annualImpact);
  actions.forEach((a, i) => {
    a.rank = i + 1;
  });

  // 確定的な改善余地の合計（試算=illustrativeは含めない。見出しの信頼性を守る）
  const deterministic = actions.filter((a) => !a.illustrative);
  const firstYearImprovement = deterministic.reduce((s, a) => s + a.annualImpact, 0);
  const lifetimeImprovement = deterministic.reduce((s, a) => s + a.lifetimeImpact, 0);

  const sources = Array.from(
    new Set([...over.sources, ...furusato.sources, ...ideco.sources, ...nisa.sources]),
  );

  return {
    firstYearImprovement,
    lifetimeImprovement,
    actions,
    coverageGaps: over.underInsured,
    coverage,
    furusato,
    ideco,
    nisa,
    insuranceBenchmark: computeInsuranceBenchmark(input),
    disclaimer: over.disclaimer,
    sources,
  };
}

export type {
  HouseholdAction,
  HouseholdOptimization,
  OptimizeInput,
  LeverDomain,
  LeverCategory,
} from './types';

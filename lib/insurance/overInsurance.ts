/**
 * ② checkOverInsurance — 過剰保険チェック。
 *
 * 生保:
 *   - 必要保障額に対する現加入額の過不足（過剰なら定期換算で削減額を推定）
 *   - 医療保険の重複（入院日額が最良の1本を残し、残りを削減候補）
 *   - 貯蓄性保険（終身・養老）の非効率（同保障を定期で確保した場合との保険料差）
 * 損保:
 *   - 火災保険：家財の過大付保、重複しやすい特約
 *   - 自動車保険：人身傷害と搭乗者傷害の重複、弁護士特約の世帯重複、車両保険の要否
 *
 * 各指摘に「想定削減額（円/年）」を付ける。いずれも目安であり、断定・推奨はしない。
 */
import { BENCHMARK, termPremiumRatePerYen } from './constants';
import { DISCLAIMER, SOURCES } from './disclaimer';
import { calcRequiredCoverage } from './requiredCoverage';
import type {
  HouseholdInput,
  OverInsuranceFinding,
  OverInsuranceOutput,
  Person,
  Role,
  UnderInsuredNote,
} from './types';

const yen = (n: number) => Math.round(n);

function personByRole(input: HouseholdInput, role: Role): Person {
  return input.persons.find((p) => p.role === role) ?? input.persons[0];
}

/** 生保：必要保障額に対する過剰分を定期換算で削減額に落とす */
function checkLifeSurplus(
  input: HouseholdInput,
  role: Role,
  requiredCoverage: number,
  findings: OverInsuranceFinding[],
): void {
  const person = personByRole(input, role);
  const termPolicies = input.lifePolicies.filter((p) => p.insured === role && p.type === 'term');
  const totalDeathBenefit = input.lifePolicies
    .filter((p) => p.insured === role)
    .reduce((s, p) => s + p.deathBenefit, 0);

  const surplus = totalDeathBenefit - requiredCoverage;
  if (surplus <= 0) return;

  const termBenefit = termPolicies.reduce((s, p) => s + p.deathBenefit, 0);
  const termPremium = termPolicies.reduce((s, p) => s + p.annualPremium, 0);
  // 削減できるのは（掛け捨ての）定期部分に限る
  const reducibleBenefit = Math.min(surplus, termBenefit);
  if (reducibleBenefit <= 0) return;

  const rate = termBenefit > 0 ? termPremium / termBenefit : termPremiumRatePerYen(person.age);
  const saving = reducibleBenefit * rate;
  if (saving <= 0) return;

  findings.push({
    domain: 'life',
    role,
    title: `${role === 'husband' ? '夫' : '妻'}の死亡保障が必要保障額を上回っています`,
    detail:
      `現在の死亡保障 約${yen(totalDeathBenefit).toLocaleString()}円に対し、` +
      `試算上の必要保障額は 約${yen(requiredCoverage).toLocaleString()}円。` +
      `差の定期保険部分（約${yen(reducibleBenefit).toLocaleString()}円）を見直すと保険料の削減余地があります。`,
    estimatedAnnualSaving: yen(saving),
  });
}

/** 医療保険の重複 */
function checkMedicalDuplication(
  input: HouseholdInput,
  role: Role,
  findings: OverInsuranceFinding[],
): void {
  const policies = input.medicalPolicies.filter((p) => p.insured === role);
  if (policies.length <= 1) return;
  if (!BENCHMARK.medical.keepBestOnly) return;

  // 入院日額が最も手厚い1本を残す
  const sorted = [...policies].sort(
    (a, b) => (b.dailyHospitalBenefit ?? 0) - (a.dailyHospitalBenefit ?? 0),
  );
  const dropped = sorted.slice(1);
  const saving = dropped.reduce((s, p) => s + p.annualPremium, 0);
  if (saving <= 0) return;

  findings.push({
    domain: 'medical',
    role,
    title: `${role === 'husband' ? '夫' : '妻'}の医療保険が重複しています`,
    detail:
      `医療保険が${policies.length}本あります。保障が最も手厚い1本に集約すると、` +
      `残り${dropped.length}本分の保険料が削減候補になります。`,
    estimatedAnnualSaving: yen(saving),
  });
}

/** 貯蓄性保険（終身・養老）の非効率 */
function checkSavingsInsurance(
  input: HouseholdInput,
  role: Role,
  findings: OverInsuranceFinding[],
): void {
  const person = personByRole(input, role);
  const flagTypes = BENCHMARK.savingsInsurance.flagTypes as string[];
  const policies = input.lifePolicies.filter(
    (p) => p.insured === role && flagTypes.includes(p.type),
  );
  const rate = termPremiumRatePerYen(person.age);

  for (const p of policies) {
    const termEquivalentPremium = p.deathBenefit * rate;
    const inefficiency = p.annualPremium - termEquivalentPremium;
    if (inefficiency <= 0) continue;
    findings.push({
      domain: 'savings_insurance',
      role,
      title: `${role === 'husband' ? '夫' : '妻'}の貯蓄性保険（${p.type === 'whole' ? '終身' : '養老'}）に見直し余地があります`,
      detail:
        `保険料 約${yen(p.annualPremium).toLocaleString()}円/年のうち、同額の死亡保障を定期保険で確保した場合との差は ` +
        `約${yen(inefficiency).toLocaleString()}円/年。保障と貯蓄を分けると効率化の余地があります` +
        `（※解約返戻金があるため単純な損得ではありません）。`,
      estimatedAnnualSaving: yen(inefficiency),
    });
  }
}

/** 火災保険 */
function checkFire(input: HouseholdInput, findings: OverInsuranceFinding[]): void {
  const fire = input.firePolicy;
  if (!fire) return;
  const b = BENCHMARK.fire;

  // 重複しやすい特約
  const overlapping = fire.riders.filter((r) => b.commonlyOverlappingRiders.includes(r));
  if (overlapping.length > 0) {
    findings.push({
      domain: 'fire',
      title: '火災保険に重複しやすい特約があります',
      detail:
        `特約「${overlapping.join('、')}」は他の補償と重複しやすい項目です。` +
        `補償内容を確認のうえ整理すると保険料の削減余地があります。`,
      estimatedAnnualSaving: yen(overlapping.length * b.riderAnnualCostEstimate),
    });
  }

  // 家財の過大付保
  const householdMembers =
    input.persons.length + input.children.filter((c) => (c.age ?? -1) >= 0).length;
  const contentsCap = householdMembers * b.contentsCoveragePerHouseholdMember;
  if (fire.contentsCoverage > contentsCap) {
    const excess = fire.contentsCoverage - contentsCap;
    const saving = excess * (b.contentsPremiumRatePer10Million / 10_000_000);
    if (saving > 0) {
      findings.push({
        domain: 'fire',
        title: '火災保険の家財補償が過大な可能性があります',
        detail:
          `家財の付保額 約${yen(fire.contentsCoverage).toLocaleString()}円は、世帯人数の目安（約${yen(contentsCap).toLocaleString()}円）を上回ります。` +
          `適正化すると保険料の削減余地があります。`,
        estimatedAnnualSaving: yen(saving),
      });
    }
  }
}

/** 自動車保険 */
function checkAuto(input: HouseholdInput, findings: OverInsuranceFinding[]): void {
  const autos = input.autoPolicies ?? [];
  if (autos.length === 0) return;
  const b = BENCHMARK.auto;

  autos.forEach((auto, idx) => {
    const label = auto.label ?? `${idx + 1}台目`;

    // 人身傷害と搭乗者傷害の重複
    if (auto.hasPersonalInjuryCoverage && auto.riders.includes('passenger_injury')) {
      findings.push({
        domain: 'auto',
        title: `自動車保険（${label}）で補償が重複しています`,
        detail: '人身傷害補償があるため、搭乗者傷害特約は補償が重複しやすい項目です。',
        estimatedAnnualSaving: yen(b.passengerInjuryRiderAnnualCost),
      });
    }

    // 車両保険の要否
    if (
      auto.hasVehicleCoverage &&
      (auto.vehicleAgeYears >= b.vehicleCoverageDropAgeYears ||
        auto.vehicleValue <= b.vehicleCoverageDropValue)
    ) {
      const premium =
        auto.vehicleCoveragePremium ??
        auto.annualPremium * b.vehicleCoveragePremiumRatioWhenUnknown;
      findings.push({
        domain: 'auto',
        title: `自動車保険（${label}）の車両保険は費用対効果が低い可能性があります`,
        detail:
          `車齢${auto.vehicleAgeYears}年・車両価値 約${yen(auto.vehicleValue).toLocaleString()}円。` +
          `車の時価が下がると車両保険の費用対効果は低下します。要否を確認する余地があります。`,
        estimatedAnnualSaving: yen(premium),
      });
    }
  });

  // 弁護士特約の世帯重複（世帯で1本に集約可能）
  const legalCount = autos.filter((a) => a.riders.includes('legal')).length;
  if (legalCount > 1) {
    findings.push({
      domain: 'auto',
      title: '弁護士特約が世帯で重複しています',
      detail: `弁護士特約が${legalCount}契約にあります。世帯で1本に集約できる場合があります。`,
      estimatedAnnualSaving: yen((legalCount - 1) * b.legalRiderAnnualCost),
    });
  }
}

export function checkOverInsurance(input: HouseholdInput): OverInsuranceOutput {
  const coverage = calcRequiredCoverage(input);
  const findings: OverInsuranceFinding[] = [];
  const underInsured: UnderInsuredNote[] = [];

  for (const c of coverage.cases) {
    // 生保：過剰
    checkLifeSurplus(input, c.deceased, c.requiredCoverage, findings);
    // 生保：不足（削減ではなくリスクとして記録）
    if (c.additionalNeeded > 0) {
      underInsured.push({
        role: c.deceased,
        shortfall: c.additionalNeeded,
        detail:
          `${c.deceased === 'husband' ? '夫' : '妻'}の死亡に対する必要保障額 約${c.requiredCoverage.toLocaleString()}円に対し、` +
          `現在の保障は 約${c.existingDeathBenefit.toLocaleString()}円で、約${c.additionalNeeded.toLocaleString()}円不足しています。`,
      });
    }
    // 医療・貯蓄性
    checkMedicalDuplication(input, c.deceased, findings);
    checkSavingsInsurance(input, c.deceased, findings);
  }

  // 損保
  checkFire(input, findings);
  checkAuto(input, findings);

  // 効果額の大きい順
  findings.sort((a, b) => b.estimatedAnnualSaving - a.estimatedAnnualSaving);

  const totalEstimatedAnnualSaving = findings.reduce(
    (s, f) => s + f.estimatedAnnualSaving,
    0,
  );

  return {
    findings,
    totalEstimatedAnnualSaving,
    underInsured,
    disclaimer: DISCLAIMER,
    sources: SOURCES,
  };
}

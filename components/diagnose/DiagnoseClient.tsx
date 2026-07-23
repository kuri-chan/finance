'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LifePolicyType, Role } from '@/lib/insurance';
import { optimizeHousehold } from '@/lib/optimize';
import { Card, CheckChips, Field, NumberField, Segmented, Toggle } from '@/components/ui';
import {
  AUTO_RIDER_OPTIONS,
  FIRE_RIDER_OPTIONS,
  buildOptimizeInput,
  defaultForm,
  type AutoForm,
  type FormState,
  type LifeForm,
  type MedicalForm,
} from './model';
import Result from './Result';

const STEPS = ['二人のこと', '暮らし', '保険・税', '結果'] as const;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'husband', label: '夫' },
  { value: 'wife', label: '妻' },
];
const EMP_OPTIONS = [
  { value: 'employee' as const, label: '会社員' },
  { value: 'self_employed' as const, label: '個人事業主' },
];
const LIFE_TYPE_OPTIONS: { value: LifePolicyType; label: string }[] = [
  { value: 'term', label: '定期（掛け捨て）' },
  { value: 'whole', label: '終身' },
  { value: 'endowment', label: '養老' },
];

export default function DiagnoseClient() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const optimization = useMemo(() => {
    if (step !== 3) return null;
    return optimizeHousehold(buildOptimizeInput(form));
  }, [step, form]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-brand-600">
          ← 二人のお金診断
        </Link>
        <span className="text-xs text-slate-400">
          {step + 1} / {STEPS.length}・{STEPS[step]}
        </span>
      </header>

      {/* 進捗バー */}
      <div className="mb-6 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {step === 0 && <StepPeople form={form} update={update} />}
      {step === 1 && <StepLife form={form} update={update} />}
      {step === 2 && <StepInsurance form={form} update={update} />}
      {step === 3 && optimization && (
        <Result optimization={optimization} onReset={() => setStep(0)} />
      )}

      {step < 3 && (
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 disabled:opacity-0"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            {step === 2 ? '診断する' : '次へ'}
          </button>
        </div>
      )}
    </main>
  );
}

/* ---------- Step 0: 二人のこと ---------- */
function StepPeople({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const person = (role: Role) => (role === 'husband' ? form.husband : form.wife);
  const setPerson = (role: Role, patch: Partial<FormState['husband']>) =>
    update(role === 'husband' ? { husband: { ...form.husband, ...patch } } : { wife: { ...form.wife, ...patch } });

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">お二人の年齢・年収・働き方を教えてください。</p>
      {ROLE_OPTIONS.map((r) => {
        const p = person(r.value);
        return (
          <Card key={r.value}>
            <h3 className="mb-3 font-semibold text-slate-800">{r.label}</h3>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="年齢" value={p.age} suffix="歳" onChange={(v) => setPerson(r.value, { age: v })} />
              <NumberField
                label="年収"
                value={p.income}
                suffix="万円"
                step={10}
                onChange={(v) => setPerson(r.value, { income: v })}
              />
            </div>
            <div className="mt-4">
              <Segmented
                label="働き方"
                value={p.employmentType}
                options={EMP_OPTIONS}
                onChange={(v) => setPerson(r.value, { employmentType: v })}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Step 1: 暮らし ---------- */
function StepLife({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const addChild = () => update({ childrenAges: [...form.childrenAges, 0] });
  const setChild = (i: number, age: number) =>
    update({ childrenAges: form.childrenAges.map((a, idx) => (idx === i ? age : a)) });
  const removeChild = (i: number) =>
    update({ childrenAges: form.childrenAges.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">住まい</h3>
        <Segmented
          value={form.housingType}
          options={[
            { value: 'rent', label: '賃貸' },
            { value: 'owned', label: '持ち家' },
          ]}
          onChange={(v) => update({ housingType: v })}
        />
        {form.housingType === 'rent' ? (
          <div className="mt-4">
            <NumberField
              label="家賃"
              value={form.monthlyRent}
              suffix="円/月"
              step={5000}
              onChange={(v) => update({ monthlyRent: v })}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <NumberField
              label="住宅ローン返済額"
              value={form.monthlyPayment}
              suffix="円/月"
              step={5000}
              onChange={(v) => update({ monthlyPayment: v })}
            />
            <Toggle
              label="団体信用生命保険（団信）に加入している"
              checked={form.groupCreditLife}
              onChange={(v) => update({ groupCreditLife: v })}
            />
            {form.groupCreditLife && (
              <Segmented
                label="主債務者（ローンの名義）"
                value={form.mortgageHolder}
                options={ROLE_OPTIONS}
                onChange={(v) => update({ mortgageHolder: v })}
              />
            )}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">お子さん</h3>
        {form.childrenAges.length === 0 && (
          <p className="mb-2 text-sm text-slate-400">現在お子さんはいません</p>
        )}
        <div className="space-y-2">
          {form.childrenAges.map((age, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <NumberField label={`第${i + 1}子の年齢`} value={age} suffix="歳" onChange={(v) => setChild(i, v)} />
              </div>
              <button
                type="button"
                onClick={() => removeChild(i)}
                className="mb-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-rose-500"
              >
                削除
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addChild}
          className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
        >
          ＋ 子どもを追加
        </button>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <Toggle
            label="出産を予定している"
            checked={form.plannedChildInYears != null}
            onChange={(v) => update({ plannedChildInYears: v ? 2 : null })}
          />
          {form.plannedChildInYears != null && (
            <div className="mt-3">
              <NumberField
                label="何年後の予定？"
                value={form.plannedChildInYears}
                suffix="年後"
                onChange={(v) => update({ plannedChildInYears: v })}
              />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-800">生活費・貯蓄</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label="月の生活費（住居費を除く）"
            hint="食費・光熱・通信・娯楽など"
            value={form.monthlyLivingExpense}
            suffix="円/月"
            step={10000}
            onChange={(v) => update({ monthlyLivingExpense: v })}
          />
          <NumberField
            label="世帯の貯蓄"
            value={form.savings}
            suffix="万円"
            step={50}
            onChange={(v) => update({ savings: v })}
          />
        </div>
      </Card>
    </div>
  );
}

/* ---------- Step 2: 今の保険 ---------- */
function StepInsurance({ form, update }: { form: FormState; update: (p: Partial<FormState>) => void }) {
  const addLife = () =>
    update({ life: [...form.life, { insured: 'husband', deathBenefit: 1000, annualPremium: 24000, type: 'term' }] });
  const setLife = (i: number, patch: Partial<LifeForm>) =>
    update({ life: form.life.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  const removeLife = (i: number) => update({ life: form.life.filter((_, idx) => idx !== i) });

  const addMedical = () =>
    update({ medical: [...form.medical, { insured: 'husband', annualPremium: 36000, dailyHospitalBenefit: 5000 }] });
  const setMedical = (i: number, patch: Partial<MedicalForm>) =>
    update({ medical: form.medical.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) });
  const removeMedical = (i: number) => update({ medical: form.medical.filter((_, idx) => idx !== i) });

  const addAuto = () =>
    update({
      autos: [
        ...form.autos,
        {
          annualPremium: 80000,
          vehicleAgeYears: 5,
          vehicleValue: 80,
          hasVehicleCoverage: true,
          vehicleCoveragePremium: 0,
          hasPersonalInjuryCoverage: true,
          riders: [],
        },
      ],
    });
  const setAuto = (i: number, patch: Partial<AutoForm>) =>
    update({ autos: form.autos.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) });
  const removeAuto = (i: number) => update({ autos: form.autos.filter((_, idx) => idx !== i) });

  const toggleRider = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        今入っている保険を入れると、過不足・重複・過剰をチェックします（分かる範囲でOK）。
      </p>

      {/* 生命保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">生命保険（死亡保障）</h3>
        <div className="space-y-3">
          {form.life.map((l, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                <Segmented value={l.insured} options={ROLE_OPTIONS} onChange={(v) => setLife(i, { insured: v })} />
                <button type="button" onClick={() => removeLife(i)} className="text-sm text-slate-400 hover:text-rose-500">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="死亡保険金" value={l.deathBenefit} suffix="万円" step={100} onChange={(v) => setLife(i, { deathBenefit: v })} />
                <NumberField label="保険料" value={l.annualPremium} suffix="円/年" step={1000} onChange={(v) => setLife(i, { annualPremium: v })} />
              </div>
              <div className="mt-3">
                <Segmented label="種類" value={l.type} options={LIFE_TYPE_OPTIONS} onChange={(v) => setLife(i, { type: v })} />
              </div>
            </Card>
          ))}
        </div>
        <AddButton onClick={addLife} label="生命保険を追加" />
      </section>

      {/* 医療保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">医療保険</h3>
        <div className="space-y-3">
          {form.medical.map((m, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                <Segmented value={m.insured} options={ROLE_OPTIONS} onChange={(v) => setMedical(i, { insured: v })} />
                <button type="button" onClick={() => removeMedical(i)} className="text-sm text-slate-400 hover:text-rose-500">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="保険料" value={m.annualPremium} suffix="円/年" step={1000} onChange={(v) => setMedical(i, { annualPremium: v })} />
                <NumberField label="入院日額" value={m.dailyHospitalBenefit} suffix="円/日" step={1000} onChange={(v) => setMedical(i, { dailyHospitalBenefit: v })} />
              </div>
            </Card>
          ))}
        </div>
        <AddButton onClick={addMedical} label="医療保険を追加" />
      </section>

      {/* 火災保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">火災保険</h3>
        <Card>
          <Toggle label="火災保険に加入している" checked={form.fire.enabled} onChange={(v) => update({ fire: { ...form.fire, enabled: v } })} />
          {form.fire.enabled && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="保険料" value={form.fire.annualPremium} suffix="円/年" step={1000} onChange={(v) => update({ fire: { ...form.fire, annualPremium: v } })} />
                <NumberField label="家財の補償額" value={form.fire.contentsCoverage} suffix="万円" step={100} onChange={(v) => update({ fire: { ...form.fire, contentsCoverage: v } })} />
              </div>
              <Field label="付帯している特約">
                <CheckChips
                  options={FIRE_RIDER_OPTIONS}
                  values={form.fire.riders}
                  onToggle={(v) => update({ fire: { ...form.fire, riders: toggleRider(form.fire.riders, v) } })}
                />
              </Field>
            </div>
          )}
        </Card>
      </section>

      {/* 自動車保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">自動車保険</h3>
        <div className="space-y-3">
          {form.autos.map((a, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{i + 1}台目</span>
                <button type="button" onClick={() => removeAuto(i)} className="text-sm text-slate-400 hover:text-rose-500">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="保険料" value={a.annualPremium} suffix="円/年" step={1000} onChange={(v) => setAuto(i, { annualPremium: v })} />
                <NumberField label="車の年式（車齢）" value={a.vehicleAgeYears} suffix="年" onChange={(v) => setAuto(i, { vehicleAgeYears: v })} />
                <NumberField label="車両価値（時価）" value={a.vehicleValue} suffix="万円" step={10} onChange={(v) => setAuto(i, { vehicleValue: v })} />
                <NumberField label="うち車両保険料" hint="分かれば（0で自動推定）" value={a.vehicleCoveragePremium} suffix="円/年" step={1000} onChange={(v) => setAuto(i, { vehicleCoveragePremium: v })} />
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Toggle label="車両保険あり" checked={a.hasVehicleCoverage} onChange={(v) => setAuto(i, { hasVehicleCoverage: v })} />
                <Toggle label="人身傷害補償あり" checked={a.hasPersonalInjuryCoverage} onChange={(v) => setAuto(i, { hasPersonalInjuryCoverage: v })} />
              </div>
              <div className="mt-3">
                <Field label="付帯している特約">
                  <CheckChips options={AUTO_RIDER_OPTIONS} values={a.riders} onToggle={(v) => setAuto(i, { riders: toggleRider(a.riders, v) })} />
                </Field>
              </div>
            </Card>
          ))}
        </div>
        <AddButton onClick={addAuto} label="自動車保険を追加" />
      </section>

      {/* ふるさと納税 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">ふるさと納税</h3>
        <Card>
          <Toggle
            label="ふるさと納税をしている"
            checked={form.furusatoDoing}
            onChange={(v) => update({ furusatoDoing: v })}
          />
          {form.furusatoDoing ? (
            <div className="mt-4">
              <NumberField
                label="今の年間寄附額（世帯合計・だいたい）"
                hint="分からなければ0でOK"
                value={form.furusatoCurrentDonation}
                suffix="円/年"
                step={10000}
                onChange={(v) => update({ furusatoCurrentDonation: v })}
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              していない場合、世帯の限度額と「実質2,000円で受け取れる返礼品」の目安を試算します。
            </p>
          )}
        </Card>
      </section>

      {/* iDeCo */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">iDeCo（個人型確定拠出年金）</h3>
        <p className="mb-2 text-sm text-slate-400">
          掛金は全額が所得控除。お二人それぞれの状況を教えてください（掛金は原則60歳まで引き出せません）。
        </p>
        <div className="space-y-3">
          {ROLE_OPTIONS.map((r) => {
            const p = r.value === 'husband' ? form.husband : form.wife;
            const setP = (patch: Partial<typeof p>) =>
              update(
                r.value === 'husband'
                  ? { husband: { ...form.husband, ...patch } }
                  : { wife: { ...form.wife, ...patch } },
              );
            return (
              <Card key={r.value}>
                <h4 className="mb-3 font-medium text-slate-700">{r.label}</h4>
                <div className="flex flex-col gap-3">
                  {p.employmentType === 'employee' && (
                    <Toggle
                      label="勤務先の企業型DC（確定拠出年金）に加入している"
                      checked={p.hasCorporateDC}
                      onChange={(v) => setP({ hasCorporateDC: v })}
                    />
                  )}
                  <NumberField
                    label="現在のiDeCo掛金"
                    hint="していなければ0"
                    value={p.idecoMonthly}
                    suffix="円/月"
                    step={1000}
                    onChange={(v) => setP({ idecoMonthly: v })}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* NISA */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">NISA（つみたて・投資）</h3>
        <Card>
          <NumberField
            label="毎月の投資額（世帯）"
            hint="投資信託・積立など。していなければ0"
            value={form.nisaMonthlyInvestment}
            suffix="円/月"
            step={5000}
            onChange={(v) => update({ nisaMonthlyInvestment: v })}
          />
          {form.nisaMonthlyInvestment > 0 && (
            <div className="mt-4">
              <Toggle
                label="その投資をNISA口座で行っている"
                checked={form.nisaUsing}
                onChange={(v) => update({ nisaUsing: v })}
              />
              <p className="mt-2 text-xs text-slate-400">
                課税口座で投資している場合、NISAに回すと運用益が非課税になる目安を試算します（前提あり・成果は保証されません）。
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 w-full rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600"
    >
      ＋ {label}
    </button>
  );
}

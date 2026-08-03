'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LifePolicyType, Role } from '@/lib/insurance';
import { optimizeHousehold } from '@/lib/optimize';
import { Card, CheckChips, Field, NumberField, Segmented, Toggle } from '@/components/ui';
import {
  AUTO_RIDER_OPTIONS,
  FIRE_RIDER_OPTIONS,
  buildOptimizeInput,
  defaultForm,
  formatMan,
  type AutoForm,
  type FormState,
  type LifeForm,
  type MedicalForm,
} from './model';
import Result from './Result';

const STEPS = ['二人のこと', '暮らし', '保険・税', '結果'] as const;

/** 前回の診断（入力＋日時）をこの端末に保存するキー（#6：ログイン不要で見返し） */
const STORAGE_KEY = 'tedorilab:lastDiagnosis:v1';

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

/** 年収の目安プリセット（タップで即入力・入力補助） */
const INCOME_PRESETS = [400, 500, 600, 800, 1000, 1200];

export default function DiagnoseClient() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm);
  // #6：前回の保存（この端末のみ・ログイン不要）
  const [saved, setSaved] = useState<{ form: FormState; at: string } | null>(null);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // ステップ遷移のたびにページ最上部へ（前ページのボタン位置で止まるのを防ぐ）
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // マウント時：前回の診断を読み込む（バナーで「結果を見る」を提示。自動復元はしない）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.form) setSaved(parsed);
      }
    } catch {
      /* localStorage不可の環境では無視 */
    }
  }, []);

  // 結果に到達したら、入力内容をこの端末に保存（生入力は端末外に出ない）
  useEffect(() => {
    if (step === 3) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, at: new Date().toISOString() }));
      } catch {
        /* 無視 */
      }
    }
  }, [step, form]);

  const optimization = useMemo(() => {
    if (step !== 3) return null;
    return optimizeHousehold(buildOptimizeInput(form));
  }, [step, form]);

  // #1：入力途中の「概算」改善余地（確定分のみ）。入力が進むほど正確になる。
  const liveEstimate = useMemo(() => {
    if (step === 3) return 0;
    return optimizeHousehold(buildOptimizeInput(form)).firstYearImprovement;
  }, [step, form]);

  const restoreSaved = () => {
    if (!saved) return;
    setForm(saved.form);
    setStep(3);
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {form.mode === 'single' ? 'あなたのお金診断' : '二人のお金診断'}
        </span>
        <span className="text-xs text-slate-400">
          {step + 1} / {STEPS.length}・
          {form.mode === 'single' && step === 0 ? 'あなたのこと' : STEPS[step]}
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

      {/* #6：前回の診断結果バナー（この端末に保存・ログイン不要） */}
      {step === 0 && saved && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div>
            <p className="text-sm font-medium text-brand-800">前回の診断結果を保存しています</p>
            <p className="text-xs text-brand-700">
              {new Date(saved.at).toLocaleDateString('ja-JP')} に診断・この端末のみに保存
            </p>
          </div>
          <button
            type="button"
            onClick={restoreSaved}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            結果を見る →
          </button>
        </div>
      )}

      {/* #1：入力途中の概算改善余地（進めるほど正確に） */}
      {step < 3 && liveEstimate > 0 && (
        <div className="mb-5 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-3 text-white">
          <p className="text-xs text-brand-100">今の入力での概算・改善余地（＝手取りを増やせる目安）</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums">
            年 約{formatMan(liveEstimate)}
            <span className="ml-1 text-xs font-medium text-brand-100">入力を進めるほど正確に</span>
          </p>
        </div>
      )}

      {step === 0 && <StepPeople form={form} update={update} />}
      {step === 1 && <StepLife form={form} update={update} />}
      {step === 2 && <StepInsurance form={form} update={update} />}
      {step === 3 && optimization && (
        <Result optimization={optimization} onReset={() => setStep(0)} />
      )}

      {step < 3 && (
        <div className="sticky bottom-0 -mx-5 mt-8 flex items-center justify-between border-t border-slate-200 bg-white/90 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
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

  const single = form.mode === 'single';
  const shownRoles = single ? [ROLE_OPTIONS[0]] : ROLE_OPTIONS;

  return (
    <div className="space-y-4">
      <Card>
        <Segmented
          label="診断のしかた"
          value={form.mode}
          options={[
            { value: 'couple' as const, label: 'ふたりで診断' },
            { value: 'single' as const, label: 'ひとりで診断' },
          ]}
          onChange={(v) => update({ mode: v })}
        />
        <p className="mt-2 text-xs text-slate-400">
          {single
            ? 'あなた一人の情報で診断します。あとでパートナーの分も入れると、世帯での最適化が見えます。'
            : '二人分を合算して、世帯まるごとで最適化します。'}
        </p>
      </Card>

      <p className="text-sm text-slate-500">
        {single
          ? 'あなたの年齢・年収・働き方を教えてください。'
          : 'お二人の年齢・年収・働き方を教えてください。'}
      </p>
      {shownRoles.map((r) => {
        const p = person(r.value);
        return (
          <Card key={r.value}>
            <h3 className="mb-3 font-semibold text-slate-800">{single ? 'あなた' : r.label}</h3>
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
            <div className="mt-2">
              <span className="text-xs text-slate-400">年収の目安（タップで入力）</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {INCOME_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setPerson(r.value, { income: v })}
                    className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                      p.income === v
                        ? 'border-brand-400 bg-brand-50 font-medium text-brand-700'
                        : 'border-slate-200 text-slate-500 hover:border-brand-300'
                    }`}
                  >
                    {v}万
                  </button>
                ))}
              </div>
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
            {form.mode === 'couple' && form.groupCreditLife && (
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

  // 「加入している」トグル。onにした時、まだ1件も無ければ既定の入力を1件出す（火災保険と同じ体験）。
  const toggleLife = (v: boolean) =>
    v && form.life.length === 0 ? (addLife(), update({ hasLife: true })) : update({ hasLife: v });
  const toggleMedical = (v: boolean) =>
    v && form.medical.length === 0 ? (addMedical(), update({ hasMedical: true })) : update({ hasMedical: v });
  const toggleAuto = (v: boolean) =>
    v && form.autos.length === 0 ? (addAuto(), update({ hasAuto: true })) : update({ hasAuto: v });

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-500">
        今入っている保険を入れると、過不足・重複・過剰をチェックします。
        <strong className="text-slate-700">保険料しか分からなくてもOK</strong>
        ——「保険金額」や「入院日額」は、保険会社のアプリ・マイページや保険証券で確認できます。
        分からない項目は空欄（0）のままでも診断できます（貯蓄型は保険料だけでも見直し余地を試算します）。
      </div>

      {/* 生命保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">生命保険（死亡保障）</h3>
        <Card>
          <Toggle label="生命保険に加入している" checked={form.hasLife} onChange={toggleLife} />
        </Card>
        {form.hasLife && (
        <div className="mt-3 space-y-3">
          {form.life.map((l, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                {form.mode === 'couple' ? (
                  <Segmented value={l.insured} options={ROLE_OPTIONS} onChange={(v) => setLife(i, { insured: v })} />
                ) : (
                  <span className="text-sm font-medium text-slate-600">あなたの保険</span>
                )}
                <button type="button" onClick={() => removeLife(i)} className="text-sm text-slate-400 hover:text-rose-500">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="死亡保険金" hint="分からなければ空欄でOK" value={l.deathBenefit} suffix="万円" step={100} onChange={(v) => setLife(i, { deathBenefit: v })} />
                <NumberField label="保険料" value={l.annualPremium} suffix="円/年" step={1000} onChange={(v) => setLife(i, { annualPremium: v })} />
              </div>
              <div className="mt-3">
                <Segmented label="種類" value={l.type} options={LIFE_TYPE_OPTIONS} onChange={(v) => setLife(i, { type: v })} />
              </div>
            </Card>
          ))}
          <AddButton onClick={addLife} label="生命保険を追加" />
        </div>
        )}
      </section>

      {/* 医療保険 */}
      <section>
        <h3 className="mb-2 font-semibold text-slate-800">医療保険</h3>
        <Card>
          <Toggle label="医療保険に加入している" checked={form.hasMedical} onChange={toggleMedical} />
        </Card>
        {form.hasMedical && (
        <div className="mt-3 space-y-3">
          {form.medical.map((m, i) => (
            <Card key={i}>
              <div className="mb-3 flex items-center justify-between">
                {form.mode === 'couple' ? (
                  <Segmented value={m.insured} options={ROLE_OPTIONS} onChange={(v) => setMedical(i, { insured: v })} />
                ) : (
                  <span className="text-sm font-medium text-slate-600">あなたの保険</span>
                )}
                <button type="button" onClick={() => removeMedical(i)} className="text-sm text-slate-400 hover:text-rose-500">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="保険料" value={m.annualPremium} suffix="円/年" step={1000} onChange={(v) => setMedical(i, { annualPremium: v })} />
                <NumberField label="入院日額" hint="分からなければ空欄でOK" value={m.dailyHospitalBenefit} suffix="円/日" step={1000} onChange={(v) => setMedical(i, { dailyHospitalBenefit: v })} />
              </div>
            </Card>
          ))}
          <AddButton onClick={addMedical} label="医療保険を追加" />
        </div>
        )}
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
        <Card>
          <Toggle label="自動車保険に加入している" checked={form.hasAuto} onChange={toggleAuto} />
        </Card>
        {form.hasAuto && (
        <div className="mt-3 space-y-3">
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
          <AddButton onClick={addAuto} label="自動車保険を追加" />
        </div>
        )}
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
          {(form.mode === 'single' ? [ROLE_OPTIONS[0]] : ROLE_OPTIONS).map((r) => {
            const p = r.value === 'husband' ? form.husband : form.wife;
            const setP = (patch: Partial<typeof p>) =>
              update(
                r.value === 'husband'
                  ? { husband: { ...form.husband, ...patch } }
                  : { wife: { ...form.wife, ...patch } },
              );
            return (
              <Card key={r.value}>
                <h4 className="mb-3 font-medium text-slate-700">{form.mode === 'single' ? 'あなた' : r.label}</h4>
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

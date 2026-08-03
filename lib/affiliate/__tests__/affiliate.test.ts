import { describe, expect, it } from 'vitest';
import type { OverInsuranceDomain } from '@/lib/insurance';
import { getAffiliateForDomain, getAffiliateForGap, getDisclosure } from '../index';

const ALL_DOMAINS: OverInsuranceDomain[] = [
  'life',
  'medical',
  'savings_insurance',
  'fire',
  'auto',
];

describe('affiliate 対応層', () => {
  it('すべての domain が送客先に対応づく', () => {
    for (const d of ALL_DOMAINS) {
      const cta = getAffiliateForDomain(d);
      expect(cta).not.toBeNull();
      expect(cta!.destination.label.length).toBeGreaterThan(0);
    }
  });

  it('生保・医療・貯蓄性は保険相談、火災・自動車は一括見積に対応する', () => {
    expect(getAffiliateForDomain('life')!.destination.id).toBe('life_review');
    expect(getAffiliateForDomain('medical')!.destination.id).toBe('life_review');
    expect(getAffiliateForDomain('savings_insurance')!.destination.id).toBe('life_review');
    expect(getAffiliateForDomain('fire')!.destination.id).toBe('fire_estimate');
    expect(getAffiliateForDomain('auto')!.destination.id).toBe('auto_estimate');

    expect(getAffiliateForDomain('life')!.destination.kind).toBe('consultation');
    expect(getAffiliateForDomain('fire')!.destination.kind).toBe('estimate');
    expect(getAffiliateForDomain('auto')!.destination.kind).toBe('estimate');
  });

  it('ふるさと納税はポータル送客に対応する', () => {
    const cta = getAffiliateForDomain('furusato');
    expect(cta).not.toBeNull();
    expect(cta!.destination.id).toBe('furusato_portal');
  });

  it('iDeCoはiDeCo口座、NISAはNISA証券口座と別導線に対応する', () => {
    const ideco = getAffiliateForDomain('ideco');
    expect(ideco).not.toBeNull();
    expect(ideco!.destination.id).toBe('ideco_account');

    const nisa = getAffiliateForDomain('nisa');
    expect(nisa).not.toBeNull();
    expect(nisa!.destination.id).toBe('securities_account');
  });

  it('保障不足は保険相談導線に対応する', () => {
    const cta = getAffiliateForGap();
    expect(cta).not.toBeNull();
    expect(cta!.destination.kind).toBe('consultation');
  });

  it('URL未設定のプレースホルダは available=false（提携準備中）', () => {
    // ASP登録前は url が空 → 送客不可としてUIで非リンク表示になる
    const cta = getAffiliateForDomain('life')!;
    expect(cta.available).toBe(cta.destination.url.trim() !== '');
  });

  it('PR明示と中立性の開示文が提供される', () => {
    const d = getDisclosure();
    expect(d.prLabel).toBe('PR');
    expect(d.disclosure).toMatch(/広告/);
    expect(d.disclosure).toMatch(/中立|変わりません/);
  });
});

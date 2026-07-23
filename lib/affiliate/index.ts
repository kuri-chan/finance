/**
 * アフィリエイト送客の対応層。
 * 純粋エンジン（lib/insurance）とは分離し、打ち手の domain / 保障不足を送客先へ対応づける。
 * URLは data/affiliate-links.json に外出し（ASP登録後に埋めるだけで実リンク化）。
 * 景表法（ステマ規制）に基づきPR明示・中立性開示を必須とする。
 */
import affiliate from '@/lib/data/affiliate-links.json';
import type { AffiliateCTA, AffiliateDestination, AffiliateDisclosure } from './types';

const DESTINATIONS = affiliate.destinations as Record<string, AffiliateDestination>;
const DOMAIN_MAP = affiliate.domainMap as Record<string, string>;

function toCTA(destination: AffiliateDestination | undefined): AffiliateCTA | null {
  if (!destination) return null;
  return {
    destination,
    available: destination.url.trim() !== '',
    prLabel: affiliate.prLabel,
  };
}

/** 打ち手の domain（保険の各領域 / furusato など）に対応する送客導線 */
export function getAffiliateForDomain(domain: string): AffiliateCTA | null {
  const destId = DOMAIN_MAP[domain];
  return toCTA(destId ? DESTINATIONS[destId] : undefined);
}

/** 保障不足（増やす方向）に対応する相談導線 */
export function getAffiliateForGap(): AffiliateCTA | null {
  return toCTA(DESTINATIONS[affiliate.gapDestination]);
}

/** PR明示・中立性の開示文 */
export function getDisclosure(): AffiliateDisclosure {
  return { prLabel: affiliate.prLabel, disclosure: affiliate.disclosure };
}

export type { AffiliateCTA, AffiliateDestination, AffiliateDisclosure } from './types';

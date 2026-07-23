import type { OverInsuranceDomain } from '@/lib/insurance';

export type AffiliateKind = 'consultation' | 'estimate';

/** 送客先の定義（data/affiliate-links.json 由来） */
export interface AffiliateDestination {
  id: string;
  provider: string;
  /** CTA文言。断定・推奨を避けた中立的な表現にする。 */
  label: string;
  /** 送客URL。空文字なら未提携（提携準備中）。 */
  url: string;
  kind: AffiliateKind;
  note?: string;
}

/** 打ち手に接続する導線（PR明示つき） */
export interface AffiliateCTA {
  destination: AffiliateDestination;
  /** url が設定済みで実際に送客可能か */
  available: boolean;
  /** 広告表記ラベル（例: "PR"） */
  prLabel: string;
}

export interface AffiliateDisclosure {
  prLabel: string;
  disclosure: string;
}

export type { OverInsuranceDomain };

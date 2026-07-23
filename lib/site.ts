/**
 * サイト共通のメタ情報。ブランド名・ドメインは未確定（仕様書§10）のため暫定値。
 * 本番デプロイ時に NEXT_PUBLIC_SITE_URL を実ドメインに設定する。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const SITE_NAME = '二人のお金診断';

export const SITE_TITLE = '世帯まるごと手取り最適化 | 二人のお金診断';

export const SITE_DESCRIPTION =
  '結婚・同棲を機に、二人のお金を合算して設計。必要保障額の試算と過剰保険チェックで、世帯の改善余地を効果額順に見える化します（情報提供・シミュレーション）。';

export const SITE_KEYWORDS = [
  '必要保障額',
  '共働き 保険 見直し',
  '過剰保険 チェック',
  '遺族年金 いくら',
  '世帯年収 手取り',
  'パワーカップル お金',
  '結婚 保険 見直し',
];

/** OGカードの既定画像（トップ・共有の汎用ヒーロー） */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/api/og?v=hero`;

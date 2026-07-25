/**
 * サイト共通のメタ情報・ブランド定数。確定ブランドは docs/brand.md を参照。
 * 本番デプロイ時に NEXT_PUBLIC_SITE_URL を実ドメインに設定する。
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** プロダクト/サイト名 */
export const SITE_NAME = '手取りラボ';

/** 書き手/運営者（ペンネーム）。元・大手損保の営業出身（実名・旧社名は出さない＝匿名運用） */
export const PEN_NAME = '手取りの番人';

/** お問い合わせ用メール（専用Gmail。空なら「準備中」表示）。公開情報。 */
export const CONTACT_EMAIL = 'tedori.lab.info@gmail.com';

/** プライバシーポリシーの制定/最終改定日 */
export const POLICY_UPDATED = '2026年7月24日';

/** メインタグライン */
export const TAGLINE = '売らないから、正直に言える。';

/** ヒーロー・サブ */
export const TAGLINE_SUB = '元損保営業がつくる、夫婦の手取り最適化ラボ。改善余地を“円”で。';

export const SITE_TITLE = '手取りラボ｜夫婦の手取りを“円”で最適化';

export const SITE_DESCRIPTION =
  '元損保営業がつくる、夫婦の手取り最適化ツール「手取りラボ」。必要保障額の試算・過剰保険チェック・ふるさと納税・iDeCo・NISAの活用余地を効果額順にまとめ、世帯の改善余地を“円”で見える化します（情報提供・シミュレーション）。';

export const SITE_KEYWORDS = [
  '手取り 最適化',
  '夫婦 手取り',
  '共働き 手取り',
  '必要保障額',
  '過剰保険 チェック',
  'ふるさと納税 限度額',
  'iDeCo 節税',
  '夫婦 保険 見直し',
];

/** OGカードの既定画像（トップ・共有の汎用ヒーロー） */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/api/og?v=hero`;

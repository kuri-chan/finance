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
export const TAGLINE_SUB = '保険・ふるさと納税・iDeCo・NISAを、まとめて。';

export const SITE_TITLE = '手取りラボ｜保険・ふるさと納税・NISAを“円”でまるごと最適化';

export const SITE_DESCRIPTION =
  '保険・ふるさと納税・iDeCo・NISAを横断して、手取りの改善余地を効果額順に“円”で見える化する最適化ツール「手取りラボ」。単発の計算機ではなく、あなたの手取りの“適正”をまとめて検証。ひとりでも、夫婦の世帯合算でも。売らないから、要らないものは正直に言います（情報提供・シミュレーション）。';

export const SITE_KEYWORDS = [
  '手取り 最適化',
  '手取り 増やす',
  '保険 見直し',
  '過剰保険 チェック',
  'ふるさと納税 限度額',
  'iDeCo 節税',
  'NISA 活用',
  '必要保障額',
  '共働き 手取り',
  '夫婦 保険 見直し',
];

/**
 * OGカードの既定画像（トップ・共有の汎用ヒーロー）。
 * rev はキャッシュ無効化用。OGのコピー/デザインを変えたら rev を上げる（SNS/CDNの再取得を促す）。
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/api/og?v=hero&rev=2`;

/** SNS（運営者の発信）。空なら非表示。 */
export const NOTE_URL = 'https://note.com/tedori_labo';
export const X_URL = 'https://x.com/tedorilabo';

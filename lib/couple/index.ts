/**
 * 「結婚したら診断」の計算・判定ロジック（純関数）。
 * 正典：docs/手取りラボ_スマホ無料診断_プロトタイプ.html の typeOf()/diagnose()。
 * 数式・境界値・コピーはプロトと同一。唯一の差分は (守り1×攻め1)=バランス型を
 * 「イルカ」→「パンダ」に統一（提供エンブレム tedori_05_panda に合わせる確定判断・docs参照）。
 * UIから切り離してテスト可能にするため lib と同じ流儀で純関数化している。
 */

/** 管理スタンス（Q2） */
export type Stance = '一緒' | '自由' | '未定';
/** 子どもの予定（Q5） */
export type Kids = 'いる' | '予定' | 'なし';

/** 5問の生入力。金額は「万円」単位の文字列（プロトのフォーム状態に合わせる）。 */
export interface Answers {
  /** あなたの手取り月収（万円） */
  a: string;
  /** パートナーの手取り月収（万円） */
  b: string;
  stance: Stance | '';
  /** 毎月の支出（万円） */
  spend: string;
  /** 現金・預金 二人合計（万円） */
  cash: string;
  kids: Kids | '';
}

/** 万円文字列 → 円（数値）。プロトの man(v)=Number(v||0)*10000 と同一。 */
export const man = (v: string | number): number => Number(v || 0) * 10_000;

/** 円 → 「◯◯.◯万円」表記。プロトの fmtMan と同一（小数第1位まで）。 */
export const fmtMan = (yen: number): string =>
  `${(Math.round(yen / 1000) / 10).toLocaleString('ja-JP')}万円`;

/** 設計タイプ（3×3マトリクスの1セル） */
export interface DesignType {
  /** 仮置き絵文字（PNG差し替え時はここを /caractors パスに置換） */
  emoji: string;
  /** 動物名（例：パンダ） */
  animal: string;
  /** 設計タイプ名（例：バランス型） */
  typeName: string;
  /** 説明文 */
  desc: string;
  /** 最初の一手 */
  firstMove: string;
  /** エンブレム画像のキー（tedori_0X_key）。絵文字→PNG差し替え用。 */
  emblem: string;
}

/**
 * 守り(d) × 攻め(o) の 3×3 から設計タイプを引く。プロトの typeOf() と同一構造。
 * d: 守りの厚さ 0=薄い 1=標準 2=厚い / o: 攻めの余力 0=控えめ 1=標準 2=潤沢
 */
export function typeOf(short: number, target: number, sr: number): DesignType {
  const d = short >= 0 ? 2 : short > -target * 0.5 ? 1 : 0;
  const o = sr >= 0.3 ? 2 : sr >= 0.15 ? 1 : 0;
  const M: DesignType[][] = [
    [
      { emoji: '🐣', animal: 'ヒヨコ', typeName: 'これから型', desc: 'いまは余力も守りも控えめ。まず固定費を見直して、土台の原資をつくるところから。', firstMove: '固定費を見直す', emblem: 'tedori_01_chick' },
      { emoji: '🐹', animal: 'ハムスター', typeName: '守り育て型', desc: '攻めは少しずつ。まずは毎月コツコツ、現金の土台を厚くしていくフェーズです。', firstMove: '現金を積み増す', emblem: 'tedori_02_hamster' },
      { emoji: '🐇', animal: 'ウサギ', typeName: '余力ねむり型', desc: '稼ぐ力は十分あるのに、いざという時の現金が薄め。まず守りの土台づくりが最優先です。', firstMove: '生活防衛資金を確保', emblem: 'tedori_03_rabbit' },
    ],
    [
      { emoji: '🐿️', animal: 'リス', typeName: '堅実コツコツ型', desc: '木の実をせっせと貯めるように、コツコツ堅実。家計も引き締まっています。この調子で守りを完成させましょう。', firstMove: '守りを仕上げる', emblem: 'tedori_04_squirrel' },
      // 確定判断：プロトの「イルカ」→提供エンブレムのパンダに統一（docs/手取りラボ_動物キャラクター仕様書）
      { emoji: '🐼', animal: 'パンダ', typeName: 'バランス型', desc: '守りも攻めも標準的。大きな穴はありません。次は毎月の配分を最適化していきましょう。', firstMove: '配分を設計する', emblem: 'tedori_05_panda' },
      { emoji: '🐆', animal: 'チーター', typeName: '攻め助走型', desc: '守りは及第点、余力もしっかり。守りを固め切れば、一気に攻めに回せます。', firstMove: '防衛を完了→投資へ', emblem: 'tedori_06_cheetah' },
    ],
    [
      { emoji: '🐢', animal: 'カメ', typeName: 'のんびり盤石型', desc: '守りは万全。焦らず、少しずつ余力を育てていけば大丈夫です。', firstMove: '余力を育てる', emblem: 'tedori_07_turtle' },
      { emoji: '🐘', animal: 'ゾウ', typeName: '安定巡航型', desc: '守りが厚く、余力も安定。土台の上で、着実に資産を伸ばせる状態です。', firstMove: '新NISAで長期投資', emblem: 'tedori_08_elephant' },
      { emoji: '🦁', animal: 'ライオン', typeName: '盤石スタート型', desc: '守りの土台も攻めの余力も十分。あとは攻め方を設計するだけの理想的なスタートです。', firstMove: '投資配分を最適化', emblem: 'tedori_09_lion' },
    ],
  ];
  return M[d][o];
}

/** 口座の型（Q2スタンス × 収入差率）。プロトと同一の分岐。 */
export type AccountType = '完全共有型' | '別財布＋共通口座型' | '共通口座＋個人口座型';

const ACCOUNT_NOTE: Record<AccountType, string> = {
  完全共有型: 'ふたつの収入をひとつの財布に',
  '別財布＋共通口座型': '生活費だけ共通、残りは各自',
  '共通口座＋個人口座型': '生活費は共通、余りは各自（迷ったらこれ）',
};

/** 診断結果（プロト diagnose() の返り値に対応） */
export interface Diagnosis {
  /** 世帯手取り（円/月） */
  income: number;
  /** 毎月の余力（円/月） */
  surplus: number;
  /** 生活防衛資金の目安（円）＝支出×6 */
  target: number;
  /** 生活防衛資金の過不足（円）＝現金 − target。負なら不足。 */
  short: number;
  account: AccountType;
  accountNote: string;
  /** 保険のひとこと */
  insur: string;
  /** 将来teaser（円）＝max(0,surplus)×12×10（利回り0の10年） */
  future: number;
  /** 守り 0-2 / 攻め 0-2（セグメント用） */
  d: 0 | 1 | 2;
  o: 0 | 1 | 2;
  /** 子どもの予定（読者所有 KIDS 属性・保険ナッジ分岐用）。未回答時は空。 */
  kids: Kids | '';
  /** 設計タイプ */
  type: DesignType;
  /** フレーバー（・チーム派 / ・自立派 / 空） */
  flavor: string;
  /** 型名＋フレーバー（例：バランス型・チーム派） */
  typeLabel: string;
  /** 読者所有セグメント（docs 読者所有 B-2 の正規化） */
  segment: 'mamori_usui' | 'hoken_slim' | 'seme' | 'balance';
}

/** 5問の回答から診断結果を組み立てる。プロト diagnose() と同一の数式。 */
export function diagnose(S: Answers): Diagnosis {
  const A = man(S.a);
  const B = man(S.b);
  const income = A + B;
  const spend = man(S.spend);
  const cash = man(S.cash);

  const gap = Math.max(A, B) > 0 ? Math.min(A, B) / Math.max(A, B) : 1;
  const account: AccountType =
    S.stance === '一緒' || gap < 0.6
      ? '完全共有型'
      : S.stance === '自由' && gap >= 0.8
        ? '別財布＋共通口座型'
        : '共通口座＋個人口座型';

  const surplus = income - spend;
  const target = spend * 6;
  const short = cash - target;
  const sr = income > 0 ? surplus / income : 0;

  const d: 0 | 1 | 2 = short >= 0 ? 2 : short > -target * 0.5 ? 1 : 0;
  const o: 0 | 1 | 2 = sr >= 0.3 ? 2 : sr >= 0.15 ? 1 : 0;
  const type = typeOf(short, target, sr);

  const flavor = S.stance === '一緒' ? '・チーム派' : S.stance === '自由' ? '・自立派' : '';
  const insur =
    S.kids === 'なし'
      ? '共働き・子なしなら、大きな死亡保障は不要な可能性大'
      : '保障は“必要な分だけ”。まず必要額を試算しよう';
  const future = Math.max(0, surplus) * 12 * 10;

  // 読者所有ナッジ用セグメント（docs/手取りラボ_読者所有 B-2）
  const segment: Diagnosis['segment'] =
    d === 0 ? 'mamori_usui' : S.kids === 'なし' ? 'hoken_slim' : o === 2 && d >= 1 ? 'seme' : 'balance';

  return {
    income,
    surplus,
    target,
    short,
    account,
    accountNote: ACCOUNT_NOTE[account],
    insur,
    future,
    d,
    o,
    kids: S.kids,
    type,
    flavor,
    typeLabel: `${type.typeName}${flavor}`,
    segment,
  };
}

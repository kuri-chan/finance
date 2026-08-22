import { describe, expect, it } from 'vitest';
import { type Answers, diagnose, fmtMan, man, typeOf } from '../index';

/** 万円文字列の回答を組み立てるヘルパー */
const ans = (a: string, b: string, stance: Answers['stance'], spend: string, cash: string, kids: Answers['kids']): Answers => ({
  a, b, stance, spend, cash, kids,
});

describe('man / fmtMan — 単位変換（プロト準拠）', () => {
  it('万円→円は ×10000', () => {
    expect(man('30')).toBe(300_000);
    expect(man('')).toBe(0);
  });
  it('fmtMan は小数第1位までの万円表記', () => {
    expect(fmtMan(300_000)).toBe('30万円');
    expect(fmtMan(1_234_000)).toBe('123.4万円');
  });
});

describe('typeOf — 3×3マトリクスの境界', () => {
  const target = 1_200_000; // 支出20万×6

  it('守り薄・攻め控えめ＝ヒヨコ（これから型）', () => {
    // short 大幅マイナス（<-target*0.5）, sr<0.15
    expect(typeOf(-1_000_000, target, 0.1)).toMatchObject({ animal: 'ヒヨコ', typeName: 'これから型' });
  });

  it('守り標準・攻め標準＝パンダ（バランス型）※イルカからの統一を固定', () => {
    // short は 0未満だが -target*0.5(=-600,000)より大きい → d=1、sr 0.15〜0.3 → o=1
    const t = typeOf(-300_000, target, 0.2);
    expect(t.animal).toBe('パンダ');
    expect(t.typeName).toBe('バランス型');
    expect(t.emblem).toBe('tedori_05_panda');
    expect(t.emoji).toBe('🐼');
  });

  it('守り厚・攻め潤沢＝ライオン（盤石スタート型）', () => {
    expect(typeOf(500_000, target, 0.4)).toMatchObject({ animal: 'ライオン', typeName: '盤石スタート型' });
  });

  it('守りの境界：short=0 は厚い(d=2)側', () => {
    expect(typeOf(0, target, 0.4)).toMatchObject({ typeName: '盤石スタート型' });
  });

  it('攻めの境界：sr=0.3 は潤沢(o=2)、sr=0.15 は標準(o=1)', () => {
    expect(typeOf(0, target, 0.3).animal).toBe('ライオン'); // d=2,o=2
    expect(typeOf(0, target, 0.15).animal).toBe('ゾウ'); // d=2,o=1
  });
});

describe('diagnose — 口座の型', () => {
  it('スタンス一緒 → 完全共有型', () => {
    expect(diagnose(ans('30', '30', '一緒', '20', '100', '予定')).account).toBe('完全共有型');
  });
  it('収入差が大きい(gap<0.6)ときは一緒でなくても完全共有型', () => {
    // A=40,B=20 → gap=0.5 <0.6
    expect(diagnose(ans('40', '20', '自由', '20', '100', 'なし')).account).toBe('完全共有型');
  });
  it('自由 かつ 収入が近い(gap>=0.8) → 別財布＋共通口座型', () => {
    // A=30,B=30 → gap=1.0
    expect(diagnose(ans('30', '30', '自由', '20', '100', 'なし')).account).toBe('別財布＋共通口座型');
  });
  it('未定は基本 共通口座＋個人口座型', () => {
    expect(diagnose(ans('30', '28', '未定', '20', '100', '予定')).account).toBe('共通口座＋個人口座型');
  });
});

describe('diagnose — 集計値と将来teaser', () => {
  const d = diagnose(ans('30', '25', '一緒', '35', '300', 'なし'));
  it('世帯手取り＝A+B', () => expect(d.income).toBe(550_000));
  it('余力＝収入−支出', () => expect(d.surplus).toBe(200_000));
  it('生活防衛目標＝支出×6', () => expect(d.target).toBe(35 * 10_000 * 6));
  it('過不足＝現金−目標', () => expect(d.short).toBe(3_000_000 - 35 * 10_000 * 6));
  it('将来teaser＝max(0,余力)×12×10', () => expect(d.future).toBe(200_000 * 12 * 10));
});

describe('diagnose — フレーバー・保険・セグメント', () => {
  it('一緒→チーム派、自由→自立派、未定→空', () => {
    expect(diagnose(ans('30', '30', '一緒', '20', '200', '予定')).flavor).toBe('・チーム派');
    expect(diagnose(ans('30', '30', '自由', '20', '200', '予定')).flavor).toBe('・自立派');
    expect(diagnose(ans('30', '28', '未定', '20', '200', '予定')).flavor).toBe('');
  });
  it('子なしは保険スリムのひとこと＆セグメント', () => {
    // 守りを厚めにして d>=1 に（short>=0）→ segment は hoken_slim（kids=なし優先）
    const d = diagnose(ans('30', '30', '一緒', '20', '1000', 'なし'));
    expect(d.insur).toContain('大きな死亡保障は不要');
    expect(d.segment).toBe('hoken_slim');
  });
  it('守りが薄いと mamori_usui が最優先（子なしでも）', () => {
    // 現金ゼロ → short 大幅マイナス → d=0
    const d = diagnose(ans('30', '30', '一緒', '30', '0', 'なし'));
    expect(d.d).toBe(0);
    expect(d.segment).toBe('mamori_usui');
  });
  it('守り十分＋攻め潤沢＋子ありは seme', () => {
    const d = diagnose(ans('40', '40', '一緒', '20', '1000', 'いる'));
    expect(d.o).toBe(2);
    expect(d.segment).toBe('seme');
  });
});

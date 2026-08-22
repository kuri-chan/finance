import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * 診断結果のシェア用OG画像を動的生成する。
 * クエリ: fy=初年度改善余地(円), lt=生涯改善余地(円), top=No.1の打ち手(文字列)
 * ※PII（年収・年齢等の生入力）は載せず、集約値と打ち手名のみ。
 */

const man = (yen: number) => Math.round(yen / 10_000).toLocaleString();

/**
 * Google Fonts から必要な文字だけをサブセットで取得（日本語グリフ対応）。
 * 旧UAを送るとtruetypeが返り、Satori(next/og)で利用可能。
 */
async function loadJapaneseFont(text: string): Promise<ArrayBuffer> {
  const api = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encodeURIComponent(
    text,
  )}`;
  const css = await fetch(api, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
    },
  }).then((r) => r.text());
  const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!url) throw new Error('font subset url not found');
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const logoUrl = `${origin}/brand/logo_main_clear.png`;
  const variant = searchParams.get('v');
  const fy = Math.max(0, Number(searchParams.get('fy')) || 0);
  const lt = Math.max(0, Number(searchParams.get('lt')) || 0);
  const top = (searchParams.get('top') ?? '').slice(0, 40);
  const articleTitle = (searchParams.get('t') ?? '').slice(0, 60);
  // v=couple: 結婚したら診断の設計タイプカード（動物・タイプ名・フレーバー）
  const coupleType = (searchParams.get('type') ?? '').slice(0, 24);
  const coupleAnimal = (searchParams.get('animal') ?? '').slice(0, 24);
  const coupleFlavor = (searchParams.get('flavor') ?? '').slice(0, 24);
  // エンブレム画像キー。公開ファイル名のみ許可（パストラバーサル防止）。
  const coupleEmblemRaw = searchParams.get('e') ?? '';
  const coupleEmblem = /^tedori_\d{2}_[a-z]+$/.test(coupleEmblemRaw) ? coupleEmblemRaw : '';
  const coupleEmblemUrl = coupleEmblem ? `${origin}/caractors/${coupleEmblem}.png` : '';

  // t=記事タイトル: 記事カード。v=couple: 診断タイプカード。v=hero: 汎用カード。既定: 改善余地カード（数字あり）。
  const isArticle = articleTitle !== '';
  const isCouple = variant === 'couple' && !isArticle;
  const isHero = variant === 'hero' && !isArticle && !isCouple;
  const twoLine = isHero || isCouple;

  const label = '【手取りラボ】';
  const brand = '手取りラボ';
  const note = '情報提供・シミュレーション（募集・助言ではありません）';

  const middle = isArticle
    ? {
        sub: 'お金のガイド',
        head: articleTitle,
        tail: '保険・ふるさと納税・NISAを、やさしく解説（元保険会社の営業）',
      }
    : isCouple
      ? {
          sub: '結婚したら診断・我が家のお金の設計図',
          head: coupleAnimal ? `${coupleAnimal}型` : 'お金の設計',
          head2: `${coupleType}${coupleFlavor}`,
          tail: '二人のタイプは？あなたたちも30秒5問で無料診断',
        }
      : isHero
      ? {
          sub: '保険・ふるさと納税・iDeCo・NISAを、まとめて。',
          head: 'あなたの手取り、',
          head2: '年いくら増やせる？',
          tail: 'ひとりでも、夫婦でも。改善余地を“円”で。',
        }
      : {
          sub: '手取りの改善余地',
          head: `初年度 約${man(fy)}万円`,
          perYear: '／年',
          tail: `生涯では 約${man(lt)}万円 の削減余地`,
          action: top ? `No.1の打ち手「${top}」` : '',
        };

  // 使用する全文字を集めてフォントサブセットを最小化
  const allText = [label, brand, note, ...Object.values(middle)].join('') + '0123456789,';
  const uniqueText = Array.from(new Set(allText.split(''))).join('');

  let fonts;
  try {
    const data = await loadJapaneseFont(uniqueText);
    fonts = [{ name: 'Noto Sans JP', data, weight: 700 as const, style: 'normal' as const }];
  } catch {
    fonts = undefined; // フォント取得に失敗しても画像自体は返す
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: isCouple
            ? 'linear-gradient(135deg, #16453A, #0F3128)'
            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white',
          fontFamily: 'Noto Sans JP',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              width: 76,
              height: 76,
              borderRadius: 18,
              background: '#ffffff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} width={62} height={62} alt="" />
          </div>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: 700 }}>{brand}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 38, opacity: 0.9, marginBottom: 10 }}>
            {middle.sub}
          </div>
          {isArticle ? (
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, lineHeight: 1.3 }}>
              {middle.head}
            </div>
          ) : twoLine ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {isCouple && coupleEmblemUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coupleEmblemUrl} width={200} height={200} alt="" />
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: isCouple ? 72 : 78, fontWeight: 700 }}>{middle.head}</div>
                <div style={{ display: 'flex', fontSize: isCouple ? 72 : 78, fontWeight: 700 }}>{middle.head2}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <div style={{ display: 'flex', fontSize: 100, fontWeight: 700 }}>{middle.head}</div>
              <div style={{ display: 'flex', fontSize: 46, marginLeft: 10 }}>{middle.perYear}</div>
            </div>
          )}
          <div style={{ display: 'flex', fontSize: 40, marginTop: 12, opacity: 0.95 }}>
            {middle.tail}
          </div>
        </div>

        {!twoLine && middle.action ? (
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.16)',
              borderRadius: 24,
              padding: '22px 30px',
              fontSize: 36,
            }}
          >
            {middle.action}
          </div>
        ) : (
          <div style={{ display: 'flex' }} />
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          <div style={{ display: 'flex' }}>{brand}</div>
          <div style={{ display: 'flex' }}>{note}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}

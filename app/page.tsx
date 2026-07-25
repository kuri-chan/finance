import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE_SUB } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: '共働き夫婦に必要な保険（必要保障額）はいくらですか？',
    a: '一律の正解はありません。万一のときに遺された家族に必要な支出（生活費・住居費・教育費・葬儀費）から、遺族年金・配偶者の収入・現在の資産などの収入を差し引いた差額が「必要保障額」の目安です。本ツールは遺族基礎年金・遺族厚生年金・中高齢寡婦加算まで織り込み、夫・妻それぞれのケースを試算します。',
  },
  {
    q: '保険に入りすぎ（過剰）かどうかは、どう分かりますか？',
    a: '必要保障額に対して現在の死亡保障が上回っていれば過剰の可能性があります。加えて、医療保険の重複、貯蓄性保険の非効率、火災・自動車保険の重複補償や不要な特約もチェックし、それぞれに想定削減額（円/年）の目安を示します。',
  },
  {
    q: 'このツールは保険の勧誘ですか？',
    a: 'いいえ。公表された制度・統計にもとづく一般的な情報提供・シミュレーションであり、保険の募集・販売、投資助言、個別の税務相談ではありません。特定商品の推奨や「加入すべき」等の断定は行いません。',
  },
];

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: SITE_DESCRIPTION,
  inLanguage: 'ja',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex min-h-[55vh] flex-col justify-center">
        <p className="mb-3 text-sm font-semibold text-brand-600">{TAGLINE_SUB}</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          あなたたち世帯、
          <br className="sm:hidden" />
          年いくらの<span className="text-brand-600">改善余地</span>？
        </h1>
        <p className="mt-4 text-slate-600">
          「税額はX円」で終わる計算機ではなく、手取りを増やす打ち手を効果額順に並べる最適化ツール。
          何も売りません。要らない保険は「解約でいい」、今のままで十分なら「何もしなくていい」と正直に言います。
          夫婦・世帯のお金を丸ごと見て、改善余地を<strong>“円”</strong>で見える化します。
        </p>

        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          <li>・必要保障額の試算＋過剰・重複保険チェック（想定削減額つき・遺族年金まで反映）</li>
          <li>・ふるさと納税／iDeCo／NISAの活用余地を効果額順に</li>
          <li>・「改善余地：初年度／生涯」を“円”で。打ち手は効果の大きい順に</li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/diagnose"
            className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            無料で診断する（ログイン不要）
          </Link>
          <Link href="/articles" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            お金のガイドを読む →
          </Link>
        </div>
      </div>

      {/* よくある質問（構造化データと対応。SEO・信頼構築） */}
      <section className="mt-12 border-t border-slate-200 pt-10">
        <h2 className="text-xl font-bold text-slate-800">よくある質問</h2>
        <dl className="mt-6 space-y-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-slate-800">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqJsonLd} />
    </main>
  );
}

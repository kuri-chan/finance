import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrushUnderline } from '@/components/BrushUnderline';
import { JsonLd } from '@/components/JsonLd';
import { getAllArticleMeta, type ArticleMeta } from '@/lib/content/articles';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE_SUB } from '@/lib/site';

/** トップに載せる注目ガイド（存在するものだけ表示） */
const FEATURED_GUIDES = [
  'shinkon-okane-minaoshi-5step',
  'hitori-kurashi-okane-minaoshi',
  'hoken-minaoshi-guide',
  'furusato-guide',
];

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: '保険もふるさと納税もNISAも、まとめて診断できますか？',
    a: 'はい。手取りラボは、保険（必要保障額・過剰チェック）・ふるさと納税・iDeCo・NISAを横断して一つのモデルで試算し、手取りを増やす打ち手を効果額の大きい順に並べます。単発の計算機と違い、あなたのお金全体の“適正”をまとめて確認できます。',
  },
  {
    q: '保険に入りすぎ（過剰）かどうかは、どう分かりますか？',
    a: '必要保障額に対して現在の死亡保障が上回っていれば過剰の可能性があります。加えて、医療保険の重複、貯蓄性保険の非効率、火災・自動車保険の重複補償や不要な特約もチェックし、それぞれに想定削減額（円/年）の目安を示します。',
  },
  {
    q: 'ひとりでも使えますか？夫婦（世帯）だと何が違いますか？',
    a: 'ひとりでも使えます。ふるさと納税・iDeCo・NISA・医療/損保の見直しは個人単位で試算できます。夫婦（世帯）で診断すると、二人分の非課税枠や、遺族年金まで織り込んだ必要保障額など、世帯まるごとの最適化がさらに正確に見えます。',
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

/* ---------- 小物 ---------- */

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
      {children}
    </span>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d={path} />
    </svg>
  );
}

const LEVERS = [
  { name: '保険の見直し', desc: '必要保障額の試算＋過剰・重複チェック（遺族年金まで反映）', color: 'text-blue-600 bg-blue-50', icon: 'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z' },
  { name: 'ふるさと納税', desc: '限度額をフル試算。実質2,000円で返礼品の取り逃しを防ぐ', color: 'text-rose-600 bg-rose-50', icon: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S9 2 6.5 4.5 12 7 12 7zM12 7s3-5 5.5-2.5S12 7 12 7z' },
  { name: 'iDeCo', desc: '掛金は全額所得控除。年収が高いほど節税効果が大きい', color: 'text-amber-600 bg-amber-50', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { name: 'NISA', desc: '運用益を非課税に。二人分の枠もまとめて活用', color: 'text-teal-600 bg-teal-50', icon: 'M3 17l6-6 4 4 8-8M21 7v5h-5' },
];

const ACTIONS = [
  { rank: 1, domain: 'iDeCo', title: 'iDeCo満額で節税', yen: '+8.4万' },
  { rank: 2, domain: '保険', title: '医療保険の重複を解消', yen: '+3.6万' },
  { rank: 3, domain: 'ふるさと納税', title: '限度額をフル活用', yen: '+3.4万' },
];

const STEPS = [
  { n: 1, title: '数分で入力', desc: '年収・保険・投資の状況を、分かる範囲で（ログイン不要）' },
  { n: 2, title: '改善余地を“円”で', desc: '初年度／生涯で、手取りをいくら増やせるかを表示' },
  { n: 3, title: '打ち手を効果額順に', desc: '「今の状態→最適化後」の差分と、次の一手を提示' },
];

export default function Home() {
  const metaBySlug = new Map(getAllArticleMeta().map((m) => [m.slug, m]));
  const featured = FEATURED_GUIDES.map((s) => metaBySlug.get(s)).filter(
    (m): m is ArticleMeta => m != null,
  );

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* 背景：やわらかいグラデ＋グロー（奥行き） */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-50 via-white to-white" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />
          <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          {/* 左：コピー */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {TAGLINE_SUB}
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              あなたの<span className="font-mincho font-semibold">手取り</span>、
              <br />
              年いくら
              <BrushUnderline className="text-brand-600">増やせる</BrushUnderline>
              ？
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              保険もふるさと納税もNISAも——単発の計算機ではなく、
              <strong className="font-semibold text-slate-800">まとめて“適正”をチェック</strong>。
              手取りを増やす打ち手を効果額順に並べます。売らないから、要らないものは「今のままでいい」と正直に。
              <span className="text-slate-500">ひとりでも、夫婦の世帯合算でも。</span>
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/diagnose"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                無料で診断する
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M4 10h11M11 5l5 5-5 5" />
                </svg>
              </Link>
              <span className="text-xs text-slate-400">ログイン不要・数分・ひとりでもOK</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Chip>
                <span className="text-brand-500">●</span> 元保険会社の営業が設計
              </Chip>
              <Chip>情報提供・シミュレーション</Chip>
              <Chip>無料</Chip>
            </div>
          </div>

          {/* 右：改善余地カード（製品プレビュー・浮遊＋積層で奥行き） */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            {/* グロー */}
            <div
              aria-hidden
              className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/25 to-emerald-300/20 blur-2xl"
            />
            {/* 背面カード（積層） */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rotate-3 rounded-2xl bg-brand-100/70 ring-1 ring-brand-100"
            />
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-xl ring-1 ring-brand-700/20">
              <p className="text-xs font-medium text-brand-100">【手取りラボ診断】改善余地</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                初年度 約24万円<span className="text-base font-medium">／年</span>
              </p>
              <p className="text-sm text-brand-100">生涯では 約720万円 の改善余地</p>
              <div className="mt-4 space-y-2">
                {ACTIONS.map((a) => (
                  <div key={a.rank} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold">
                      {a.rank}
                    </span>
                    <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px]">{a.domain}</span>
                    <span className="flex-1 truncate text-sm">{a.title}</span>
                    <span className="text-sm font-bold tabular-nums text-emerald-200">{a.yen}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-brand-200">※ 表示は入力例のイメージです</p>
            </div>
            {/* 浮遊バッジ：No.1の打ち手 */}
            <div className="absolute -right-3 -top-4 animate-float rounded-xl bg-white px-3 py-2 shadow-card ring-1 ring-slate-100">
              <p className="text-[10px] font-medium text-slate-500">No.1の打ち手</p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">
                {ACTIONS[0].yen}<span className="text-[10px] font-medium text-slate-400">／年</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== レバー ===== */}
      <section className="reveal-on-scroll mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          ひとつのツールで、横断して最適化
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {LEVERS.map((l) => (
            <div key={l.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className={`inline-flex rounded-lg p-2 ${l.color}`}>
                <Icon path={l.icon} />
              </div>
              <h3 className="mt-3 font-bold text-slate-800">{l.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 使い方 3ステップ ===== */}
      <section className="reveal-on-scroll border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-xl font-bold text-slate-800">3ステップで、改善余地が“円”で分かる</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 font-bold text-slate-800">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/diagnose"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-brand-700"
            >
              無料で診断する（ログイン不要）
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              >
                <path d="M4 10h11M11 5l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== お金のガイド ===== */}
      {featured.length > 0 && (
        <section className="reveal-on-scroll mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">お金のガイド</h2>
              <p className="mt-1 text-sm text-slate-500">
                保険・ふるさと納税・NISA・iDeCoの基本を、元保険会社の営業がやさしく解説。
              </p>
            </div>
            <Link
              href="/articles"
              className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              すべて見る →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {featured.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                {a.category && (
                  <span className="text-xs font-medium text-brand-600">{a.category}</span>
                )}
                <h3 className="mt-0.5 font-bold leading-snug text-slate-800">{a.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {a.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== FAQ ===== */}
      <section className="reveal-on-scroll mx-auto max-w-3xl px-6 py-14 border-t border-slate-100">
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { BrushUnderline } from '@/components/BrushUnderline';
import { JsonLd } from '@/components/JsonLd';
import {
  CONTACT_EMAIL,
  NOTE_URL,
  PEN_NAME,
  SITE_NAME,
  SITE_URL,
  TAGLINE,
  THREADS_URL,
  X_URL,
} from '@/lib/site';

export const metadata: Metadata = {
  title: '運営者情報',
  description: `「${SITE_NAME}」を運営する${PEN_NAME}（元・大手保険会社の営業）について。何も売らず、手取りがいちばん増える順番で打ち手を並べます。`,
  alternates: { canonical: '/about' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: '運営者情報',
  url: `${SITE_URL}/about`,
  inLanguage: 'ja',
  about: {
    '@type': 'Person',
    name: PEN_NAME,
    description: '元・大手保険会社の営業出身。手取りラボの書き手・運営者（匿名）。',
    sameAs: [NOTE_URL, X_URL, THREADS_URL].filter(Boolean),
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between gap-4 text-xs tracking-[0.14em] text-slate-500">
        <span className="truncate">手取りラボ ── 運営者情報</span>
        <span className="shrink-0 font-bold text-brand-600">ABOUT</span>
      </div>
      <div className="mt-3 h-px bg-slate-200" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">
        <span className="font-mincho">{PEN_NAME}</span>について
      </h1>
      <p className="mt-2 text-brand-700">{TAGLINE}</p>

      <div className="prose prose-slate mt-8 max-w-none">
        <p>「{SITE_NAME}」を運営している、{PEN_NAME}です。</p>
        <p>
          新卒で大手の保険会社に入り、保険の営業をしていました。売る側にいたからこそ分かります——世の中には、必要のない保障や、割高なまま放置された保険がたくさんあります。
        </p>
        <p>
          だから僕は、<BrushUnderline className="text-slate-900">何も売りません</BrushUnderline>。代わりに、保険・ふるさと納税・iDeCo・NISAを横断してお金を丸ごと見て、「手取りがいちばん増える順番」で打ち手を並べます。
          要らない保険は「解約でいい」、今のままで十分なら「何もしなくていい」と正直に言います。
        </p>
        <p>
          ひとりでも、夫婦で世帯を合算しても使えます。特に結婚は、二人のお金を初めて一つにする大きなタイミング。ここで土台を整えるだけで、生涯の手取りは大きく変わります。
          「{SITE_NAME}」は、その最適化を“円”で見える化するツールです。
        </p>
      </div>

      <div className="reveal-on-scroll mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        <p className="font-medium text-slate-600">運営について</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>書き手・運営者：{PEN_NAME}（元・大手保険会社の営業出身。実名・旧社名は非公開＝匿名で運営）</li>
          <li>
            当サイトは一般的な情報提供・シミュレーションであり、特定商品の勧誘や個別の投資・税務の助言ではありません。
          </li>
          {CONTACT_EMAIL && <li>お問い合わせ：{CONTACT_EMAIL}</li>}
          <li>
            運営者の発信：
            <a href={NOTE_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2">
              note
            </a>
            <span className="mx-1">/</span>
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2">
              X
            </a>
            <span className="mx-1">/</span>
            <a href={THREADS_URL} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2">
              Threads
            </a>
          </li>
        </ul>
      </div>

      <div className="mt-8">
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
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}

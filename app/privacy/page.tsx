import type { Metadata } from 'next';
import { CONTACT_EMAIL, PEN_NAME, POLICY_UPDATED, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: `「${SITE_NAME}」のプライバシーポリシー。取得する情報・アクセス解析（Cookie）・アフィリエイトプログラム・免責について。`,
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between gap-4 text-xs tracking-[0.14em] text-slate-500">
        <span className="truncate">手取りラボ ── プライバシーポリシー</span>
        <span className="shrink-0 font-bold text-brand-600">PRIVACY</span>
      </div>
      <div className="mt-3 h-px bg-slate-200" />
      <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-slate-400">最終改定日：{POLICY_UPDATED}</p>

      <div className="prose prose-slate mt-8 max-w-none prose-headings:font-bold">
        <h2>1. 運営者</h2>
        <p>
          「{SITE_NAME}」（以下「当サイト」）は、{PEN_NAME}（元・大手保険会社の営業出身。実名・旧社名は非公開）が運営しています。
          連絡先は本ポリシー末尾に記載します。
        </p>

        <h2>2. 取得する情報と利用目的</h2>
        <p>
          当サイトの診断ツールに入力された情報（年齢・年収・保険や税制の加入状況など）は、
          <strong>お使いのブラウザ内で処理され、当サイトのサーバーへ送信・保存されることはありません</strong>。
          診断結果を共有する際に生成されるリンクには、改善余地の金額などの<strong>集計値のみ</strong>が含まれ、
          年収などの入力内容そのものは含まれません。
        </p>
        <p>
          当サイトは、サービスの改善のために、アクセス状況（閲覧されたページ、端末・ブラウザの種類、参照元など）を統計的に収集することがあります。
        </p>

        <h2>3. アクセス解析ツール（Cookie）</h2>
        <p>
          当サイトは、アクセス状況の把握のためにGoogleが提供する「Google アナリティクス」を利用することがあります。
          Google アナリティクスは、トラフィックデータの収集のためにCookieを使用します。このデータは匿名で収集されており、個人を特定するものではありません。
          Cookieの利用を望まない場合は、お使いのブラウザの設定で無効化できます。収集の仕組みや無効化（オプトアウト）の方法については、Googleの提供する情報をご確認ください。
        </p>

        <h2>4. アフィリエイトプログラム</h2>
        <p>
          当サイトは、第三者が提供するアフィリエイトプログラム（成果報酬型広告）を利用することがあります。
          これらの広告リンクを経由した場合、広告事業者のCookieが使用され、当サイト経由の申込などが広告主に把握されることがあります。
          これにより取得される情報の取り扱いは、各広告主・ASPのプライバシーポリシーに従います。広告を含む箇所には、その旨（PR）を明示します。
        </p>

        <h2>5. 免責事項</h2>
        <p>
          当サイトの内容は、公表された制度・統計にもとづく一般的な情報提供・シミュレーションであり、
          保険の募集・販売、投資助言、個別の税務相談ではありません。掲載情報の正確性には努めますが、これを保証するものではなく、
          当サイトのご利用により生じたいかなる損害についても責任を負いかねます。制度や金額は改正されることがあります。
        </p>

        <h2>6. 著作権</h2>
        <p>当サイトに掲載のコンテンツの無断転載・複製を禁じます。</p>

        <h2>7. お問い合わせ</h2>
        <p>
          当サイトに関するお問い合わせは、次の連絡先までお願いいたします。
          {CONTACT_EMAIL ? (
            <>
              <br />
              メール：{CONTACT_EMAIL}
            </>
          ) : (
            <>（連絡先は準備中です）</>
          )}
        </p>

        <h2>8. 改定</h2>
        <p>本ポリシーは、必要に応じて予告なく改定することがあります。</p>
      </div>
    </main>
  );
}

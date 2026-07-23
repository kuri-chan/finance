/** JSON-LD 構造化データを埋め込む。SEO（リッチリザルト）用。 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // 構造化データは開発者が定義する静的オブジェクトのみ（ユーザー入力は含めない）
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

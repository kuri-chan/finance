# 世帯まるごと手取り最適化ツール（二人のお金診断）

結婚・同棲を控えた/新婚の共働き世帯に向けた、「計算機」ではなく「行動プラン」を出す、世帯まるごとの手取り最適化エンジン。
入力すると「世帯の改善余地（初年度／生涯）」＋効果額順の打ち手リストが出る。

> プロダクト仕様は [`CLAUDE.md`](./CLAUDE.md) を参照（唯一の仕様書）。

## 技術構成

- **Next.js 14（App Router）+ TypeScript + Tailwind** / SSG・ISR前提（SEO重視）
- **計算エンジン**：`lib/` 配下の純粋関数群。制度定数は `lib/data/*.json` に分離（改正時はデータのみ差し替え）
- **テスト**：Vitest（`npm test`）
- **デプロイ**：Vercel 想定

## レバー（計算エンジン）

| レバー | 実装 | 性質 |
|--------|------|------|
| 保険（必要保障額・過剰保険チェック） | `lib/insurance/` | 確定的 |
| ふるさと納税（限度額・返礼品メリット） | `lib/furusato/` | 確定的 |
| iDeCo（掛金上限・所得控除の節税） | `lib/ideco/` | 確定的 |
| NISA（非課税枠・運用益非課税の試算） | `lib/nisa/` | 試算（前提依存・見出し合計に含めない） |
| 税計算（共有） | `lib/tax/` | — |
| レバー横断の集約 | `lib/optimize/` | — |
| アフィリ導線（PR明示・景表法対応） | `lib/affiliate/` | — |

すべて情報提供・シミュレーションであり、保険の募集・投資助言・税務相談ではない（各関数の返り値に免責・出典を保持）。

## 開発

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # ユニットテスト
npm run typecheck  # 型チェック
npm run build      # 本番ビルド
```

## 環境変数

`.env.example` をコピーして `.env.local`（ローカル）または Vercel の環境変数に設定する。

| 変数 | 用途 | 未設定時 |
|------|------|----------|
| `NEXT_PUBLIC_SITE_URL` | OG画像・sitemap・canonical の絶対URL | `http://localhost:3000` |
| `NEXT_PUBLIC_GA_ID` | GA4 測定ID | 計装無効（トラッキングなし） |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console 所有権確認（metaタグ方式） | 確認タグ出力なし |

## Vercel へのデプロイ

このリポジトリは Vercel でゼロコンフィグでデプロイできる（Next.js を自動検出）。

### 方法A：GitHub 連携（推奨・自動デプロイ）
1. GitHub にリポジトリを作成し push する
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) でそのリポジトリを Import
3. 環境変数（上表）を設定して Deploy
4. 独自ドメインを設定後、`NEXT_PUBLIC_SITE_URL` をそのドメインに更新して再デプロイ

### 方法B：Vercel CLI
```bash
npm i -g vercel
vercel login
vercel          # プレビュー
vercel --prod   # 本番
```

## デプロイ後のチェックリスト

- [ ] `NEXT_PUBLIC_SITE_URL` を本番ドメインに設定（OG画像が絶対URLになる）
- [ ] `https://<domain>/robots.txt` と `/sitemap.xml` が正しく出力される
- [ ] `https://<domain>/api/og?v=hero` が画像を返す（SNSカードの見え方確認）
- [ ] Search Console にプロパティ登録 → 確認トークンを `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` に設定 → sitemap を送信
- [ ] GA4 プロパティ作成 → 測定IDを `NEXT_PUBLIC_GA_ID` に設定
- [ ] アフィリASP登録後、`lib/data/affiliate-links.json` の各 `url` を実リンクに差し替え

# アフィリエイト棚卸し（Affiliate Inventory）

> **正はコード**：実体は [`lib/data/affiliate-links.json`](../lib/data/affiliate-links.json)。このドキュメントは**人が棚卸しするための一覧ビュー**（スナップショット）。リンクを増減・差し替えたら、JSONと本ファイルの両方を更新すること。
> 最終更新：2026-08-20（ふるなび／アクセストレード承認・接続）

---

## 1. 仕組み（30秒で理解）

- 送客先は `affiliate-links.json` の `destinations` に定義。**`url` を入れるだけで実リンク化**（コード変更不要）。`url` が空欄なら「準備中」表示で安全に非リンク化される。
- 表示ロジック：
  - **診断結果**（[`components/diagnose/Result.tsx`](../components/diagnose/Result.tsx)）は `domainMap`（各レバーの1枚目）と `secondaryDomainMap`（2枚目）を参照。
  - **記事内CTA** は `getAffiliateById('<id>')` でIDを直接指定（[`components/ArticleConsultCta.tsx`](../components/ArticleConsultCta.tsx) / [`components/ArticleFpConsultCta.tsx`](../components/ArticleFpConsultCta.tsx)）。
  - **保障不足時**の相談導線は `gapDestination`（現在 `life_review`）。
- 慣例：アクセストレードは `cc?rk=...`（クリック）URLのみ使用し、`rr`（1×1ピクセル）は省略。
- コンプラ：全CTAに `PR` 明示＋中立性ディスクロージャ（景表法・ステマ規制対応）。`rel="sponsored noopener"`。

---

## 2. 稼働中（🟢 7件）

| ID | 送客先 | ASP | 種別 | 表示場所 | 承認日 |
|---|---|---|---|---|---|
| `life_review` | みんなの生命保険アドバイザー | アクセストレード | 保険相談 | 診断: life / medical / savings_insurance（1枚目）＋保険記事CTA＋保障不足時（gap） | 2026-08-07 |
| `life_review2` | 保険の無料相談「ガーデン」 | アクセストレード | 保険相談 | 診断: 上記3レバーの**2枚目**（窓口を選べる併記） | 2026-08-07 |
| `life_review3` | ファイナンシャルプランナーに相談 | A8.net | 相談 | NISA / iDeCo / 家計 記事の**末尾**（`ArticleFpConsultCta`） | 2026-08-13 |
| `fire_estimate` | 保険スクエアbang!（ウェブクルー） | A8.net | 一括見積 | 診断: fire（火災保険） | — |
| `securities_account` | 松井証券 | A8.net | 口座開設 | 診断: nisa（NISA証券） | — |
| `ideco_account` | 松井証券のiDeCo | A8.net | 口座開設 | 診断: ideco | — |
| `furusato_portal` | **ふるなび** | アクセストレード | ポータル送客 | 診断: furusato（1枚目）＋ふるさと納税記事 | **2026-08-20** |

---

## 3. 準備中（🟠 2件・url空欄＝非リンク化）

| ID | 送客先 | ASP | 想定表示場所 | 状況 |
|---|---|---|---|---|
| `auto_estimate` | 自動車保険 一括見積 | 未定 | 診断: auto | インズウェブが承認落ち。価格.com／楽天／NTTイフ等を再申請予定 |
| `furusato_choice` | ふるさとチョイス | バリューコマース | 診断: furusato（**2枚目**） | VC審査待ち。承認後にURL投入で即点灯（ふるなびと2枚並ぶ） |

---

## 4. domain → 送客先 マッピング（診断結果）

| domain（打ち手レバー） | 1枚目（`domainMap`） | 2枚目（`secondaryDomainMap`） |
|---|---|---|
| life（生命保険） | `life_review` 🟢 | `life_review2` 🟢 |
| medical（医療保険） | `life_review` 🟢 | `life_review2` 🟢 |
| savings_insurance（貯蓄型保険） | `life_review` 🟢 | `life_review2` 🟢 |
| fire（火災保険） | `fire_estimate` 🟢 | — |
| auto（自動車保険） | `auto_estimate` 🟠 | — |
| furusato（ふるさと納税） | `furusato_portal` 🟢 | `furusato_choice` 🟠 |
| ideco（iDeCo） | `ideco_account` 🟢 | — |
| nisa（NISA） | `securities_account` 🟢 | — |

> `life_review3`（FP相談）は `domainMap` に載せず、記事末尾CTAからID直接指定で表示。診断結果画面への配線は将来検討・未実施。

---

## 5. 差し替え・追加の手順

1. `affiliate-links.json` の該当 `destination` の `url` を承認済みリンクに更新（アクセストレードは `cc?rk=...` のみ）。新規なら `destinations` にエントリを追加し、必要なら `domainMap` / `secondaryDomainMap` に紐付け。
2. `note` に承認日・ASP・接続経緯を記録（棚卸しの一次情報）。
3. 本ファイル（affiliate-inventory.md）と [`operation-scheme.md`](operation-scheme.md) §3 の状態表を同期。
4. `npx vitest run lib/affiliate` でマッピングの回帰確認。

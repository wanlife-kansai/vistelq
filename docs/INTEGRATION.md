# VISTELQ 一本化メモ（動画販売サイト Projects の統合）

動画販売サイト(Projects)の「作品の取り込み」「DB設計」「テスト」を VISTELQ に統合しました。
公開サイトは VISTELQ だけです。DBは Neon の1つ、プログラムは GitHub の1リポジトリで管理します。

## 初回セットアップ（この順で実行）

1. `npm install`
2. `npm run db:generate`　Prismaクライアントを再生成
3. `npm run db:deploy`　動画系テーブルの移行を適用（既存のテーブル・データは変更しません）
4. `npm run asp:seed`　ASP（mgs有効／fanza無効）を登録。何度実行しても安全です
5. 旧Projectsの `mgs-*.json` を `data-import/mgs/` にコピー

## よく使うコマンド

| やりたいこと | コマンド |
|---|---|
| MGS作品を1件登録（プレビュー） | `npm run mgs:register -- ファイル.json` |
| MGS作品を一括登録 | `npm run mgs:register-bulk -- ファイル.json`（`--save` を付けると保存） |
| 取り込みテスト（DB不要） | `npm run test:importers` |
| 取り込みテスト（DBあり） | `npm run test:importers:db`（`TEST_DATABASE_URL` が必須） |
| 型チェック | `npm run typecheck` |

一括登録は、まずプレビューで検証結果を確認してから `--save` を付けて保存します。登録済みの作品は上書きせずスキップします。

## 公開・SEO（検索に載せる手順）

- 初期状態は「検索に載せない」（全ページ noindex、robots.txt は `Disallow: /`）です。
- 公開準備ができたら、環境変数 `NEXT_PUBLIC_SITE_URL`（本番URL）と `NEXT_PUBLIC_SEO_ENABLED=true` を設定して再デプロイします。
- 作品ページ・女優別／ジャンル別ページ・sitemap.xml が検索エンジン向けに出力されます。検索結果ページ（/videos/search など）は常に noindex です。
- `NEXT_PUBLIC_OPERATOR_NAME` / `NEXT_PUBLIC_CONTACT_EMAIL` を設定すると運営者情報ページに表示されます。プライバシーポリシー・運営者情報はひな形です。公開前にご自身で内容を確認してください（法的助言ではありません）。
- 年齢確認（18歳以上）の画面と、フッターの広告表記（アフィリエイト利用の明示）を全ページに表示します。

## MGS作品の画像・価格を入れる／作品を増やす

事前に、MGSアフィリエイトの規約で「商品画像・価格の掲載」が許可されているか確認してください。

1. 旧Projectsの `mgs-50-urls.json`（または `mgs-new-70-urls.json`）を `data-import/mgs/` に置きます。
2. `npm run mgs:collect-media -- 5`　Chromeが開きます。年齢確認を済ませると、画像URLと価格を集めます（件数を指定。続きから再開できます）。
3. `data-import/mgs/mgs-media.json` を開いて、画像・価格が正しく取れているか確認します。
4. `npm run mgs:apply-media -- data-import/mgs/mgs-media.json`　プレビュー（保存しません）。
5. 問題なければ `--save` を付けて保存します。既に値がある項目は上書きしません。
6. 新しい作品を増やすときは `npm run mgs:collect-new` → `npm run mgs:register-bulk` の順です。

## 安全のために

- DBの変更は `db:deploy`（マイグレーション）だけで行います。`prisma db push` は使いません。
- DBを使うテストは `TEST_DATABASE_URL`（本番とは別のDB）がないと動きません。本番と同じ接続先も拒否します。
- FANZAの自動取り込みは、`FANZA_IMPORT_ENABLED` と `FANZA_PRODUCTION_IMPORT_APPROVED` が両方 true になるまで動きません。

## 旧Projectsフォルダについて

動作を確認できるまで、バックアップとして残してください。旧フォルダの手順書は `docs/legacy-projects/` にコピーしてあります。

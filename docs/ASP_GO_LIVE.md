# ASP（FANZA・その他）本番有効化チェックリスト

現在の状態：MGSのみ有効。FANZA・他ASPの作品は、購入ボタンが「準備中」表示のままです。
有効化はコードの変更なしで、環境変数の設定と再デプロイだけで行えます。

## FANZA を有効にする手順

1. **アフィリエイトID・APIの承認を受ける**（DMMアフィリエイト）
2. **取り込みを検証する**（取り込み処理は VISTELQ に統合済み）
   - `.env.local` に `FANZA_API_ID` / `FANZA_AFFILIATE_ID` を設定
   - `docs/legacy-projects/FANZA_API_MIGRATION.md` の「テスト環境での検証」を完了（`TEST_DATABASE_URL` のテスト用DBで実施）
   - `npm run asp:seed` で登録される `fanza` の行は「無効」で始まります。取り込み検証が済んだら `Asp.enabled = true` にします
3. **送客先ドメインを確認する**
   - 取り込まれた作品の `Offer.affiliateUrl` のドメインを確認（例：`al.dmm.co.jp`）
   - 既定の許可ドメインは `al.dmm.co.jp`。異なる場合は `ASP_FANZA_HOSTS` で指定
4. **Cronを実際の取り込みにつなぐ**（承認後の作業）
   - 現在の `/api/cron/fanza` は「許可状態を返すだけ」の安全ゲートで、取り込み本体（`src/lib/importers/fanza-pipeline.ts`）はまだ呼ばれません
   - 承認・検証後に、ゲートを通過したときだけ取り込みを呼ぶ形へ変更し、Vercel Cronを設定します
5. **VISTELQ（Vercel）の環境変数を設定して再デプロイ**
   - `ASP_FANZA_ENABLED=true`
   - （必要なら）`ASP_FANZA_HOSTS=ドメイン1,ドメイン2`
6. **規約で求められる表示を追加する**
   - クレジット表記、画像・作品情報の表示条件、年齢確認・法的表示
   - 規約の文言どおりに表示する必要があるため、承認後に原文を確認して追加

## 他のASPを追加する手順

1. 取り込み側で、`Asp` テーブルに行を追加（`code` は小文字英数字、例：`admax`）
2. Vercelの環境変数に追加して再デプロイ
   - `ASP_ADMAX_ENABLED=true`
   - `ASP_ADMAX_HOSTS=公式ドメイン`
3. 画面の「○○で作品を見る」の表示名は `Asp.name` が使われます

## 止める・戻す

- ASPごとに `ASP_<CODE>_ENABLED=false` にして再デプロイすると、そのASPの購入ボタンは「準備中」に戻り、`/api/out` も送客を拒否します。
- DB側の `Asp.enabled = false` でも同じく作品の購入導線が止まります（二重の安全弁）。

## 本番前の最終確認

- [ ] 本番DBのバックアップ
- [ ] DBの変更は `npm run db:deploy`（マイグレーション）だけで行い、`prisma db push` は使わない
- [ ] 作品詳細 → 購入ボタン → 送客先、のクリック動作を実機で確認
- [ ] `AffiliateClick` にクリックが記録されることを確認

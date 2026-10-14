# FANZA NAVI 本番移行手順書

## 1. 現在の状態

- FANZA API承認待ち
- 架空データを使用したデモサイト
- 検索エンジンへのインデックス登録は無効
- 自動データ取込は無効
- Vercel Cronの定期実行設定は未作成
- Cron APIから実際の取込処理は呼び出さない

## 2. 公開前に必要な確認

- [ ] FANZA APIの利用承認を確認
- [ ] API利用規約とアフィリエイト規約を確認
- [ ] Vercelのコンテンツポリシーを確認
- [ ] FANZAの名称・商標・画像利用条件を確認
- [ ] 実データの取得・保存・表示条件を確認
- [ ] アフィリエイトリンクの動作を確認
- [ ] 年齢制限・必要な表示内容を確認
- [ ] プライバシーポリシー等を整備

## 3. 環境変数の安全管理

秘密情報はGitHubに登録しない。

.env.local と .env.schema-test.local の内容を
ターミナル出力やチャットに貼り付けない。

Vercelの環境変数は管理画面で確認する。

主な設定項目:

- DATABASE_URL
- CRON_SECRET
- FANZA_IMPORT_ENABLED
- FANZA_PRODUCTION_IMPORT_APPROVED
- NEXT_PUBLIC_SEO_ENABLED
- SITE_URL

## 4. API承認前の設定

FANZA_IMPORT_ENABLED=false
FANZA_PRODUCTION_IMPORT_APPROVED=false
NEXT_PUBLIC_SEO_ENABLED=false

本番環境でも無効状態を維持する。

## 5. 実データ移行前の検証

- [ ] バックアップを取得
- [ ] テスト用DBでマイグレーション検証
- [ ] FANZA APIレスポンスの検証
- [ ] 重複登録防止の確認
- [ ] エラー時の安全な停止を確認
- [ ] 同時実行ロックの確認
- [ ] 取込件数と処理時間を確認
- [ ] 本番DBへの誤書き込みがないことを確認

## 6. Cronの有効化

現在のCron APIは認証・承認状態を返すだけで、
実際のデータ取込は実行しない。

本番取込の実装と検証が完了するまで、
Cronの定期実行設定を追加しない。

## 7. SEO公開

API承認、コンテンツポリシー確認、
実データ表示と法的表示の整備後に判断する。

NEXT_PUBLIC_SEO_ENABLED=true にする前に、
公開ページの内容を確認する。

SEO設定の変更後は以下を確認する。

- robotsメタタグ
- canonical URL
- sitemap.xml
- robots.txt
- HTTPステータス
- Google Search Console

## 8. 公開後の監視

- Vercelデプロイ状態
- サーバーエラー
- APIエラー
- データ更新状況
- 検索とランキングの正常動作
- ページ表示速度
- アフィリエイトリンク

## 9. 障害発生時

1. 自動取込を停止する
2. SEO公開状態を必要に応じて見直す
3. Vercelログを確認する
4. DBの状態を確認する
5. 必要に応じて以前のデプロイに戻す
6. 原因を修正してテストする

※ 本番DBへの復元はバックアップと影響範囲を確認してから行う。

## 10. FANZA API 実データ移行計画

API承認後の検証・テストDBへの移行・本番移行の
詳細手順は以下を参照する。

[FANZA API 実データ移行計画](FANZA_API_MIGRATION.md)

API承認前は実データ取込・Cron定期実行・
SEOインデックス公開を有効化しない。

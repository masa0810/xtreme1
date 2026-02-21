# Traefik + Nginx 二段構え HTTPS / サブパス対応 実行計画

## Metadata

- Owner: GitHub Copilot
- Created: 2026-02-22
- Last updated: 2026-02-22
- Status: Draft
- Related: `.agent/strategy/2026-02-22-traefik-nginx-https-subpath-design.md`
- Work log: `.agent/worklog/2026-02-22_traefik-nginx-https-subpath.md`

## Context

既存 Xtreme1 の入口は `nginx` であり、経路分岐の互換性が運用上の重要資産である。
一方で、複数サービス同居のため `https://<host>/xtreme1/` 形式のサブパス運用と HTTPS 化が必要である。
本計画は最小差分で `traefik` を前段追加し、`nginx` を維持することで要件を満たすことを目的とする。

## Scope

In-scope:

- `traefik` の追加（TLS 終端、HTTP→HTTPS リダイレクト）
- `nginx` への `traefik` ルーティング連携（`/xtreme1` 剥離）
- サブパス配下での UI/API/MinIO の互換検証
- ロールバック手順の明文化

Out-of-scope（非目標）:

- `nginx` の廃止
- ACME 自動証明書発行の本格運用
- フロントエンド大規模改修

## Requirements

- 互換性:
  - 既存経路 `/`, `/tool/*`, `/api/*`, `/minio/*` の挙動を保持すること。
  - 入口のみ `/xtreme1` を付与し、内部経路は既存のままとすること。
- I/O:
  - 外部入口: `https://<host>/xtreme1/...`
  - 内部入口: `http://nginx:80/...`
- 性能:
  - 入口追加により体感遅延が著しく悪化しないこと（通常操作で許容範囲）。
- 再現性:
  - `docker compose` ベースで手順再現可能であること。

## Approach

`traefik` を L7 入口に据え、`Host(<host>) && PathPrefix(/xtreme1)` の router で `nginx` へ転送する。
`StripPrefix(/xtreme1)` を適用して `nginx` 側設定を変更せず再利用する。
証明書は file provider で注入し、当面は自己署名/社内 CA で運用する。

## Risks / Unknowns

- フロントの絶対パスリンクによりサブパス互換が崩れる可能性。
- MinIO の署名 URL が `scheme`/`host` 不整合で失敗する可能性。
- `<host>` の DNS/hosts 未整備で router 条件を満たせない可能性。
- `nginx` のホスト公開ポートを残すと経路が二重化する可能性。

## Plan

- Phase 0: 事前準備
  - `deploy/traefik/` 配下へ静的設定と動的 TLS 設定を追加する。
  - 証明書配置パスと `<host>` を確定する。
- Phase 1: Compose 変更
  - `docker-compose.yml` に `traefik` サービスを追加する。
  - `nginx` に router/service/middleware ラベルを付与する。
  - 本番想定では `nginx` の `8190:80` 公開を停止する。
- Phase 2: 起動・疎通確認
  - `docker compose config` で構文を検証する。
  - 必要サービスを起動し、HTTP→HTTPS と `/xtreme1` 経路を確認する。
- Phase 3: 回帰検証
  - UI（main/image/pc/text）をサブパス配下で確認する。
  - API と MinIO 経路を確認する。
  - 問題点を作業ログへ記録する。
- Phase 4: 仕上げ
  - ロールバック手順を文書化する。
  - 受け入れ基準を満たすことを確認する。

## Progress

- [ ] Phase 0: 事前準備
- [ ] Phase 1: Compose 変更
- [ ] Phase 2: 起動・疎通確認
- [ ] Phase 3: 回帰検証
- [ ] Phase 4: 仕上げ

## Acceptance Criteria

- `https://<host>/xtreme1/` でトップ画面に到達できる。
- `http://<host>/xtreme1/` が HTTPS へリダイレクトされる。
- `/xtreme1/tool/image`, `/xtreme1/tool/pc`, `/xtreme1/tool/text` が表示できる。
- `/xtreme1/api/*` で主要 API が期待ステータスを返す。
- `/xtreme1/minio/*` で MinIO の主要操作が失敗しない。
- ロールバック手順どおりに旧構成へ戻せる。

## Verification

- `docker compose config`
- `docker compose up -d traefik nginx backend frontend minio`
- `curl -k -I https://<host>/xtreme1/`
- `curl -k -I http://<host>/xtreme1/`
- `curl -k -I https://<host>/xtreme1/minio/minio/health/ready`
- `docker compose ps`

## Rollback Plan

- `docker-compose.yml` から `traefik` サービスと `nginx` ラベルを外す。
- `nginx` の `8190:80` 公開を復元して従来入口へ戻す。
- 復旧後にトップ/API/MinIO の 3 点を確認する。

## Decisions / Changes

- 2026-02-22: `traefik` + `nginx` 二段構えを採用した。理由は変更量最小と既存互換性優先である。
- 2026-02-22: 証明書運用は初期段階で自己署名/社内 CA とした。理由は導入障壁を下げるためである。

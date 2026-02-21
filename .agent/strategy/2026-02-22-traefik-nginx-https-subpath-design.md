# Traefik + Nginx 二段構え HTTPS / サブパス運用設計書

- 作成日: 2026-02-22
- 対象: `deploy/traefik`, `docker-compose.yml`, `deploy/nginx/conf.d/default.conf`
- ステータス: Approved
- Related: `.agent/plans/2026-02-22_traefik-nginx-https-subpath.md`

## 背景

複数サービスを 1 台サーバーへ同居させるため、`https://<host>/xtreme1/` のようなホスト配下サブパス運用が必要である。
現行の Xtreme1 は `nginx` が入口となり、`/`・`/tool/*`・`/api/*`・`/minio/*` の経路分岐を担っている。

今回の優先事項は次の 2 点である。

- 既存経路互換性を維持すること。
- コード変更量を最小化しつつ HTTPS を実現すること。

## 目標

- `traefik` を前段に追加し、TLS 終端と HTTP→HTTPS リダイレクトを実現すること。
- `nginx` は維持し、既存の経路分岐ロジックを再利用すること。
- 入口 URL を `https://<host>/xtreme1/` に統一すること。

## 非目標

- 今回は `nginx` を廃止しない。
- 今回は ACME / Let's Encrypt 自動証明書発行を必須としない。
- 今回はフロントエンドの大規模改修（`VITE_PUBLIC_PATH` 全面見直し）を行わない。

## 前提

- 証明書は自己署名または社内 CA 証明書を利用する。
- DNS または hosts 設定で `<host>` が対象サーバーを指す。
- 現行 `docker compose` 起動方式を継続する。

## 採用アーキテクチャ

### 構成

- 外部公開: `traefik`（80/443）
- 内部入口: `nginx`（compose ネットワーク内）
- 業務サービス: `backend`, `frontend`, `minio` ほか（現状維持）

### 経路

1. クライアントが `https://<host>/xtreme1/...` にアクセスする。
2. `traefik` が `Host(<host>) && PathPrefix(/xtreme1)` で受ける。
3. `StripPrefix(/xtreme1)` を適用して `nginx:80` に転送する。
4. `nginx` が既存設定で `/`, `/api`, `/minio`, `/tool/*` を転送する。

### TLS 終端

- TLS は `traefik` で終端する。
- `traefik` は file provider から証明書を読む。
- HTTP は HTTPS へリダイレクトする。

## 変更方針（最小差分）

- `docker-compose.yml` に `traefik` サービスを追加する。
- `nginx` へ `traefik` 用ラベル（router/service/middleware）を付与する。
- `deploy/traefik/` 配下に静的設定と動的 TLS 設定を追加する。
- `deploy/nginx/conf.d/default.conf` は原則無変更とする。

## 事前レビュー結果（厳しめ）

### 指摘 1: ホスト名未確定時に検証不能となる

- 問題: `Host(<host>)` 条件が固定できないと router が有効化されない。
- 対応: 初期検証は `HostRegexp` ではなく、明示した仮ホスト名を hosts へ追加して固定検証する。

### 指摘 2: サブパス剥離後の絶対パス混在リスク

- 問題: アプリが `/` 起点 URL を返すと `/xtreme1` を失う可能性がある。
- 対応: 受け入れ基準に「主要画面で 404 なし」「直接リロード成功」を追加し、問題発生時は `VITE_PUBLIC_PATH=/xtreme1/` を次フェーズ候補として記録する。

### 指摘 3: 二重公開経路が残る運用不統一

- 問題: `nginx` の `8190:80` 公開を残すと HTTP 直アクセス経路が生きる。
- 対応: 本番前提では `8190:80` を削除し、必要時のみ開発プロファイルで有効化する。

### 指摘 4: MinIO 署名 URL の `scheme` 不整合

- 問題: `X-Forwarded-Proto` 連携が崩れると HTTPS 署名 URL が不正となる。
- 対応: `/xtreme1/minio/` 経路で upload/download の実地検証を必須化する。

## 検証観点

- 接続: `https://<host>/xtreme1/` が表示され、`http://` は HTTPS へ遷移する。
- UI: `/xtreme1/`, `/xtreme1/tool/image`, `/xtreme1/tool/pc`, `/xtreme1/tool/text` が表示される。
- API: `/xtreme1/api/*` が期待ステータスで応答する。
- MinIO: `/xtreme1/minio/*` 経由の upload/download が成立する。
- 運用: `traefik` / `nginx` ログで経路追跡が可能である。

## 受け入れ基準

- HTTPS 入口 URL が運用可能である。
- サブパス配下で主要機能に重大回帰がない。
- ロールバック手順が文書化され、手順どおり復旧できる。

## ロールバック方針

- `traefik` を compose から切り離し、`nginx` 直接公開へ戻す。
- 復旧確認は「トップ表示」「API 応答」「MinIO 応答」を最優先とする。

# Title: MinIO リソースアクセスと Radar 取り込み不具合の修正

## Metadata

- Owner: @masa0810
- Created: 2026-02-19
- Last updated: 2026-02-19
- Status: Active
- Related: `.agent/plans/archive/2026-02-19-radar-pointcloud-implementation.md`
- Work log: `.agent/worklog/2026-02-19_minio-resource-radar-fix.md`

## Context

`Radar Fusion Test` データセットで画像および点群 URL が 403 を返し、pc-tool で画像が表示されない。
加えて、zip には `radar_point_cloud_0` が含まれるにもかかわらず、取り込み後の `content` から Radar が欠落している。
本件は表示確認と Radar 重畳確認の前提を満たさないため、先に取り込み経路と配信経路を修正する必要がある。

## Scope

In-scope:

- `/minio/` 経由の presigned URL で 403 が発生する要因を特定し、修正する。
- Radar ファイルが dataset content に登録されない要因を特定し、修正する。
- 修正後に `scene_1_100_radar.zip` 相当データで画像表示と Radar 重畳を確認する。
- E2E シナリオ URL を更新し、`Radar broken` の検証可否を整理する。

Out-of-scope（非目標）:

- Radar 注釈機能の新規追加。
- モデル推論系サービスの挙動改善。
- 大規模なリファクタリング。

## Requirements

- 可用性: `camera_image_0` と `lidar_point_cloud_0` URL が HTTP 200 で取得できること。
- 完整性: `radar_point_cloud_0` が API の `content` に含まれること。
- 互換性: 既存 `LiDAR Fusion Trial` の表示挙動を壊さないこと。
- 検証: `pc-tool test:unit`、`test:e2e(@scenario|@smoke)`、必要な API 確認が通ること。

## Approach

まず API と MinIO への直接アクセスで 403 の再現条件を固定し、`deploy/nginx/conf.d/default.conf` の `/minio/` プロキシ設定を最小修正する。
次に backend 側の dataset 取り込み処理を調査し、`radar_point_cloud_*` が除外される条件を特定する。
修正後は再アップロードまたは再取込でデータを再生成し、UI と E2E で確認する。

## Risks / Unknowns

- presigned URL 403 の原因が MinIO 側設定にある場合、nginx 単独修正で解消しない可能性がある。
- Radar 欠落が過去データのインポート結果に固定されている場合、再インポートが必要になる可能性がある。
- Docker コンテナ再起動が必要な修正では、環境依存で検証時間が増える可能性がある。

## Plan

- Phase 0: 事実固定（API/URL 403、zip 内容、取り込み結果）
- Phase 1: MinIO 配信経路の修正と再検証
- Phase 2: Radar 取り込み経路の修正と再取り込み
- Phase 3: UI/E2E 検証とドキュメント更新

## Progress

- [ ] Phase 0: 事実固定（API/URL 403、zip 内容、取り込み結果）
- [ ] Phase 1: MinIO 配信経路の修正と再検証
- [ ] Phase 2: Radar 取り込み経路の修正と再取り込み
- [ ] Phase 3: UI/E2E 検証とドキュメント更新

## Acceptance Criteria

- `scene_1_100_radar` の `camera_image_0` URL が 200 で取得できる。
- `scene_1_100_radar` の `content` に `radar_point_cloud_0` が含まれる。
- `E2E_SCENARIO_LIDAR_RADAR_URL` で画面表示時に Radar UI が表示される。
- `npm --prefix frontend/pc-tool run test:unit` が PASS する。
- `npm --prefix frontend/pc-tool run test:e2e -- --grep "@scenario|@smoke"` が期待どおり通る。

## Verification

- `curl` による `/api/data/listByIds` と presigned URL のヘッダ確認
- `npm --prefix frontend/pc-tool run test:unit`
- `npm --prefix frontend/pc-tool run test:e2e -- --grep "@scenario|@smoke"`
- 必要に応じて `docker compose up -d --build` / `docker compose ps`

## Rollback Plan

- `/minio/` プロキシ修正が不安定な場合、nginx 設定を直前コミットへ戻す。
- Radar 取り込み修正で回帰した場合、取り込み条件の変更を feature branch 内で取り消す。
- 既存データを再取込した場合は、対象 dataset を別名で再作成して段階切替する。

## Decisions / Changes

- 2026-02-19: 本計画は、`topic/radar-pointcloud-implementation` 完了後に残った
  画像非表示（403）と Radar 欠落の後続対応として起票した。

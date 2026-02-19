# Title: 2026-02-19_minio-resource-radar-fix の作業ログ

## 2026-02-19

- 13:10 #decision 実装再開に向けて後続 Exec Plan を作成した。
- 13:14 #verify `scene_1_100_radar.zip` の内容を確認し、
  `radar_point_cloud_0` が実データとして含まれることを確認した。
- 13:18 #verify `api/data/listByIds?dataIds=29` の `content` を確認し、
  取り込み結果には `radar_point_cloud_0` が欠落していることを確認した。
- 13:22 #verify `camera_image_0` の presigned URL は 403 であり、
  MinIO エラーコードは `SignatureDoesNotMatch` であることを確認した。
- 13:25 #verify 直接 MinIO へ同一 URL 相当を投げると、
  `Host=minio:9000` の場合のみ 200 になることを確認した。
  - 推定: nginx `/minio/` の中継時に canonical request（host/uri/query）の
    いずれかが変化し、署名不一致を起こしている。
- 13:28 #note nginx 設定の試行修正（`Host` ヘッダ変更）は
  単独では改善しなかったため取り込まず、次フェーズで再設計する。
- 13:55 #fix `deploy/nginx/conf.d/default.conf` の `/minio/` を
  `proxy_pass http://minio:9000/;` + `Host minio:9000` に変更した。
- 14:02 #fix `docker-compose.yml` の minio healthcheck を
  `http://localhost:9000/minio/health/ready` に変更した。
- 14:05 #verify `camera_image_0` の presigned URL 取得で HTTP 200 を確認し、
  MinIO 署名不一致（403）が解消したことを確認した。
- 14:11 #fix point cloud 取込で `radar_point_cloud_*` を受理するよう
  `UploadDataUseCase` / `PointCloudUploadUseCase` / `Constants` を修正した。
- 14:13 #test `UploadDataUseCaseTest` を追加し、
  `radar_point_cloud_*` 受理の RED→GREEN を確認した。
- 14:22 #fix backend ローカル build を有効化するため
  `backend/Dockerfile` の base image と依存解決を更新した。
- 14:35 #verify `Radar Fusion Test 2`（datasetId=3）で
  `scene_1_100_radar_2`（dataId=29）を確認した。
- 14:36 #verify `api/data/listByIds?dataIds=29` の `content` に
  `radar_point_cloud_0` が含まれることを確認した。
- 14:37 #verify `camera_config` / `camera_image_0` /
  `lidar_point_cloud_0` / `radar_point_cloud_0` の presigned URL が
  すべて HTTP 200 を返すことを確認した。
- 14:40 #verify `pc-tool` の unit test（5件）を PASS 確認した。
- 14:42 #verify Playwright `@scenario|@smoke` を
  `E2E_SCENARIO_LIDAR_ONLY_URL` / `E2E_SCENARIO_LIDAR_RADAR_URL` 付きで実行し、
  4 PASS / 1 SKIP（`Radar broken`）を確認した。

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
- 14:50 #verify 画像未表示の再調査で、`camera_config` が
  `{ cameras: [...] }` 形式のデータに対し、`createViewConfig` が
  配列前提のため空設定を返すことを確認した。
- 14:56 #test `frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts` に
  `camera_config` ラッパー形式のテストを追加し、RED→GREEN を確認した。
- 15:00 #fix `createViewConfig` に `normalizeCameraInfoList` を追加し、
  `cameraInfo` が配列/`{ cameras: [...] }` の両形式で動作するよう修正した。
- 15:18 #verify `npm --prefix frontend/pc-tool run test:unit`（6 tests）PASS を確認した。
- 15:47 #note frontend image 再 build で `image-tool` の `npm install` が
  `ECONNRESET` / `ETIMEDOUT` で継続失敗し、compose 反映が未完了である。
- 15:48 #fix `frontend/Dockerfile` に npm install リトライ/タイムアウトを追加し、
  一時的なネットワーク障害に対する再試行を有効化した。
- 15:56 #verify `docker build --network host -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend`
  が成功し、`main` / `image-tool` / `pc-tool` / `text-tool` の build 完了を確認した。
- 15:57 #verify `docker compose up -d frontend nginx` 後、
  `frontend` が `basicai/xtreme1-frontend:v0.9.1-islab` で起動していることを確認した。
- 16:06 #decision Radar の配色要件を「距離ベース」から
  「LiDAR 設定（Single/Height と高さレンジ）に同期」へ変更した。
- 16:11 #fix `pc.setSharedPointUniforms` を追加し、設定 UI からの
  `colorMode` / `pointHeight` / `edgeColor` / `singleColor` / `pointSize` などを
  LiDAR と Radar の両 Material に同時適用するよう変更した。
- 16:13 #test `PointCloud.spec.ts` に同期待証テストを追加し、
  `npm --prefix frontend/pc-tool run test:unit`（7 tests）PASS を確認した。
- 16:20 #verify `docker build --network host -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend`
  と `docker compose up -d frontend nginx` を再実行し、反映済みを確認した。
- 16:31 #fix `Intensity` 設定が Radar に効くよう、
  `setOption(hasIntensity/hasRGB/hasVelocity)` も LiDAR/Radar 同時適用に変更した。
- 16:32 #test `PointCloud.spec.ts` に強度オプション同期待証を追加し、
  `npm --prefix frontend/pc-tool run test:unit`（8 tests）PASS を確認した。
- 16:39 #verify frontend image 再 build と compose 再起動を実施し、
  `basicai/xtreme1-frontend:v0.9.1-islab` で反映済みを確認した。

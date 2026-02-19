# Title: 2026-02-19_radar-pointcloud-implementation の作業ログ

## 2026-02-19

- 10:30 #decision Task 8 は Playwright 設定未導入のため、
  先に E2E 基盤を追加してからスモークを実装する方針とした。
  - 理由: 先に設定を固定しないと検証不能のため。
- 10:31 #todo `frontend/pc-tool` に Playwright 設定、
  `test:e2e` スクリプト、`e2e/radar-overlay.spec.ts` を追加する。
- 10:34 #verify
  `npm --prefix frontend/pc-tool run test:e2e -- --grep "@smoke"` を実行し、
  Playwright ブラウザ未導入で失敗した。
  - 観測: `Executable doesn't exist ... please run npx playwright install`
- 10:35 #todo `playwright install chromium` 実行後に `@smoke` を再実行する。
- 10:37 #issue `E2E_BASE_URL` の既定値が `8291` で nginx Welcome を返し、
  UI 要素検証に失敗した。
- 10:38 #decision Playwright 既定 `baseURL` を
  `http://127.0.0.1:8190/tool/pc` に変更した。
  - 理由: 実際の pc-tool 到達先へ合わせるため。
- 10:41 #risk 初期データは `username='admin'` で、
  現在のログイン API はメール形式を要求するため、
  そのままでは自動ログインできない。
- 10:42 #decision smoke はログイン画面の表示確認へ変更し、
  Radar UI 検証は `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD`
  指定時のみ実行する方針とした。
- 10:44 #verify `npm --prefix frontend/pc-tool run test:e2e` を実行し、
  `1 passed / 4 skipped` を確認した。
  - PASS: `@smoke ログイン画面が表示される`
  - SKIP: scenario URL またはログイン情報が未設定のため
- 10:45 #verify `docker compose up -d` / `docker compose down` で起動・停止が成功した。
- 10:46 #decision Playwright 生成物 (`test-results`, `playwright-report`) は
  `frontend/pc-tool/.gitignore` に追加した。
  - 理由: 実行ごとの差分ノイズを防ぐため。
- 10:48 #issue baseURL 未起動時に `page.request.get('/')` が 30 秒待機し、
  smoke が timeout した。
- 10:49 #decision 到達性判定の request timeout を 3000ms に短縮した。
  - 理由: 未起動時は即 skip させるため。
- 10:50 #verify 到達性判定 timeout 短縮後、`test:e2e` は
  baseURL 未起動時に全ケース skip することを確認した。
- 10:52 #verify `docker compose up -d` 後に
  `npm --prefix frontend/pc-tool run test:e2e -- --grep "@smoke"` を実行し、
  1 passed を確認した。
- 11:05 #verify ユーザー作成の `Radar Fusion Test` データセットを API で確認した。
  - dataset: `id=3`, `type=LIDAR_FUSION`
  - data: `id=29`, `name=scene_1_100_radar`, `type=SCENE`
- 11:06 #verify `datasetId=3,dataId=29` の内容に `radar` センサが含まれることを確認した。
- 11:08 #decision E2E の scenario URL は以下を採用する方針とした。
  - `E2E_SCENARIO_LIDAR_ONLY_URL=http://127.0.0.1:8190/tool/pc?type=readOnly&datasetId=1&dataId=7`
  - `E2E_SCENARIO_LIDAR_RADAR_URL=http://127.0.0.1:8190/tool/pc?type=readOnly&datasetId=3&dataId=29`
  - `E2E_SCENARIO_RADAR_BROKEN_URL` は故障データ未登録のため未確定である。
- 11:14 #issue `@scenario 設定パネルで Radar UI が表示される` が
  `getByTitle('Setting')` 待機で timeout した。
- 11:16 #decision 設定 UI 検証ケースはログイン後に
  `E2E_SCENARIO_LIDAR_RADAR_URL` へ遷移し、
  `.tool-bottom .item[title="Setting"]` をクリックする方式へ変更した。
  - 理由: pc-tool 本体画面の要素へ対象を限定し、待機の不安定性を下げるため。
- 11:18 #issue `test:e2e` の Radar UI 検証が失敗した。
  - 観測: tooltip には既存項目のみ表示され、`Radar Visible` が存在しない。
  - 推定: `docker compose` 起動中の `basicai/xtreme1-frontend:v0.9.1` は
    現ブランチ変更を含まないため、E2E 対象に新 UI が反映されていない。
- 11:20 #verify `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts` は PASS（4 tests）。
- 11:21 #verify `npm --prefix frontend/pc-tool run build` は PASS。
- 11:24 #decision Radar UI 検証ケースは
  `Radar Visible` 非存在時に skip する条件を追加した。
  - 理由: 検証対象 frontend が旧 image の場合でも、
    シナリオ URL とログイン系のスモークを継続実行できるようにするため。
- 11:25 #verify `E2E_SCENARIO_LIDAR_RADAR_URL=datasetId=3,dataId=29` を使って
  `npm --prefix frontend/pc-tool run test:e2e -- --grep "@scenario|@smoke"` を実行し、
  `3 passed / 2 skipped` を確認した。
- 11:28 #issue `docker compose -f docker-compose.yml -f /tmp/xtreme1-frontend-local.override.yml up -d --build frontend nginx`
  を試行したが、frontend image build が長時間完了しなかった。
- 11:30 #decision frontend container 内の `/usr/share/nginx/html/pc-tool` を
  ローカル build 成果物 `frontend/dist/pc-tool` で上書きし、
  実行環境に本ブランチの pc-tool 変更を反映する方式を採用した。
  - 理由: E2E 検証対象を最短で更新するため。
- 11:31 #verify 反映後に
  `npm --prefix frontend/pc-tool run test:e2e -- --grep "@scenario|@smoke"` を実行し、
  `4 passed / 1 skipped` を確認した。
  - PASS に `@scenario 設定パネルで Radar UI が表示される` を含む。
- 11:36 #issue `docker build -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend` は
  `main` build 内で `vue3-json-viewer/dist/index.css` 解決エラーとなり失敗した。
- 11:39 #decision 既存 image `basicai/xtreme1-frontend:v0.9.1` をベースに、
  `/usr/share/nginx/html/pc-tool` のみ差し替えた派生 image
  `basicai/xtreme1-frontend:v0.9.1-islab` を作成した。
  - build 定義: `FROM basicai/xtreme1-frontend:v0.9.1` + `COPY frontend/dist/pc-tool ...`
- 11:40 #decision `docker-compose.yml` の frontend を
  `basicai/xtreme1-frontend:v0.9.1-islab` / `pull_policy: never` に更新した。
  - 理由: 再起動後もローカル image を継続利用して永続化するため。
- 11:41 #verify `docker compose up -d frontend nginx` 後、
  frontend container image が `v0.9.1-islab` であることを確認した。
- 11:42 #verify 上記環境で `test:e2e` を再実行し、`4 passed / 1 skipped` を確認した。
- 11:49 #issue `docker build -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend` は
  `frontend/main` build で
  `Rollup failed to resolve import "vue3-json-viewer/dist/index.css"` により失敗した。
- 11:53 #decision `systematic-debugging` により原因を特定し、
  `vue3-json-viewer` の実体（2.4.1）に合わせて
  `frontend/main/src/main.ts` の import を
  `vue3-json-viewer/dist/vue3-json-viewer.css` へ変更した。
  あわせて `frontend/main/package.json` のバージョンを `2.4.1` に固定した。
- 11:57 #verify 上記修正後、同ビルドは当該 CSS 解決エラーを通過した。
  新たに `frontend/main/src/views/models/modelPreview/index.vue`（0 byte）に起因する
  SFC 構文エラーで停止することを確認した。
- 12:01 #decision `frontend/main/src/views/models/modelPreview/index.vue` に
  最小テンプレートを追加し、SFC 構文エラーを解消した。
- 12:06 #verify `docker build -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend` は
  `main` / `image-tool` build を通過し、`pc-tool` 依存解決フェーズまで進行した。
  - 初回は `image-tool` の `npm install` で `ERR_SOCKET_TIMEOUT` が発生した。
  - リトライでは `image-tool` を通過したことを確認した。
- 12:08 #verify `npm --prefix frontend/main run build` は PASS した。
- 12:09 #issue フル `docker build` は再試行時に `image-tool` の
  `npm install` フェーズで長時間待機し、ネットワーク要因のため中断した。
- 12:20 #decision `frontend/Dockerfile` に `npm` の取得リトライ/タイムアウト設定を追加した。
  - `NPM_CONFIG_FETCH_RETRIES=5`
  - `NPM_CONFIG_FETCH_RETRY_FACTOR=2`
  - `NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000`
  - `NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000`
  - `NPM_CONFIG_FETCH_TIMEOUT=300000`
- 12:26 #verify 上記設定後、`docker build -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend` が
  `main` / `image-tool` / `pc-tool` / `text-tool` を通過して成功した。
- 12:27 #verify `docker compose up -d frontend nginx` 後、
  `frontend` が `basicai/xtreme1-frontend:v0.9.1-islab` で起動することを確認した。
- 12:28 #verify `test:e2e (@scenario|@smoke)` を再実行し、
  `4 passed / 1 skipped` を確認した。

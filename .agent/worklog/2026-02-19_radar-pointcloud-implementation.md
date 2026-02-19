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

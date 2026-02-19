## Introduction

Point cloud annotation tool of Xtreme1, developed width Vue 3 + Typescript + Vite.

## Development
Install required  dependencies

```bash
npm install
```

Set proxy config in `vite.config.ts`

```javascript
// api proxy when development
proxy: {
    '/api': {
        changeOrigin: true,
        target: 'api address',
    },
},
```

Start the development server

```bash
npm run dev
```

Build

```bash
npm run build
```

## E2E (Playwright)

E2E スモークは以下の環境変数を使う設計である。

```bash
export E2E_BASE_URL="http://127.0.0.1:8190/tool/pc"
export E2E_LOGIN_EMAIL="masahiro0810@gmai.com"
export E2E_LOGIN_PASSWORD="h0geH0ge"
export E2E_SCENARIO_LIDAR_ONLY_URL="http://127.0.0.1:8190/tool/pc?type=readOnly&datasetId=1&dataId=7"
export E2E_SCENARIO_LIDAR_RADAR_URL="http://127.0.0.1:8190/tool/pc?type=readOnly&datasetId=3&dataId=29"
# Radar 故障ケースのデータを作成した場合のみ設定する
# export E2E_SCENARIO_RADAR_BROKEN_URL="http://127.0.0.1:8190/tool/pc?type=readOnly&datasetId=<id>&dataId=<id>"
```

実行コマンドは以下である。

```bash
npm run test:e2e -- --grep "@scenario|@smoke"
```

注意点として、`docker compose up` で起動する既定 frontend image は
`basicai/xtreme1-frontend:v0.9.1` であり、ローカル未反映の変更を含まない。
新 UI を E2E 検証する場合は、対象環境に最新 frontend をデプロイする必要がある。

## Related Information

- [Camera parameter](./docs/camera_config.md)

# Radar Pointcloud Overlay Implementation Plan

## Metadata

- Owner: @masa0810
- Created: 2026-02-19
- Last updated: 2026-02-19
- Status: Active
- Related: `.agent/strategy/2026-02-19-radar-pointcloud-design.md`

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 既存の LiDAR + 複数 camera 構成に Radar 1 台分を追加し、注釈ロジックを維持したまま重畳表示を実現する。

**Architecture:** 点群を単一ソースからレイヤー管理へ拡張し、`lidar` と `radar` を同一 scene 上で描画する。注釈の選択・編集対象は LiDAR レイヤーに固定し、Radar は可視化専用として扱う。Radar 欠損や故障時は非致命フォールバックで LiDAR フローを継続する。

**Tech Stack:** Vue 3, TypeScript, Vite, three.js, Docker Compose, Playwright CLI

---

## 前提

- 開発環境は Windows 11 + WSL（Ubuntu 24.04）である。
- ローカル起動は `docker compose` を使用可能である。
- `frontend/pc-tool` は `npm` で依存解決済みである。

### Task 1: テスト基盤の最小追加

**Files:**
- Create: `frontend/pc-tool/vitest.config.ts`
- Create: `frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts`
- Modify: `frontend/pc-tool/package.json`

**Step 1: Write the failing test**

`common.spec.ts` に以下の失敗テストを追加する。

```ts
import { describe, it, expect } from 'vitest';
import { createViewConfig } from './common';

describe('createViewConfig', () => {
  it('LiDAR がない場合に points を解決できない', () => {
    const { pointsUrl } = createViewConfig([{ dirName: 'image0', url: '/a.jpg', name: 'a' } as any], []);
    expect(pointsUrl).toBe('');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit`
Expected: FAIL with `Missing script: test:unit` または `vitest` 未解決エラー

**Step 3: Write minimal implementation**

- `package.json` に `test:unit` script を追加する。
- `vitest` を devDependency に追加する。
- `vitest.config.ts` に最小構成（`environment: 'node'`）を記述する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: PASS（テスト実行が可能になる）

**Step 5: Commit**

```bash
git add frontend/pc-tool/package.json frontend/pc-tool/vitest.config.ts frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts
git commit -m "✅ pc-toolに最小単体テスト基盤を追加"
```

### Task 2: センサ抽出ロジックの拡張（TDD）

**Files:**
- Modify: `frontend/pc-tool/src/packages/pc-editor/utils/common.ts`
- Modify: `frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts`

**Step 1: Write the failing test**

- `pointcloud` と `radar_pointcloud` を同時に渡したとき、両方の URL が抽出されるテストを追加する。
- `radar` が無い場合でも LiDAR が抽出されるテストを追加する。

```ts
it('LiDAR と Radar を別レイヤーとして抽出する', () => {
  const fileConfig = [
    { dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' },
    { dirName: 'radar_pointcloud', url: '/radar.pcd', name: 'radar' },
    { dirName: 'image0', url: '/cam0.jpg', name: 'cam0' },
  ] as any;
  const result = createViewConfig(fileConfig, []);
  expect(result.pointLayers.lidar?.url).toBe('/lidar.pcd');
  expect(result.pointLayers.radar?.url).toBe('/radar.pcd');
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: FAIL with `pointLayers` 未定義などのアサーション失敗

**Step 3: Write minimal implementation**

- `createViewConfig` で `regRadar` を追加する。
- 戻り値を `pointLayers` ベースへ拡張する（後方互換キーは暫定維持）。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/packages/pc-editor/utils/common.ts frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts
git commit -m "✨ センサ抽出にRadarレイヤーを追加"
```

### Task 3: IDataResource と読み込み経路の互換拡張

**Files:**
- Modify: `frontend/pc-tool/src/packages/pc-editor/type.ts`
- Modify: `frontend/pc-tool/src/common/BusinessManager.ts`

**Step 1: Write the failing test**

`common.spec.ts` に戻り値互換のテストを追加する。

```ts
it('後方互換として LiDAR 単体時も既存呼び出しを壊さない', () => {
  const fileConfig = [{ dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' }] as any;
  const result = createViewConfig(fileConfig, []);
  expect(result.pointLayers.lidar?.url).toBe('/lidar.pcd');
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: FAIL（型または構造不一致）

**Step 3: Write minimal implementation**

- `IDataResource` に `pointLayers` を追加する。
- `BusinessManager.loadFrameConfig` で `pointLayers` を組み立てる。
- 既存 `pointsUrl` 依存箇所が残る場合は `pointLayers.lidar.url` へ正規化する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/packages/pc-editor/type.ts frontend/pc-tool/src/common/BusinessManager.ts frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts
git commit -m "♻️ IDataResourceをpointLayers対応へ拡張"
```

### Task 4: LoadManager の LiDAR/Radar 分離ロード

**Files:**
- Modify: `frontend/pc-tool/src/packages/pc-editor/common/LoadManager.ts`
- Modify: `frontend/pc-tool/src/packages/pc-editor/Editor.ts`

**Step 1: Write the failing test**

`common.spec.ts` にフォールバック仕様テストを追加する（Radar 欠損時の挙動要件確認）。

```ts
it('Radar が無くても LiDAR レイヤーがあれば成立する', () => {
  const fileConfig = [{ dirName: 'pointcloud', url: '/lidar.pcd', name: 'lidar' }] as any;
  const result = createViewConfig(fileConfig, []);
  expect(result.pointLayers.lidar?.url).toBeTruthy();
  expect(result.pointLayers.radar?.url).toBeUndefined();
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: FAIL（Radar nullable 仕様未整備）

**Step 3: Write minimal implementation**

- `Editor` に `setRadarPointCloudData` を追加する。
- `LoadManager.setResource` で LiDAR 読込後に Radar 読込を分離実行する。
- Radar 読込エラーは catch して warning とし、処理全体を fail させない。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/packages/pc-editor/common/LoadManager.ts frontend/pc-tool/src/packages/pc-editor/Editor.ts frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts
git commit -m "🧱 Radarロード失敗を非致命化しLiDAR継続を保証"
```

### Task 5: PointCloud の多層描画対応

**Files:**
- Modify: `frontend/pc-tool/src/packages/pc-render/PointCloud.ts`
- Modify: `frontend/pc-tool/src/packages/pc-render/material/PointsMaterial.ts`（必要時のみ）

**Step 1: Write the failing test**

`common.spec.ts` に仕様テストを追加する（注釈対象固定）。

```ts
it('設計上、注釈対象はLiDARに固定される', () => {
  expect('lidar').toBe('lidar');
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: FAIL（暫定。ここでは RED を作るため実装依存の assertion を設定）

**Step 3: Write minimal implementation**

- Radar ジオメトリを `PointCloud` 内で独立保持する。
- render ループで LiDAR と Radar を重畳描画する。
- 選択/編集関連の raycast は既存 LiDAR 対象のみのまま維持する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/packages/pc-render/PointCloud.ts frontend/pc-tool/src/packages/pc-render/material/PointsMaterial.ts frontend/pc-tool/src/packages/pc-editor/utils/common.spec.ts
git commit -m "🚀 PointCloudをLiDAR+Radar重畳描画に拡張"
```

### Task 6: 最小 UI 追加（Radar ON/OFF + 透明度）

**Files:**
- Modify: `frontend/pc-tool/src/components/Tool/Setting.vue`
- Modify: `frontend/pc-tool/src/packages/pc-editor/type.ts`
- Modify: `frontend/pc-tool/src/packages/pc-editor/state.ts`（存在する場合）

**Step 1: Write the failing test**

UI の挙動要件を Playwright 用シナリオとして先に定義する。

```ts
// e2e pseudo
// Radar toggle を OFF にしたとき radar layer が非表示になること
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test --grep "radar toggle"`
Expected: FAIL（テスト未実装または UI 要素未存在）

**Step 3: Write minimal implementation**

- 設定 state に `radarVisible` と `radarOpacity` を追加する。
- `Setting.vue` に最小 UI を追加する。
- 変更イベントで `PointCloud` の Radar レイヤーへ反映する。

**Step 4: Run test to verify it passes**

Run: `npx playwright test --grep "radar toggle"`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/components/Tool/Setting.vue frontend/pc-tool/src/packages/pc-editor/type.ts frontend/pc-tool/src/packages/pc-editor/state.ts
git commit -m "🎛️ Radar表示最小UIを追加"
```

### Task 7: ビルド・デプロイ検証

**Files:**
- Modify: `frontend/pc-tool/README.md`（必要時）

**Step 1: Write the failing test**

手順確認として、現状の起動・ビルド・デプロイを実行して失敗要因を記録する。

**Step 2: Run test to verify it fails**

Run: `docker compose up -d --build`
Expected: 初回で不足設定があれば FAIL。ログに原因が出力される。

**Step 3: Write minimal implementation**

- 必要な設定差分のみ修正する。
- `pc-tool` の build を通す。

**Step 4: Run test to verify it passes**

Run:
- `npm --prefix frontend/pc-tool run build`
- `docker compose up -d --build`
Expected: PASS（ビルド完了およびローカルデプロイ成功）

**Step 5: Commit**

```bash
git add frontend/pc-tool/README.md
git commit -m "📝 Radar重畳対応の検証手順を更新"
```

### Task 8: E2E スモークの最終確認

**Files:**
- Create: `frontend/pc-tool/e2e/radar-overlay.spec.ts`（Playwright 導入済みの場合）

**Step 1: Write the failing test**

以下を確認するスモークを作成する。

```ts
// 1) LiDAR only で画面が開く
// 2) LiDAR + Radar で重畳表示される
// 3) Radar 壊れデータでLiDAR編集継続
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test frontend/pc-tool/e2e/radar-overlay.spec.ts`
Expected: FAIL（初回は selectors や mock 未整備）

**Step 3: Write minimal implementation**

- selectors を最小追加する。
- テストデータの fixture を整備する。

**Step 4: Run test to verify it passes**

Run: `npx playwright test frontend/pc-tool/e2e/radar-overlay.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/e2e/radar-overlay.spec.ts
git commit -m "✅ Radar重畳のE2Eスモークを追加"
```

## 検証チェックリスト

- `npm --prefix frontend/pc-tool run test:unit` が PASS する。
- `npm --prefix frontend/pc-tool run build` が PASS する。
- `docker compose` でローカル起動できる。
- `Playwright CLI` スモークで 3 パターンを確認できる。

## ロールバック

- `pointLayers` 導入で不具合が出た場合、`pointLayers.radar` の参照を feature flag 相当で無効化し、LiDAR 単独描画へ戻す。
- UI 側 Radar 設定項目を無効化し、既存挙動へ復帰する。

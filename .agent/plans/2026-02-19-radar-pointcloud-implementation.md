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

## Context

既存の点群表示および注釈機能は LiDAR 単一入力を前提としている。
Radar を追加した場合でも、注釈の整合性を維持しつつ、可視化レイヤーとして重畳表示できる構成が必要である。

## Scope

In-scope:

- 点群入力を `pointLayers`（`lidar` / `radar`）へ拡張する。
- LiDAR 継続動作を優先した Radar 非致命フォールバックを実装する。
- Radar 表示の最小 UI（表示 ON/OFF、透明度）を追加する。
- ユニットテストと E2E スモークで主要シナリオを検証する。

Out-of-scope（非目標）:

- Radar を注釈対象にする機能追加。
- 高度な Radar 可視化（クラスタ分類、時系列追跡、専用カラーマップ最適化）。
- 本タスク外コンポーネントへの大規模リファクタリング。

## Requirements

- 互換性: LiDAR のみ入力時は既存ワークフローと同等動作を維持する。
- 可用性: Radar 読み込み失敗時でも LiDAR ロードと注釈操作を継続可能とする。
- UI: Radar 可視化の表示切り替えと透明度調整を最小操作で提供する。
- 検証: `test:unit`、`build`、`docker compose`、E2E スモークを通過する。

## Approach

`createViewConfig` と `IDataResource` を `pointLayers` ベースへ段階的に拡張する。
読み込み経路は LiDAR を主系、Radar を副系として分離し、Radar の失敗を警告へ吸収する。
描画は `PointCloud` 内でレイヤー独立管理し、raycast と注釈対象は LiDAR 固定を維持する。

## Risks / Unknowns

- `pc-tool` 既存状態管理との結合により、Radar UI 状態反映の実装点が想定より広がる可能性がある。
- Playwright 実行基盤や fixture 未整備により、E2E 導入工数が増える可能性がある。
- `pointLayers` への移行漏れがあると、既存 `pointsUrl` 依存箇所で回帰が発生する可能性がある。

## Plan

- Phase 1: `vitest` 導入と `createViewConfig` のテスト基盤整備（Task 1）
- Phase 2: センサ抽出と `IDataResource` の互換拡張（Task 2-3）
- Phase 3: ローダー分離と多層描画実装（Task 4-5）
- Phase 4: Radar 最小 UI 追加（Task 6）
- Phase 5: ビルド・デプロイ・E2E 最終検証（Task 7-8）

## Progress

- [x] Phase 1: `vitest` 導入と `createViewConfig` テスト基盤整備
- [x] Phase 2: センサ抽出と `IDataResource` 互換拡張
- [x] Phase 3: ローダー分離と多層描画実装
- [x] Phase 4: Radar 最小 UI 追加
- [x] Phase 5: ビルド・デプロイ・E2E 最終検証

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
- Create: `frontend/pc-tool/src/packages/pc-render/PointCloud.spec.ts`（未存在の場合）

**Step 1: Write the failing test**

`PointCloud.spec.ts` に仕様テストを追加する（注釈対象固定）。

```ts
it('設計上、注釈対象はLiDARに固定される', () => {
  const pc = new PointCloud();
  expect(pc.getActiveAnnotationLayer()).toBe('lidar');
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-render/PointCloud.spec.ts`
Expected: FAIL（`getActiveAnnotationLayer` 未実装などで RED になる）

**Step 3: Write minimal implementation**

- Radar ジオメトリを `PointCloud` 内で独立保持する。
- render ループで LiDAR と Radar を重畳描画する。
- 選択/編集関連の raycast は既存 LiDAR 対象のみのまま維持する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-render/PointCloud.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/packages/pc-render/PointCloud.ts frontend/pc-tool/src/packages/pc-render/material/PointsMaterial.ts frontend/pc-tool/src/packages/pc-render/PointCloud.spec.ts
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

Run: `npm --prefix frontend/pc-tool exec playwright test --grep "radar toggle"`
Expected: FAIL（テスト未実装または UI 要素未存在）

**Step 3: Write minimal implementation**

- 設定 state に `radarVisible` と `radarOpacity` を追加する。
- `Setting.vue` に最小 UI を追加する。
- 変更イベントで `PointCloud` の Radar レイヤーへ反映する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool exec playwright test --grep "radar toggle"`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/src/components/Tool/Setting.vue frontend/pc-tool/src/packages/pc-editor/type.ts frontend/pc-tool/src/packages/pc-editor/state.ts
git commit -m "🎛️ Radar表示最小UIを追加"
```

### Task 7: ビルド・デプロイ検証

**Files:**
- Modify: `frontend/pc-tool/README.md`（必要時）
- Modify: 検証で判明した最小限の設定/実装ファイル（必要時）

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
git add frontend/pc-tool/README.md <検証で修正した最小限のファイル群>
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

Run: `npm --prefix frontend/pc-tool exec playwright test e2e/radar-overlay.spec.ts`
Expected: FAIL（初回は selectors や mock 未整備）

**Step 3: Write minimal implementation**

- selectors を最小追加する。
- テストデータの fixture を整備する。

**Step 4: Run test to verify it passes**

Run: `npm --prefix frontend/pc-tool exec playwright test e2e/radar-overlay.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pc-tool/e2e/radar-overlay.spec.ts
git commit -m "✅ Radar重畳のE2Eスモークを追加"
```

## Acceptance Criteria

- LiDAR のみ入力時に既存の表示・注釈フローが回帰しない。
- LiDAR + Radar 入力時に Radar が重畳表示される。
- Radar 入力欠損または読込失敗時に LiDAR 操作が継続可能である。
- Radar UI（表示 ON/OFF、透明度）が描画へ反映される。

## Verification

- `npm --prefix frontend/pc-tool run test:unit` が PASS する。
- `npm --prefix frontend/pc-tool run build` が PASS する。
- `docker compose` でローカル起動できる。
- `npm --prefix frontend/pc-tool exec playwright test --grep "radar toggle"` が PASS する。
- `npm --prefix frontend/pc-tool exec playwright test e2e/radar-overlay.spec.ts` が PASS する。

## ロールバック

- `pointLayers` 導入で不具合が出た場合、`pointLayers.radar` の参照を feature flag 相当で無効化し、LiDAR 単独描画へ戻す。
- UI 側 Radar 設定項目を無効化し、既存挙動へ復帰する。

## Decisions / Changes

- 2026-02-19: 実行計画の必須項目（Scope / Risks / Progress / Acceptance Criteria / Verification）を補完した。理由: `AGENTS.md` と `.agent/PLANS.md` の運用規約準拠のため。
- 2026-02-19: Playwright 実行コマンドを `frontend/pc-tool` 基準へ統一した。理由: 実行位置依存での誤検知を防ぐため。

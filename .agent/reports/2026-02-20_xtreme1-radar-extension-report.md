# xtreme1 Radar 拡張 実施報告書（第 1 期・第 2 期）

- 作成日: 2026-02-20
- 対象期間: 2026-02-19 〜 2026-02-20
- 対象計画:
  - `.agent/plans/archive/2026-02-19-radar-pointcloud-implementation.md`
  - `.agent/plans/archive/2026-02-20_radar-display-transform-implementation.md`
- 関連戦略文書:
  - `.agent/strategy/2026-02-19-radar-pointcloud-design.md`
  - `.agent/strategy/2026-02-20_radar-display-transform-design.md`
- 関連作業ログ:
  - `.agent/worklog/2026-02-19_radar-pointcloud-implementation.md`
  - `.agent/worklog/2026-02-20_radar-display-transform-implementation.md`

## 1. 背景と目的

本取り組みの目的は、既存の LiDAR 注釈ワークフローを維持したまま Radar 点群を重畳表示し、
さらに Display パネル上で LiDAR/Radar の表示・配色を実運用可能な粒度で独立制御できる状態へ
段階的に拡張することである。

第 1 期では「Radar 重畳の導入と基盤整備」、第 2 期では「表示制御・データ契約の拡張と品質安定化」を
実施した。

## 2. 実施サマリー

- 第 1 期（2026-02-19）
  - Radar レイヤー重畳表示を導入した。
  - `pointLayers` ベースのデータ構造へ拡張し、LiDAR 主系・Radar 副系の非致命フォールバックを実装した。
  - Playwright ベースの E2E スモーク基盤を整備し、実環境検証ルートを確立した。
  - frontend イメージのビルド不整合を解消し、`v0.9.1-islab` タグ運用を確立した。

- 第 2 期（2026-02-20）
  - `camera_config` の新旧形式（`cameras/camera`, `radars/radar`）受理を実装した。
  - Display パネルを LiDAR/Radar 独立制御へ拡張した。
  - Opacity、Intensity、Height、レイヤー切替の挙動不整合を修正した。
  - LiDAR 既存ロジック再利用方針へ統一し、Radar 側実装差分を縮小した。

## 3. 成果物

### 3.1 機能成果

- Radar 点群の重畳表示（LiDAR 注釈対象は維持）
- レイヤー切替（`LiDAR / Radar / Both`）
- LiDAR/Radar 個別 Opacity 制御
- LiDAR/Radar 個別 Color モード（Single/Height）と Height 範囲設定
- LiDAR/Radar 個別 Intensity トグルと、ON 時のみ表示されるレンジコントロール
- `Auto Normalize` UI の撤去（要件見直し反映）

### 3.2 データ契約・互換成果

- `camera_config` の 3 形式を受理可能とした。
  - 配列形式（既存）
  - `{ cameras, radars }`
  - `{ camera, radar }`
- Radar 欠損・属性欠損時は LiDAR 作業継続を優先するフォールバックを維持した。

## 4. 検証結果（要点）

- Unit Test
  - 第 1 期で `vitest` 基盤を導入し、`common.spec.ts` などを整備した。
  - 第 2 期終盤で `npm --prefix frontend/pc-tool run test:unit` は 20+ 件のテスト成功を確認した。

- Build
  - `npm --prefix frontend/pc-tool run build` は各段階で成功を確認した（既知 warning のみ）。
  - `docker build -t basicai/xtreme1-frontend:v0.9.1-islab ./frontend` の安定実行条件を整備した。

- E2E / Manual
  - `@smoke` / `@scenario` の Playwright 実行経路を確立した。
  - 実データセット（`datasetId=3` 系）で Radar 表示および UI 反映を確認した。

- Backend 契約確認（Phase 2.5）
  - `camera_config` 内 `radars[0].radar_external`（長さ 16, `rowMajor=true`）を確認した。
  - 検証データ上で LiDAR/Radar の同一フレーム PCD が一致することを確認した。

## 5. 主要課題と対応

- frontend ビルド失敗（依存不整合・ネットワーク要因）
  - `vue3-json-viewer` の実体に合わせた import 修正とバージョン固定を実施した。
  - `frontend/Dockerfile` に npm リトライと timeout 設定を追加した。

- Radar Height 入力欠落
  - `TypeError` を起点に formatter 実装を共通化し、数値入力表示不具合を修正した。

- `Both` 表示と Opacity の視認不整合
  - 深度書き込み制御が Opacity と連動していないことを原因特定した。
  - `opacity < 1` 時に `transparent=true` / `depthWrite=false` とする制御へ修正した。

- 設定 UI の LiDAR/Radar 非対称
  - Radar 側独自レイアウト差分を削減し、LiDAR 側実装に寄せて統一した。

## 6. 意思決定の要点

- Radar 実装は LiDAR 既存ロジックの再利用を優先する。
- 座標変換責務は backend に固定し、frontend は変換済みデータ描画を担う。
- `Auto Normalize` は要件見直しにより UI から削除し、Intensity 明示操作へ一本化する。
- コンテナ配布運用は `v0.9.1-islab` タグを基準とする。

## 7. 計画クローズ結果

- 第 1 期計画: Done（`2026-02-19-radar-pointcloud-implementation`）
- 第 2 期計画: Done（`2026-02-20_radar-display-transform-implementation`）
- 関連実行計画は archive 化済みである。
- 作業ブランチ/ワークツリーは整理済みである。

## 8. 残課題と次アクション

- 現行検証データは LiDAR/Radar 同一点群であるため、Radar 専用実データでの変換精度検証を追試する必要がある。
- UI レイアウトは運用中の微調整要求が再発しやすいため、スナップショットテスト導入を検討すべきである。
- 配布手順の再現性向上のため、コンテナ再ビルド・起動・簡易確認を一括化した runbook を整備すべきである。

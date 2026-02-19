# Title: Radar 表示拡張と座標変換契約の実装

## Metadata

- Owner: @copilot
- Created: 2026-02-20
- Last updated: 2026-02-20
- Status: Draft
- Related: `.agent/strategy/2026-02-20_radar-display-transform-design.md`
- Work log: `.agent/worklog/2026-02-20_radar-display-transform-implementation.md`

## Context

Radar 点群の重畳表示は導入済みであるが、今回の要求では LiDAR 基準座標系の明確化と、
Display パネル上での Radar 独立制御が求められる。
既存データ互換を維持しつつ、`camera_config` 新形式への対応と UI 拡張を最小差分で行う必要がある。

## Scope

In-scope:

- `camera_config` の新旧互換パース（配列形式 / `{ camera, radar }` 形式）を実装する。
- Radar 座標変換契約を backend へ明示し、frontend は変換済みデータ前提で処理する。
- Display パネルへ Radar レイヤー選択と Radar 専用着色設定（属性、自動正規化、カラーマップ）を追加する。
- 単体テスト、既存 E2E スモーク、手動確認を更新する。

Out-of-scope（非目標）:

- Radar を注釈対象にする機能追加。
- Radar 用の新規高度可視化（追跡、クラスタリング、時系列解析）追加。
- 既存 LiDAR 配色 UI の全面改修。

## Requirements

- 互換性: Radar が無いデータセットで既存ワークフローを維持する。
- 契約: `camera_config` は新旧形式を受理し、Radar 行列欠損時は安全にフォールバックする。
- UI: ユーザーが LiDAR/Radar/Both を選択でき、Radar の属性着色を独立制御できる。
- 可用性: Radar 読込失敗や属性欠損時でも LiDAR 注釈作業を継続できる。

## Approach

既存の Radar 重畳基盤を再利用し、状態と Uniform を LiDAR/Radar で分離する。
`camera_config` 正規化は frontend で受理範囲を拡張しつつ、座標変換計算は backend 責務として契約化する。
UI は既存 Display パネルへ最小追加し、既存コンポーネント再利用で実装コストと回帰リスクを抑える。

## Risks / Unknowns

- backend 側で Radar 変換適用が未完了の場合、frontend だけでは要件達成できない可能性がある。
- Radar の `snr/intensity` 分布がデータセットごとに偏る場合、自動正規化の視覚結果が不安定になる可能性がある。
- 既存 `setSharedPointUniforms` の挙動変更が LiDAR 表示に副作用を与える可能性がある。

## Plan

- Phase 1: 仕様固定とテスト先行
  - `camera_config` 新旧形式と Radar 表示設定の期待挙動をテストで固定する。
- Phase 2: `camera_config` 正規化とデータ契約反映
  - frontend の正規化関数と型定義を拡張し、Radar メタ情報を扱えるようにする。
- Phase 3: 描画・状態管理の Radar 独立化
  - Radar レイヤー表示モードと Radar 専用着色 Uniform を分離適用する。
- Phase 4: Display パネル拡張
  - レイヤー選択、属性選択、自動正規化、カラーマップ UI を追加する。
- Phase 5: 検証・ドキュメント更新
  - 単体/E2E/手動確認を実施し、README と検証手順を更新する。

## Progress

- [ ] Phase 1: 仕様固定とテスト先行
- [ ] Phase 2: `camera_config` 正規化とデータ契約反映
- [ ] Phase 3: 描画・状態管理の Radar 独立化
- [ ] Phase 4: Display パネル拡張
- [ ] Phase 5: 検証・ドキュメント更新

## Acceptance Criteria

- `camera_config` の配列形式と `{ camera, radar }` 形式の双方でフレーム読込が成立する。
- Display パネルで `LiDAR のみ / Radar のみ / 両方` 切替が機能する。
- Radar 着色設定（`snr/intensity`、自動正規化、カラーマップ）が描画へ反映される。
- Radar 欠損または属性欠損時に LiDAR 注釈フローが継続できる。

## Verification

- Unit:
  - `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
  - `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-render/PointCloud.spec.ts`
- Build:
  - `npm --prefix frontend/pc-tool run build`
- E2E（環境変数設定済み前提）:
  - `npm --prefix frontend/pc-tool exec playwright test e2e/radar-overlay.spec.ts`
- Manual:
  - LiDAR-only データ、LiDAR+Radar データ、Radar 属性欠損データの 3 ケースで画面確認する。

## Rollback Plan

- Radar 専用 UI を feature flag 相当で非表示化し、既存 LiDAR 設定のみへ戻す。
- Radar 独立 Uniform 適用が不安定な場合は `setSharedPointUniforms` のみ適用へ切り戻す。
- `camera_config` 新形式パースで不具合が出た場合は既存配列形式優先の分岐へ戻す。

## Decisions / Changes

- 2026-02-20: 座標変換責務は backend に固定し、frontend は変換済み Radar の描画と UI 拡張に集中する方針とした。

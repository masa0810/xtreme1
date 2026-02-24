# Title: レーダー点群座標変換の監査と修正

## Metadata

- Owner: @copilot
- Created: 2026-02-24
- Last updated: 2026-02-24
- Status: Done
- Closed: 2026-02-24
- Related: `.agent/strategy/2026-02-20_radar-display-transform-design.md`
- Work log: `.agent/worklog/2026-02-24_radar-lidar-transform-audit-fix.md`

## Context

レーダー点群をライダー座標系へ変換して描画する要件が設計書に定義されているが、現行実装では
`camera_config`のレーダー外部行列を取得しても、レーダー点群へ適用する経路が存在しない。
そのため、レーダー表示位置がライダー基準にならないリスクがある。

## Scope

In-scope:

- `pc-tool`におけるレーダー外部行列の適用経路を実装する。
- `radar_external`と`rowMajor`を解釈し、レーダー点群`position`をライダー座標へ変換する。
- 変換失敗時のフォールバック（警告ログ + 表示継続）を実装する。
- 単体テストで行列適用の正しさを固定する。

Out-of-scope（非目標）:

- backend APIのレスポンス契約変更。
- レーダーを注釈対象へ拡張する機能。
- DisplayパネルのUI仕様変更。

## Requirements

- 互換性: レーダー設定がないデータでは既存挙動を維持すること。
- 正確性: `rowMajor=true/false`および列優先判定の双方で正しい行列が適用されること。
- 可用性: 行列不正時は処理を中断せず、レーダー描画を継続できること。
- 最小差分: 既存のライダー描画と注釈フローへ影響を与えないこと。

## Approach

`pc-editor`のutilにレーダー変換関数を追加し、`LoadManager.setResource`でレーダー読み込み後に
変換関数を通してから`setRadarPointCloudData`へ渡す。
行列の正規化は既存のカメラ変換ロジックに合わせて実装し、テストで回帰を防止する。

## Risks / Unknowns

- データセットに複数レーダーが存在する場合、どの行列を適用するかは将来仕様で明確化が必要。
- `radar_external`の向き（Radar→LiDAR/LiDAR→Radar）がデータ契約と異なる場合、逆行列適用が必要になる可能性がある。
- レーダー点群に`position`欠損や長さ不整合がある場合、描画品質が低下する可能性がある。

## Plan

- Phase 1: 現行経路の監査結果を反映した変換方針を固定する。
- Phase 2: レーダー行列正規化と点群座標変換utilを実装する。
- Phase 3: `LoadManager`に変換適用経路とフォールバックを実装する。
- Phase 4: 単体テストを追加し、行列形式差分とフォールバックを検証する。
- Phase 5: 既存関連テストを実行して回帰確認し、結果を整理する。

## Progress

- [x] Phase 1: 現行経路の監査結果を反映した変換方針を固定する。
- [x] Phase 2: レーダー行列正規化と点群座標変換utilを実装する。
- [x] Phase 3: `LoadManager`に変換適用経路とフォールバックを実装する。
- [x] Phase 4: 単体テストを追加し、行列形式差分とフォールバックを検証する。
- [x] Phase 5: 既存関連テストを実行して回帰確認し、結果を整理する。

## Acceptance Criteria

- レーダー外部行列がある場合、レーダー点群`position`がライダー座標へ変換されて描画される。
- `camera_config`のレーダー情報欠損時に既存表示が回帰しない。
- 行列不正時に警告ログを出しつつアプリが継続動作する。
- 単体テストが追加され、対象テストがローカルで成功する。

## Verification

- `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts`
- `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/common/ConfigManager.spec.ts`
- `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-render/PointCloud.spec.ts`

## Rollback Plan

- `LoadManager`のレーダー変換呼び出しを削除し、既存の未変換経路へ戻す。
- 追加ユーティリティとテストを差分単位で巻き戻す。

## Decisions / Changes

- 2026-02-24: backend側での変換実装が未確認のため、`pc-tool`側で変換適用を補完する方針とした。
- 2026-02-24: 既存仕様との互換性を優先し、変換失敗時は非致命フォールバックを採用する方針とした。
- 2026-02-24: 実データ確認で`radarExternal`のZ方向並進が表示へ反映されることを確認し、計画を完了とした。

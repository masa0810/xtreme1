# Title: 2026-02-20_radar-display-transform-implementation の作業ログ

## 2026-02-20

- 16:50 #decision 実装開始に向けて設計書/実行計画のレビュー指摘を反映した。
- 16:51 #decision `camera_config` は `cameras/camera` と `radars/radar` の両形式を受理対象とした。
- 16:51 #decision backend 変換確認は新規配布データを待たず、現行データの `radars/radar` 行列で行う方針とした。
- 16:52 #note 実行計画の Status を `Active` に更新し、作業ブランチで実装を開始した。
- 17:05 #impl `PointCloud` に点群レイヤー切替、Radar 属性選択、自動正規化、LiDAR/Radar の個別 Uniform 適用 API を追加した。
- 17:11 #impl `Setting.vue` に `LiDAR / Radar / Both` 切替と Radar 専用設定（色モード、属性、自動正規化）を追加した。
- 17:14 #impl `LoadManager` / `Editor` で Radar データ有無に応じた状態同期（属性フラグ更新、未読込時クリア）を追加した。
- 17:18 #test `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-render/PointCloud.spec.ts` を実行し、7 tests passed を確認した。
- 17:18 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、14 tests passed を確認した。
- 17:30 #test `npm --prefix frontend/pc-tool run build` を実行し、build 成功を確認した（chunk size warning のみ）。
- 08:56 #impl Setting パネルを LiDAR/Radar セクションに再編し、Radar Visible を削除した。
- 08:57 #impl Radar Attribute を Intensity トグルへ置換し、Radar/LiDAR の Color・Height・Auto Normalize を分離した。
- 08:58 #impl Setting パネルに縦スクロールを追加し、小さい画面でも全設定にアクセス可能とした。
- 08:59 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、15 tests passed を確認した。
- 09:10 #test `npm --prefix frontend/pc-tool run build` を実行し、build 成功を確認した（既知 warning のみ）。
- 09:06 #impl LiDAR opacity 設定を追加し、Radar opacity と独立して反映されるようにした。
- 09:06 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、16 tests passed を確認した。
- 09:44 #impl Setting パネルのレイアウトを再調整し、LiDAR/Radar セクションと Opacity 配置を要望どおりに変更した。
- 09:45 #impl 横スクロール抑制のため Setting 幅制御を見直し、主要スライダー幅を `100%` に統一した。
- 11:46 #debug Radar Height 入力欠落の原因を追跡し、`Setting.vue` の Radar 側独自レイアウトと LiDAR 側実装差分を不具合源として特定した。
- 11:47 #test `PointCloud.spec.ts` に「Radar Visible 非依存」テストを先行追加し、失敗を確認してから修正を開始した。
- 11:48 #impl `PointCloud` から `setRadarVisible` / `radarVisible` を削除し、レイヤー表示を `pointLayerMode` のみで制御するよう統一した。
- 11:49 #impl Radar Height UI を LiDAR と同型の入力配置へ揃え、`blur` 補正・範囲クランプ・リセット動作を同期した。
- 11:50 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、17 tests passed を確認した。
- 11:50 #test `npm --prefix frontend/pc-tool run build` を実行し、build 成功を確認した（既知 warning のみ）。
- 12:57 #debug Playwright で `datasetId=3&dataId=29` を再現し、`TypeError: H.toFixed is not a function` により Radar Height 入力が描画失敗していることを確認した。
- 12:57 #impl `numberFormat.ts` を追加し、`Setting.vue`/`colorSlider.vue` の `a-input-number` formatter を共通化して文字列入力でも例外を出さないよう修正した。
- 12:57 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、20 tests passed を確認した。
- 12:57 #test `npm --prefix frontend/pc-tool run build` を実行し、build 成功を確認した（既知 warning のみ）。
- 12:57 #test Playwright で再撮影し、Radar Height の数値入力が表示されることを確認した（`2026-02-20_playwright_tool_pc_dataset3_data29_setting_after_fix_radar_height.png`）。
- 13:12 #impl LiDAR 既存ロジック再利用方針に合わせ、`getHeightRangeByGroundAndMax` を追加し Radar 高さ初期値を `ground + max` 算出へ統一した。
- 13:12 #test `position.spec.ts` を追加し、同一データ時に LiDAR と同じ下限（ground）を使うことを固定した。
- 13:12 #test `npm --prefix frontend/pc-tool run test:unit` を実行し、22 tests passed を確認した。
- 13:12 #test `npm --prefix frontend/pc-tool run build` を実行し、build 成功を確認した（既知 warning のみ）。

# Title: 2026-02-24_radar-lidar-transform-audit-fix の作業ログ

## 2026-02-24

- 13:20 #issue Radar外部行列は`camera_config`で取得できるが、Radar点群へ適用する処理経路が未接続であることを確認した。
- 13:24 #decision `pc-editor`側で行列適用を補完する方針とし、`LoadManager`でRadar読込直後に変換する実装を採用した。
- 13:31 #verify `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/utils/common.spec.ts` を実行し、Radar行列補正と座標変換テストが通過した。
- 13:42 #verify `npm --prefix frontend/pc-tool run test:unit -- --run src/packages/pc-editor/common/ConfigManager.spec.ts` および `src/packages/pc-render/PointCloud.spec.ts` が通過した。
- 14:57 #issue `http://localhost:8190/api/data/listByIds?dataIds=29` は未認証状態で`401 LOGIN_STATUS_TIMEOUT`となり、API直叩きでの確認ができなかった。
- 15:01 #verify DBとMinIO実体を確認し、対象フレーム`000105`の`camera_config`に`radarExternal`のZ方向`+0.5`並進が格納されていることを確認した。
- 15:06 #verify LiDAR/Radarの元PCDが同一ハッシュであることを確認し、差分要因が外部行列適用のみであることを確認した。
- 15:12 #verifyフロントエンド再ビルド後、配信バンドル内にレーダー変換関数の呼び出しが含まれることを確認した。
- 15:20 #verify実機確認により、並進が反映されることを確認した。
- 15:23 #verify実行計画を完了状態でクローズし、計画アーカイブへ移動した。

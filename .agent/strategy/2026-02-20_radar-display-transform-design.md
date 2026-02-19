# Radar 表示拡張および座標変換設計書

- 作成日: 2026-02-20
- 対象: `backend`, `frontend/pc-tool`
- ステータス: Approved
- Related: `.agent/strategy/2026-02-19-radar-pointcloud-design.md`

## 背景

既存対応では Radar 点群の重畳表示と最小表示 UI（表示切替、透明度）は導入済みである。
一方で、今回の追加要求では以下 2 点が必要である。

- LiDAR 座標系を基準とし、Radar 点群を Radar-LiDAR 外部行列で変換して描画すること。
- Display パネルで、LiDAR と独立した Radar 表示制御と着色制御を提供すること。

本設計は既存の注釈体験を維持し、最小差分で上記要求を満たす方針を定義する。

## 目標

- アノテーション基準座標系を LiDAR 固定とし、Radar は LiDAR 座標系へ正規化された点群として描画すること。
- `camera_config` の新形式（`camera` + `radar`）と既存形式（配列）を同時に受理すること。
- Display パネルで、LiDAR/Radar/両方の描画選択と Radar 専用着色設定を提供すること。
- Radar 情報を持たない既存データセットで回帰を起こさないこと。

## 非目標

- Radar を注釈対象（選択、編集、保存対象）に拡張すること。
- Radar 専用のクラスタリング、追跡、フィルタリング等の高度可視化機能を追加すること。
- 既存の LiDAR 着色仕様を全面刷新すること。

## 要求整理

### 1. `camera_config` 形式

- 既存互換: これまでのカメラ配列形式を引き続き受理する。
- 新規拡張: 以下構造を受理する。
  - `camera`: 既存カメラ配列
  - `radar`: Radar 外部行列配列（`radar_external`, `rowMajor`）
- `radar` 未定義は許容し、Radar なしモードとして扱う。

### 2. 座標変換責務

- 変換責務はバックエンドに置く。
- フロントエンドは「LiDAR 座標に変換済み Radar 点群」を受け取り、描画に専念する。
- `camera_config.radar` は契約情報として保持し、フォーマット検証と将来拡張の足場とする。

### 3. Display パネル

- 点群表示対象: `LiDAR のみ / Radar のみ / 両方`。
- Radar 専用着色設定:
  - 属性: `snr` または `intensity`（排他的、存在する属性のみ選択可能）
  - 自動正規化: ON/OFF
  - カラーマップ: 既存候補から選択
- Radar 属性が存在しない場合は、該当 UI を無効化し単色描画へフォールバックする。

## 設計方針

### データ契約

- backend は `camera_config` を正規化して解釈し、Radar 外部行列が存在する場合は Radar 点群を LiDAR 座標へ変換する。
- frontend は `pointLayers.radar` の点群受信時、すでに LiDAR 座標系である前提で描画する。
- 既存形式の `camera_config` では Radar 変換をスキップし、既存動作を維持する。

### 互換性

- 既存データ（カメラ + LiDAR のみ）:
  - ロード、描画、注釈、保存の挙動は不変である。
- 新規データ（カメラ + LiDAR + Radar）:
  - Radar が任意追加されても注釈主体は LiDAR のままである。

### UI

- 既存 `Setting.vue` の Display セクションを拡張し、Radar 専用ブロックを追加する。
- LiDAR と Radar の設定状態を分離し、相互干渉を避ける。
- 既存の色レンジスライダー、カラーマップ選択コンポーネントを再利用し、重複実装を避ける。

## コンポーネント別設計

### backend

- `camera_config` 解析に新旧互換ロジックを追加する。
- Radar 外部行列が定義される場合、Radar 点群を LiDAR 座標へ変換する。
- 点属性は `x,y,z,snr/intensity` を保持し、追加属性は無視する。

### frontend (`pc-tool`)

- `createViewConfig` の `camera_config` 正規化を `camera` キー対応へ拡張する。
- `IDataResource` / state に Radar 表示モード、Radar 着色設定を追加する。
- `PointCloud` / `PointsMaterial` に Radar 独立色設定適用 API を追加する。
- `Setting.vue` に Radar レイヤー選択、自動正規化、カラーマップ設定 UI を追加する。

## エラーハンドリング

- Radar 外部行列不正（長さ不一致、NaN 等）: 警告ログを出し、Radar を非表示化して LiDAR を継続する。
- Radar 属性欠損（`snr/intensity` なし）: Radar 着色 UI を無効化し、単色描画で継続する。
- Radar 読み込み失敗: 既存方針どおり非致命扱いとし、LiDAR 作業を継続する。

## テスト方針

### 単体テスト

- `camera_config` 正規化（配列形式 / `{ camera, radar }` 形式）。
- Radar 表示モード切替（LiDAR/Radar/Both）。
- Radar 着色属性選択、属性欠損時フォールバック。

### E2E / 手動確認

- Radar なしデータで回帰がないこと。
- Radar ありデータで frame 同期更新されること。
- Display 操作（表示モード、属性、自動正規化、カラーマップ）が即時反映されること。

## 受け入れ基準

- LiDAR 基準で注釈操作が従来どおり成立すること。
- Radar 点群の表示対象と着色設定が Display パネル操作どおり反映されること。
- `camera_config` の新旧形式を受理し、旧形式で回帰がないこと。
- Radar 欠損、Radar 属性欠損、Radar 読み込み失敗の各ケースで LiDAR 作業を継続できること。

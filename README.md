# RS不動産管理 - アールエス株式会社向け不動産管理アプリ

不動産管理会社向けの業務Webアプリケーションです。物件・部屋・入居者・申込・契約・家賃・修繕などを一元管理します。

## 技術構成

- **フロントエンド**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod
- **テーブル**: TanStack Table
- **チャート**: Recharts

## 主要機能

| 機能 | 説明 |
|------|------|
| ダッシュボード + OCR統合 | ファイルアップロード → OCR処理 → 手動修正 → カテゴリ仕分け |
| 物件管理 | 物件一覧・詳細・登録・編集 |
| 部屋管理 | 部屋一覧・詳細・空室/入居状況管理 |
| 申込管理 | 7ステップ新規申込フォーム・申込一覧・詳細 |
| 契約管理 | 契約一覧・詳細・PDF生成 |
| 入居者管理 | 入居者一覧・詳細 |
| 家賃管理 | 請求・入金・消込 |
| 未収管理 | 滞納アラート・督促管理 |
| 修繕管理 | 修繕依頼・対応履歴 |
| 書類管理 | ファイルアップロード・閲覧 |
| 帳票マッピング | OCR項目マッピング補助 |
| ユーザー設定 | ロール管理 (super_admin / admin / staff / viewer) |

## 対応ファイル形式（OCR取込）

PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), 画像 (JPG/PNG/HEIC)

## ローカル起動手順

```bash
# 依存パッケージインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build
```

## 環境変数

`.env` ファイルをプロジェクトルートに作成してください。

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- 環境変数が未設定の場合、**デモモード**（モックデータ表示）で動作します
- 環境変数を設定すると、**実装モード**（Supabase接続）に切り替わります

## データベース（Supabase）

### マイグレーション

`supabase/migrations/` ディレクトリに以下のマイグレーションファイルがあります：

1. `00001_initial_schema.sql` - 25テーブル作成（物件、部屋、申込、契約、家賃、修繕等）
2. `00002_rls_policies.sql` - RLSポリシー（40+）+ ヘルパー関数
3. `00003_storage_buckets.sql` - 6つの非公開Storageバケット

### 初期データ

`supabase/seed.sql` - 初期会社データ（アールエス株式会社）

### Edge Functions

`supabase/functions/` に8つのEdge Functionsが含まれています：

- `run-ocr` - OCR処理実行
- `suggest-field-mappings` - 項目マッピング候補提示
- `confirm-field-mappings` - マッピング確定
- `create-application-from-ocr` - OCR結果から申込作成
- `generate-contract-pdf` - 契約書PDF生成
- `reconcile-rent-payments` - 家賃消込
- `send-followup-email` - 督促メール送信
- `write-audit-log` - 監査ログ記録

## 管理者初期作成手順

1. Supabase Auth でユーザーを作成（Signup API またはダッシュボード）
2. SQL Editor でメール確認 + `users` テーブルにレコード追加
3. `raw_app_meta_data` に `company_id` を設定

## セキュリティ

- 全テーブルに **Row Level Security (RLS)** を適用
- 会社スコープでのデータ分離
- ロールベースアクセス制御（super_admin / admin / staff / viewer）
- Storageバケットは全て**非公開**
- 監査ログによる操作追跡

## ディレクトリ構成

```
src/
  app/           - ページコンポーネント（dashboard, properties, units, etc.）
  components/    - 共通UIコンポーネント（ui, layout）
  hooks/         - カスタムフック（useAuth）
  lib/           - ユーティリティ（supabase client, utils）
  store/         - 状態管理（Zustand）
  types/         - TypeScript型定義
supabase/
  migrations/    - DBマイグレーション
  functions/     - Edge Functions
  seed.sql       - 初期データ
```

## ライセンス

Private - アールエス株式会社

# 🚀 最強タスク管理ツール - デプロイドキュメント

## 📋 プロジェクト概要

**プロジェクト名**: 最強タスク管理ツール (GoogleTODO移行対応版)  
**リポジトリ**: https://github.com/muranaka-tenma/sales-task-manager.git  
**本番URL**: https://stellar-biscochitos-e19cb4.netlify.app/index-kanban.html  
**作成日**: 2025年8月2日  
**最終更新**: 2025年8月2日

## 🎯 主要機能

### OCR機能（GoogleTODO移行対応）
- **絶対参照方式**: 囲み数字・全角数字の完全変換
- **手書き文字対応**: エッジ強化・ガウシアンフィルタ前処理
- **複雑レイアウト解析**: 表・リスト・フォーム自動検出
- **AI信頼度スコア**: リアルタイム精度表示（0-100%）

### タスク管理コア機能
- Kanbanボード形式
- ドラッグ&ドロップ優先度変更
- 期限設定・アラート機能
- 担当者アサイン機能

## 🌐 デプロイ環境

### フロントエンド: Netlify
- **サービス**: Netlify (https://netlify.com)
- **サイト名**: stellar-biscochitos-e19cb4
- **デプロイURL**: https://stellar-biscochitos-e19cb4.netlify.app/
- **メインファイル**: sales-task-core/index-kanban.html
- **自動デプロイ**: GitHubプッシュ時に自動実行

### バージョン管理: GitHub
- **リポジトリ**: https://github.com/muranaka-tenma/sales-task-manager.git
- **メインブランチ**: main
- **自動連携**: Netlify ↔ GitHub

## 🔧 環境変数・設定

### 現在の環境変数
**注意**: 現在このプロジェクトは純粋なフロントエンドアプリケーションのため、バックエンド環境変数は設定されていません。

### フロントエンド設定
- **言語**: HTML/JavaScript/CSS
- **OCRエンジン**: Tesseract.js v4 (CDN)
- **PWA対応**: manifest.json, sw.js
- **ローカルストレージ**: タスク・設定データ

## 📝 デプロイ手順

### 手動デプロイ方法

#### 1. Netlify Dashboard方式
```bash
# 1. プロジェクトファイルを準備
cd /home/muranaka-tenma/顧客管理ツール/frontend/src/services/api/最強タスク管理ツール

# 2. Netlify.comにログイン
# https://app.netlify.com にアクセス

# 3. ドラッグ&ドロップでデプロイ
# プロジェクトフォルダ全体をNetlifyにドラッグ
```

#### 2. Git連携自動デプロイ（現在の設定）
```bash
# 変更をコミット
git add .
git commit -m "機能追加: [変更内容]"

# GitHubにプッシュ（自動でNetlifyデプロイ）
git push origin main
```

### CLI デプロイ方法
```bash
# Netlify CLI インストール（初回のみ）
npm install -g netlify-cli

# ログイン（初回のみ）
netlify login

# デプロイ実行
cd /home/muranaka-tenma/顧客管理ツール/frontend/src/services/api/最強タスク管理ツール
netlify deploy --prod --dir .
```

## 🔄 CI/CD設定

### 現在の自動デプロイ設定
- **トリガー**: main ブランチへのプッシュ
- **ビルド**: 不要（静的ファイル）
- **デプロイ先**: Netlify
- **デプロイ時間**: 約1-2分

### Git Hooks設定
プロジェクトには以下のGitフックが設定されています：
```bash
# .git/hooks/prepare-commit-msg
# コミットメッセージに日時を自動追加
```

## 📊 デプロイ履歴

### 最新の重要なデプロイ
```
b2bd349 - 2025年8月2日
🎯 OCR精度向上: GoogleTODO期限認識の絶対参照方式実装
- 囲み数字・全角数字の完全変換機能追加
- GoogleTODO特有のノイズ除去ロジック強化
- 期限フォーマットの強制正規化実装
- 拡張テストケース追加（17パターン対応）

b5ba5bb - 以前
🔧 緊急修正: リダイレクトが効かない問題を解決
```

## 🛡️ セキュリティ設定

### 現在のセキュリティ状況
- **HTTPS**: Netlify により自動適用
- **機密情報**: 環境変数なし（フロントエンドのみ）
- **認証**: 現在未実装
- **CORS**: 外部API未使用のため設定不要

## 🔍 モニタリング・ログ

### Netlify Analytics
- **URL**: https://app.netlify.com/sites/stellar-biscochitos-e19cb4/analytics
- **ビルドログ**: https://app.netlify.com/sites/stellar-biscochitos-e19cb4/deploys

### ブラウザ開発者ツール
- **OCRログ**: Console (F12) でOCR処理詳細を確認可能
- **信頼度スコア**: UI上でリアルタイム表示

## 🚨 トラブルシューティング

### 一般的な問題と解決策

#### デプロイが失敗する場合
```bash
# 1. Gitステータス確認
git status

# 2. コンフリクトがある場合
git pull origin main
# コンフリクト解決後
git add .
git commit -m "コンフリクト解決"
git push origin main
```

#### OCR機能が動作しない場合
1. **ブラウザコンソール確認**: F12でエラーメッセージを確認
2. **Tesseract.js読み込み確認**: CDNが正常に読み込まれているか確認
3. **画像ファイル形式確認**: JPG, PNG, GIF対応

#### 信頼度スコアが表示されない場合
1. **OCR処理完了確認**: 処理が正常に完了しているか確認
2. **ブラウザ互換性**: モダンブラウザ（Chrome, Firefox, Safari最新版）を使用

### エラーログの確認方法
```bash
# Git操作でエラーが出た場合
git log --oneline -5  # 最近のコミット確認
git remote -v         # リモートリポジトリ確認
git status           # 現在の状態確認
```

## 📁 プロジェクト構造

```
最強タスク管理ツール/
├── sales-task-core/
│   ├── index-kanban.html      # メインアプリケーション
│   ├── index-*.html           # バックアップ・テスト版
│   └── task-*.html           # 各種機能別ファイル
├── docs/
│   ├── deployment/
│   │   └── deploy.md         # このファイル
│   └── SCOPE_PROGRESS.md     # プロジェクト進捗
├── mockups/                  # モックアップファイル
├── manifest.json             # PWA設定
├── sw.js                    # Service Worker
├── netlify-deploy.md        # Netlify簡易ガイド
└── README系ファイル          # プロジェクト説明
```

## 🔄 バックアップ・復旧

### バックアップファイル管理
プロジェクトでは以下の命名規則でバックアップを作成：
```
index-kanban-backup-YYYYMMDD-HHMMSS.html
```

### 復旧手順
```bash
# 1. 特定コミットに戻す場合
git log --oneline                    # コミット履歴確認
git checkout [コミットハッシュ] -- [ファイル名]

# 2. バックアップファイルから復旧
cp sales-task-core/index-kanban-backup-*.html sales-task-core/index-kanban.html
```

## 📞 緊急時連絡先・参考資料

### サービス管理画面
- **Netlify Dashboard**: https://app.netlify.com/sites/stellar-biscochitos-e19cb4
- **GitHub Repository**: https://github.com/muranaka-tenma/sales-task-manager

### 技術参考資料
- **Tesseract.js**: https://tesseract.projectnaptha.com/
- **Netlify Docs**: https://docs.netlify.com/
- **PWA Guidelines**: https://web.dev/progressive-web-apps/

---

**⚠️ 重要**: このドキュメントは機能追加・変更時に必ず更新してください。  
**📝 最終更新者**: Claude Code Assistant  
**🤖 Generated with [Claude Code](https://claude.ai/code)**
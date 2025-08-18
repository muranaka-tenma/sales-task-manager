# 🚀 最強タスク管理ツール - デプロイドキュメント

## 📋 プロジェクト概要

**プロジェクト名**: 最強タスク管理ツール (マルチユーザー・プロジェクト管理対応版)  
**リポジトリ**: https://github.com/muranaka-tenma/sales-task-manager.git  
**本番URL**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html  
**作成日**: 2025年8月2日  
**最終更新**: 2025年8月18日

## 🎯 主要機能

### 🏢 マルチユーザー・プロジェクト管理
- **権限管理**: 開発者・一般ユーザーの役割分担
- **プロジェクト作成**: チーム別プロジェクトの管理
- **メンバー管理**: プロジェクトメンバーの追加・削除
- **アクセス制御**: 公開/非公開プロジェクトの設定
- **リアルタイム同期**: Firebase連携による即座の更新

### 📝 拡張タスク管理機能
- **プロジェクトタスク**: プロジェクト単位でのタスク管理
- **個人タスク**: 個人専用のタスク管理
- **他者へのタスク追加**: チームメンバーへのタスク割り当て
- **マルチデバイス対応**: 複数端末での同期作業

### 📊 従来機能（継続提供）
- Kanbanボード形式のタスク管理
- ドラッグ&ドロップ操作
- 期限設定・アラート機能
- OCR機能（画像からのタスク作成）

## 🌐 デプロイ環境

### フロントエンド: Netlify
- **サービス**: Netlify (https://netlify.com)
- **サイト名**: stellar-biscochitos-e19cb4
- **正しいURL**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
- **メインファイル**: sales-task-core/index-kanban.html
- **自動デプロイ**: GitHubプッシュ時に自動実行

### バックエンド: Firebase (新規追加)
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **リアルタイム同期**: Firebase Realtime Database
- **ユーザー管理**: systemUsers (LocalStorage + Firebase)

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
6d7df35 - 2025年8月18日
🚀 マルチユーザー対応とプロジェクト管理機能を実装
【主要な機能追加】
✅ 権限管理の改善
- 邨中天真：開発者権限（全機能利用可）
- その他ユーザー：一般ユーザー権限

✅ プロジェクト管理機能
- プロジェクト作成・編集・削除
- メンバー管理とアクセス制御
- 公開/非公開設定

✅ タスク管理の拡張
- タスク作成時のプロジェクト選択
- プロジェクトメンバーとの自動共有
- マルチデバイス対応

b2bd349 - 2025年8月2日
🎯 OCR精度向上: GoogleTODO期限認識の絶対参照方式実装
- 囲み数字・全角数字の完全変換機能追加
- GoogleTODO特有のノイズ除去ロジック強化
```

## 🛡️ セキュリティ設定

### 現在のセキュリティ状況
- **HTTPS**: Netlify により自動適用
- **認証**: Firebase Authentication で実装済み
- **権限管理**: ロールベースアクセス制御（RBAC）
- **データ保護**: Firebase Firestore セキュリティルール適用

### 📋 ユーザー権限情報
**開発者権限**:
- 邨中天真 (muranaka-tenma@terracom.co.jp)
  - 全機能へのアクセス
  - プロジェクト作成・編集・削除
  - ユーザー管理権限

**一般ユーザー権限**:
- 加藤純 (kato-jun@terracom.co.jp)
- 朝日圭一 (asahi-keiichi@terracom.co.jp) 
- 半澤侑果 (hanzawa-yuka@terracom.co.jp)
- 田村渉 (tamura-wataru@terracom.co.jp)
- 橋本友美 (hashimoto-yumi@terracom.co.jp)
- 福島亜未 (fukushima-ami@terracom.co.jp)
  - 基本的なタスク管理機能
  - プロジェクト参加（招待制）
  - 自身のタスクのみ編集可能

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
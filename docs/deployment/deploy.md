# 🚀 最強タスク管理ツール - デプロイドキュメント

## 📋 プロジェクト概要

**プロジェクト名**: 最強タスク管理ツール (マルチユーザー・プロジェクト管理対応版)  
**リポジトリ**: https://github.com/muranaka-tenma/sales-task-manager.git  
**本番URL**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html  
**作成日**: 2025年8月2日  
**最終更新**: 2025年10月6日（デプロイ設定完全文書化）

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

### バックエンド: Firebase
- **プロジェクトID**: sales-task-manager-af356
- **認証**: Firebase Authentication（メール/パスワード認証）
- **データベース**: Firebase Firestore
- **リアルタイム同期**: Firebase Realtime Database
- **ユーザー管理**: systemUsers (LocalStorage + Firebase)
- **Firebase Console**: https://console.firebase.google.com/project/sales-task-manager-af356

### Firebase設定情報（sales-task-core/firebase-config.js）
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAHScwiAkvJ3qwl_VcdDDyzM_Zb37osBMs",
  authDomain: "sales-task-manager-af356.firebaseapp.com",
  projectId: "sales-task-manager-af356",
  storageBucket: "sales-task-manager-af356.firebasestorage.app",
  messagingSenderId: "953432845897",
  appId: "1:953432845897:web:bf441cb3590ce1fc455998"
};
```
**⚠️ 注意**: この設定はフロントエンドコードに含まれており、Firebaseセキュリティルールで保護されています。

### バージョン管理: GitHub
- **リポジトリ**: https://github.com/muranaka-tenma/sales-task-manager.git
- **メインブランチ**: main
- **自動連携**: Netlify ↔ GitHub

## 🔧 環境変数・設定

### Netlify環境変数

現在Netlifyに設定されている環境変数：

| 変数名 | 値 | 用途 |
|--------|-----|------|
| NODE_VERSION | 18 | ビルド環境のNode.jsバージョン |
| DEPLOY_TIME | 2025-08-03-16-59 | デプロイタイムスタンプ |

### Netlifyアカウント情報
- **アカウント名**: Tenma Muranaka
- **メールアドレス**: muranaka-tenma@terracom.co.jp
- **チーム名**: east erea sales team
- **サイトID**: 876143f6-3c44-461a-856a-681013c2fc6f

### フロントエンド設定
- **言語**: HTML/JavaScript/CSS（バニラJS）
- **OCRエンジン**: Tesseract.js v4 (CDN)
- **PWA対応**: manifest.json, sw.js
- **データ保存**: Firebase Firestore + LocalStorage（一部機能）
- **認証**: Firebase Authentication

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

#### 初回セットアップ
```bash
# 1. リポジトリをクローン
git clone https://github.com/muranaka-tenma/sales-task-manager.git
cd sales-task-manager

# 2. Netlify CLIをローカルインストール（権限問題回避）
npm install netlify-cli --save-dev

# 3. Netlifyにログイン
npx netlify login
# ブラウザが開くので muranaka-tenma@terracom.co.jp でログイン

# 4. サイトにリンク
npx netlify link --id 876143f6-3c44-461a-856a-681013c2fc6f
```

#### デプロイ実行
```bash
# プレビューデプロイ（テスト用）
npx netlify deploy

# 本番デプロイ
npx netlify deploy --prod

# デプロイ状況確認
npx netlify status
```

## 🔄 CI/CD設定

### 現在の自動デプロイ設定（Netlify自動デプロイ）
- **方式**: GitHub連携による自動デプロイ
- **トリガー**: main ブランチへのプッシュ
- **ビルド**: 不要（静的HTMLファイル）
- **デプロイ先**: Netlify (stellar-biscochitos-e19cb4)
- **デプロイ時間**: 約1-2分
- **GitHub Actions**: 未使用（Netlify自動デプロイのみ）

### デプロイフロー
```
コード修正
  ↓
git commit & push
  ↓
GitHub (main branch)
  ↓
Netlify自動検知
  ↓
自動デプロイ開始
  ↓
本番環境更新
  ↓
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```

### Git Hooks設定
プロジェクトには以下のGitフックが設定されています：
```bash
# .git/hooks/prepare-commit-msg
# コミットメッセージに日時を自動追加
```

### Netlify設定ファイル（netlify.toml）
```toml
[build]
  publish = "."

[build.environment]
  NODE_VERSION = "18"
  DEPLOY_TIME = "2025-08-03-16-59"

[[redirects]]
  from = "/"
  to = "/sales-task-core/index-kanban.html"
  status = 302

[[redirects]]
  from = "/app"
  to = "/sales-task-core/index-kanban.html"
  status = 302
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

## 🔄 新PCでの完全復旧手順

PC交換後に開発環境を復旧する手順：

### 1. 必要ツールのインストール
```bash
# Node.js（v18以上推奨）
# https://nodejs.org/ からダウンロード

# Git
# https://git-scm.com/ からダウンロード
```

### 2. リポジトリクローン
```bash
git clone https://github.com/muranaka-tenma/sales-task-manager.git
cd sales-task-manager
```

### 3. Netlify CLIセットアップ
```bash
# Netlify CLIインストール
npm install netlify-cli --save-dev

# ログイン
npx netlify login
# muranaka-tenma@terracom.co.jp でログイン

# サイトにリンク
npx netlify link --id 876143f6-3c44-461a-856a-681013c2fc6f

# 動作確認
npx netlify status
```

### 4. 動作確認
```bash
# ローカルサーバー起動（任意）
npx http-server . -p 8080

# ブラウザで http://localhost:8080/sales-task-core/index-kanban.html にアクセス
```

---

## 📌 重要URL一覧（PC交換後のクイックアクセス）

### 本番環境
- **メインアプリ**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
- **ログイン**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/login.html
- **ユーザー管理**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/user-management.html
- **プロジェクトタスク作成**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/pj-create.html

### 管理画面
- **Netlify Dashboard**: https://app.netlify.com/sites/stellar-biscochitos-e19cb4
- **Firebase Console**: https://console.firebase.google.com/project/sales-task-manager-af356
- **GitHub Repository**: https://github.com/muranaka-tenma/sales-task-manager

---

## 📋 未完了TODO（PC交換前の作業リスト）

### 🔴 高優先度
27. ⏳ 非表示タスク機能を削除して元に戻す
28. ⏳ 一般ユーザーの個人タスク表示制限実装
29. ⏳ 表示対象フィルターの権限制御（一般ユーザーは自分のみ）
30. ⏳ プロジェクトタスク移動通知機能修正：カラムIDではなくカラム名で通知

### 🟡 中優先度
31. ⏳ 統計表示削除：看板メニュー画面の統計情報を削除
32. ⏳ 統計表示削除：メイン画面の統計情報を削除
33. ⏳ ローカル機能洗い出し：LocalStorage依存機能を特定
34. ⏳ Firestore移行：特定したローカル機能をFirebaseに移行
35. ⏳ コード整理：重複コードと不要コードを削除・統合

### ⚪ 低優先度
36. ⏳ UI改善：タスク作成時の初期カラム配置枠を削除
37. ⏳ UI改善：ダイアログとメニューのデザイン改善
38. ⏳ 懸念事項：ハンバーガーメニューの権限制御問題の継続調査
39. ⏳ 予防策：重複ファイル監視・防止システムの検討

**進捗率**: 26/39 完了（66.7%）

---

**⚠️ 重要**: このドキュメントは機能追加・変更時に必ず更新してください。
**📝 最終更新者**: Claude Code (デプロイスペシャリスト)
**📅 最終更新日**: 2025年10月6日
**🤖 Generated with [Claude Code](https://claude.com/claude-code)**
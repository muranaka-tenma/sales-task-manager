# 営業タスク管理システム（Sales Task Manager）

**📂 プロジェクトディレクトリ**: `/home/muranaka-tenma/sales-task-manager/`
**🌐 本番URL**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/
**📅 最終更新**: 2025-11-14

---

## 🚀 クイックスタート（セッション開始時）

### 1️⃣ 必ず最初に読むファイル
👉 **[SESSION.md](./SESSION.md)** ← メイン引継ぎ書（必読）

### 2️⃣ 補足ドキュメント
- **要件定義**: [handover/requirements/](./handover/requirements/)
- **設計書**: [handover/design/](./handover/design/)
- **技術ドキュメント**: [docs/](./docs/)

---

## 📋 現在の状況（2025-11-14 19:30時点）

### ✅ 最近完了した作業（11月13-14日）
- 非表示タスク機能の完全実装
- モーダルスクロール位置リセット修正
- systemUsers初期化問題の根本解決
- Firebase認証時の日本語名取得修正
- E2Eテスト実装（Playwright）
- テンプレートカテゴリ機能削除
- 優先度機能削除
- 管理者ダッシュボードアクセス権限修正
- **引継ぎ書の整理・統合**（README.md作成、handoverディレクトリ作成）
- **計16件の修正・実装完了**

### 🔴 現在の最優先課題（ユーザー判断待ち）

#### ❗ **ゲストユーザー問題の根本解決が必要**

**症状**: ログイン後に「ゲストユーザー」として認識される

**根本原因**: Firebase Authenticationにユーザーが登録されていない（または認証情報が間違っている）ため、LocalStorageフォールバックを使用するが、Firebase未認証なので「ゲストユーザー」になる

**次回セッションで以下3つの選択肢から選択**:
1. **選択肢A**: Firebase Authentication使用（推奨、2-3時間）
2. **選択肢B**: Firebase Authentication不使用（カスタム認証、1-2時間）
3. **選択肢C**: LocalStorage完全脱却プロジェクト（大規模、3-5時間）

詳細はSESSION.md参照

### ⏱️ 残作業時間の見積もり
約10-15時間（詳細はSESSION.md参照）

---

## 🗂️ ディレクトリ構成

```
/home/muranaka-tenma/sales-task-manager/
├── README.md                    # このファイル（プロジェクト概要）
├── SESSION.md                   # メイン引継ぎ書（必読）★
├── handover/                    # 引継ぎドキュメント
│   ├── requirements/            # 要件定義
│   │   └── 2025-11-10-new-requirements.md
│   └── design/                  # 設計ドキュメント
│       ├── phase2-pj-task-management.md
│       └── recurring-tasks.md
├── docs/                        # 技術ドキュメント
│   ├── firebase-implementation-status.md
│   ├── localStorage-dependency-report.md
│   └── deployment/
├── sales-task-core/             # メインアプリケーション
│   ├── index-kanban.html
│   ├── login.html
│   └── firebase-config-auth-fix-20250819-132508.js
├── tests/                       # E2Eテスト
│   └── hidden-task.spec.js
├── e2e/                         # E2Eテスト設定
├── netlify/                     # Netlify Functions
└── package.json                 # 依存関係
```

---

## 🔧 技術スタック

- **フロントエンド**: HTML/CSS/JavaScript（バニラJS）
- **認証**: Firebase Authentication
- **データベース**: Firebase Firestore
- **通知**: Slack Webhook（Netlify Functions経由）
- **デプロイ**: Netlify（自動デプロイ）
- **テスト**: Playwright（E2Eテスト）

---

## 🚨 次回セッション開始時の手順

### ステップ1: プロジェクト確認（最重要）
1. **このREADME.mdを確認** ← ディレクトリとURLを確認
2. **SESSION.mdを読む** ← 最新の進捗と課題を把握
3. **他のプロジェクトと混同していないか確認**
   - CocoFileではない
   - タスク管理ツール（別ディレクトリ）ではない

### ステップ2: 状況確認
4. **SESSION.mdの最新セッション進捗を読む**
5. **未解決の問題を確認**
6. **全TODO一覧を確認**（優先度順）

### ステップ3: ユーザーに確認
7. **作業内容をユーザーに確認**
   - どのタスクから着手するか
   - 優先順位の変更はあるか

### ステップ4: 作業開始
8. **選択したタスクの実装を開始**
9. **作業完了後、必ずSESSION.mdを更新**

---

## 📞 サポート

- **開発者**: Claude Code
- **プロジェクトオーナー**: muranaka-tenma
- **本番URL**: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/

---

**⚠️ 重要**: セッション開始時に必ずREADME.md→SESSION.mdの順で確認してください。

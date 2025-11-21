# 検証済み正確情報リスト

**作成日**: 2025-11-21
**最終検証日**: 2025-11-21
**重要度**: 🔴🔴🔴 最高
**目的**: すべての正しいURL・パス・情報を1箇所に集約

---

## ⚠️ このドキュメントの使い方

**問題**: 間違った開発環境URL、古いリンク、不正確なパスを何度も送ってしまう

**解決**: このドキュメントに記載されている情報が**唯一の正しい情報**です。
新規セッション開始時は必ずこのファイルを確認してください。

---

## 1. プロジェクトパス（ファイルシステム）

### ✅ 正しい作業ディレクトリ
```
/home/muranaka-tenma/sales-task-manager
```

**確認コマンド**:
```bash
cd /home/muranaka-tenma/sales-task-manager
pwd
```

**期待される出力**:
```
/home/muranaka-tenma/sales-task-manager
```

### ❌ 間違ったディレクトリ（絶対に使わない）
```
/home/muranaka-tenma/タスク管理ツール              # 別プロジェクト（未着手）
/home/muranaka-tenma/タスク管理ツール_archive_*    # アーカイブ（使用禁止）
```

---

## 2. 主要ファイルの絶対パス

### メインアプリケーション
```
/home/muranaka-tenma/sales-task-manager/sales-task-core/index-kanban.html
```

**確認コマンド**:
```bash
ls -lh /home/muranaka-tenma/sales-task-manager/sales-task-core/index-kanban.html
```

**期待される出力**: ファイルサイズ約697Kの HTMLファイル

### その他の重要ファイル
```
/home/muranaka-tenma/sales-task-manager/START_HERE.md
/home/muranaka-tenma/sales-task-manager/TODO-v004-2025-11-20.md
/home/muranaka-tenma/sales-task-manager/PROJECT_STRUCTURE.md
/home/muranaka-tenma/sales-task-manager/HANDOVER_CHECKLIST.md
/home/muranaka-tenma/sales-task-manager/TOOLING_INTEGRATION.md
/home/muranaka-tenma/sales-task-manager/VERIFIED_INFORMATION.md  ← このファイル
```

---

## 3. 開発環境URL

### ✅ 正しい開発環境URL
```
http://localhost:3000/index-kanban.html
```

**重要ポイント**:
- ポート番号: `3000`（固定）
- ファイル名: `index-kanban.html`（`sales-task-core/` は不要）
- `http://` であって `https://` ではない

**アクセス前の確認**:
```bash
# サーバーが起動しているか確認
ps aux | grep live-server | grep -v grep

# 起動していない場合
cd /home/muranaka-tenma/sales-task-manager
npm run dev
```

**サーバー起動コマンド**:
```bash
cd /home/muranaka-tenma/sales-task-manager
npm run dev
# または
npm run dev:open  # ブラウザを自動で開く
```

### ❌ 間違ったURL（使わない）
```
http://localhost:3000/sales-task-core/index-kanban.html  # 余計なパスが入っている
http://localhost:8000/                                    # ポート番号が違う
http://localhost:3000/                                    # ファイル名がない
```

---

## 4. 本番環境URL

### ✅ 正しい本番環境URL

**ルートURL**:
```
https://stellar-biscochitos-e19cb4.netlify.app/
```

**アプリケーションURL**:
```
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```

**リダイレクト設定**:
- `/` → `/sales-task-core/index-kanban.html` (302リダイレクト)
- `/app` → `/sales-task-core/index-kanban.html` (302リダイレクト)

**動作確認コマンド**:
```bash
# ステータスコード確認（200が正常）
curl -s -o /dev/null -w "%{http_code}\n" https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html

# レスポンスヘッダー確認
curl -I https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```

**期待される出力**:
```
HTTP/2 200
cache-control: no-cache,no-store,must-revalidate
content-type: text/html; charset=UTF-8
```

### その他のページURL
```
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/pj-settings.html
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/user-management.html
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/admin-dashboard.html
```

---

## 5. Git情報

### ✅ 正しいGitリポジトリ

**GitHub URL**:
```
https://github.com/muranaka-tenma/sales-task-manager
```

**Gitリモート**:
```
https://github.com/muranaka-tenma/sales-task-manager.git
```

**確認コマンド**:
```bash
cd /home/muranaka-tenma/sales-task-manager
git remote -v
```

**期待される出力**:
```
origin	https://github.com/muranaka-tenma/sales-task-manager.git (fetch)
origin	https://github.com/muranaka-tenma/sales-task-manager.git (push)
```

### ブランチ情報
```
メインブランチ: main
```

**確認コマンド**:
```bash
git branch -vv
```

**期待される出力**:
```
* main 5c35fb9 [origin/main] docs: セッション開始ガイド（START_HERE.md）を追加
```

---

## 6. Netlify情報

### Netlify Webダッシュボード
```
https://app.netlify.com/
```

**プロジェクト名**: sales-task-manager（要確認）

**デプロイ設定ファイル**:
```
/home/muranaka-tenma/sales-task-manager/netlify.toml
```

**デプロイトリガー**: GitHub `main` ブランチへのpush

---

## 7. Firebase情報

### Firebaseコンソール
```
https://console.firebase.google.com/
```

**プロジェクト名**: sales-task-manager（要確認）

**設定ファイル**:
```
/home/muranaka-tenma/sales-task-manager/sales-task-core/firebase-config-auth-fix-20250819-132508.js
```

**データベース**: Firestore Database

**認証**: Firebase Authentication（メール/パスワード）

---

## 8. パッケージ情報

### package.jsonの場所
```
/home/muranaka-tenma/sales-task-manager/package.json
```

### npm scripts

**開発サーバー起動**:
```bash
npm run dev        # サーバー起動（ブラウザを開かない）
npm run dev:open   # サーバー起動（ブラウザを開く）
```

**テスト実行**:
```bash
npm run test       # E2Eテスト実行
npm run test:ui    # テストUIで実行
npm run test:local # ローカルサーバーでテスト
```

---

## 9. ドキュメントファイルの場所

### 最重要ドキュメント
```
/home/muranaka-tenma/sales-task-manager/START_HERE.md
/home/muranaka-tenma/sales-task-manager/HANDOVER_CHECKLIST.md
/home/muranaka-tenma/sales-task-manager/VERIFIED_INFORMATION.md  ← このファイル
```

### TODOファイル（最新）
```
/home/muranaka-tenma/sales-task-manager/TODO-v004-2025-11-20.md
```

### 要件定義（最新）
```
/home/muranaka-tenma/sales-task-manager/handover/requirements/2025-11-20-comprehensive-requirements.md
```

### エラーログ
```
/home/muranaka-tenma/sales-task-manager/error-logs/
```

---

## 10. 環境変数

### .envファイルの場所
```
/home/muranaka-tenma/sales-task-manager/.env
```

**⚠️ 注意**: このファイルは機密情報を含むため、Gitにコミットしない（.gitignoreに含まれている）

---

## 🔍 新規セッション開始時の確認手順

### ステップ1: プロジェクトディレクトリに移動
```bash
cd /home/muranaka-tenma/sales-task-manager
pwd  # 正しいか確認
```

### ステップ2: 開発サーバー起動
```bash
npm run dev
```

### ステップ3: ブラウザでアクセス
```
http://localhost:3000/index-kanban.html
```

### ステップ4: コンソールエラーがないか確認
```
F12 → Console タブ
エラーがないことを確認
```

---

## 📝 情報更新ルール

### このファイルを更新すべきタイミング
1. 新しいURL・パスが追加された
2. 既存のURL・パスが変更された
3. 間違った情報を見つけた
4. 新しいツール・サービスが追加された

### 更新時の手順
1. このファイルを編集
2. 実際に動作確認してから更新
3. 「最終検証日」を更新
4. Git commitして記録を残す

---

## ❓ ユーザーへの確認事項

以下の情報が正しいか確認させてください：

### 確認1: 本番環境URL
```
https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```
**質問**: このURLは現在も正しい本番環境のURLですか？

### 確認2: 開発環境URL
```
http://localhost:3000/index-kanban.html
```
**質問**: 開発環境はこのURLで間違いないですか？

### 確認3: GitHubリポジトリ
```
https://github.com/muranaka-tenma/sales-task-manager
```
**質問**: このリポジトリで間違いないですか？

### 確認4: Firebaseプロジェクト名
**質問**: Firebaseのプロジェクト名は何ですか？（sales-task-manager？）

### 確認5: Netlifyプロジェクト名
**質問**: Netlifyのプロジェクト名は何ですか？（sales-task-manager？）

### 確認6: その他の環境
**質問**: 他に開発環境・ステージング環境などはありますか？

---

## 🚨 間違った情報を送ってしまった場合の対処

### ユーザーに送るべきメッセージ
```
申し訳ございません。間違った情報を送ってしまいました。
正しい情報は VERIFIED_INFORMATION.md に記載されています。

正しい開発環境URL: http://localhost:3000/index-kanban.html
正しい本番環境URL: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```

### その後の対応
1. `error-logs/` に記録
2. このファイル (VERIFIED_INFORMATION.md) を更新
3. 同様のミスを防ぐため、ドキュメントを改善

---

## 📊 検証履歴

| 日付 | 検証者 | 検証内容 | 結果 |
|------|--------|----------|------|
| 2025-11-21 | Claude Code | 開発環境URL確認 | ✅ http://localhost:3000/index-kanban.html |
| 2025-11-21 | Claude Code | 本番環境URL確認 | ✅ https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html |
| 2025-11-21 | Claude Code | Gitリポジトリ確認 | ✅ https://github.com/muranaka-tenma/sales-task-manager.git |
| 2025-11-21 | Claude Code | プロジェクトパス確認 | ✅ /home/muranaka-tenma/sales-task-manager |

---

**最終更新**: 2025-11-21
**次回検証予定**: ユーザーからフィードバックがあったとき、または情報が変更されたとき

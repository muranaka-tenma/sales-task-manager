# ツール連携完全ガイド（Git / Netlify / Firebase）

**作成日**: 2025-11-21
**重要度**: 🔴🔴🔴 最高
**目的**: 二度と同じ引継ぎミスを繰り返さない

---

## 📊 システム全体図

```
ローカル開発環境
  ↓ (コード編集)
Git (ローカル)
  ↓ (git push)
GitHub (リモート)
  ↓ (自動デプロイ)
Netlify (本番環境)
  ↑ ↓
Firebase (データベース・認証)
  ↑ ↓
Slack (通知)
```

---

## 1. Git（バージョン管理）

### 基本情報

| 項目 | 値 |
|------|-----|
| リポジトリ | `https://github.com/muranaka-tenma/sales-task-manager.git` |
| ブランチ | `main` |
| ローカルパス | `/home/muranaka-tenma/sales-task-manager` |

### 現在の状態を確認

```bash
cd /home/muranaka-tenma/sales-task-manager

# ブランチとコミット状態
git status

# 最新のコミット履歴
git log --oneline -5

# リモートとの同期状態
git fetch origin
git status
```

### よく使うコマンド

```bash
# 変更を確認
git status
git diff

# コミット
git add sales-task-core/index-kanban.html
git commit -m "fix: SyntaxError in template literal"

# プッシュ（本番デプロイのトリガー）
git push origin main

# 最新を取得
git pull origin main
```

### ⚠️ 重要なルール

1. **本番デプロイ前に必ずローカルでテスト**
   ```bash
   npm run dev  # localhost:3000でテスト
   ```

2. **コミットメッセージの形式**
   ```
   fix: バグ修正の説明
   feat: 新機能の説明
   docs: ドキュメント更新
   style: コードフォーマット
   refactor: リファクタリング
   test: テスト追加・修正
   ```

3. **push = 本番デプロイ**
   - `git push` するとNetlifyが自動でデプロイする
   - 必ずユーザー承認を得てからpushする

### トラブルシューティング

#### コミットが進まない
```bash
# 現在の状態確認
git status

# 変更を一時退避
git stash

# 最新を取得
git pull origin main

# 退避した変更を戻す
git stash pop
```

#### 間違ってコミットした
```bash
# 最新のコミットを取り消し（変更は保持）
git reset --soft HEAD~1

# 変更を確認して再コミット
git status
```

#### リモートと同期がずれた
```bash
# リモートの状態を確認
git fetch origin
git log origin/main --oneline -5

# ローカルをリモートに合わせる（危険：ローカルの変更が消える）
git reset --hard origin/main
```

---

## 2. Netlify（本番環境）

### 基本情報

| 項目 | 値 |
|------|-----|
| 本番URL | `https://stellar-biscochitos-e19cb4.netlify.app/` |
| アプリURL | `/sales-task-core/index-kanban.html` |
| デプロイ方法 | GitHub連携（自動デプロイ） |
| 設定ファイル | `netlify.toml` |

### デプロイフロー

```
1. ローカルで変更
   ↓
2. git commit でコミット
   ↓
3. git push origin main でプッシュ
   ↓
4. GitHubがWebhookでNetlifyに通知
   ↓
5. Netlifyが自動ビルド・デプロイ（約1-2分）
   ↓
6. 本番環境に反映
```

### デプロイ状態の確認

#### Webダッシュボードで確認
1. https://app.netlify.com/ にアクセス
2. "sales-task-manager" プロジェクトを選択
3. "Deploys" タブでデプロイ履歴を確認

#### CLIで確認（推奨しない：リンク未設定）
```bash
# Netlify CLIはリンクされていないため使用不可
# Webダッシュボードを使用すること
```

### キャッシュの扱い

**netlify.tomlの設定**:
```toml
# HTMLはキャッシュしない
[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

# JavaScriptは1年キャッシュ
[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**重要**: HTMLファイルはキャッシュされないため、デプロイ後すぐに反映される。

### トラブルシューティング

#### デプロイが失敗する
1. Netlify Webダッシュボードで "Deploy log" を確認
2. エラーメッセージを読む
3. 通常はビルドエラーやファイルパス問題

#### デプロイしたのに反映されない
```bash
# ブラウザのハードリフレッシュ
# Chrome/Edge: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# または
# デベロッパーツールを開いて "Disable cache" にチェック
```

#### 本番URLにアクセスできない
```bash
# URLを確認
curl -I https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html

# 200 OK が返ってくれば正常
```

---

## 3. Firebase（データベース・認証）

### 基本情報

| 項目 | 値 |
|------|-----|
| プロジェクト | sales-task-manager |
| 認証 | Firebase Authentication（メール/パスワード） |
| データベース | Firestore Database |
| 設定ファイル | `sales-task-core/firebase-config-auth-fix-20250819-132508.js` |

### データ構造

```
Firestore:
├── users/                         # ユーザー情報
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── role: string
│       └── ...
├── tasks/                         # タスクデータ
│   └── {taskId}/
│       ├── title: string
│       ├── columnId: string
│       ├── assignees: array
│       └── ...
└── projects/                      # プロジェクト
    └── {projectId}/
        ├── name: string
        ├── columns: array
        └── ...
```

### Firebaseコンソールへのアクセス

1. https://console.firebase.google.com/ にアクセス
2. "sales-task-manager" プロジェクトを選択
3. 左メニューから以下を確認可能：
   - **Firestore Database**: データを確認・編集
   - **Authentication**: ユーザー一覧
   - **Usage**: 使用量とクォータ

### データのバックアップ

```bash
# Firebaseコンソールから手動エクスポート
# 1. Firestore Database を開く
# 2. 上部の "..." メニュー → "Export data"
# 3. Cloud Storageにエクスポート
```

### トラブルシューティング

#### データが保存されない
```javascript
// ブラウザのコンソールで確認
// Firebase接続状態をチェック
console.log('Firebase initialized:', firebase.apps.length > 0);
```

#### 認証エラーが出る
```javascript
// コンソールでユーザー情報を確認
firebase.auth().currentUser
```

#### クォータ超過
- Firebaseコンソールで使用量を確認
- 無料枠: 読み取り 50,000/日、書き込み 20,000/日
- 超過時は課金プランへアップグレード

---

## 4. Slack（通知）

### 基本情報

| 項目 | 値 |
|------|-----|
| Webhook設定 | `sales-task-core/slack-notification-config.js` |
| プロキシ | `sales-task-core/slack-proxy.js` |
| 通知タイミング | タスク作成、コメント追加、メンション |

### 設定ファイル

**slack-notification-config.js**:
- Slack Webhook URLが格納されている
- セキュリティのため、URLを分割して保存

**slack-proxy.js**:
- Webhook URLの検出回避機能
- 本番環境でのみ動作

### トラブルシューティング

#### 通知が届かない
```javascript
// コンソールでWebhook URLを確認
console.log('[WEBHOOK-SPLIT] URL設定完了');
```

#### メンション機能が正常動作しない
- **TODO-v004で最優先バグとして記載済み**
- `error-logs/` に解決方法を記録予定

---

## 5. 統合トラブルシューティング

### 本番環境で動くが開発環境で動かない

**原因**:
1. 環境変数の違い
2. ファイルパスの違い
3. CORSポリシーの違い

**解決方法**:
```bash
# .envファイルを確認
cat .env

# 開発サーバーを再起動
npm run dev
```

### 開発環境で動くが本番で動かない

**原因**:
1. デプロイされていないファイルがある
2. 環境変数が本番に設定されていない
3. Netlifyのビルド設定が間違っている

**解決方法**:
```bash
# ファイルがコミットされているか確認
git status

# リモートにプッシュされているか確認
git log origin/main --oneline -5

# Netlifyのデプロイログを確認
# → Webダッシュボードで確認
```

---

## 6. 定期メンテナンス

### 毎週のチェックリスト

- [ ] Firebase使用量を確認（クォータ超過していないか）
- [ ] Gitのコミット履歴を確認（不要なファイルがコミットされていないか）
- [ ] Netlifyのデプロイ履歴を確認（失敗していないか）
- [ ] エラーログを確認（`error-logs/`）

### 毎月のチェックリスト

- [ ] Firebaseデータのバックアップ
- [ ] 依存パッケージの更新（`npm outdated`）
- [ ] セキュリティアップデート（`npm audit`）

---

## 7. 緊急連絡先・リソース

### ドキュメント
- [Firebase Documentation](https://firebase.google.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Documentation](https://docs.github.com/)

### プロジェクト内ドキュメント
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - プロジェクト構造
- [START_HERE.md](./START_HERE.md) - セッション開始ガイド
- [error-logs/](./error-logs/) - エラー対処ログ

---

## 8. よくある質問

### Q: git pushしたらどれくらいで本番に反映される？
**A**: 通常1-2分。Netlify WebダッシュボードでDeployステータスを確認できます。

### Q: 本番環境だけバグが出る場合は？
**A**:
1. Netlifyのデプロイログを確認
2. ブラウザのコンソールでエラーを確認
3. `error-logs/`に記録
4. 開発環境で再現できないか試す

### Q: Firebaseのデータを間違って削除した場合は？
**A**: バックアップから復元。バックアップがない場合は復旧不可能。定期バックアップが重要。

### Q: Gitで何か壊した場合は？
**A**:
```bash
# 最新のコミットを取り消す
git reset --soft HEAD~1

# または、特定のコミットに戻る
git log --oneline
git reset --hard <commit-hash>
```

---

**最終更新**: 2025-11-21
**次回更新予定**: 問題発生時または新機能追加時

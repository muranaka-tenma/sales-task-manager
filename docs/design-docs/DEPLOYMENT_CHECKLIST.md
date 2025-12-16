# デプロイチェックリスト

**作成日**: 2025-11-07
**対象**: LocalStorage→Firebase移行デプロイ
**重要度**: Critical

---

## 事前準備（デプロイ24時間前）

### 1. チーム通知
- [ ] チームメンバーに予定を通知
- [ ] デプロイ時間帯の合意（推奨: 平日午前中）
- [ ] ロールバック担当者の確認
- [ ] 緊急連絡体制の確認

### 2. ドキュメント準備
- [ ] ROLLBACK_PLAN.mdを確認
- [ ] 変更内容のサマリー作成
- [ ] ユーザー向け案内文作成

### 3. 環境準備
- [ ] Firebase Console アクセス確認
- [ ] Netlify Console アクセス確認
- [ ] Gitリポジトリアクセス確認
- [ ] 必要な権限の確認

---

## デプロイ当日（開始2時間前）

### 1. 技術的準備

#### Gitの準備
```bash
# 最新状態に更新
git fetch origin
git status

# 作業ブランチ確認
git branch --show-current

# 現在のコミットハッシュを記録
git log -1 --format="%H" > deployment-$(date +%Y%m%d-%H%M).txt
git log -1 --oneline >> deployment-$(date +%Y%m%d-%H%M).txt
```
- [ ] 実行完了

#### ローカルビルドテスト
```bash
# 依存関係の最新化
npm install

# ビルドテスト
npm run build

# ローカル起動テスト
npm run dev
```
- [ ] ビルド成功
- [ ] ローカル起動成功
- [ ] コンソールエラーなし

#### 型チェック（TypeScriptプロジェクトの場合）
```bash
# 型エラー確認
npm run type-check
# または
npx tsc --noEmit
```
- [ ] 型エラーなし

#### Lintチェック
```bash
# コード品質チェック
npm run lint
npm run lint:fix  # 自動修正可能なものは修正
```
- [ ] Lintエラーなし（警告のみOK）

### 2. バックアップ作成

#### Firebaseバックアップ
```bash
# Firestoreエクスポート
firebase firestore:export gs://[your-bucket]/backups/pre-migration-$(date +%Y%m%d-%H%M)

# または特定コレクションのみ
gcloud firestore export gs://[your-bucket]/backups/$(date +%Y%m%d) \
  --collection-ids=projects,tasks,users
```
- [ ] バックアップ完了
- [ ] バックアップURLを記録: _______________

#### ユーザーデータバックアップ案内
```javascript
// ユーザーに送信するバックアップスクリプト
// メールまたはSlackで送信

const backupData = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  backupData[key] = localStorage.getItem(key);
}
const dataStr = JSON.stringify(backupData, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `backup-${new Date().toISOString()}.json`;
link.click();
URL.revokeObjectURL(url);
```

**送信テンプレート**:
```
件名: 【重要】デプロイ前のデータバックアップのお願い

皆さま

本日XX時にシステムアップデートを実施します。
念のため、以下のスクリプトでデータバックアップを取得してください。

1. タスク管理システムにログイン
2. ブラウザのコンソールを開く（F12キー）
3. 以下のスクリプトを貼り付けて実行

[スクリプト]

バックアップファイルがダウンロードされます。
問題があった場合の復旧に使用します。

ご協力よろしくお願いします。
```

- [ ] バックアップ案内メール送信
- [ ] 主要ユーザーのバックアップ確認

### 3. 環境変数確認

```bash
# .env ファイルの確認
cat .env

# 必要な環境変数がすべて設定されているか
# - FIREBASE_API_KEY
# - FIREBASE_AUTH_DOMAIN
# - FIREBASE_PROJECT_ID
# - FIREBASE_STORAGE_BUCKET
# - FIREBASE_MESSAGING_SENDER_ID
# - FIREBASE_APP_ID
```
- [ ] 全環境変数設定済み
- [ ] Netlify環境変数も同期済み

---

## デプロイ実施（開始30分前）

### 1. 最終確認

#### コードレビュー
```bash
# 変更内容の最終確認
git diff origin/main

# 変更ファイル一覧
git diff --name-only origin/main

# 統計情報
git diff --stat origin/main
```
- [ ] 想定外の変更がないか確認
- [ ] デバッグコードが残っていないか確認
- [ ] console.logが残っていないか確認

#### 変更箇所の再確認
**11箇所の変更リスト**:
1. [ ] プロジェクト一覧取得
2. [ ] プロジェクト作成
3. [ ] プロジェクト更新
4. [ ] プロジェクト削除
5. [ ] プロジェクトメンバー管理
6. [ ] プロジェクト検索
7. [ ] プロジェクト統計
8. [ ] プロジェクト設定
9. [ ] プロジェクトアーカイブ
10. [ ] プロジェクトインポート/エクスポート
11. [ ] isAdmin()セキュリティ修正

各ファイルで以下を確認:
- [ ] LocalStorageコードが完全に削除されている
- [ ] Firebase APIが正しく実装されている
- [ ] エラーハンドリングが適切
- [ ] 型定義が正しい

#### セキュリティチェック
```bash
# 機密情報が含まれていないか確認
git diff origin/main | grep -i "password\|secret\|key\|token"

# 結果が空であることを確認
```
- [ ] APIキーがハードコードされていない
- [ ] パスワードが含まれていない
- [ ] .envファイルがコミットされていない

### 2. テストユーザーでの最終確認

**ローカル環境で実施**:
```bash
npm run dev
```

#### ログインテスト
- [ ] 新規ユーザー登録
- [ ] 既存ユーザーログイン
- [ ] パスワードリセット
- [ ] ログアウト

#### プロジェクト機能テスト
- [ ] プロジェクト作成
- [ ] プロジェクト一覧表示
- [ ] プロジェクト編集
- [ ] プロジェクト削除
- [ ] メンバー追加
- [ ] メンバー削除

#### タスク機能テスト
- [ ] タスク作成
- [ ] タスク一覧表示
- [ ] タスク編集
- [ ] タスク削除
- [ ] ステータス変更

#### セキュリティテスト
```javascript
// ブラウザコンソールで実行
localStorage.setItem('isAdmin', 'true');
// その後、管理画面にアクセスを試みる
// → アクセスできないことを確認（Firebase認証で判定されるべき）
```
- [ ] LocalStorageハック無効化確認

#### パフォーマンステスト
- [ ] 初期ロード時間（目標: 3秒以内）
- [ ] プロジェクト一覧表示（目標: 1秒以内）
- [ ] タスク一覧表示（目標: 1秒以内）
- [ ] ネットワークタブでAPI応答時間確認

#### ブラウザ互換性テスト
- [ ] Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（可能なら）
- [ ] Edge（可能なら）

---

## デプロイ実行

### 方法A: Gitプッシュによる自動デプロイ（推奨）

```bash
# 1. ステージング
git add .

# 2. コミットメッセージ確認
# フォーマット: feat: [変更内容の簡潔な説明]
git commit -m "feat: migrate project management from LocalStorage to Firebase

- Migrate 10 project-related functions to Firebase
- Fix isAdmin() security vulnerability
- Add proper error handling
- Update type definitions
- Total 11 critical changes"

# 3. プッシュ前の最終確認
git log -1 --stat

# 4. プッシュ
git push origin main
```

**タイムスタンプ記録**:
- [ ] プッシュ時刻: _______________

### 方法B: Netlify CLIでのデプロイ

```bash
# 1. ビルド
npm run build

# 2. プレビューデプロイ（オプション）
netlify deploy

# プレビューURLでテスト: _______________

# 3. 本番デプロイ
netlify deploy --prod

# デプロイURL: _______________
```

**タイムスタンプ記録**:
- [ ] デプロイ開始: _______________
- [ ] デプロイ完了: _______________

---

## デプロイ直後の確認（5分以内）

### Tier 1: サイトアクセス確認（1分以内）

```bash
# 1. サイトアクセス
curl -I https://[your-app].netlify.app

# ステータスコード 200 を確認
```

**手動確認**:
- [ ] トップページが表示される
- [ ] 404エラーが出ない
- [ ] ビルドエラーページが表示されない
- [ ] ロード時間が正常（3秒以内）

### Tier 2: 認証機能確認（2分以内）

- [ ] ログインページが表示される
- [ ] テストアカウントでログイン成功
- [ ] ダッシュボードが表示される
- [ ] ログアウト成功

### Tier 3: データ表示確認（3分以内）

- [ ] **タスク一覧**
  - [ ] 既存タスクが表示される
  - [ ] 件数が正しい
  - [ ] データが欠損していない

- [ ] **プロジェクト一覧**
  - [ ] 既存プロジェクトが表示される
  - [ ] 件数が正しい
  - [ ] メンバー情報が正しい

### Tier 4: CRUD操作確認（5分以内）

#### プロジェクト
- [ ] 新規作成
- [ ] 編集
- [ ] 削除
- [ ] メンバー追加
- [ ] メンバー削除

#### タスク
- [ ] 新規作成
- [ ] 編集
- [ ] 削除
- [ ] ステータス変更

### Tier 5: エラーチェック

**ブラウザコンソール**:
```javascript
// F12 → Console タブ
// エラーがないことを確認
```
- [ ] JavaScript エラーなし
- [ ] React エラーなし
- [ ] Firebase エラーなし

**ネットワークタブ**:
- [ ] 500エラーなし
- [ ] 404エラーなし（意図しない）
- [ ] Firebase API 応答正常

### Tier 6: セキュリティ確認

```javascript
// ブラウザコンソールで実行
localStorage.setItem('isAdmin', 'true');
// 管理画面にアクセス
// → 403エラーまたはリダイレクトされることを確認
```
- [ ] LocalStorage改ざんが無効
- [ ] Firebase認証が正しく機能
- [ ] 管理者権限が保護されている

---

## デプロイ後監視（最初の1時間）

### 5分ごとの確認

```bash
# サイトアクセス確認
curl -I https://[your-app].netlify.app

# 結果記録
# [時刻] [ステータスコード] [応答時間]
# 14:00  200  0.5s
# 14:05  200  0.6s
# 14:10  200  0.5s
```

- [ ] 14:00 _______________
- [ ] 14:05 _______________
- [ ] 14:10 _______________
- [ ] 14:15 _______________
- [ ] 14:20 _______________
- [ ] 14:25 _______________
- [ ] 14:30 _______________

### Firebaseコンソール監視

**URL**: https://console.firebase.google.com/project/[your-project]/firestore

- [ ] Firestoreアクセスログ確認
- [ ] エラーログ確認
- [ ] 認証ログ確認
- [ ] 使用量確認（急激な増加がないか）

### Netlifyコンソール監視

**URL**: https://app.netlify.com/sites/[your-site]

- [ ] 関数実行ログ確認
- [ ] エラーログ確認
- [ ] トラフィック確認

### ユーザーフィードバック確認

- [ ] Slack/Discordでの報告確認
- [ ] メールでの報告確認
- [ ] GitHub Issueの確認

---

## 問題発生時の対応フロー

### 判断基準

| 重大度 | 症状 | 対応時間 | アクション |
|--------|------|----------|------------|
| **Critical** | データ消失、全機能停止 | 30秒 | 即座にロールバック |
| **High** | 主要機能停止、セキュリティホール | 5分 | 状況確認→ロールバック判断 |
| **Medium** | 軽微な機能不全、表示崩れ | 30分 | Hot Fix開発 |
| **Low** | 見た目の問題 | 次回デプロイ | Issue登録 |

### Critical: 即座対応

```bash
# 1. Netlifyロールバック（10秒）
netlify rollback

# または管理画面から
# https://app.netlify.com/sites/[your-site]/deploys
# → 前回デプロイの「Publish deploy」

# 2. チーム通知（10秒）
# Slack/Discordに投稿:
```

**通知テンプレート**:
```
🚨 緊急ロールバック実施

【時刻】 [現在時刻]
【対応】 前回の安定版にロールバック完了
【原因】 [簡潔な説明]
【状況】 現在調査中

詳細は15分以内に報告します。
```

- [ ] ロールバック実行
- [ ] 通知送信
- [ ] ROLLBACK_PLAN.md参照

### High: 状況確認後判断

```bash
# 1. ログ確認（1分）
netlify logs
# Firebaseコンソールでエラーログ確認

# 2. 影響範囲確認（1分）
# - 全ユーザーに影響？
# - 特定機能のみ？
# - データ損失リスク？

# 3. 判断（1分）
# Hot Fixで15分以内に修正可能？
#   YES → Hot Fix開発
#   NO  → ロールバック

# 4. 実行（2分）
```

**Hot Fix手順**:
```bash
# 1. 修正コード作成
# 2. ローカルテスト
npm run build
npm run dev

# 3. コミット＆プッシュ
git add .
git commit -m "hotfix: [問題の説明]"
git push origin main

# 4. デプロイ監視
```

---

## デプロイ完了後の事後作業

### 1. ドキュメント更新（1時間以内）

```bash
# 変更履歴を記録
echo "## Deploy: $(date)" >> docs/CHANGELOG.md
echo "- LocalStorage → Firebase migration" >> docs/CHANGELOG.md
echo "- Security fix: isAdmin()" >> docs/CHANGELOG.md
echo "- Files changed: 11" >> docs/CHANGELOG.md
```

- [ ] CHANGELOG.md 更新
- [ ] README.md 更新（必要なら）
- [ ] API仕様書更新（必要なら）

### 2. バックアップの整理

```bash
# 不要な一時ファイル削除
rm deployment-*.txt

# バックアップアーカイブ
mkdir -p backups/2025-11-07
mv *.json backups/2025-11-07/
```

- [ ] ローカルバックアップ整理
- [ ] Firebaseバックアップ確認
- [ ] 1ヶ月後に古いバックアップ削除（カレンダー登録）

### 3. チームへの報告

**成功報告テンプレート**:
```
件名: デプロイ完了報告

皆さま

本日XX時のデプロイが無事完了しました。

【デプロイ内容】
- LocalStorage → Firebase移行（10機能）
- isAdmin()セキュリティ修正
- 合計11箇所の変更

【結果】
✅ エラーなし
✅ パフォーマンス正常
✅ データ損失なし

【今後の監視】
- 24時間の継続監視
- 問題があればすぐに報告ください

ご協力ありがとうございました。
```

- [ ] チーム報告メール送信
- [ ] ミーティングで共有（次回）

### 4. モニタリング設定

**24時間監視スケジュール**:
- [ ] 1時間後: _______________
- [ ] 3時間後: _______________
- [ ] 6時間後: _______________
- [ ] 12時間後: _______________
- [ ] 24時間後: _______________

**確認項目**:
- Firebaseエラーログ
- Netlify関数ログ
- ユーザーからの報告
- パフォーマンスメトリクス

---

## レビューと改善（1週間後）

### 振り返りミーティング

**アジェンダ**:
1. デプロイは成功したか？
2. 問題はあったか？
3. 何がうまくいったか？
4. 何を改善すべきか？
5. 次回に向けた教訓

**ドキュメント作成**:
```markdown
# デプロイ振り返り: 2025-11-07

## 成功要因
- [要因1]
- [要因2]

## 課題
- [課題1]
- [課題2]

## 改善アクション
- [ ] [アクション1]
- [ ] [アクション2]

## 次回への提言
- [提言1]
- [提言2]
```

- [ ] 振り返りミーティング実施
- [ ] ドキュメント作成
- [ ] 改善アクション実施

---

## 緊急連絡先

### 技術担当
- **デプロイ責任者**: muranaka-tenma
  - Email: _______________
  - Slack: @muranaka-tenma
  - 電話: _______________

### エスカレーション先
- **Level 1**: kato-jun
- **Level 2**: asahi-keiichi
- **Level 3**: [CTO/技術責任者]

### 外部サービスサポート
- **Firebase Support**: https://firebase.google.com/support
- **Netlify Support**: https://www.netlify.com/support

---

## 付録

### 便利コマンド集

```bash
# Netlifyデプロイ状況確認
netlify status

# Netlifyログ確認
netlify logs

# Firebase Firestore確認
firebase firestore:indexes

# Gitコミット履歴
git log --oneline -10

# ビルドサイズ確認
npm run build
du -sh dist/

# 依存関係の脆弱性チェック
npm audit
npm audit fix
```

### トラブルシューティング

#### ビルドエラー
```bash
# キャッシュクリア
rm -rf node_modules .next dist
npm install
npm run build
```

#### 環境変数が反映されない
```bash
# Netlify環境変数確認
netlify env:list

# ローカル環境変数確認
cat .env
```

#### Firebaseエラー
```javascript
// Firebaseコンソールログ確認
// https://console.firebase.google.com/project/[your-project]/firestore/usage

// 認証状態確認
firebase.auth().currentUser
```

---

**最終更新**: 2025-11-07
**文書オーナー**: muranaka-tenma
**次回レビュー**: 2025-12-07

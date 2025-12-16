# 緊急ロールバック計画

**作成日**: 2025-11-07
**対象**: LocalStorage→Firebase移行（11箇所の変更）
**想定所要時間**: 最速30秒〜最大5分

---

## 目次
1. [前提条件の確認](#前提条件の確認)
2. [即座の緊急対応（30秒以内）](#即座の緊急対応30秒以内)
3. [Git Revert手順（1-2分）](#git-revert手順1-2分)
4. [手動ロールバック手順（5分）](#手動ロールバック手順5分)
5. [データ復旧手順](#データ復旧手順)
6. [確認チェックリスト](#確認チェックリスト)

---

## 前提条件の確認

### デプロイ前に記録すべき情報
```bash
# 1. 現在のコミットハッシュを記録
git log -1 --oneline > deployment_info.txt
git log -1 --format="%H" >> deployment_info.txt

# 2. 現在のブランチを記録
git branch --show-current >> deployment_info.txt

# 3. Netlifyの現在のデプロイIDを記録
# Netlify管理画面から「Deploy ID」をコピー
# または CLI使用時:
netlify status >> deployment_info.txt

# 4. タイムスタンプ
date >> deployment_info.txt
```

### 現在のGit状態
```bash
# リポジトリの状態確認
git status

# 最新コミットの確認
git log -1 --stat

# リモートとの同期確認
git fetch origin
git status
```

### Netlify状態
- **現在のデプロイURL**: https://[your-app].netlify.app
- **管理画面**: https://app.netlify.com/sites/[your-site]/deploys
- **ビルドコマンド**: (package.jsonのbuild scriptを確認)

---

## 即座の緊急対応（30秒以内）

### シナリオ1: Netlifyでロールバック（最速）

**状況**: デプロイ後すぐに重大な問題が発覚した場合

```bash
# 方法A: Netlify CLI使用
netlify rollback

# 方法B: Netlify管理画面
# 1. https://app.netlify.com/sites/[your-site]/deploys にアクセス
# 2. 「Published deploys」セクションで前回の成功デプロイを探す
# 3. 該当デプロイの「...」メニューから「Publish deploy」を選択
# 4. 確認画面で「Publish」をクリック
```

**所要時間**: 10-30秒
**影響範囲**: フロントエンドのみ（即座に反映）

### シナリオ2: 緊急停止

**状況**: 修正が必要だがロールバックでは不十分な場合

```bash
# サイトを一時的にメンテナンスモードに
# public/_redirects または netlify.toml に設定
# 例: メンテナンスページを表示
/* /maintenance.html 503

# Netlifyに再デプロイ
git add public/_redirects
git commit -m "chore: emergency maintenance mode"
git push origin main
```

---

## Git Revert手順（1-2分）

### 単一コミットのRevert

```bash
# 1. 問題のあるコミットハッシュを特定
git log --oneline -10

# 2. Revertコミットを作成（例: 最新コミットをrevert）
git revert HEAD --no-edit

# または特定のコミットをrevert
git revert <commit-hash> --no-edit

# 3. リモートにプッシュ
git push origin main

# 4. Netlifyが自動デプロイを開始（約1-3分）
```

### 複数コミットのRevert

```bash
# 例: 直近3つのコミットをまとめてrevert
git revert HEAD~2..HEAD --no-edit

# プッシュ
git push origin main
```

### Revertの確認

```bash
# Revert後の状態確認
git log --oneline -5
git diff HEAD~1

# ローカルで動作確認
npm install
npm run dev
```

---

## 手動ロールバック手順（5分）

### Git Resetを使う方法（非推奨・最終手段）

**警告**: この方法は履歴を書き換えます。チームで作業している場合は必ず事前に通知してください。

```bash
# 1. 安全のため現在の状態をバックアップブランチに保存
git branch backup-$(date +%Y%m%d-%H%M%S)

# 2. 前の安全な状態にリセット
git log --oneline -10  # 戻りたいコミットを特定
git reset --hard <safe-commit-hash>

# 3. 強制プッシュ（危険！）
git push origin main --force

# 4. チームメンバーに通知
# チームメンバーは以下を実行する必要あり:
# git fetch origin
# git reset --hard origin/main
```

### ファイル単位のロールバック

```bash
# 特定ファイルのみ前のバージョンに戻す
git log --oneline <ファイルパス>  # 履歴確認
git checkout <commit-hash> -- <ファイルパス>

# 例: プロジェクト管理機能のみ戻す
git checkout HEAD~1 -- src/services/projectService.ts
git checkout HEAD~1 -- src/components/ProjectManagement.tsx

# コミットしてプッシュ
git add .
git commit -m "fix: revert project management changes"
git push origin main
```

---

## データ復旧手順

### LocalStorageからのバックアップ（デプロイ前に実施）

```javascript
// ユーザーに実行してもらうスクリプト
// ブラウザのコンソールで実行

// 1. 現在のLocalStorageを全てエクスポート
const backupData = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  backupData[key] = localStorage.getItem(key);
}

// 2. JSONファイルとしてダウンロード
const dataStr = JSON.stringify(backupData, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `localStorage-backup-${new Date().toISOString()}.json`;
link.click();
URL.revokeObjectURL(url);

console.log('バックアップ完了！ダウンロードフォルダを確認してください。');
```

### LocalStorageのリストア

```javascript
// バックアップJSONファイルからリストア
// 1. ファイル選択UIを表示
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/json';
input.onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const backupData = JSON.parse(event.target.result);

    // LocalStorageに復元
    for (const [key, value] of Object.entries(backupData)) {
      localStorage.setItem(key, value);
    }

    console.log('復元完了！ページをリロードしてください。');
    alert('データを復元しました。ページをリロードします。');
    location.reload();
  };
  reader.readAsText(file);
};
input.click();
```

### Firebaseバックアップ（デプロイ後）

```bash
# Firestore全体のエクスポート（Firebase CLIが必要）
firebase firestore:export gs://[your-bucket]/backups/$(date +%Y%m%d-%H%M%S)

# 特定コレクションのみエクスポート
gcloud firestore export gs://[your-bucket]/backups/projects-$(date +%Y%m%d) \
  --collection-ids=projects,tasks,users
```

### Firebaseデータのインポート

```bash
# バックアップから復元
firebase firestore:import gs://[your-bucket]/backups/[backup-name]
```

---

## 確認チェックリスト

### デプロイ前チェックリスト

- [ ] **Gitコミット完了**
  - [ ] 変更内容を確認: `git diff HEAD`
  - [ ] コミットメッセージが明確
  - [ ] 現在のコミットハッシュを記録

- [ ] **ローカルでの動作確認**
  - [ ] `npm run build` が成功
  - [ ] ブラウザでログイン確認
  - [ ] タスク作成・表示確認
  - [ ] プロジェクト作成・表示確認
  - [ ] コンソールエラーなし

- [ ] **バックアップ取得**
  - [ ] LocalStorageバックアップスクリプト実行
  - [ ] ユーザーにバックアップ依頼メール送信
  - [ ] Firebase現在のデータをエクスポート

- [ ] **ロールバック準備**
  - [ ] このドキュメントを開いておく
  - [ ] Netlify管理画面を別タブで開く
  - [ ] Gitコマンド履歴を確認

- [ ] **緊急連絡先確認**
  - [ ] チームメンバーの連絡先
  - [ ] Slack/Discordチャンネル
  - [ ] エスカレーション先

### デプロイ後チェックリスト（5分以内）

**Tier 1: 即座確認（1分以内）**
- [ ] **サイトアクセス確認**
  - [ ] トップページが表示される
  - [ ] 404エラーが出ない
  - [ ] ビルドエラーが表示されない

**Tier 2: 基本機能確認（2分以内）**
- [ ] **認証機能**
  - [ ] ログインページが表示される
  - [ ] 既存アカウントでログインできる
  - [ ] ログアウトできる

- [ ] **データ表示**
  - [ ] タスク一覧が表示される
  - [ ] プロジェクト一覧が表示される
  - [ ] 既存データが消えていない

**Tier 3: CRUD操作確認（5分以内）**
- [ ] **タスク機能**
  - [ ] 新規タスク作成
  - [ ] タスク編集
  - [ ] タスク削除
  - [ ] タスクステータス変更

- [ ] **プロジェクト機能**
  - [ ] 新規プロジェクト作成
  - [ ] プロジェクト編集
  - [ ] プロジェクト削除

- [ ] **エラーチェック**
  - [ ] ブラウザコンソールにエラーなし
  - [ ] ネットワークタブで500エラーなし
  - [ ] Firebase接続エラーなし

**Tier 4: セキュリティ確認（追加2分）**
- [ ] **isAdmin()チェック**
  - [ ] 一般ユーザーで管理画面にアクセスできない
  - [ ] `localStorage.setItem('isAdmin', 'true')` が無効
  - [ ] 管理者専用機能が保護されている

### 問題発見時の判断フロー

```
問題を発見
    ↓
Critical? (データ消失・全機能停止)
    ↓YES → 即座にNetlifyロールバック（30秒）
    ↓NO
    ↓
High? (主要機能停止・セキュリティホール)
    ↓YES → Git revert + プッシュ（2分）
    ↓NO
    ↓
Medium? (表示崩れ・軽微なバグ)
    ↓YES → Hot Fix開発 + テスト + デプロイ（15-30分）
    ↓NO
    ↓
Low? (見た目の問題・非重要機能)
    ↓YES → 次回デプロイで修正（Issue登録）
```

---

## 緊急時連絡フロー

### 重大度: Critical（データ消失・全機能停止）

**対応時間**: 即座（30秒以内）

```
1. Netlifyロールバック実行
2. Slack/Discordで全体通知:
   「緊急: システムをロールバックしました。原因調査中です。」
3. GitHub Issueを作成（Critical タグ）
4. 原因特定まで新規デプロイ禁止
```

**通知テンプレート**:
```
🚨 緊急ロールバック実施

【時刻】 2025-11-07 14:30
【対応】 前回の安定版にロールバック完了
【影響】 約2分間サービス不安定
【状況】 現在は正常稼働中
【原因】 調査中（1時間以内に報告予定）

ご不便をおかけして申し訳ございません。
```

### 重大度: High（主要機能停止・セキュリティホール）

**対応時間**: 5分以内

```
1. 状況確認（1分）
   - ログ確認
   - エラー内容特定
   - 影響範囲確認

2. 判断（1分）
   - ロールバック or Hot Fix?
   - Hot Fixで15分以内に修正可能？
     YES → Hot Fix開発
     NO  → ロールバック

3. 実行（2分）
   - Git revert + プッシュ
   - または Hot Fix開発開始

4. 通知（1分）
   - チーム全体に状況共有
```

### 重大度: Medium（表示崩れ・軽微な機能不全）

**対応時間**: 30分以内

```
1. Issue作成（優先度: High）
2. Hot Fix開発（15分）
3. ローカルテスト（5分）
4. デプロイ（5分）
5. 動作確認（5分）
```

### 重大度: Low（見た目の問題）

**対応時間**: 次回デプロイ時

```
1. Issue作成（優先度: Medium/Low）
2. 次回スプリントに含める
3. ユーザーに既知の問題として周知
```

---

## 段階的デプロイ戦略（推奨）

### Phase 1: 開発者のみ（1-2時間）

**目的**: 実環境での最終確認

```bash
# 1. 開発用ブランチにデプロイ
git checkout -b deploy-test
git push origin deploy-test

# 2. Netlifyで新しいブランチデプロイを作成
# https://app.netlify.com/sites/[your-site]/settings/deploys
# Branch deploys → Add branch: deploy-test

# 3. テストURL経由でアクセス
# https://deploy-test--[your-site].netlify.app
```

**テスト項目**:
- [ ] 全デプロイ後チェックリストを実施
- [ ] 異なるブラウザでテスト（Chrome, Firefox, Safari）
- [ ] モバイルブラウザでテスト
- [ ] パフォーマンス確認（Lighthouse）

**テスター**: muranaka-tenma

**判断基準**:
- 全チェック項目が合格 → Phase 2へ
- 問題発見 → 修正して再テスト

### Phase 2: 管理者のみ（1日）

**目的**: 複数ユーザーでの動作確認

**手順**:
```bash
# mainブランチにマージ
git checkout main
git merge deploy-test
git push origin main

# 管理者のみに先行案内
```

**通知メール例**:
```
件名: 【先行テスト】タスク管理システム更新のお知らせ

○○さま

タスク管理システムのアップデートを実施しました。
本日〜明日の間、先行テストにご協力ください。

【主な変更点】
- データ保存方法の改善（LocalStorage → Firebase）
- セキュリティ強化
- パフォーマンス改善

【確認事項】
✓ ログインできるか
✓ 既存のタスク・プロジェクトが表示されるか
✓ 新規作成・編集・削除ができるか

問題があればすぐにご連絡ください。

テストURL: https://[your-app].netlify.app
```

**テスター**: kato-jun, asahi-keiichi（想定）

**監視期間**: 24時間

**監視項目**:
- [ ] Firebaseエラーログ確認
- [ ] Netlify関数ログ確認
- [ ] ユーザーからの報告

### Phase 3: 全ユーザー公開

**判断基準**:
- Phase 2で24時間問題なし
- 管理者全員が承認

**手順**:
```bash
# すでにmainにマージ済みのため追加作業なし
# 全ユーザーに案内メール送信
```

**通知メール例**:
```
件名: タスク管理システムアップデートのお知らせ

皆さま

タスク管理システムをアップデートしました。

【主な改善点】
✨ データの信頼性向上
✨ セキュリティ強化
✨ 動作速度改善

特別な操作は不要です。
引き続きご利用ください。

何か問題があれば support@example.com までご連絡ください。
```

---

## トラブルシューティング

### よくある問題と対処法

#### 問題1: Netlifyロールバックが効かない

**症状**: ロールバック後も新しいバージョンが表示される

**原因**: ブラウザキャッシュ

**対処法**:
```bash
# ユーザーに実施してもらう
1. Ctrl + Shift + R（強制リロード）
2. または ブラウザのキャッシュクリア
3. または シークレットモードで確認
```

#### 問題2: Git revertがコンフリクトする

**症状**: `git revert` 実行時にコンフリクトエラー

**対処法**:
```bash
# 1. Revertを中止
git revert --abort

# 2. 手動で前の状態に戻す
git checkout <safe-commit-hash> -- <conflicting-file>

# 3. コミット
git add .
git commit -m "fix: manual rollback due to conflict"
git push origin main
```

#### 問題3: Firebaseデータが表示されない

**症状**: ロールバック後もデータが空

**原因**: LocalStorageとFirebaseの混在

**対処法**:
```javascript
// ブラウザコンソールで確認
console.log('LocalStorage:', localStorage);
console.log('Firebase Auth:', firebase.auth().currentUser);

// LocalStorageバックアップから復元
// （上記「LocalStorageのリストア」セクション参照）
```

#### 問題4: ビルドが失敗する

**症状**: Netlifyデプロイ時にビルドエラー

**対処法**:
```bash
# ローカルで再現
npm run build

# エラーログ確認
cat /var/log/netlify-build.log  # Netlify上

# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 事後対応

### デプロイ成功後

```bash
# 1. deployment_info.txt に結果を追記
echo "Deploy Success: $(date)" >> deployment_info.txt
echo "No rollback needed" >> deployment_info.txt

# 2. バックアップブランチ削除（1週間後）
git branch -D backup-20251107-*

# 3. ドキュメント更新
# - 変更履歴を記録
# - 学んだ教訓を共有
```

### ロールバック実施後

```bash
# 1. 原因分析ドキュメント作成
# docs/post-mortem/2025-11-07-rollback.md

# 2. 改善策の実施
# - テストケース追加
# - CI/CD改善
# - レビュープロセス見直し

# 3. チームミーティング
# - 何が問題だったか
# - どう防ぐか
# - プロセス改善
```

### テンプレート: Post-Mortem レポート

```markdown
# Post-Mortem: [日付] デプロイロールバック

## 概要
- **日時**: 2025-11-07 14:30
- **影響時間**: 2分
- **影響範囲**: 全ユーザー
- **重大度**: Critical/High/Medium/Low

## タイムライン
- 14:00 - デプロイ開始
- 14:02 - 問題発見
- 14:03 - ロールバック決定
- 14:05 - ロールバック完了

## 根本原因
（何が問題だったか）

## 影響
- ユーザー数: X人
- データ損失: なし/あり
- ダウンタイム: X分

## 対応
1. 即座にロールバック
2. 原因調査
3. 修正版デプロイ

## 今後の防止策
1. XXXのテストケース追加
2. YYYのレビュープロセス強化
3. ZZZの監視アラート設定

## 学んだ教訓
- （教訓1）
- （教訓2）
```

---

## 参考資料

### 関連ドキュメント
- [デプロイ手順](./DEPLOYMENT.md)
- [データバックアップ手順](./BACKUP.md)
- [緊急連絡先リスト](./CONTACTS.md)

### 外部リンク
- [Netlify Rollback Documentation](https://docs.netlify.com/site-deploys/manage-deploys/#deploy-actions)
- [Firebase Firestore Export/Import](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Git Revert Guide](https://git-scm.com/docs/git-revert)

---

**最終更新**: 2025-11-07
**文書オーナー**: muranaka-tenma
**レビュー周期**: 四半期ごと

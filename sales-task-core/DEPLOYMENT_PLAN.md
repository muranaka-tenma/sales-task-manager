# 🚀 Netlifyデプロイ計画書 - Firebase統合版

## 🎯 目標
誰でログインしても「邨中天真」と表示される問題を解決し、Firebase統合によるリアルタイムマルチユーザーシステムを本番環境で稼働させる

## 📋 必要な工程

### 1. 現状確認（5分）
```bash
# Gitリポジトリの状態確認
git status
git remote -v

# 変更されたファイル一覧
git diff --name-only
```

### 2. ローカルの修正内容まとめ（10分）
**修正済みファイル：**
- `index-kanban.html` - Firebase認証とセッション同期機能追加
- `login.html` - Firebase認証統合
- `firebase-config.js` - チーム共有モード設定（ユーザーフィルタリング削除）
- `shared-users-database.js` - 無効化（キャッシュ問題対策）
- `user-management.html` - Firebase連携

### 3. Gitコミット（5分）
```bash
# すべての変更をステージング
git add .

# コミット
git commit -m "🔧 Firebase統合完了 - マルチユーザー対応とセッション同期修正

- 他ユーザーでログインしても正しい名前が表示されるよう修正
- shared-users-database.jsを無効化（キャッシュ問題解決）
- チーム共有モードでタスク・テンプレートを全員で共有
- Firebase認証とLocalStorageセッションの自動同期"
```

### 4. Netlifyへデプロイ（3分）
```bash
# mainブランチにプッシュ（Netlifyが自動デプロイ）
git push origin main

# または手動デプロイの場合
netlify deploy --prod
```

### 5. デプロイ確認（2分）
- Netlifyダッシュボードでビルド状況確認
- デプロイ完了まで待機

### 6. 本番環境テスト（10分）

#### A. キャッシュクリア
1. Chrome: Ctrl+Shift+Delete → キャッシュされた画像とファイル → 削除
2. または新規シークレットウィンドウを使用

#### B. 各ユーザーでテスト
1. **kato-jun**でログイン → 「加藤純」と表示されることを確認
2. **hanzawa-yuka**でログイン → 「半澤侑果」と表示されることを確認
3. **muranaka-tenma**でログイン → 「邨中天真」と表示されることを確認

#### C. リアルタイム同期テスト
1. PCとスマホで同時にログイン
2. PCでタスク作成 → スマホで即座に表示確認
3. スマホでタスク移動 → PCで即座に反映確認

### 7. 機能確認（5分）
- [ ] メンション機能
- [ ] PJ作成・共有
- [ ] 他者へのタスク追加
- [ ] テンプレート共有

## ⚠️ 注意事項
1. **Firebase APIキーは公開されているが問題なし**（Firebaseセキュリティルールで保護）
2. **ブラウザキャッシュ**が原因で古い動作をする場合は、必ずキャッシュクリア
3. **Netlifyのビルド設定**でNode.jsバージョンが適切か確認

## 🔄 ロールバック計画
問題が発生した場合：
```bash
# 前のコミットに戻す
git revert HEAD
git push origin main
```

## 📞 サポート
- Netlifyステータス: https://www.netlifystatus.com/
- Firebaseステータス: https://status.firebase.google.com/

---
作成日: 2025-08-06
最終確認: デプロイ前に必ず全項目をチェック
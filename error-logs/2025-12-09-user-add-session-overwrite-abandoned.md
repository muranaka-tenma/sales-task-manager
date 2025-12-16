# エラー対処ログ: ユーザー追加時のセッション上書き問題

**日付**: 2025-12-09
**ステータス**: ❌ 放棄（対応不可）
**初出**: v004（2025-11-20）

---

## 問題の概要

ユーザー管理画面で新規ユーザーを追加すると、自動でそのユーザーにログインされてしまう。

### 症状
- ヘッダーのユーザー名が新規ユーザーに切り替わる
- マイページが新規ユーザーの情報で表示される
- 元のユーザー（管理者）のセッションが失われる

---

## 根本原因

**Firebase Authの仕様**: `createUserWithEmailAndPassword()`を呼び出すと、Firebase Authが**自動的に新規ユーザーでログイン状態にする**。

これはFirebaseの設計上の動作であり、フロントエンドだけでは防止できない。

### 技術的な流れ

1. 管理者が新規ユーザーを作成
2. `FirebaseAuth.createUser()` → `createUserWithEmailAndPassword()` が実行される
3. Firebase Authが新規ユーザーでログイン状態にする
4. `onAuthStateChanged`が発火
5. `currentSession`が新規ユーザーの情報で上書きされる

---

## 試した対策

### 対策1: onAuthStateChangedでセッション保護

```javascript
// firebase-config-auth-fix-20250819-132508.js
const existingSession = JSON.parse(localStorage.getItem('currentSession') || 'null');
if (!existingSession || existingSession.user.email === user.email) {
    localStorage.setItem('currentSession', JSON.stringify(sessionData));
}
```

**結果**: ❌ 効果なし
- Firebase Authが既にログインユーザーを切り替えているため、`user.email`が新規ユーザーになっている

### 対策2: ユーザー作成前後でセッション保存・復元

```javascript
// user-management.html
const savedSession = localStorage.getItem('currentSession');
const authResult = await window.FirebaseAuth.createUser(email, password, name);
if (savedSession) {
    localStorage.setItem('currentSession', savedSession);
}
```

**結果**: ❌ 効果なし
- `onAuthStateChanged`が非同期で発火し、復元後に再度上書きされる

---

## 根本的な解決方法（将来対応）

### Firebase Admin SDK（サーバーサイド）の導入

Admin SDKを使えば、現在のユーザーのログイン状態を維持したままユーザーを作成できる。

```javascript
// サーバーサイド（Node.js）
const admin = require('firebase-admin');
admin.auth().createUser({
    email: 'newuser@example.com',
    password: 'password123',
    displayName: '新規ユーザー'
});
```

**必要な作業**:
1. Firebase Admin SDKをセットアップ
2. Netlify Functionsまたは別のバックエンドサービスを構築
3. フロントエンドからAPIを呼び出す形式に変更

**工数**: 4-6時間

---

## 決定事項

- **放棄**: フロントエンドだけでは対応不可
- **将来対応**: Firebase Admin SDK導入時に再検討
- **運用回避策**: ユーザー追加後は手動でページをリロードしてもらう

---

## 関連ファイル

- `sales-task-core/user-management.html` - ユーザー追加処理
- `sales-task-core/firebase-config-auth-fix-20250819-132508.js` - Firebase認証設定

---

**最終更新**: 2025-12-09
**担当者**: Claude Code

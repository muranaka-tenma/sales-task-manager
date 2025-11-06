# B-d 権限管理Firebase移行 - 分析レポート

## 1. 失敗原因の特定

### dbcba79での問題点

#### 🔴 問題1: 無限ループ（循環参照）の発生

**原因**:
`index-kanban.html`内に定義された`getCurrentUser()`関数が、自分自身を呼び出す循環参照を引き起こした。

**コード分析** (`dbcba79:sales-task-core/index-kanban.html` line 2422):
```javascript
// ❌ 問題のあるコード
function getCurrentUser() {
    // Firebase設定ファイルで定義されたwindow.getCurrentUser()を使用
    if (typeof window.getCurrentUser === 'function') {
        return window.getCurrentUser();  // ⚠️ これが自分自身を呼んでしまう！
    }
    // ... フォールバック処理
}
```

**発生メカニズム**:
1. `index-kanban.html`読み込み時、ローカル関数`getCurrentUser()`が定義される
2. JavaScript実行時、この関数が`window`オブジェクトに自動的にアタッチされる可能性がある
3. 関数内で`typeof window.getCurrentUser === 'function'`がtrueになる（自分自身を指す）
4. `window.getCurrentUser()`を呼び出す → 自分自身を再度呼び出す
5. **無限再帰ループ** → スタックオーバーフロー → ブラウザフリーズ

**影響**:
- ページ読み込み時にログインチェックが実行されない
- すべての権限チェックが失敗
- タスク表示などが動作しない

---

#### 🔴 問題2: Firebase設定ファイルの読み込みタイミング問題

**原因**:
`firebase-config-auth-fix-20250819-132508.js`の`window.getCurrentUser()`が定義される前に、`index-kanban.html`の`getCurrentUser()`が実行された可能性。

**タイミング図**:
```
[正常な期待動作]
1. firebase-config-auth-fix-20250819-132508.js 読み込み
2. window.getCurrentUser() 定義
3. index-kanban.html 読み込み
4. ローカル getCurrentUser() → window.getCurrentUser() を参照

[実際の失敗ケース]
1. index-kanban.html 読み込み（先に実行）
2. ローカル getCurrentUser() 定義（window.getCurrentUserが未定義）
3. firebase-config-auth-fix-20250819-132508.js 読み込み（遅延）
4. 循環参照発生
```

**影響**:
- ページ読み込み順序に依存する不安定な動作
- ログイン失敗・タスク消失などのランダムな不具合

---

#### 🔴 問題3: Firestoreユーザー情報の未登録

**原因**:
`users/{uid}`コレクションにユーザー情報が登録されていない場合、roleが取得できない。

**コード分析** (`dbcba79:firebase-config-auth-fix-20250819-132508.js` line 47-78):
```javascript
const userDoc = await getDoc(doc(db, 'users', user.uid));

if (userDoc.exists()) {
    const userData = userDoc.data();
    userRole = userData.role || 'user'; // ✅ Firestoreから取得
} else {
    // ⚠️ フォールバック処理はあるが、currentSession更新時に問題
    console.warn('⚠️ [AUTH] Firestoreにユーザー情報なし。フォールバック使用');
    userRole = roleMap[user.email] || 'user';
}
```

**影響**:
- 既存ユーザーがログインできない
- role情報が不正確になる

---

## 2. 現在のlocalStorage依存箇所（完全リスト）

### index-kanban.html内のlocalStorage依存

| 行番号 | コード | 用途 | 優先度 |
|--------|--------|------|--------|
| 2417 | `localStorage.getItem('currentSession')` | ユーザー情報取得 | 🔴 高 |
| 2434 | `localStorage.removeItem('currentSession')` | セッションクリア | 🟡 中 |
| 2439 | `localStorage.getItem('currentUser')` | フォールバック | 🟢 低 |
| 7246 | `localStorage.getItem('userRole')` | **管理者権限チェック（ブラックテーマ）** | 🔴 **最優先** |

### その他のファイル

| ファイル | 行番号 | コード | 用途 |
|---------|--------|--------|------|
| `my-profile.html` | 307 | `localStorage.getItem('currentSession')` | プロフィール表示 |
| `user-management.html` | 298 | `localStorage.getItem('currentSession')` | ユーザー管理権限 |
| `user-management.html` | 928 | `localStorage.getItem('currentSession')` | ユーザー管理権限 |
| `admin-dashboard.html` | 217 | `localStorage.getItem('currentSession')` | ダッシュボード権限 |
| `pj-create.html` | 228 | `localStorage.getItem('currentSession')` | プロジェクト作成 |
| `login.html` | 696 | `localStorage.getItem('currentSession')` | ログイン状態確認 |

**⚠️ 最重要問題**:
- **line 7246の`localStorage.getItem('userRole')`はcurrentSessionから独立した別の値を参照している**
- これは完全にクライアント側で改変可能なセキュリティホール

---

## 3. 正しい実装方針

### 基本アプローチ

#### 原則1: 循環参照の回避
- `index-kanban.html`内の`getCurrentUser()`を**完全に削除**せず、**リネーム**して共存させる
- 例: `getCurrentUserLocal()` または `_getCurrentUserCompat()`

#### 原則2: Firebase設定ファイルを唯一の真実源とする
- `window.getCurrentUser()`はFirebase設定ファイルでのみ定義
- 他のファイルはすべて`window.getCurrentUser()`を参照

#### 原則3: 段階的移行（Big Bangアプローチを避ける）
- Step 1: Firebase設定ファイルの強化（非同期版追加）
- Step 2: localStorage.getItem('userRole')の完全削除
- Step 3: 各HTMLファイルの段階的移行（1ファイルずつテスト）

---

### 段階的実装手順

#### Step 1: Firebase設定ファイルの修正（firebase-config-auth-fix-20250819-132508.js）

**目的**: Firestoreからroleを確実に取得し、LocalStorageに保存する

**変更内容**:
```javascript
// onAuthStateChangedでFirestoreからroleを取得
onAuthStateChanged(auth, async (user) => {
    if (user) {
        let userRole = 'user';
        let displayName = user.email === 'muranaka-tenma@terracom.co.jp' ? '邨中天真' :
                         user.displayName || user.email.split('@')[0];

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                userRole = userData.role || 'user';
                displayName = userData.displayName || displayName;
                console.log('✅ [AUTH] Firestoreからrole取得成功:', userRole);
            } else {
                // 🔥 Firestoreにユーザー情報がない場合は自動作成
                const roleMap = {
                    'muranaka-tenma@terracom.co.jp': 'developer',
                    'kato-jun@terracom.co.jp': 'admin',
                    'asahi-keiichi@terracom.co.jp': 'admin',
                    'hanzawa-yuka@terracom.co.jp': 'user',
                    'tamura-wataru@terracom.co.jp': 'user',
                    'hashimoto-yumi@terracom.co.jp': 'user',
                    'fukushima-ami@terracom.co.jp': 'user'
                };
                userRole = roleMap[user.email] || 'user';

                // Firestoreに新規登録
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName,
                    role: userRole,
                    createdAt: new Date().toISOString(),
                    isDisabled: false,
                    isHidden: false
                });
                console.log('✅ [AUTH] Firestoreにユーザー情報を作成:', user.email);
            }
        } catch (error) {
            console.error('❌ [AUTH] Firestore取得エラー、フォールバック使用:', error);
            const roleMap = { /* ... */ };
            userRole = roleMap[user.email] || 'user';
        }

        // currentSessionとuserRoleの両方をLocalStorageに保存
        const sessionData = {
            user: {
                id: user.uid,
                name: displayName,
                email: user.email,
                role: userRole
            },
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        localStorage.setItem('userRole', userRole); // 🔥 互換性のため追加

        console.log('✅ [AUTH] セッション情報保存完了:', sessionData);
    } else {
        localStorage.removeItem('currentSession');
        localStorage.removeItem('userRole');
    }
});

// window.getCurrentUser()の定義（同期版）
window.getCurrentUser = function() {
    try {
        const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
        if (session && session.user) {
            return {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
                isLoggedIn: true
            };
        }
    } catch (error) {
        console.error('❌ [GET-USER] セッション取得エラー:', error);
    }

    return {
        id: null,
        name: 'ゲスト',
        email: null,
        role: 'guest',
        isLoggedIn: false
    };
};

// window.getCurrentUserAsync()の定義（非同期版）
window.getCurrentUserAsync = async function() {
    if (!window.currentFirebaseUser) {
        return window.getCurrentUser();
    }

    try {
        const userDocRef = doc(db, 'users', window.currentFirebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName = window.currentFirebaseUser.email === 'muranaka-tenma@terracom.co.jp' ?
                               '邨中天真' :
                               userData.displayName || userData.name || window.currentFirebaseUser.email.split('@')[0];

            const userInfo = {
                id: window.currentFirebaseUser.uid,
                name: displayName,
                email: window.currentFirebaseUser.email,
                role: userData.role || 'user',
                isLoggedIn: true
            };

            // currentSessionを更新
            const sessionData = {
                user: {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    role: userInfo.role
                },
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('currentSession', JSON.stringify(sessionData));
            localStorage.setItem('userRole', userInfo.role); // 🔥 互換性のため更新

            return userInfo;
        }
    } catch (error) {
        console.error('❌ [GET-USER-ASYNC] Firestore取得エラー:', error);
    }

    return window.getCurrentUser();
};
```

**テスト方法**:
```javascript
// ブラウザコンソールで確認
console.log('現在のユーザー:', window.getCurrentUser());
window.getCurrentUserAsync().then(user => console.log('非同期取得:', user));
```

---

#### Step 2: index-kanban.htmlの修正

**目的**: 循環参照を回避し、Firebase設定ファイルのwindow.getCurrentUser()を使用

**変更内容**:

##### 2-1. getCurrentUser()関数の削除（line 2414-2461）

**削除するコード**:
```javascript
// ❌ 削除
function getCurrentUser() {
    try {
        const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
        // ...
    }
    // ...
}
```

**理由**:
- Firebase設定ファイルの`window.getCurrentUser()`と重複
- 循環参照の原因

##### 2-2. localStorage.getItem('userRole')の削除（line 7246）

**現在のコード**:
```javascript
function isAdmin() {
    return localStorage.getItem('userRole') === 'admin'; // ❌ セキュリティリスク
}
```

**修正後**:
```javascript
function isAdmin() {
    const currentUser = window.getCurrentUser();
    return currentUser.role === 'admin' || currentUser.role === 'developer';
}
```

**理由**:
- LocalStorageのuserRoleは改変可能
- window.getCurrentUser()で一元管理

**テスト方法**:
1. ログイン後、ブラックテーマを選択
2. 管理者でない場合、エラーメッセージが表示されることを確認

---

#### Step 3: その他のHTMLファイルの修正

**対象ファイル**:
- `my-profile.html`
- `user-management.html`
- `admin-dashboard.html`
- `pj-create.html`
- `login.html`

**修正方針**:
1. 独自の`getCurrentUser()`実装を削除
2. `window.getCurrentUser()`を使用
3. Firebase設定ファイルを読み込み

**例（my-profile.html）**:
```html
<!-- Firebase設定ファイル読み込み -->
<script type="module" src="./firebase-config-auth-fix-20250819-132508.js"></script>

<script>
    // ❌ 削除
    // function getCurrentUser() { ... }

    // ✅ 使用
    const currentUser = window.getCurrentUser();
    console.log('現在のユーザー:', currentUser);
</script>
```

---

#### Step 4: Firestoreユーザー情報の登録

**目的**: 既存ユーザーの`users/{uid}`情報を作成

**方法1: 自動作成（推奨）**
- Step 1の実装により、ログイン時に自動作成される
- 各ユーザーが1回ログインすればFirestoreに登録される

**方法2: 管理者による手動作成**
- Firebase Console → Firestore Database → `users`コレクション
- 各ユーザーのuidでドキュメント作成
- 必須フィールド:
  ```json
  {
    "uid": "FIREBASE_AUTH_UID",
    "email": "user@example.com",
    "displayName": "ユーザー名",
    "role": "developer|admin|user",
    "createdAt": "2025-11-06T10:00:00.000Z",
    "isDisabled": false,
    "isHidden": false
  }
  ```

**テスト方法**:
1. 各ユーザーでログイン
2. Firebase Console → Firestore → `users`コレクションを確認
3. uidでドキュメントが作成されていることを確認

---

## 4. 実装コード案

### firebase-config-auth-fix-20250819-132508.jsの修正

**変更箇所**: line 38-136

```javascript
// Firebase認証状態監視
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log('🔐 Firebase認証成功:', user.email);
        window.currentFirebaseUser = user;

        // 🔥 Firestoreからユーザーのroleを取得
        let userRole = 'user';
        let displayName = user.email === 'muranaka-tenma@terracom.co.jp' ? '邨中天真' :
                         user.displayName || user.email.split('@')[0];

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                userRole = userData.role || 'user';
                displayName = user.email === 'muranaka-tenma@terracom.co.jp' ? '邨中天真' :
                             userData.displayName || userData.name || user.email.split('@')[0];

                console.log('✅ [AUTH] Firestoreからrole取得:', userRole);
            } else {
                // Firestoreにユーザー情報がない場合は自動作成
                console.warn('⚠️ [AUTH] Firestoreにユーザー情報なし。新規作成します:', user.email);

                const roleMap = {
                    'muranaka-tenma@terracom.co.jp': 'developer',
                    'kato-jun@terracom.co.jp': 'admin',
                    'asahi-keiichi@terracom.co.jp': 'admin',
                    'hanzawa-yuka@terracom.co.jp': 'user',
                    'tamura-wataru@terracom.co.jp': 'user',
                    'hashimoto-yumi@terracom.co.jp': 'user',
                    'fukushima-ami@terracom.co.jp': 'user'
                };

                userRole = roleMap[user.email] || 'user';

                // Firestoreに新規登録
                await setDoc(userDocRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName,
                    role: userRole,
                    createdAt: new Date().toISOString(),
                    isDisabled: false,
                    isHidden: false
                });

                console.log('✅ [AUTH] Firestoreにユーザー情報を作成:', user.email, 'role:', userRole);
            }
        } catch (error) {
            console.error('❌ [AUTH] Firestore取得エラー、フォールバック使用:', error);

            // エラー時はハードコードマップを使用
            const roleMap = {
                'muranaka-tenma@terracom.co.jp': 'developer',
                'kato-jun@terracom.co.jp': 'admin',
                'asahi-keiichi@terracom.co.jp': 'admin',
                'hanzawa-yuka@terracom.co.jp': 'user',
                'tamura-wataru@terracom.co.jp': 'user',
                'hashimoto-yumi@terracom.co.jp': 'user',
                'fukushima-ami@terracom.co.jp': 'user'
            };

            userRole = roleMap[user.email] || 'user';
        }

        // セッション情報をローカルストレージに保存（Firestoreから取得したrole）
        const sessionData = {
            user: {
                id: user.uid,
                name: displayName,
                email: user.email,
                role: userRole
            },
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        localStorage.setItem('userRole', userRole); // 🔥 互換性のため（段階的削除予定）

        console.log('✅ [AUTH] セッション情報保存完了:', {
            email: user.email,
            role: userRole,
            displayName: displayName
        });

        // ハンバーガーメニューを更新
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
                console.log('🍔 [FIREBASE] Firebase認証後にメニューを更新');
            }
        }, 100);
    } else {
        console.log('⚠️ Firebase未認証');
        window.currentFirebaseUser = null;
        localStorage.removeItem('currentSession');
        localStorage.removeItem('userRole');

        // ログアウト時もハンバーガーメニューを更新
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
                console.log('🍔 [FIREBASE] Firebase未認証時にメニューを更新');
            }
        }, 100);
    }
});

// セッション管理 - Firebase専用（同期版）
window.getCurrentUser = function() {
    try {
        const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
        if (session && session.user) {
            return {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: session.user.role,
                isLoggedIn: true
            };
        }
    } catch (error) {
        console.error('❌ [GET-USER] セッション取得エラー:', error);
    }

    return {
        id: null,
        name: 'ゲスト',
        email: null,
        role: 'guest',
        isLoggedIn: false
    };
};

// 🔥 NEW: Firestoreからroleを取得する非同期版getCurrentUser
window.getCurrentUserAsync = async function() {
    if (!window.currentFirebaseUser) {
        return window.getCurrentUser();
    }

    try {
        const userDocRef = doc(db, 'users', window.currentFirebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName = window.currentFirebaseUser.email === 'muranaka-tenma@terracom.co.jp' ?
                               '邨中天真' :
                               userData.displayName || userData.name || window.currentFirebaseUser.email.split('@')[0];

            const userInfo = {
                id: window.currentFirebaseUser.uid,
                name: displayName,
                email: window.currentFirebaseUser.email,
                role: userData.role || 'user',
                isLoggedIn: true
            };

            // currentSessionを更新
            const sessionData = {
                user: {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    role: userInfo.role
                },
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('currentSession', JSON.stringify(sessionData));
            localStorage.setItem('userRole', userInfo.role); // 🔥 互換性のため

            console.log('✅ [GET-USER-ASYNC] Firestoreからrole取得完了:', userInfo.role);
            return userInfo;
        }
    } catch (error) {
        console.error('❌ [GET-USER-ASYNC] Firestore取得エラー:', error);
    }

    return window.getCurrentUser();
};
```

---

### index-kanban.htmlの修正

#### 修正1: getCurrentUser()関数の削除（line 2414-2461）

**現在のコード**:
```javascript
// Phase 1: 権限取得機能のみ（表示制御なし）
function getCurrentUser() {
    try {
        const session = JSON.parse(localStorage.getItem('currentSession') || 'null');
        if (session && session.user) {
            // Firebase認証のムラナカ・テンマを邨中天真にマッピング
            let displayName = session.user.name;
            if (session.user.email === 'muranaka-tenma@terracom.co.jp') {
                displayName = '邨中天真';  // 日本名に統一
            }

            return {
                name: displayName,
                email: session.user.email,
                role: session.user.role,
                isLoggedIn: true
            };
        }
    } catch (error) {
        console.error('❌ [GET-USER] セッション取得エラー:', error);
        localStorage.removeItem('currentSession');
    }

    // フォールバック処理
    try {
        const user = localStorage.getItem('currentUser');
        if (user) {
            const userName = typeof user === 'string' ? user : JSON.parse(user).name;
            if (userName && (userName.includes('邨中天真') || userName.includes('muranaka'))) {
                return {
                    name: '邨中天真',
                    email: 'muranaka-tenma@terracom.co.jp',
                    role: 'developer',
                    isLoggedIn: true
                };
            }
        }
    } catch (error) {
        console.error('ユーザーデータエラー:', error);
    }

    return {
        name: null,
        email: null,
        role: null,
        isLoggedIn: false
    };
}
```

**修正後**:
```javascript
// 🔥 getCurrentUser()はFirebase設定ファイル（firebase-config-auth-fix-20250819-132508.js）で定義されています
// window.getCurrentUser() - Firestoreからroleを取得（同期版）
// window.getCurrentUserAsync() - Firestoreから最新roleを取得（非同期版）
//
// ⚠️ index-kanban.htmlでの独自実装は削除しました
// すべての権限チェックはFirebaseで一元管理されます

// ✅ 削除（Firebase設定ファイルのwindow.getCurrentUser()を使用）
```

#### 修正2: isAdmin()関数の修正（line 7244-7247）

**現在のコード**:
```javascript
function isAdmin() {
    // 実際の実装では認証システムと連携
    return localStorage.getItem('userRole') === 'admin';
}
```

**修正後**:
```javascript
function isAdmin() {
    const currentUser = window.getCurrentUser();
    return currentUser.role === 'admin' || currentUser.role === 'developer';
}
```

---

## 5. リスク評価

### リスク1: 既存ユーザーのFirestore情報不足

**内容**:
- Firestoreの`users/{uid}`コレクションに既存ユーザー情報が登録されていない
- ログイン時にrole取得失敗の可能性

**対策**:
- ✅ Step 1で自動作成機能を実装（onAuthStateChangedで新規登録）
- ✅ フォールバック処理でハードコードマップを使用
- ⚠️ 初回ログイン時に全ユーザーがFirestoreに登録されることを確認

**影響度**: 🟡 中（自動作成で対処可能）

---

### リスク2: 循環参照の再発

**内容**:
- `index-kanban.html`の`getCurrentUser()`削除が不完全だと循環参照が再発

**対策**:
- ✅ `index-kanban.html`から`getCurrentUser()`関数を**完全削除**
- ✅ Firebase設定ファイルの`window.getCurrentUser()`のみを使用
- ✅ ブラウザコンソールで`typeof window.getCurrentUser`を確認

**影響度**: 🔴 高（実装ミスでログイン不可）

**確認方法**:
```javascript
// ブラウザコンソールで確認
console.log('getCurrentUser定義元:', window.getCurrentUser.toString());
// 期待: Firebase設定ファイルの実装が表示される
// NG: index-kanban.htmlの実装が表示される
```

---

### リスク3: localStorage.getItem('userRole')の段階的削除

**内容**:
- 一気に削除するとブラックテーマ選択機能が動作しない

**対策**:
- ✅ Step 1でFirebase設定ファイルが`localStorage.setItem('userRole', ...)`を設定
- ✅ Step 2で`localStorage.getItem('userRole')`を`window.getCurrentUser().role`に置き換え
- ✅ 段階的に移行（各ステップでテスト）

**影響度**: 🟢 低（段階的移行で対処）

---

### リスク4: ページ読み込み順序の問題

**内容**:
- Firebase設定ファイルの読み込みが遅れると`window.getCurrentUser`が未定義

**対策**:
- ✅ Firebase設定ファイルを`<head>`内で最初に読み込む
- ✅ `type="module"`で確実に読み込み
- ⚠️ 各HTMLファイルの`<script>`タグ順序を確認

**影響度**: 🟡 中（読み込み順序を厳守）

**確認方法**:
```html
<head>
    <!-- ✅ 最初に読み込む -->
    <script type="module" src="./firebase-config-auth-fix-20250819-132508.js"></script>

    <!-- その他のスクリプト -->
    <script src="..."></script>
</head>
```

---

### リスク5: Firestoreアクセスエラー時の動作

**内容**:
- Firestoreが一時的にアクセス不可の場合、ログインできない

**対策**:
- ✅ フォールバック処理でハードコードマップを使用
- ✅ try-catchで確実にエラーハンドリング
- ✅ LocalStorageのcurrentSessionをキャッシュとして利用

**影響度**: 🟢 低（フォールバック完備）

---

## 6. テスト計画

### テストケース1: 新規ログイン（Firestore未登録ユーザー）

**手順**:
1. Firestoreの`users`コレクションから既存ユーザーを削除（テスト用）
2. ログインページでログイン
3. ブラウザコンソールで確認：
   ```javascript
   console.log('現在のユーザー:', window.getCurrentUser());
   ```

**期待結果**:
- ✅ Firestoreに新規ユーザー情報が作成される
- ✅ roleが正しく設定される（developer/admin/user）
- ✅ LocalStorageのcurrentSessionにroleが保存される

---

### テストケース2: 既存ログイン（Firestore登録済みユーザー）

**手順**:
1. Firestoreの`users/{uid}`に既存ユーザー情報がある状態
2. ログインページでログイン
3. ブラウザコンソールで確認：
   ```javascript
   window.getCurrentUserAsync().then(user => console.log('非同期取得:', user));
   ```

**期待結果**:
- ✅ Firestoreからroleが取得される
- ✅ LocalStorageのcurrentSessionが更新される
- ✅ ブラックテーマが管理者のみ選択可能

---

### テストケース3: localStorage改変テスト（セキュリティ確認）

**手順**:
1. 通常ユーザーでログイン
2. ブラウザコンソールでlocalStorageを改変：
   ```javascript
   localStorage.setItem('userRole', 'admin');
   ```
3. ブラックテーマを選択

**期待結果**:
- ❌ ブラックテーマが選択できない（window.getCurrentUser()はcurrentSessionから取得）
- ✅ セキュリティが確保されている

---

### テストケース4: タスク表示確認

**手順**:
1. ログイン後、カンバンボードを表示
2. タスクが表示されることを確認
3. ブラウザコンソールでエラーがないことを確認

**期待結果**:
- ✅ タスクが正常に表示される
- ✅ 無限ループエラーが発生しない
- ✅ getCurrentUser()が正常に動作

---

## 7. ロールバック手順

万が一問題が発生した場合:

```bash
# 現在の状態に戻す（既にrevert済み）
git log --oneline -5

# 必要に応じて特定のコミットに戻す
git checkout ea9d331  # revert後の安定版
```

---

## 8. 次のステップ

### 優先順位

#### 🔴 最優先（Phase 1）:
1. Firebase設定ファイルの修正（Firestore自動作成機能追加）
2. index-kanban.htmlの修正（getCurrentUser削除、isAdmin修正）
3. テストケース1-4の実行

#### 🟡 中優先（Phase 2）:
4. その他HTMLファイルの修正（my-profile.html等）
5. localStorage.getItem('userRole')の完全削除

#### 🟢 低優先（Phase 3）:
6. ドキュメント整備
7. ユーザー向けマニュアル作成

---

**作成日**: 2025年11月6日
**作成者**: Claude (Anthropic)
**対象プロジェクト**: sales-task-manager
**対象タスク**: B-d（権限管理のFirebase移行）

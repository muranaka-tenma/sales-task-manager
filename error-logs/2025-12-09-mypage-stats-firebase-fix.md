# エラー対処ログ: マイページ個人統計がFirebase移行後に機能しない

**日付**: 2025-12-09
**ステータス**: ✅ 解決
**初出**: v004（2025-11-20）

---

## 問題の概要

マイページの個人詳細統計が0件と表示される。

### 症状
- 総タスク数が0
- 完了率が0%
- 期限遵守率が0%
- 平均完了時間が0日

---

## 根本原因

### 原因1: タスクデータの取得元が古い

マイページは`localStorage.getItem('salesTasksKanban')`からタスクを取得していたが、タスクは**Firebaseに完全移行済み**でLocalStorageには入っていない。

### 原因2: Firebase設定ファイルの競合

マイページはiframe内で開かれるため、`firebase-config-auth-fix-20250819-132508.js`を読み込むと`onAuthStateChanged`が発火し、親ウィンドウとセッションが競合してログイン画面にリダイレクトされる。

### 原因3: completedAtフィールドの未使用

完了日時の計算で`task.updatedAt`を使用していたが、正確な完了日時は`task.completedAt`に記録されている。

### 原因4: assigneeフィールドの不統一

担当者フィールドが`assignees`（配列）と`assignee`（単数）で不統一だった。

---

## 解決方法

### 1. 親ウィンドウからpostMessageでタスクデータを送信

**index-kanban.html（親ウィンドウ）**:
```javascript
function openMyProfileModal() {
    const modal = document.getElementById('myProfileModal');
    const iframe = document.getElementById('myProfileFrame');
    if (modal && iframe) {
        iframe.src = 'my-profile.html';
        modal.style.display = 'flex';

        // iframeが読み込まれたらタスクデータを送信
        iframe.onload = () => {
            iframe.contentWindow.postMessage({
                type: 'TASKS_DATA',
                tasks: window.tasks || []
            }, '*');
        };
    }
}
```

**my-profile.html（iframe内）**:
```javascript
let receivedTasks = null;

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TASKS_DATA') {
        receivedTasks = event.data.tasks;
        // データ受信後に統計を再計算
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.isLoggedIn) {
            calculatePersonalAnalytics(currentUser, 'week');
        }
    }
});

function calculatePersonalAnalytics(user, period = 'all') {
    // 親ウィンドウから受け取ったタスクを使用
    let tasks = receivedTasks || JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
    // ...
}
```

### 2. completedAtを優先使用

```javascript
// 修正前
const completedAt = task.updatedAt ? new Date(task.updatedAt) : new Date();

// 修正後
const completedAt = task.completedAt ? new Date(task.completedAt) :
                   (task.updatedAt ? new Date(task.updatedAt) : new Date());
```

### 3. assigneeフィールドの両対応

```javascript
let myTasks = tasks.filter(task => {
    if (task.assignees && Array.isArray(task.assignees)) {
        return task.assignees.includes(user.name);
    }
    return task.assignee === user.name;
});
```

### 4. プロジェクトタスクの完了カラム判定

```javascript
const isDoneColumn = (columnId) => {
    if (!columnId) return false;
    if (columnId === 'done') return true;
    return /完了|done|完成/i.test(columnId);
};
```

---

## 試して失敗した方法

### Firebase設定ファイルの変更

`firebase-config.js` → `firebase-config-auth-fix-20250819-132508.js`に変更したところ、`onAuthStateChanged`がiframe内で発火し、セッションが競合してログイン画面にリダイレクトされた。

**結論**: iframeで開くページではFirebase認証を直接使わず、親ウィンドウからデータを渡す方式が安全。

---

## 変更ファイル

- `sales-task-core/index-kanban.html` - openMyProfileModal()にpostMessage追加
- `sales-task-core/my-profile.html` - messageイベントリスナー追加、統計ロジック修正

---

## 教訓

1. **iframe内でのFirebase認証は要注意**: 親ウィンドウと認証状態が競合する可能性がある
2. **データ移行後は参照元を確認**: LocalStorage → Firebase移行後、古いコードがLocalStorageを参照していないかチェック
3. **postMessageパターン**: iframe間のデータ受け渡しには`postMessage`が安全

---

**最終更新**: 2025-12-09
**担当者**: Claude Code

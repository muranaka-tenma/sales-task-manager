# 修正ログ: 全データ削除ボタン実装

**日付**: 2025-11-28
**作業時間**: 約30分（調査20分 + 実装10分）
**重要度**: 🔴🔴🔴 最優先
**ステータス**: ✅ 修正完了

---

## 問題の概要

### 症状
設定画面の「🗑️ 全データを削除」ボタンが機能しない

**エラー内容**:
```
Uncaught ReferenceError: clearAllData is not defined
```

### 影響
- 全データ削除機能が使用不可
- Firebase完全移行後、テストデータのクリアができない
- ユーザーが手動でFirebaseコンソールにアクセスする必要がある

---

## 根本原因

### 問題箇所: index-kanban.html:1641

**ボタンは存在するが、関数が未定義**:
```html
<button onclick="clearAllData()" style="...">🗑️ 全データを削除</button>
```

**原因の詳細**:
Firebase完全移行時（2025-08-19頃）に、LocalStorage依存の `clearAllData()` 関数が削除された。
しかし、設定画面のボタンは残ったままで、関数の再実装が漏れていた。

---

## 修正内容

### 修正箇所: index-kanban.html:7736-7822

**追加した関数**:
```javascript
// 全データ削除（Firebase完全移行対応）
async function clearAllData() {
    const confirmMessage =
        '⚠️ 警告: すべてのデータを完全削除します\n\n' +
        '以下のデータが削除されます:\n' +
        '• 全タスク（Firebase + LocalStorage）\n' +
        '• 全プロジェクト（Firebase + LocalStorage）\n' +
        '• ローカルストレージのすべてのデータ\n\n' +
        '⚠️ この操作は取り消せません ⚠️\n\n' +
        '本当に削除しますか？';

    if (!confirm(confirmMessage)) {
        console.log('🔕 [CLEAR-ALL] ユーザーがキャンセル');
        return;
    }

    // 二重確認
    const doubleConfirm = prompt('削除を実行するには「削除」と入力してください:');
    if (doubleConfirm !== '削除') {
        alert('キャンセルしました。');
        console.log('🔕 [CLEAR-ALL] 二重確認でキャンセル');
        return;
    }

    console.log('🗑️ [CLEAR-ALL] 全データ削除開始...');

    try {
        let deletedTasksCount = 0;
        let deletedProjectsCount = 0;

        // 1. Firebase の全タスクを削除
        const tasksResult = await window.FirebaseDB.getTasks();
        if (tasksResult.success && tasksResult.tasks.length > 0) {
            console.log(`🗑️ [CLEAR-ALL] ${tasksResult.tasks.length}件のタスクを削除中...`);
            for (const task of tasksResult.tasks) {
                const taskId = task.firebaseId || task.id;
                await window.FirebaseDB.deleteTask(taskId);
                deletedTasksCount++;
            }
            console.log(`✅ [CLEAR-ALL] ${deletedTasksCount}件のタスクを削除完了`);
        }

        // 2. Firebase の全プロジェクトを削除
        const projectsResult = await window.FirebaseDB.getProjects();
        if (projectsResult.success && projectsResult.projects.length > 0) {
            console.log(`🗑️ [CLEAR-ALL] ${projectsResult.projects.length}件のプロジェクトを削除中...`);
            for (const project of projectsResult.projects) {
                await window.FirebaseDB.deleteProject(project.id);
                deletedProjectsCount++;
            }
            console.log(`✅ [CLEAR-ALL] ${deletedProjectsCount}件のプロジェクトを削除完了`);
        }

        // 3. LocalStorage をクリア（セッション情報以外）
        const currentSession = localStorage.getItem('currentSession');
        const currentUser = localStorage.getItem('currentUser');
        const systemUsers = localStorage.getItem('systemUsers');

        console.log('🧹 [CLEAR-ALL] LocalStorageをクリア中...');
        localStorage.clear();

        // セッション情報は保持
        if (currentSession) localStorage.setItem('currentSession', currentSession);
        if (currentUser) localStorage.setItem('currentUser', currentUser);
        if (systemUsers) localStorage.setItem('systemUsers', systemUsers);
        console.log('✅ [CLEAR-ALL] LocalStorageクリア完了（セッション情報は保持）');

        // 4. 完了メッセージ
        alert(
            `✅ 全データ削除が完了しました\n\n` +
            `削除されたデータ:\n` +
            `• タスク: ${deletedTasksCount}件\n` +
            `• プロジェクト: ${deletedProjectsCount}件\n` +
            `• LocalStorageデータ: クリア完了\n\n` +
            `ページをリロードします。`
        );

        console.log('✅ [CLEAR-ALL] 全データ削除完了');
        console.log(`📊 [CLEAR-ALL] 削除統計: タスク ${deletedTasksCount}件, プロジェクト ${deletedProjectsCount}件`);

        // 5. ページリロード
        location.reload();
    } catch (error) {
        console.error('❌ [CLEAR-ALL] 削除エラー:', error);
        alert(`削除中にエラーが発生しました:\n${error.message}\n\n一部のデータが残っている可能性があります。`);
    }
}
```

### 変更点

1. **二重確認機能**
   - confirm() ダイアログで第一確認
   - prompt() で「削除」と入力させる第二確認
   - 誤操作防止のための安全機構

2. **Firebase Firestore のデータ削除**
   - `window.FirebaseDB.getTasks()` で全タスクを取得
   - 各タスクを `deleteTask()` で削除
   - `window.FirebaseDB.getProjects()` で全プロジェクトを取得
   - 各プロジェクトを `deleteProject()` で削除

3. **LocalStorage のクリア**
   - `localStorage.clear()` で全データクリア
   - セッション情報（currentSession, currentUser, systemUsers）は保持
   - ログアウトさせないための配慮

4. **削除統計とフィードバック**
   - 削除件数をカウント
   - コンソールログで詳細記録
   - ユーザーにアラートで通知

5. **自動リロード**
   - `location.reload()` でページをリロード
   - UI をクリーンな状態にリセット

---

## 期待される動作

### Before（修正前）
```
ボタンクリック
↓
Uncaught ReferenceError: clearAllData is not defined ❌
```

### After（修正後）
```
ボタンクリック
↓
確認ダイアログ表示
↓
「削除」と入力
↓
Firebase の全タスク削除
↓
Firebase の全プロジェクト削除
↓
LocalStorage クリア（セッション情報以外）
↓
削除完了メッセージ表示
↓
ページリロード ✅
```

---

## テスト方法

### 1. 基本動作テスト

**手順**:
1. 開発環境 (`http://localhost:3000/index-kanban.html`) を開く
2. 設定アイコン（⚙️）をクリック
3. 「🔄 データ管理」セクションの「🗑️ 全データを削除」ボタンをクリック
4. 確認ダイアログで「OK」をクリック
5. prompt で「削除」と入力

**確認事項**:
- [ ] 確認ダイアログが表示される
- [ ] prompt で「削除」と入力すると削除が実行される
- [ ] prompt で「削除」以外を入力するとキャンセルされる
- [ ] 削除完了後にアラートが表示される
- [ ] ページが自動でリロードされる

### 2. キャンセル動作テスト

**手順**:
1. 「🗑️ 全データを削除」ボタンをクリック
2. 確認ダイアログで「キャンセル」をクリック

**確認事項**:
- [ ] データは削除されない
- [ ] コンソールに「🔕 [CLEAR-ALL] ユーザーがキャンセル」と表示される

### 3. コンソールログ確認

**確認事項**:
```
🗑️ [CLEAR-ALL] 全データ削除開始...
🗑️ [CLEAR-ALL] N件のタスクを削除中...
✅ [CLEAR-ALL] N件のタスクを削除完了
🗑️ [CLEAR-ALL] N件のプロジェクトを削除中...
✅ [CLEAR-ALL] N件のプロジェクトを削除完了
🧹 [CLEAR-ALL] LocalStorageをクリア中...
✅ [CLEAR-ALL] LocalStorageクリア完了（セッション情報は保持）
✅ [CLEAR-ALL] 全データ削除完了
📊 [CLEAR-ALL] 削除統計: タスク N件, プロジェクト N件
```

---

## 関連コード

### 主要な関数

1. **`clearAllData()`** (line 7736-7822)
   - 全データ削除のメイン関数
   - 二重確認機能付き

2. **`window.FirebaseDB.getTasks()`** (firebase-config-auth-fix-20250819-132508.js:275-295)
   - Firebase から全タスクを取得

3. **`window.FirebaseDB.deleteTask()`** (firebase-config-auth-fix-20250819-132508.js:339-364)
   - 指定タスクを削除

4. **`window.FirebaseDB.getProjects()`** (firebase-config-auth-fix-20250819-132508.js:367-388)
   - Firebase から全プロジェクトを取得

5. **`window.FirebaseDB.deleteProject()`** (firebase-config-auth-fix-20250819-132508.js:505-518)
   - 指定プロジェクトを削除

---

## 副作用・注意点

### ✅ 問題なし
- セッション情報は保持されるため、ログアウトしない
- Firebase Authentication のユーザーデータは削除されない
- Firestore の `users` コレクションは削除されない

### ⚠️ 注意
- **この操作は取り消せない**
  - 削除されたデータは復元不可
  - 二重確認で誤操作を防止

- **削除に時間がかかる可能性**
  - タスク・プロジェクトが多い場合、削除に時間がかかる
  - ループで1件ずつ削除するため、最適化の余地あり

---

## コミット情報

- **修正ファイル**: `sales-task-core/index-kanban.html`
- **変更箇所**: Line 7736-7822（新規関数追加）
- **変更内容**: Firebase完全移行対応の `clearAllData()` 関数を実装

---

## 次のステップ

### 今後の改善案

1. **削除パフォーマンス最適化**
   - バッチ削除機能の実装
   - 現在: 1件ずつ削除（N回のFirestore呼び出し）
   - 改善: バッチAPIで一括削除（1回のAPI呼び出し）

2. **削除対象の選択機能**
   - タスクのみ削除
   - プロジェクトのみ削除
   - 特定期間のデータのみ削除

3. **バックアップ機能**
   - 削除前に自動バックアップ
   - JSON形式でエクスポート

---

**最終更新**: 2025-11-28
**作成者**: Claude Code
**レビュー**: 邨中天真

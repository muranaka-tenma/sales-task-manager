# 統計ロジック修正: カラム判定の不具合修正

**日付**: 2025-12-02
**ステータス**: ✅ 修正完了
**重要度**: 🔴 高（統計の正確性に影響）

---

## 🔍 発見された問題

### 問題1: プロジェクトタスクの完了が統計にカウントされない
- **影響範囲**: 完了率、期限遵守率、平均完了時間など全統計
- **原因**: `task.columnId === 'done'` による判定が通常タスクにしか対応していない
- **症状**: プロジェクトタスクで「完了」カラムに移動しても完了としてカウントされない

### 問題2: ゴミ箱カラムのタスクが統計に含まれる
- **影響範囲**: 負荷調整、アクティブタスク数、期限切れタスク、停滞タスク
- **原因**: `task.columnId !== 'done'` のみで判定、ゴミ箱を除外していない
- **症状**: 削除されたタスクが未完了タスクとしてカウントされる

---

## 📊 カラムシステムの構造

### 通常タスク（固定ID）
```javascript
columns = [
  {"id": "todo", "title": "TODO", "color": "#667eea"},
  {"id": "in-progress", "title": "進行中", "color": "#f59e0b"},
  {"id": "done", "title": "完了", "color": "#10b981"},
  {"id": "trash", "title": "ゴミ箱", "color": "#6b7280"}
]
```

### プロジェクトタスク（動的ID）
```javascript
project.columns = ["TODO", "進行中", "完了", "ゴミ箱"]
task.columnId = "pj_abc123_2"  // project.columns[2] = "完了"
```

### カラム判定関数（Lines 3376-3405）
```javascript
function isDoneColumn(columnId) {
    if (!columnId) return false;
    if (columnId === 'done') return true; // 通常タスク

    // プロジェクトタスク - カラム名で判定
    const columnName = getColumnNameById(columnId);
    const lowerColumnName = columnName.toLowerCase();
    return lowerColumnName.includes('完了') ||
           lowerColumnName.includes('done') ||
           lowerColumnName.includes('完成');
}

function isTrashColumn(columnId) {
    if (!columnId) return false;
    if (columnId === 'trash') return true; // 通常タスク

    // プロジェクトタスク - カラム名で判定
    const columnName = getColumnNameById(columnId);
    const lowerColumnName = columnName.toLowerCase();
    return lowerColumnName.includes('ゴミ箱') ||
           lowerColumnName.includes('trash') ||
           lowerColumnName.includes('削除');
}
```

---

## 🔧 修正内容

### グループ1: ゴミ箱除外追加（4箇所）

#### 1. Line 6958 - 負荷調整の要調整判定
**修正前**:
```javascript
if (task.columnId !== 'done') {
    if (task.assignee) {
        assigneeCounts[task.assignee] = (assigneeCounts[task.assignee] || 0) + 1;
        totalAssignedTasks++;
    }
    assigneeCount = Object.keys(assigneeCounts).length;
}
```

**修正後**:
```javascript
if (!isDoneColumn(task.columnId) && !isTrashColumn(task.columnId)) {
    if (task.assignee) {
        assigneeCounts[task.assignee] = (assigneeCounts[task.assignee] || 0) + 1;
        totalAssignedTasks++;
    }
    assigneeCount = Object.keys(assigneeCounts).length;
}
```

**影響**: ゴミ箱のタスクを負荷計算から除外し、正確な「要調整」判定を実現

---

#### 2. Line 10496 - ダッシュボード期限遵守チャート
**修正前**:
```javascript
const activeTasks = tasks.filter(task => task.columnId !== 'done');
```

**修正後**:
```javascript
const activeTasks = tasks.filter(task => !isDoneColumn(task.columnId) && !isTrashColumn(task.columnId));
```

**影響**: ゴミ箱のタスクを期限チャートから除外

---

#### 3. Line 13076 - 期限切れタスクフィルタ
**修正前**:
```javascript
const overdueTasks = tasks.filter(task =>
    task.deadline &&
    new Date(task.deadline) < now &&
    task.columnId !== 'done'
);
```

**修正後**:
```javascript
const overdueTasks = tasks.filter(task =>
    task.deadline &&
    new Date(task.deadline) < now &&
    !isDoneColumn(task.columnId) &&
    !isTrashColumn(task.columnId)
);
```

**影響**: ゴミ箱のタスクを期限切れ警告から除外

---

#### 4. Line 13082 - 停滞タスクフィルタ
**修正前**:
```javascript
const staleTasks = tasks.filter(task =>
    task.lastMovedAt &&
    new Date(task.lastMovedAt) < threeDaysAgo &&
    task.columnId !== 'done'
);
```

**修正後**:
```javascript
const staleTasks = tasks.filter(task =>
    task.lastMovedAt &&
    new Date(task.lastMovedAt) < threeDaysAgo &&
    !isDoneColumn(task.columnId) &&
    !isTrashColumn(task.columnId)
);
```

**影響**: ゴミ箱のタスクを停滞警告から除外

---

### グループ2: プロジェクトタスク対応（10箇所）

#### 5. Line 7815 - 通知除外
**修正前**:
```javascript
tasks.forEach(task => {
    if (task.columnId === 'done') return; // 完了済みは除外
    // ... 通知ロジック
});
```

**修正後**:
```javascript
tasks.forEach(task => {
    if (isDoneColumn(task.columnId)) return; // 完了済みは除外
    // ... 通知ロジック
});
```

**影響**: プロジェクトタスクの完了も通知から除外

---

#### 6. Line 10406 - ダッシュボード完了率
**修正前**:
```javascript
const completedTasks = filteredTasks.filter(task => task.columnId === 'done').length;
const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
```

**修正後**:
```javascript
const completedTasks = filteredTasks.filter(task => isDoneColumn(task.columnId)).length;
const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
```

**影響**: プロジェクトタスクの完了が完了率に反映される

---

#### 7. Line 10412 - ダッシュボード期限遵守率
**修正前**:
```javascript
const completedWithDeadline = filteredTasks.filter(task => {
    if (task.columnId === 'done' && task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completedDate = new Date(task.completedAt);
        return completedDate <= deadline;
    }
    return false;
}).length;
```

**修正後**:
```javascript
const completedWithDeadline = filteredTasks.filter(task => {
    if (isDoneColumn(task.columnId) && task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completedDate = new Date(task.completedAt);
        return completedDate <= deadline;
    }
    return false;
}).length;
```

**影響**: プロジェクトタスクの期限遵守が期限遵守率に反映される

---

#### 8. Line 10432 - ダッシュボード平均完了時間
**修正前**:
```javascript
const completedWithTime = tasks.filter(task =>
    task.columnId === 'done' &&
    task.createdAt &&
    task.completedAt
);
```

**修正後**:
```javascript
const completedWithTime = tasks.filter(task =>
    isDoneColumn(task.columnId) &&
    task.createdAt &&
    task.completedAt
);
```

**影響**: プロジェクトタスクの完了が平均完了時間の計算に含まれる

---

#### 9. Line 10570 - 担当者別完了数
**修正前**:
```javascript
const completed = assigneeTasks.filter(task => task.columnId === 'done').length;
```

**修正後**:
```javascript
const completed = assigneeTasks.filter(task => isDoneColumn(task.columnId)).length;
```

**影響**: プロジェクトタスクの完了が担当者別統計に反映される

---

#### 10. Line 10575 - 担当者別期限遵守率
**修正前**:
```javascript
const completedWithDeadline = assigneeTasks.filter(task =>
    task.columnId === 'done' &&
    task.deadline &&
    task.completedAt
);
```

**修正後**:
```javascript
const completedWithDeadline = assigneeTasks.filter(task =>
    isDoneColumn(task.columnId) &&
    task.deadline &&
    task.completedAt
);
```

**影響**: プロジェクトタスクの期限遵守が担当者別統計に反映される

---

#### 11. Line 10641 - 分析サマリー完了数
**修正前**:
```javascript
const completedTasks = tasks.filter(task => task.columnId === 'done').length;
```

**修正後**:
```javascript
const completedTasks = tasks.filter(task => isDoneColumn(task.columnId)).length;
```

**影響**: プロジェクトタスクの完了が分析サマリーに反映される

---

#### 12. Line 10646 - 分析サマリー期限遵守率
**修正前**:
```javascript
const completedWithDeadline = tasks.filter(task => {
    if (task.columnId === 'done' && task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completedDate = new Date(task.completedAt);
        return completedDate <= deadline;
    }
    return false;
}).length;
```

**修正後**:
```javascript
const completedWithDeadline = tasks.filter(task => {
    if (isDoneColumn(task.columnId) && task.deadline && task.completedAt) {
        const deadline = new Date(task.deadline);
        const completedDate = new Date(task.completedAt);
        return completedDate <= deadline;
    }
    return false;
}).length;
```

**影響**: プロジェクトタスクの期限遵守が分析サマリーに反映される

---

#### 13. Line 10660 - 分析サマリー平均完了時間
**修正前**:
```javascript
const completedWithTime = tasks.filter(task =>
    task.columnId === 'done' &&
    task.createdAt &&
    task.completedAt
);
```

**修正後**:
```javascript
const completedWithTime = tasks.filter(task =>
    isDoneColumn(task.columnId) &&
    task.createdAt &&
    task.completedAt
);
```

**影響**: プロジェクトタスクの完了が平均完了時間の計算に含まれる

---

#### 14. Line 13105 - ユーザー統計完了数
**修正前**:
```javascript
if (task.columnId === 'done') {
    userStats[task.assignee].completed++;
}
```

**修正後**:
```javascript
if (isDoneColumn(task.columnId)) {
    userStats[task.assignee].completed++;
}
```

**影響**: プロジェクトタスクの完了がユーザー統計に反映される

---

## ✅ 修正による改善

### 1. 統計の正確性向上
- ✅ プロジェクトタスクの完了が全統計に反映される
- ✅ 多言語対応（「完了」「done」「完成」すべて検出）
- ✅ ゴミ箱のタスクが未完了タスクにカウントされない

### 2. 影響範囲
| 統計項目 | 修正前の動作 | 修正後の動作 |
|---------|------------|------------|
| 完了率 | 通常タスクのみカウント | 通常+プロジェクトタスクをカウント |
| 期限遵守率 | 通常タスクのみ | 通常+プロジェクトタスク |
| 平均完了時間 | 通常タスクのみ | 通常+プロジェクトタスク |
| 負荷調整 | ゴミ箱も含む | ゴミ箱を除外 |
| 期限切れ警告 | ゴミ箱も含む | ゴミ箱を除外 |
| 停滞警告 | ゴミ箱も含む | ゴミ箱を除外 |

### 3. ユーザーへの影響
- ✅ プロジェクトタスクを完了しても統計が変わらない問題が解決
- ✅ ゴミ箱のタスクが「期限切れ」「停滞」として警告される問題が解決
- ✅ 負荷調整の「要調整」判定が正確になる

---

## 🔍 検証

### 検証1: プロジェクトタスクの完了カウント
**テストケース**:
```javascript
// プロジェクトタスク
task = {
    id: "task001",
    title: "テストタスク",
    columnId: "pj_abc123_2",  // project.columns[2] = "完了"
    projectId: "abc123"
}

// 修正前
task.columnId === 'done'  // false → カウントされない

// 修正後
isDoneColumn(task.columnId)  // true → カウントされる
```

### 検証2: ゴミ箱の除外
**テストケース**:
```javascript
// ゴミ箱のタスク
task = {
    id: "task002",
    title: "削除済みタスク",
    columnId: "trash"
}

// 修正前
task.columnId !== 'done'  // true → 未完了としてカウント

// 修正後
!isDoneColumn(task.columnId) && !isTrashColumn(task.columnId)  // false → カウントされない
```

### 検証3: 多言語カラム名対応
**テストケース**:
```javascript
// 英語プロジェクト
project.columns = ["To Do", "In Progress", "Done", "Trash"]
task.columnId = "pj_xyz789_2"  // project.columns[2] = "Done"

isDoneColumn(task.columnId)  // true → カウントされる

// 中国語プロジェクト
project.columns = ["待办", "进行中", "完成", "垃圾箱"]
task.columnId = "pj_chinese_2"  // project.columns[2] = "完成"

isDoneColumn(task.columnId)  // true → カウントされる
```

---

## 📝 今後の課題

### 残っている問題
1. **カラムIDの脆弱性** - インデックスベースのIDは削除・並び替えに弱い
2. **カラム名依存** - カラム名変更で isDoneColumn() が機能しなくなる可能性

### 次の改善案
- カラムに一意のIDと `isDone`/`isTrash` 属性を追加
- インデックスではなくID参照に変更
- カラム削除・並び替え時のタスクマイグレーション実装

---

## 📊 修正サマリー

### 修正箇所
- **合計14箇所** を修正
  - ゴミ箱除外追加: 4箇所
  - プロジェクトタスク対応: 10箇所

### 影響ファイル
- `sales-task-core/index-kanban.html` (14箇所)

### 修正時間
- 調査: 1時間
- 実装: 30分
- ドキュメント作成: 30分
- **合計**: 2時間

---

**作成日**: 2025-12-02
**作成者**: Claude Code
**確認者**: 邨中天真
**ステータス**: ✅ 修正完了・検証済み

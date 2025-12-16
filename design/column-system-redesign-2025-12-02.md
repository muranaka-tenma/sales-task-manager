# カラムシステム再設計 - 一意のID + 属性ベース

**作成日**: 2025-12-02
**目的**: インデックスベースのカラムIDから、一意のIDと属性ベースのシステムへ移行
**優先度**: 🟡 中（現行システムに限定的な問題あり）

---

## 🔍 現状の問題

### 問題1: インデックスベースのカラムID
```javascript
// プロジェクトカラム
project.columns = ["TODO", "進行中", "完了", "ゴミ箱"]
task.columnId = "pj_abc123_2"  // project.columns[2] = "完了"

// カラムを削除すると...
project.columns.splice(1, 1)  // "進行中"を削除
// → ["TODO", "完了", "ゴミ箱"]
// task.columnId = "pj_abc123_2" は今 "ゴミ箱" を指してしまう！
```

**影響**:
- ✅ 限定的: 必須カラム（完了・ゴミ箱）は削除不可で保護されている
- ✅ 限定的: カラム並び替え機能は未実装
- ⚠️ リスク: 将来的にカラム並び替え実装時にバグの原因になる

### 問題2: カラム名依存の判定
```javascript
function isDoneColumn(columnId) {
    const columnName = getColumnNameById(columnId);
    return lowerColumnName.includes('完了') ||
           lowerColumnName.includes('done') ||
           lowerColumnName.includes('完成');
}
```

**影響**:
- ⚠️ カラム名を変更すると統計が壊れる（例: "完了" → "終わり"）
- ⚠️ パターンマッチに依存（"完了予定"も完了と判定される）

---

## 🎯 新設計: 一意のID + 属性ベース

### 新しいカラムオブジェクト構造

```javascript
// 通常タスク用カラム（既存）
columns = [
    {
        id: "todo",
        title: "TODO",
        color: "#667eea",
        isDone: false,
        isTrash: false,
        order: 0
    },
    {
        id: "in-progress",
        title: "進行中",
        color: "#f59e0b",
        isDone: false,
        isTrash: false,
        order: 1
    },
    {
        id: "done",
        title: "完了",
        color: "#10b981",
        isDone: true,   // ← 属性で判定
        isTrash: false,
        order: 2
    },
    {
        id: "trash",
        title: "ゴミ箱",
        color: "#6b7280",
        isDone: false,
        isTrash: true,   // ← 属性で判定
        order: 3
    }
]

// プロジェクトタスク用カラム（新設計）
project.columns = [
    {
        id: "col_abc123_1701234567890_0",  // col_{projectId}_{timestamp}_{index}
        title: "📋 TODO",
        isDone: false,
        isTrash: false,
        order: 0
    },
    {
        id: "col_abc123_1701234567890_1",
        title: "🔄 進行中",
        isDone: false,
        isTrash: false,
        order: 1
    },
    {
        id: "col_abc123_1701234567890_2",
        title: "✅ 完了",
        isDone: true,    // ← カラム名に依存しない！
        isTrash: false,
        order: 2
    },
    {
        id: "col_abc123_1701234567890_3",
        title: "🗑️ ゴミ箱",
        isDone: false,
        isTrash: true,   // ← カラム名に依存しない！
        order: 3
    }
]

// タスクのカラムID
task.columnId = "col_abc123_1701234567890_2"  // 一意のID参照
```

### 新しい判定関数

```javascript
// 🔥 属性ベースの判定（カラム名変更に強い）
function isDoneColumn(columnId) {
    if (!columnId) return false;

    // 通常タスク（後方互換性）
    if (columnId === 'done') return true;

    // プロジェクトタスク - 属性で判定
    const column = getColumnById(columnId);
    return column && column.isDone === true;
}

function isTrashColumn(columnId) {
    if (!columnId) return false;

    // 通常タスク（後方互換性）
    if (columnId === 'trash') return true;

    // プロジェクトタスク - 属性で判定
    const column = getColumnById(columnId);
    return column && column.isTrash === true;
}

// 新しいヘルパー関数
function getColumnById(columnId) {
    // 通常タスクのカラム
    const normalColumn = columns.find(col => col.id === columnId);
    if (normalColumn) return normalColumn;

    // プロジェクトタスクのカラム
    if (columnId.startsWith('col_')) {
        const projectId = columnId.split('_')[1];
        const project = getProjectSettings()[projectId];
        if (project && project.columns) {
            return project.columns.find(col => col.id === columnId);
        }
    }

    return null;
}
```

---

## 📊 メリット

### 1. カラム削除・並び替えに強い
```javascript
// カラムを削除してもタスクのIDは変わらない
project.columns = project.columns.filter(col => col.id !== "col_abc123_1701234567890_1");
task.columnId = "col_abc123_1701234567890_2"  // まだ有効！

// カラムを並び替えてもタスクのIDは変わらない
project.columns.sort((a, b) => a.order - b.order);
task.columnId = "col_abc123_1701234567890_2"  // まだ有効！
```

### 2. カラム名変更に強い
```javascript
// カラム名を変更しても統計は壊れない
column.title = "✅ 完了" → "✅ 終わり"
// isDoneColumn() は column.isDone を見るので問題なし
```

### 3. 多言語対応が簡単
```javascript
// カラム名を英語に変更しても動作する
column.title = "✅ 完了" → "✅ Done"
// isDoneColumn() は column.isDone を見るので問題なし
```

### 4. カラム属性の追加が容易
```javascript
// 将来的に追加可能
column.isArchive = true;  // アーカイブカラム
column.isHidden = true;   // 非表示カラム
column.color = "#ff0000"; // カラム色
```

---

## 🔄 マイグレーション戦略

### フェーズ1: 通常タスクのカラムを拡張（低リスク）

**現状**:
```javascript
columns = [
    {"id": "todo", "title": "TODO", "color": "#667eea"},
    {"id": "in-progress", "title": "進行中", "color": "#f59e0b"},
    {"id": "done", "title": "完了", "color": "#10b981"},
    {"id": "trash", "title": "ゴミ箱", "color": "#6b7280"}
]
```

**新設計**:
```javascript
columns = [
    {"id": "todo", "title": "TODO", "color": "#667eea", "isDone": false, "isTrash": false, "order": 0},
    {"id": "in-progress", "title": "進行中", "color": "#f59e0b", "isDone": false, "isTrash": false, "order": 1},
    {"id": "waiting", "title": "保留", "color": "#8b5cf6", "isDone": false, "isTrash": false, "order": 2},
    {"id": "done", "title": "完了", "color": "#10b981", "isDone": true, "isTrash": false, "order": 3},
    {"id": "trash", "title": "ゴミ箱", "color": "#6b7280", "isDone": false, "isTrash": true, "order": 4}
]
```

**影響**: ✅ 低リスク - 既存のIDは変更なし、属性を追加するだけ

---

### フェーズ2: プロジェクトカラムの移行（中リスク）

#### ステップ1: 新規プロジェクト作成時に新形式を使用

**現状** (pj-settings.html:367):
```javascript
const DEFAULT_COLUMNS = ["📋 TODO", "🔄 進行中", "✅ 完了", "🗑️ ゴミ箱"];
```

**新設計**:
```javascript
function generateDefaultColumns(projectId) {
    const timestamp = Date.now();
    return [
        {
            id: `col_${projectId}_${timestamp}_0`,
            title: "📋 TODO",
            isDone: false,
            isTrash: false,
            order: 0
        },
        {
            id: `col_${projectId}_${timestamp}_1`,
            title: "🔄 進行中",
            isDone: false,
            isTrash: false,
            order: 1
        },
        {
            id: `col_${projectId}_${timestamp}_2`,
            title: "✅ 完了",
            isDone: true,   // ← 自動設定
            isTrash: false,
            order: 2
        },
        {
            id: `col_${projectId}_${timestamp}_3`,
            title: "🗑️ ゴミ箱",
            isDone: false,
            isTrash: true,  // ← 自動設定
            order: 3
        }
    ];
}
```

#### ステップ2: 既存プロジェクトの自動移行

**移行関数**:
```javascript
function migrateProjectColumns(project) {
    // 既に移行済みかチェック
    if (Array.isArray(project.columns) &&
        project.columns.length > 0 &&
        typeof project.columns[0] === 'object' &&
        project.columns[0].id) {
        console.log('✅ [MIGRATE] Already migrated:', project.id);
        return project.columns;
    }

    // 旧形式（文字列配列）を検出
    if (Array.isArray(project.columns) &&
        typeof project.columns[0] === 'string') {
        console.log('🔧 [MIGRATE] Migrating project columns:', project.id);

        const timestamp = Date.now();
        const newColumns = project.columns.map((title, index) => {
            // REQUIRED_COLUMNSパターンで判定
            const isDone = /完了|done|完成/i.test(title);
            const isTrash = /ゴミ箱|trash|削除/i.test(title);

            return {
                id: `col_${project.id}_${timestamp}_${index}`,
                title: title,
                isDone: isDone,
                isTrash: isTrash,
                order: index
            };
        });

        // タスクのcolumnIdも移行
        migrateTasks(project.id, project.columns, newColumns);

        return newColumns;
    }

    // デフォルトカラムを返す
    return generateDefaultColumns(project.id);
}

function migrateTasks(projectId, oldColumns, newColumns) {
    const tasks = getTasks();
    let migrationCount = 0;

    tasks.forEach(task => {
        if (task.projectId === projectId && task.columnId) {
            // 旧形式: pj_{projectId}_{index}
            const match = task.columnId.match(/^pj_(.+?)_(\d+)$/);
            if (match) {
                const index = parseInt(match[2], 10);
                if (newColumns[index]) {
                    task.columnId = newColumns[index].id;
                    migrationCount++;
                }
            }
        }
    });

    if (migrationCount > 0) {
        console.log(`🔧 [MIGRATE] Migrated ${migrationCount} tasks for project ${projectId}`);
        saveTasks(tasks);
    }
}
```

#### ステップ3: ロード時に自動移行を実行

**index-kanban.html の初期化処理** (Line 3148付近):
```javascript
// デフォルトカラムを設定
if (!project.columns) {
    project.columns = generateDefaultColumns(projectId);
    needsMigration = true;
} else {
    // 🔧 既存プロジェクトの移行
    const migratedColumns = migrateProjectColumns(project);
    if (migratedColumns !== project.columns) {
        project.columns = migratedColumns;
        needsMigration = true;
    }
}
```

---

## ⚠️ リスクと対策

### リスク1: 既存タスクのcolumnId参照が壊れる
**対策**:
- 移行時に全タスクのcolumnIdを一括更新
- `getColumnById()` で後方互換性を保持（旧形式も認識）

### リスク2: Firebaseの保存容量増加
**現状**: `["TODO", "進行中", "完了", "ゴミ箱"]` = ~40 bytes
**新設計**: オブジェクト配列 = ~400 bytes (10倍)
**対策**: プロジェクト数は限定的（100プロジェクト × 400 bytes = 40KB）で問題なし

### リスク3: 移行の失敗でデータ損失
**対策**:
- 移行前にFirebaseスナップショットを取得
- 移行ログを詳細に記録
- ロールバック機能を実装

---

## 📋 実装計画

### Phase 1: 基盤整備（1時間）
1. ✅ 設計ドキュメント作成
2. ⏳ `getColumnById()` ヘルパー関数実装
3. ⏳ `isDoneColumn()` / `isTrashColumn()` を属性ベースに更新
4. ⏳ 通常タスクのカラムに属性を追加

### Phase 2: プロジェクトカラム移行（1.5時間）
5. ⏳ `generateDefaultColumns()` 実装
6. ⏳ `migrateProjectColumns()` 実装
7. ⏳ `migrateTasks()` 実装
8. ⏳ pj-settings.html のカラム作成/編集を新形式に対応

### Phase 3: テストと検証（1時間）
9. ⏳ 既存プロジェクトの移行テスト
10. ⏳ 新規プロジェクト作成テスト
11. ⏳ カラム削除・並び替えのテスト
12. ⏳ 統計機能の動作確認

### Phase 4: ドキュメント化（30分）
13. ⏳ 移行完了レポート作成
14. ⏳ TODO-v006に完了を記録

**総所要時間**: 約4時間

---

## 🎯 期待される効果

### 即時の効果
- ✅ カラム名変更で統計が壊れなくなる
- ✅ 将来的なカラム並び替え実装の準備完了
- ✅ コードの保守性向上（パターンマッチ削除）

### 長期的な効果
- ✅ カラム削除機能の安全性向上
- ✅ 多言語対応が容易に
- ✅ 新しいカラム属性の追加が容易（アーカイブ、非表示など）

---

## 📝 次のステップ

### 今すぐ実装すべきか？

#### 実装を推奨する理由
1. 統計ロジック修正と関連性が高い（同じ問題領域）
2. 技術的負債の早期解消
3. 将来的な機能追加の基盤

#### 実装を延期する理由
1. 現行システムは限定的な問題（必須カラム保護済み）
2. より優先度の高いタスクがある（LocalStorage脱却、パフォーマンス改善）
3. 移行リスクがゼロではない

### 推奨アクション
**現時点では延期し、以下のタイミングで実装**:
- LocalStorage完全脱却プロジェクト完了後
- カラム並び替え機能を実装する時
- カラム名変更で統計が壊れる問題が実際に発生した時

---

**作成日**: 2025-12-02
**作成者**: Claude Code
**ステータス**: 📋 設計完了 - 実装待機中
**推奨実装時期**: LocalStorage脱却後

# 📅 定期タスク機能 - 設計書

## 📋 概要
毎月・毎週など定期的に繰り返されるタスクを自動生成する機能を実装します。

## 🎯 ユースケース
- **毎月の営業レポート作成**
- **週次のミーティング**
- **四半期の予算見直し**
- **年次の計画策定**

## 🏗️ データ構造設計

### 定期タスクテンプレート
```javascript
recurringTemplate = {
  id: "recurring_001",
  name: "月次営業レポート",
  
  // 基本タスク情報
  taskTemplate: {
    title: "{{YYYY年MM月}} 営業レポート作成",
    priority: "high",
    assignees: ["田中部長", "佐藤課長"],
    memo: "前月実績をまとめて提出",
    
    // PJタスク対応
    projectId: null,
    projectName: null,
    approvers: []
  },
  
  // 繰り返し設定
  recurringConfig: {
    type: "monthly",        // "daily", "weekly", "monthly", "yearly"
    interval: 1,            // 1ヶ月ごと
    dayOfMonth: 25,         // 月の25日
    dayOfWeek: null,        // 週の何曜日（週次の場合）
    monthOfYear: null,      // 年の何月（年次の場合）
    timeOfDay: "09:00"      // 生成時刻
  },
  
  // 期限設定
  deadlineConfig: {
    relativeDays: 5,        // 生成日から5日後が期限
    timeOfDay: "17:00"      // 期限時刻
  },
  
  // 生成設定
  generationConfig: {
    advanceDays: 3,         // 3日前に生成
    maxFutureGeneration: 2, // 最大2回先まで生成
    lastGenerated: null,    // 最後に生成した日時
    nextGeneration: null    // 次回生成予定日時
  },
  
  // メタ情報
  isActive: true,
  createdAt: "2025-08-03T10:00:00.000Z",
  createdBy: "管理者"
}
```

## 🔄 自動生成ロジック

### 1. チェックタイミング
- アプリ起動時
- 日付変更時（午前0時）
- 手動チェック機能

### 2. 生成条件
```javascript
function shouldGenerateRecurringTask(template) {
  const now = new Date();
  const nextGen = new Date(template.generationConfig.nextGeneration);
  
  // 生成予定日時を過ぎている かつ アクティブ
  return now >= nextGen && template.isActive;
}
```

### 3. タスク生成
```javascript
function generateRecurringTask(template) {
  const now = new Date();
  const task = {
    id: Date.now(),
    title: formatTemplateString(template.taskTemplate.title, now),
    deadline: calculateDeadline(now, template.deadlineConfig),
    
    // テンプレートから継承
    ...template.taskTemplate,
    
    // 生成情報
    columnId: 'todo',
    completed: false,
    createdAt: now.toISOString(),
    isRecurring: true,
    recurringTemplateId: template.id,
    generatedFor: formatDateString(now) // "2025-08"
  };
  
  return task;
}
```

## 🖥️ UI設計

### 1. 定期タスク管理画面
- 設定ボタンから「定期タスク管理」を選択
- 既存テンプレート一覧表示
- 新規テンプレート作成

### 2. テンプレート作成フォーム
```
📅 定期タスクテンプレート作成

テンプレート名: [月次営業レポート]

基本情報:
  タスク名: [{{YYYY年MM月}} 営業レポート作成]
  優先度: [高] [中] [低]
  担当者: [選択UI]
  メモ: [テキストエリア]

繰り返し設定:
  頻度: [毎日] [毎週] [毎月] [毎年]
  詳細: [月の25日] [3日前に生成]
  
期限設定:
  期限: [生成から5日後の17:00]

[保存] [キャンセル]
```

### 3. タスクカードでの表示
- 定期タスクには 🔄 アイコン表示
- "月次営業レポート (8月分)" のような表示

## 🛠️ 実装ステップ

### Step 1: データ構造
- [ ] 定期タスクテンプレート配列をlocalStorageで管理
- [ ] 基本的なCRUD操作関数

### Step 2: 生成ロジック
- [ ] 日時計算関数
- [ ] 自動生成チェック関数
- [ ] テンプレート文字列置換

### Step 3: UI実装
- [ ] 定期タスク管理モーダル
- [ ] テンプレート作成・編集フォーム
- [ ] 一覧表示・削除機能

### Step 4: 統合
- [ ] アプリ起動時の自動チェック
- [ ] タスクカードでの定期表示
- [ ] 手動生成・停止機能

## ⚠️ 注意事項

### パフォーマンス
- テンプレート数制限（最大20件）
- 生成履歴の定期クリーンアップ

### ユーザビリティ
- テンプレート名の重複チェック
- 無効な設定のバリデーション
- 生成予定の事前通知

### 互換性
- 既存タスクとの区別
- PJタスクテンプレート対応
- エクスポート・インポート対応

---

**次回実装**: Step 1のデータ構造から開始
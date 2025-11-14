# 📋 Phase 2: PJタスク管理機能 - 詳細設計書

## 📅 作成日: 2025年8月3日

## 🎯 目的
個人タスクとプロジェクトタスクのWチェック体制を構築し、証跡管理とガバナンス強化を実現する。

## 🏗️ 基本アーキテクチャ

### データ構造設計（フラグベース管理）

```javascript
task = {
  // 既存フィールド
  id: 1,
  title: "契約書レビュー作成",
  deadline: "2025-08-10T17:00:00.000Z",
  priority: "high",
  assignee: "田中部長",
  assignees: ["田中部長"],
  memo: "重要案件のため優先対応",
  createdAt: "2025-08-01T09:00:00.000Z",
  
  // PJタスク拡張フィールド
  projectId: "PJ001",           // PJタスクの場合のみ設定
  projectName: "新規システム導入PJ", // PJ表示名
  
  // ステータス管理（デュアル管理）
  personalStatus: "inprogress", // 個人側での進捗状態
  projectStatus: "todo",        // PJ側での承認状態
  
  // 移動申請管理
  pendingMove: {
    requested: true,
    fromStatus: "todo",
    toStatus: "inprogress", 
    requestedAt: "2025-08-03T14:30:00.000Z",
    evidence: ["メール_承認依頼.png", "仕様書_v1.pdf"],
    comment: "お客様からの承認を得ましたので進行中に移動します"
  },
  
  // 承認者設定
  approvers: ["佐藤課長", "鈴木主任"], // このPJの承認者リスト
  lastApprovedBy: null,               // 最後に承認した人
  approvedAt: null                    // 承認日時
}
```

## 🔄 動作フロー詳細

### 1. PJタスクの作成
```javascript
// PJタスク作成時の初期値設定
const newPJTask = {
  ...regularTask,
  projectId: "PJ001",
  projectName: "新規システム導入PJ",
  personalStatus: "todo",
  projectStatus: "todo", // 初期は同期
  pendingMove: null,
  approvers: ["佐藤課長", "鈴木主任"]
}
```

### 2. 個人側でのタスク移動（申請）
```javascript
function moveTaskPersonal(taskId, toStatus) {
  const task = findTask(taskId);
  
  if (task.projectId) {
    // PJタスクの場合は申請モードに
    task.personalStatus = toStatus;
    task.pendingMove = {
      requested: true,
      fromStatus: task.projectStatus,
      toStatus: toStatus,
      requestedAt: new Date().toISOString(),
      evidence: [], // 後で証憑を添付
      comment: ""   // 後でコメント追加
    };
    
    // 即座にPJ側に通知フラグを立てる
    showPendingApprovalInProject(task);
  } else {
    // 通常タスクは従来通り
    task.columnId = toStatus;
  }
}
```

### 3. PJ側での承認フロー
```javascript
function approveTaskMove(taskId, approverId) {
  const task = findTask(taskId);
  
  if (task.pendingMove && task.pendingMove.requested) {
    // 承認実行
    task.projectStatus = task.pendingMove.toStatus;
    task.lastApprovedBy = approverId;
    task.approvedAt = new Date().toISOString();
    
    // 申請をクリア
    task.pendingMove = null;
    
    // 両方のステータスが同期される
    saveTasks();
    renderKanban();
  }
}
```

## 🖥️ UI/UX設計

### 担当者フィルターの拡張
```
現在: [全員] [田中部長] [佐藤課長] ...
拡張後: [全員] [田中部長] [佐藤課長] ... [新規システムPJ] [契約更新PJ] ...
```

### PJモード表示の特徴
1. **アラート表示**: 申請待ちタスクに🔔マーク
2. **証憑確認**: クリックで添付ファイル・コメント表示
3. **承認ボタン**: 「承認して移動」「差し戻し」

### 個人モード表示の特徴
1. **申請状態表示**: 「承認待ち」ラベル
2. **証憑添付UI**: ドラッグ&ドロップで追加可能
3. **進捗表示**: PJ側の承認状況を表示

## 📊 統計・レポートへの影響

### 新しい指標
- **承認待ちタスク数**: PJ管理者向け
- **申請から承認までの時間**: プロセス改善用
- **差し戻し率**: 品質管理指標

## 🔧 実装ステップ

### Step 1: データ構造拡張（今回）
- [ ] タスクオブジェクトの拡張
- [ ] PJ作成機能
- [ ] 既存タスクのマイグレーション

### Step 2: 表示切り替え機能
- [ ] フィルター拡張
- [ ] PJ/個人モードの切り替え
- [ ] カラム表示の動的変更

### Step 3: 移動申請機能
- [ ] 申請UI
- [ ] 証憑添付機能
- [ ] アラート表示

### Step 4: 承認フロー
- [ ] 承認者権限チェック
- [ ] 承認/差し戻しUI
- [ ] 通知機能

## ⚠️ 注意事項

### 既存機能との互換性
- 既存の個人タスクは従来通り動作
- `projectId`がないタスクは個人タスクとして扱い

### エラーハンドリング
- ネットワーク切断時の状態同期
- 同時編集時の競合解決
- データ不整合の自動修復

---

**次回実装**: Step 1から順次実装開始
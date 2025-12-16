# 修正ログ: プロジェクト編集のメンバー選択機能削除

**日付**: 2025-11-28
**作業時間**: 約20分
**重要度**: 🔴🔴 高優先度
**ステータス**: ✅ 修正完了

---

## 問題の概要

### 症状

1. **プロジェクト編集時にメンバー選択欄が表示される**
   - タスク作成時に指定するため、プロジェクト編集時は不要

2. **メンバーを選ばないと編集できない**
   - バリデーションエラー: 「少なくとも1人のメンバーを選択してください」
   - メンバーを選択しないと保存できない

3. **無効化されたユーザーも選択肢に表示される**
   - `localStorage.getItem('systemUsers')` から全ユーザーを取得
   - 無効化ユーザーのフィルタリングがない

4. **既存メンバーのほとんどが undefined になっている**
   - ユーザー情報の取得に問題がある可能性

### 影響
- プロジェクト編集が正常に機能しない
- カラム追加のテストができない（メンバー選択で止まる）
- ユーザー体験の低下

---

## 根本原因

### 問題箇所

**1. メンバー選択UIの生成** (index-kanban.html:13451-13460):
```javascript
const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
const memberOptions = systemUsers.map(user => {
    const isSelected = project.members.includes(user.email);
    return `
        <label>
            <input type="checkbox" value="${user.email}" ${isSelected ? 'checked' : ''}>
            <span>${user.name} (${user.email})</span>
        </label>
    `;
}).join('');
```

**2. モーダル内のメンバー選択UI** (index-kanban.html:13497-13502):
```html
<div style="margin-bottom: 1.5rem;">
    <label>プロジェクトメンバー</label>
    <div id="membersList">
        ${memberOptions}
    </div>
</div>
```

**3. メンバー取得ロジック** (index-kanban.html:13542-13546):
```javascript
const memberCheckboxes = modalElement.querySelectorAll('#membersList input[type="checkbox"]');
const members = Array.from(memberCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
```

**4. メンバー未選択のバリデーション** (index-kanban.html:13558-13561):
```javascript
if (members.length === 0) {
    alert('少なくとも1人のメンバーを選択してください');
    return;
}
```

**5. プロジェクト更新時のメンバー設定** (index-kanban.html:13560):
```javascript
members: members, // ← 削除した変数を参照
```

---

## 修正内容

### 修正1: メンバー選択UI生成ロジックを削除 (13451-13452)

**修正前**:
```javascript
const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
const memberOptions = systemUsers.map(user => {
    const isSelected = project.members.includes(user.email);
    return `
        <label>
            <input type="checkbox" value="${user.email}" ${isSelected ? 'checked' : ''}>
            <span>${user.name} (${user.email})</span>
        </label>
    `;
}).join('');

modal.innerHTML = `
```

**修正後**:
```javascript
// 🔥 メンバー選択機能は削除（タスク作成時に指定するため不要）

modal.innerHTML = `
```

---

### 修正2: モーダル内のメンバー選択UIを削除 (13488)

**修正前**:
```html
<div style="margin-bottom: 1.5rem;">
    <label>プロジェクトメンバー</label>
    <div id="membersList">
        ${memberOptions}
    </div>
</div>

<div style="margin-bottom: 1.5rem;">
    <label>カラム設定</label>
    ...
</div>
```

**修正後**:
```html
<div style="margin-bottom: 1.5rem;">
    <label>カラム設定</label>
    ...
</div>
```

---

### 修正3: メンバー取得ロジックとバリデーションを削除 (13526)

**修正前**:
```javascript
const status = document.getElementById('editProjectStatus').value;
const columns = getEditProjectColumns();

// メンバーリストを取得
const memberCheckboxes = modalElement.querySelectorAll('#membersList input[type="checkbox"]');
const members = Array.from(memberCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

if (!name) {
    alert('プロジェクト名を入力してください');
    return;
}

if (columns.length === 0) {
    alert('最低1つのカラムを設定してください');
    return;
}

if (members.length === 0) {
    alert('少なくとも1人のメンバーを選択してください');
    return;
}
```

**修正後**:
```javascript
const status = document.getElementById('editProjectStatus').value;
const columns = getEditProjectColumns();

// 🔥 メンバー選択機能は削除（タスク作成時に指定するため不要）

if (!name) {
    alert('プロジェクト名を入力してください');
    return;
}

if (columns.length === 0) {
    alert('最低1つのカラムを設定してください');
    return;
}
```

---

### 修正4: プロジェクト更新時に既存メンバーを保持 (13560)

**修正前**:
```javascript
const updatedProject = {
    ...existingProject,
    name: name,
    description: description,
    visibility: visibility,
    status: status,
    columns: columns,
    members: members, // ← 削除した変数を参照（エラー）
    updatedAt: new Date().toISOString()
};
```

**修正後**:
```javascript
const updatedProject = {
    ...existingProject,
    name: name,
    description: description,
    visibility: visibility,
    status: status,
    columns: columns,
    // 🔥 members は既存のものを保持（編集不可）
    updatedAt: new Date().toISOString()
};
```

**解説**:
- `...existingProject` でスプレッド演算子を使っているため、既存の `members` フィールドが自動的に保持される
- メンバー編集機能を削除したため、明示的に `members` を設定する必要がない

---

## 期待される動作

### Before（修正前）

```
プロジェクト編集モーダルを開く
↓
メンバー選択欄が表示される
↓
メンバーを選択しないと保存できない ❌
↓
無効化ユーザーも表示される ❌
↓
undefinedのメンバーが表示される ❌
```

### After（修正後）

```
プロジェクト編集モーダルを開く
↓
メンバー選択欄が表示されない ✅
↓
カラムを追加・編集
↓
保存ボタンをクリック
↓
即座に保存成功 ✅
↓
既存メンバーは保持される ✅
```

---

## テスト方法

### 1. プロジェクト編集モーダルの表示確認

**手順**:
1. 開発環境 (`http://localhost:3000/index-kanban.html`) を開く
2. サイドバーからプロジェクトを選択
3. 「✏️ 編集」ボタンをクリック

**確認事項**:
- [ ] メンバー選択欄が表示されない
- [ ] カラム設定欄が表示される
- [ ] その他のフィールド（名前、説明、公開設定、ステータス）が表示される

---

### 2. カラム追加・保存のテスト

**手順**:
1. プロジェクト編集モーダルを開く
2. 「➕ カラム追加」ボタンをクリック
3. カラム名を入力（例: 「🔍 レビュー中」）
4. 「💾 保存」ボタンをクリック

**確認事項**:
- [ ] メンバー未選択のエラーが出ない
- [ ] 保存が成功する
- [ ] アラート「プロジェクトを更新しました！」が表示される
- [ ] モーダルが閉じる
- [ ] カンバンボードに新しいカラムが即座に反映される

---

### 3. 既存メンバーの保持確認

**手順**:
1. Firebaseコンソールでプロジェクトの `members` フィールドを確認（事前）
2. プロジェクトを編集して保存
3. Firebaseコンソールでプロジェクトの `members` フィールドを確認（事後）

**確認事項**:
- [ ] `members` フィールドが変更されていない（保持されている）

---

## 関連する問題と今後の対応

### 🔍 発見された関連問題

1. **無効化ユーザーのフィルタリング**
   - `localStorage.getItem('systemUsers')` から取得するユーザー一覧に無効化ユーザーが含まれる
   - 他の機能でも同様の問題が発生している可能性

2. **undefined のメンバー表示**
   - ユーザー情報の取得に問題がある可能性
   - `systemUsers` の構造を確認する必要がある

### 📋 今後の対応（別タスク）

1. **ユーザー情報取得のロジック全体をチェック**
   - `localStorage.getItem('systemUsers')` を使用している箇所を検索
   - 無効化ユーザーのフィルタリングを追加
   - `undefined` が表示される原因を調査

2. **プロジェクトメンバー機能の見直し**
   - プロジェクト作成時のメンバー設定は必要か？
   - タスク作成時の担当者指定で十分か？

---

## 副作用・注意点

### ✅ 問題なし
- 既存のプロジェクトデータに影響なし
- メンバー情報は保持される
- 構文エラーなし

### ⚠️ 注意
- プロジェクト編集でメンバーを追加・削除できなくなる
  - 対策: プロジェクト作成時に正しいメンバーを設定する
  - または、別途メンバー管理機能を実装する（必要に応じて）

---

## コミット情報

- **修正ファイル**: `sales-task-core/index-kanban.html`
- **変更箇所**:
  - Line 13451-13452: メンバーオプション生成ロジック削除
  - Line 13488: メンバー選択UI削除
  - Line 13526: メンバー取得・バリデーション削除
  - Line 13560: メンバー保持（明示的設定を削除）
- **変更行数**: 25行削減

---

## 次のステップ

### 残タスク

1. **カラム追加即時反映のテスト**
   - メンバー選択機能削除により、テスト可能になった
   - カラム追加後、即座に反映されることを確認

2. **ユーザー情報取得のロジック調査**（別タスク）
   - `systemUsers` の undefined 問題を調査
   - 無効化ユーザーのフィルタリングを実装

---

## 追加修正1: モーダルが閉じない問題（2025-12-01）

### 問題の発見

**ユーザー報告**: 「閉じないね。。。説明欄を編集してみたんだけど。保存ボタンが消えたのみだった。」

**症状**:
- プロジェクト編集後、保存ボタンが消える
- モーダルが閉じない
- アラートも表示されない

### 根本原因

**問題箇所**: index-kanban.html:13502

```html
<button onclick="saveProjectChanges('${project.id}', this.closest('div'))" ...>
```

**原因**:
- `this.closest('div')` は、ボタンから最も近い `div` を取得する
- 実際に取得されたのは、ボタンを含む flex コンテナ（13498行の `<div style="display: flex; gap: 1rem; justify-content: flex-end;">`）
- モーダル全体（`projectEditModal`）ではなく、ボタンコンテナだけが削除されるため「保存ボタンが消えた」状態になった

### 修正内容

**修正1**: 保存ボタンのonclick属性を修正（13502行）

```html
<!-- 修正前 -->
<button onclick="saveProjectChanges('${project.id}', this.closest('div'))" ...>

<!-- 修正後 -->
<button onclick="saveProjectChanges('${project.id}')" ...>
```

**修正2**: 関数シグネチャを修正（13518行）

```javascript
// 修正前
async function saveProjectChanges(projectId, modalElement) {

// 修正後
async function saveProjectChanges(projectId) {
```

**修正3**: モーダル削除処理を修正（13572-13573行）

```javascript
// 修正前
modalElement.remove();

// 修正後
const modal = document.getElementById('projectEditModal');
if (modal) modal.remove();
```

### テスト結果

- ✅ モーダルが正しく閉じる
- ✅ アラートが表示される
- ✅ カンバンボードが更新される

---

## 追加修正2: 公開設定の削除（2025-12-01）

### ユーザー要望

**質問**: 「後は公開設定っているっけ？これタスク単位でメンバーも変えるから、メンバーのみにした場合の影響がよくわからない。」

**回答選択**: 「1 no 2 いったんは削除で。」

### 問題の分析

**公開設定の使われ方**:
- `public` (🌐 全員に公開): 全ユーザーがプロジェクト一覧で見られる
- `private` (🔒 メンバーのみ): プロジェクトメンバーとオーナーのみが見られる

**潜在的な問題**:
- プロジェクトを `private` に設定し、プロジェクトメンバーでない人がタスクの担当者になった場合、その人はプロジェクトを見られない
- タスク単位でメンバーを変える運用には適さない設計

**ユーザー判断**: 公開設定は不要 → UI から削除

### 修正内容

**修正1**: プロジェクト作成フォームから公開設定UIを削除（1864-1868行）

```html
<!-- 削除 -->
<label style="font-size: 0.9rem; color: #6b7280;">公開設定:</label>
<select id="newProjectVisibility" style="...">
    <option value="public">🌐 全員に公開</option>
    <option value="private">🔒 メンバーのみ</option>
</select>
```

**修正2**: プロジェクト編集モーダルから公開設定UIを削除（13471-13477行 削除済み）

```html
<!-- 削除 -->
<div style="margin-bottom: 1rem;">
    <label>公開設定</label>
    <select id="editProjectVisibility" ...>
        <option value="public">🌐 全員に公開</option>
        <option value="private">🔒 メンバーのみ</option>
    </select>
</div>
```

**修正3**: createNewProject関数の修正（13210, 13272行）

```javascript
// 修正前
const visibility = document.getElementById('newProjectVisibility').value;
...
visibility: visibility,

// 修正後
// visibility取得コードを削除
...
visibility: 'public', // デフォルトで全員に公開（公開設定UIは削除）
```

**修正4**: saveProjectChanges関数の修正（13514, 13550行）

```javascript
// 修正前
const visibility = document.getElementById('editProjectVisibility').value;
...
visibility: visibility,

// 修正後
// visibility取得コードを削除
...
// 🔥 members, visibility は既存のものを保持（編集不可）
```

### 変更点のまとめ

- **新規プロジェクト作成**: すべて `visibility: 'public'` として作成
- **既存プロジェクト編集**: `visibility` は既存値を保持（スプレッド演算子で自動保持）
- **UI**: 公開設定の選択肢が完全に非表示

### 影響範囲

- ✅ 既存のプロジェクトデータには影響なし（visibility フィールドは保持される）
- ✅ 新規作成プロジェクトはすべて `public` として作成される
- ✅ プロジェクトの表示ロジックは変更なし（既存の visibility 判定は動作し続ける）

---

**最終更新**: 2025-12-01
**作成者**: Claude Code
**レビュー**: 邨中天真

# エラーログ: キャッシュが古い状態を読み込み続ける問題

**発生日**: 2025-12-15（問題自体は以前から繰り返し発生）
**重要度**: 最高
**ステータス**: 調査中

---

## 問題の概要

開発環境で古いバージョンのコードがキャッシュされ続け、最新のコードが反映されない問題。
**ユーザーから何度も指摘されていたにもかかわらず、エラーログに記録していなかった。**

---

## 発生した現象

### 1. 「9月のコードを読み込み続ける」問題
- **現象**: APP_VERSIONが9月のままで表示される
- **期待**: 最新のバージョンが表示される
- **ユーザーコメント**: 「なぜ9月を呼び込むのか」（何度も指摘）

### 2. 最新の変更が反映されない
- **現象**: コードを編集しても画面に反映されない
- **期待**: 編集後すぐに反映される

---

## 考えられる原因

### 1. ブラウザキャッシュ
- **対策**: ハードリフレッシュ（Ctrl+Shift+R）
- **対策**: DevTools > Network > Disable cache
- **対策**: DevTools > Application > Clear storage

### 2. Service Worker
- **確認方法**: DevTools > Application > Service Workers
- **対策**: Unregister all service workers
- **対策**: `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()))`

### 3. live-serverのキャッシュ
- **対策**: live-serverを再起動
- **対策**: `pkill -f live-server && npx live-server sales-task-core --port=3000`

### 4. HTTPキャッシュヘッダー
- **確認方法**: DevTools > Network > 該当ファイル > Headers
- **対策**: Cache-Control: no-cache, no-store を設定

### 5. ファイルシステムの問題（WSL環境）
- **WSL特有の問題**: Windowsとのファイル同期遅延
- **対策**: `wsl --shutdown` で再起動
- **対策**: ファイルをWSL内で直接編集

---

## 調査手順

### Step 1: 現在のバージョン確認
```bash
grep "APP_VERSION" sales-task-core/index-kanban.html
```

### Step 2: ブラウザで表示されるバージョン確認
1. DevTools > Console
2. `console.log(APP_VERSION)` を実行

### Step 3: 不一致がある場合
1. ハードリフレッシュ（Ctrl+Shift+R）
2. それでもダメなら DevTools > Application > Clear storage
3. それでもダメなら Service Worker を削除
4. それでもダメなら live-server を再起動

---

## 再発防止策

### 1. コード変更時の確認手順
1. ファイルを保存
2. ターミナルで `grep "変更した内容" ファイルパス` で保存を確認
3. ブラウザでハードリフレッシュ
4. DevToolsで変更が反映されているか確認

### 2. APP_VERSIONを必ず更新
```javascript
// 変更時に必ず更新
const APP_VERSION = 'YYYY-MM-DD-vX-変更内容';
```

### 3. 開発開始時のルーティン（2025-12-26更新）
```bash
# 1. 現在のサーバー状態確認
lsof -i :8080

# 2. 古いサーバーがあれば停止
pkill -f "http.server 8080"

# 3. 新しいサーバー起動
cd /home/muranaka-tenma/sales-task-manager/sales-task-core
python3 -m http.server 8080
```

**開発環境URL**: `http://localhost:8080/index-kanban.html`

---

## 教訓

### 絶対にやるべきこと
1. **問題が発生したら即座にエラーログに記録する**
2. **ユーザーから指摘されたら最優先で記録する**
3. **「あとで記録しよう」は許されない**

### 問題を放置した結果
- 同じ問題が繰り返し発生
- ユーザーの信頼を失った
- 「何度も言ったのに」と怒られた

---

## 関連ファイル

- `sales-task-core/index-kanban.html` - APP_VERSION定義
- `package.json` - live-server設定

---

**作成者**: Claude Code
**最終更新**: 2025-12-15
**反省**: ユーザーから何度も指摘されていたのに、エラーログに残さなかった。これは絶対にあってはならないことだった。

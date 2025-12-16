# エラーログ: 開発環境URLを繰り返し間違える

**日付**: 2025-12-04
**重要度**: 🔴🔴🔴 最高（繰り返しミス）
**ステータス**: 記録済み

---

## 問題

開発環境のURLを何度も間違えて伝えてしまう。

### 正しいURL
```
http://localhost:3000/index-kanban.html
```

### 間違ったURL（使ってはいけない）
```
http://localhost:3000/sales-task-core/index-kanban.html  ← ❌ 余計なパスが入っている
```

---

## なぜ間違えるのか

1. **package.jsonの設定を見落とす**
   ```json
   "dev": "live-server sales-task-core --port=3000 --no-browser"
   ```
   - `sales-task-core`がルートディレクトリになる
   - だから`/index-kanban.html`だけでアクセスできる

2. **本番環境URLとの混同**
   - 本番: `https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html`
   - 開発: `http://localhost:3000/index-kanban.html`
   - 本番は`sales-task-core/`が必要、開発は不要

3. **VERIFIED_INFORMATION.mdを読んでいるのに適用しない**
   - ドキュメントを読んでも、回答時に間違える

---

## 再発防止策

### 絶対ルール
**開発環境URLを伝える前に必ず確認する**:
1. VERIFIED_INFORMATION.mdを開く
2. 「3. 開発環境URL」セクションを読む
3. そのまま正確にコピーする

### 覚え方
- **開発環境 = ポート3000 + ファイル名だけ**
- **本番環境 = Netlify URL + sales-task-core/ + ファイル名**

---

## ユーザーへの謝罪テンプレート

```
すみません、開発環境URLを間違えました。

正しいURL: http://localhost:3000/index-kanban.html
間違ったURL: http://localhost:3000/sales-task-core/index-kanban.html

以後、必ずVERIFIED_INFORMATION.mdを確認してから回答します。
```

---

**作成日**: 2025-12-04
**原因**: ドキュメントを読んでも回答時に適用しない
**対策**: URL回答前に必ずVERIFIED_INFORMATION.mdを確認

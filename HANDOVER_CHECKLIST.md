# 完全引継ぎチェックリスト - 二度と同じミスを繰り返さない

**作成日**: 2025-11-21
**重要度**: 🔴🔴🔴 最高
**目的**: 新規セッション開始時に必ず実行する

---

## 🎯 このチェックリストの目的

**2025-11-21に発生した問題**:
- SyntaxErrorの原因特定に6時間かかった
- プロジェクトフォルダの混乱
- バージョン不一致による混乱
- 何度も同じ調査を繰り返した

**このチェックリストで防ぐこと**:
✅ 時間の無駄を防ぐ
✅ 混乱を即座に解消
✅ 正しい情報に素早くアクセス
✅ 同じミスを二度と繰り返さない

---

## 📋 新規セッション開始時のチェックリスト

### Phase 1: プロジェクト確認（1分）

```bash
# ステップ1: 正しいディレクトリにいることを確認
cd /home/muranaka-tenma/sales-task-manager
pwd

# ステップ2: プロジェクト構造を確認
ls -la | head -20

# ステップ3: メインファイルの存在確認
ls sales-task-core/index-kanban.html
```

**チェック項目**:
- [ ] 現在地が `/home/muranaka-tenma/sales-task-manager` である
- [ ] `sales-task-core/` フォルダが存在する
- [ ] `index-kanban.html` が存在する
- [ ] `.git/` フォルダが存在する（Gitリポジトリである）

**⚠️ 注意**: `/home/muranaka-tenma/タスク管理ツール` は別プロジェクト（未着手）。混同しない！

---

### Phase 2: 最新情報の読み取り（3分）

#### 2-1. START_HEREを読む
```bash
cat START_HERE.md
```

**確認事項**:
- [ ] 最新のTODOファイル名を確認（現在: TODO-v004-2025-11-20.md）
- [ ] 最新の要件定義ファイル名を確認

#### 2-2. 最新TODOを読む
```bash
cat TODO-v004-2025-11-20.md
```

**確認事項**:
- [ ] 🔴🔴🔴 最優先タスクを把握（3.5時間）
- [ ] 🔴 高優先度タスクを把握（6.5-8.5時間）
- [ ] 残作業時間の総計を把握（約18-23時間）

#### 2-3. エラーログを確認
```bash
ls -la error-logs/
cat error-logs/*.md | tail -50
```

**確認事項**:
- [ ] 過去に発生したエラーを把握
- [ ] 再発防止策を確認

---

### Phase 3: システム状態の確認（2分）

#### 3-1. Git状態の確認
```bash
git status
git log --oneline -5
git remote -v
```

**チェック項目**:
- [ ] ブランチが `main` である
- [ ] 未コミットの変更がないか確認
- [ ] リモートが `https://github.com/muranaka-tenma/sales-task-manager.git` である

#### 3-2. 開発サーバーの確認
```bash
# サーバーが起動しているか確認
ps aux | grep live-server | grep -v grep

# 起動していない場合は起動
npm run dev
```

**チェック項目**:
- [ ] live-serverが起動している
- [ ] `http://localhost:3000/index-kanban.html` にアクセスできる

#### 3-3. ファイルバージョンの確認
```bash
# キャッシュログのバージョン
grep "console.log('✅ \[CACHE\]" sales-task-core/index-kanban.html

# APP_VERSIONのバージョン
grep "const APP_VERSION =" sales-task-core/index-kanban.html
```

**チェック項目**:
- [ ] 両方のバージョンが一致している（現在: `2025-11-20-v8-hide-management-id`）
- [ ] 不一致の場合は `error-logs/` で原因を確認

---

### Phase 4: 環境の整合性確認（2分）

#### 4-1. 本番環境の確認
```bash
# 本番環境のステータスコード確認
curl -s -o /dev/null -w "%{http_code}" https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html

# 期待値: 200
```

**チェック項目**:
- [ ] 本番環境が正常に動作している（HTTP 200）
- [ ] Netlify Webダッシュボードでデプロイ履歴を確認

#### 4-2. Firebase接続確認
```bash
# ブラウザで開発環境にアクセスし、コンソールを確認
# 以下のログが出ていればOK:
# ✅ [CACHE] キャッシュクリア完了
# 🔗 [WEBHOOK-SPLIT] Webhook URL設定完了
```

**チェック項目**:
- [ ] Firebase初期化エラーがない
- [ ] 認証が正常に動作している

---

## 🚨 トラブルシューティング

### 問題: エラーが出ている

#### ステップ1: エラーメッセージを記録
```markdown
## エラー内容
- ファイル: index-kanban.html
- 行番号: 10083
- エラー: Uncaught SyntaxError: Unexpected end of input
- 発生環境: 開発環境 / 本番環境
```

#### ステップ2: エラーログを確認
```bash
# 同様のエラーが過去にないか確認
grep -r "SyntaxError" error-logs/
grep -r "Unexpected" error-logs/
```

#### ステップ3: エラーログに記録
```bash
# 新しいエラーログファイルを作成
nano error-logs/$(date +%Y-%m-%d)-<error-type>.md
```

**テンプレート**: `error-logs/2025-11-21-syntax-error-template-literal.md` を参考

---

### 問題: プロジェクトフォルダがわからない

```bash
# プロジェクト一覧を表示
ls -la /home/muranaka-tenma/ | grep -E "sales|タスク"

# 正しいプロジェクトに移動
cd /home/muranaka-tenma/sales-task-manager

# 確認
pwd
```

**参照**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

### 問題: バージョンが不一致

#### 原因1: キャッシュログが古い
```bash
# 45行目を確認
sed -n '45p' sales-task-core/index-kanban.html

# APP_VERSIONを確認
grep "const APP_VERSION =" sales-task-core/index-kanban.html
```

**解決策**: キャッシュログをAPP_VERSIONに合わせて更新

#### 原因2: ブラウザキャッシュ
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

### 問題: 本番環境と開発環境で動作が異なる

#### チェックリスト
1. [ ] ファイルは完全に同一か？
   ```bash
   # ローカル
   wc -l sales-task-core/index-kanban.html

   # 本番
   curl -s https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html | wc -l
   ```

2. [ ] 最新のコミットがプッシュされているか？
   ```bash
   git log origin/main --oneline -5
   ```

3. [ ] Netlifyのデプロイが成功しているか？
   - Webダッシュボードで確認

**参照**: [TOOLING_INTEGRATION.md](./TOOLING_INTEGRATION.md)

---

## 📚 重要ドキュメントクイックリンク

### 必読ドキュメント
1. **[START_HERE.md](./START_HERE.md)** - セッション開始時に必ず読む
2. **[TODO-v004-2025-11-20.md](./TODO-v004-2025-11-20.md)** - 最新のタスクリスト
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - プロジェクト構造の明確化

### 参考ドキュメント
4. **[TOOLING_INTEGRATION.md](./TOOLING_INTEGRATION.md)** - Git/Netlify/Firebase連携
5. **[error-logs/](./error-logs/)** - エラー対処ログ
6. **[SESSION.md](./SESSION.md)** - セッション履歴（詳細）

### 要件定義
7. **[handover/requirements/2025-11-20-comprehensive-requirements.md](./handover/requirements/2025-11-20-comprehensive-requirements.md)** - 包括的要件定義

---

## 🔄 作業フロー

### 開発の標準フロー

```
1. セッション開始
   ↓
2. このチェックリストを実行（5-10分）
   ↓
3. TODO-v004から優先タスクを選択
   ↓
4. ローカルで実装・テスト
   ↓
5. 動作確認（localhost:3000）
   ↓
6. Git commit
   ↓
7. ユーザーに確認を取る
   ↓
8. Git push（本番デプロイ）
   ↓
9. 本番環境で動作確認
   ↓
10. TODOを更新
   ↓
11. エラーが出た場合は error-logs/ に記録
```

### デプロイの標準フロー

```bash
# ステップ1: ローカルでテスト
npm run dev
# ブラウザで動作確認

# ステップ2: コミット
git add sales-task-core/index-kanban.html
git commit -m "fix: <変更内容>"

# ステップ3: ユーザーに確認
# 「本番環境にデプロイしてよろしいですか？」

# ステップ4: プッシュ
git push origin main

# ステップ5: 本番確認（1-2分待つ）
curl -I https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
```

---

## ⚠️ 絶対にやってはいけないこと

### ❌ 禁止事項

1. **`/home/muranaka-tenma/タスク管理ツール` で作業する**
   - これは別の未着手プロジェクト
   - 作業するのは常に `sales-task-manager`

2. **ユーザー確認なしに `git push` する**
   - `git push` = 本番デプロイ
   - 必ずユーザーの承認を得る

3. **エラーを記録せずに次に進む**
   - 同じエラーが再発する
   - 必ず `error-logs/` に記録

4. **古いTODOファイルを読む**
   - 必ず最新バージョン（v004）を読む
   - START_HERE.mdで確認

5. **テンプレートリテラルにHTMLを含める**
   - `newWindow.document.write(\`<html>...\`)` は NG
   - 文字列連結を使用: `'<' + '/html>'`

---

## 📊 セッション終了時のチェックリスト

### 作業完了後

- [ ] 変更をコミット・プッシュした
- [ ] 本番環境で動作確認した
- [ ] TODOファイルを更新した
- [ ] エラーが出た場合は `error-logs/` に記録した
- [ ] 次回セッションへの引継ぎ事項を `START_HERE.md` に記載した

### ドキュメント更新

- [ ] 新しい機能を追加した場合 → README.md更新
- [ ] 新しいエラーを発見した場合 → error-logs/に追加
- [ ] 作業フローが変わった場合 → このチェックリスト更新

---

## 🎓 教訓

### 2025-11-21に学んだこと

1. **エラーメッセージの行番号を最優先で確認する**
   - 遠回りせず、まずエラー箇所を読む

2. **ブラウザのエラーとNode.jsのエラーは異なる**
   - HTMLコンテキストの問題はブラウザでしか発生しない

3. **テンプレートリテラルとHTMLの組み合わせは要注意**
   - 特に `<script>` タグ内でHTMLを生成する場合

4. **プロジェクト名とフォルダ名は異なることがある**
   - 必ず絶対パスで確認する

5. **バージョン表記の不一致は表面的な問題**
   - 本質的なエラーを見逃さない

---

## 📞 緊急時の対応

### どうしても解決できない場合

1. **エラーログを確認**
   ```bash
   cat error-logs/*.md
   ```

2. **過去のセッション履歴を確認**
   ```bash
   cat SESSION.md | tail -200
   ```

3. **Gitで前のバージョンに戻す**
   ```bash
   git log --oneline
   git reset --hard <working-commit-hash>
   ```

4. **ユーザーに状況を報告**
   - 何を試したか
   - どこまで調査したか
   - 次に何を試すべきか

---

## 🎯 このチェックリストの使い方

### 新規セッション開始時
```bash
# ステップ1: このファイルを開く
cat HANDOVER_CHECKLIST.md

# ステップ2: Phase 1から順に実行
# 所要時間: 5-10分

# ステップ3: すべてのチェック項目が✓になるまで進めない
```

### トラブル発生時
```bash
# このファイルの「トラブルシューティング」セクションを参照
grep -A 20 "## 🚨 トラブルシューティング" HANDOVER_CHECKLIST.md
```

---

**最終更新**: 2025-11-21
**作成理由**: 2025-11-21のSyntaxError対応に6時間かかったことを二度と繰り返さないため
**次回更新**: 新しい問題が発生したとき、または作業フローが変更されたとき

---

## ✅ このチェックリストを実行しましたか？

- [ ] Phase 1: プロジェクト確認（1分）完了
- [ ] Phase 2: 最新情報の読み取り（3分）完了
- [ ] Phase 3: システム状態の確認（2分）完了
- [ ] Phase 4: 環境の整合性確認（2分）完了

**すべてにチェックが入ったら、作業を開始してください。**

# 🚨 緊急修復ガイド

## JavaScript構文エラーで画面が表示されない場合の即座修復方法

### 症状
- ブラウザコンソールに `SyntaxError` が表示される
- タスク画面が表示されない
- Firebase認証は成功するが、メインUIが読み込まれない

### 緊急修復手順

#### 1. 即座確認コマンド
```bash
# sales-task-coreディレクトリで実行
cd /home/muranaka-tenma/顧客管理ツール/frontend/src/services/api/最強タスク管理ツール/sales-task-core

# JavaScriptの構文チェック
node -c index-kanban.html
```

#### 2. 最新の既知良好版へのロールバック
```bash
# 直前のコミットにロールバック
git reset --hard HEAD~1
git push origin main --force

# 特定の既知良好コミットにロールバック（例：18d7b31）
git reset --hard 18d7b31
git push origin main --force
```

#### 3. よくある構文エラーパターンと修正

**パターン1: 不完全なifブロック**
```javascript
// ❌ エラーパターン
if (condition) {
    // 確認不要（期限状態に変化なし）
}

// ✅ 修正例
if (condition) {
    // 確認不要（期限状態に変化なし）
    console.log('処理完了');
}
```

**パターン2: 不完全なtryブロック**
```javascript
// ❌ エラーパターン  
try {
    // 処理
// catch または finally がない

// ✅ 修正例
try {
    // 処理
} catch (error) {
    console.error(error);
}
```

**パターン3: 削除による括弧の不整合**
```javascript
// ❌ エラーパターン
function test() {
    if (condition) {
        // 処理が削除されて閉じ括弧だけ残る
    }
// 関数の閉じ括弧がない

// ✅ 修正例
function test() {
    if (condition) {
        // 処理
    }
} // 関数の閉じ括弧を追加
```

#### 4. 構文チェックツール
```bash
# Node.jsでのチェック
node -c index-kanban.html

# 詳細なエラー位置を確認
grep -n "function\|if\|try\|for\|while" index-kanban.html | tail -20
```

### 予防策

#### 1. 削除作業時の注意点
- **大きなコードブロックを削除する時は、必ず対応する括弧も確認**
- **if文、try文、function文の削除時は特に注意**
- **削除後は必ずローカルでブラウザコンソールをチェック**

#### 2. 削除前のバックアップ
```bash
# 重要な変更前はバックアップコミットを作成
git add .
git commit -m "🔄 バックアップ: [変更内容]実施前の状態"
```

#### 3. 段階的デプロイ
- **大きな削除は複数回に分けて実施**
- **各段階でデプロイ→動作確認→次の段階**
- **一度に複数の構文構造を変更しない**

#### 4. 緊急時のトラブルシューティング順序
1. **ブラウザコンソールでエラー行を確認**
2. **該当行前後の括弧の整合性をチェック**
3. **削除した部分の影響範囲を確認**
4. **最小限の修正で構文エラーを解決**
5. **動作確認後、必要に応じて追加修正**

### 緊急連絡先とエスカレーション
- 修復に15分以上かかる場合は既知良好版にロールバック
- 本番環境の停止時間を最小化することを最優先とする

---
**最終更新**: 2025-09-22
**作成理由**: JavaScript構文エラーによる画面表示不具合の再発防止
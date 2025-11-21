# エラー対処ログ: SyntaxError - Template Literal in HTML

**日付**: 2025-11-21
**対応時間**: 約6時間
**重要度**: 🔴🔴🔴 最高
**再発防止**: 必須

---

## エラー内容

### 症状
```
index-kanban.html:10083 Uncaught SyntaxError: Unexpected end of input
```

- 開発環境（localhost:3000）でページ読み込み時に発生
- 本番環境（Netlify）では発生しない（謎）
- ブラウザのコンソールにエラーが表示される

### ユーザーへの影響
- ページが正常に動作しない
- 開発が完全に停止

---

## 原因

### 根本原因
**HTMLファイル内のJavaScriptで、テンプレートリテラル内にHTMLの閉じタグを含めた場合、ブラウザのHTMLパーサーが誤って外側の`<script>`タグを閉じてしまう**

### 問題のコード（10038-10055行目）
```javascript
// ❌ 問題のあるコード
newWindow.document.write(`
    <html>
        <head><title>OCR前処理プレビュー</title></head>
        <body style="margin: 20px; font-family: Arial, sans-serif;">
            <h3>元画像 vs 処理後</h3>
            <!-- ... -->
        </body>
    </html>
`);
```

### なぜエラーになるのか
1. ブラウザはHTMLを上から順に解析する
2. `<script>`タグ内でも、`</body>`や`</html>`といった閉じタグを見つける
3. パーサーが「これは本物の閉じタグだ」と誤認識
4. テンプレートリテラルが終わる前に、外側の`<script>`タグが閉じられる
5. 残りのJavaScriptコードが実行されず、"Unexpected end of input"エラー

### なぜNode.jsでのシンタックスチェックでは検出されなかったのか
- Node.jsはJavaScriptのみを解析する（HTMLコンテキストを考慮しない）
- ブラウザはHTML+JavaScriptを統合的に解析する
- このエラーは「HTMLパーサーとJavaScriptパーサーの相互作用」によって発生

---

## 解決方法

### 修正後のコード
```javascript
// ✅ 修正後のコード
newWindow.document.write(
    '<html>' +
    '<head><title>OCR前処理プレビュー<' + '/title><' + '/head>' +
    '<body style="margin: 20px; font-family: Arial, sans-serif;">' +
    '<h3>元画像 vs 処理後<' + '/h3>' +
    '<div style="display: flex; gap: 20px;">' +
    '<div>' +
    '<h4>元画像<' + '/h4>' +
    '<canvas id="original" style="border: 1px solid #ccc;"><' + '/canvas>' +
    '<' + '/div>' +
    '<div>' +
    '<h4>処理後<' + '/h4>' +
    '<canvas id="processed" style="border: 1px solid #ccc;"><' + '/canvas>' +
    '<' + '/div>' +
    '<' + '/div>' +
    '<' + '/body>' +
    '<' + '/html>'
);
```

### 修正のポイント
1. テンプレートリテラル（`` ` ``）を使わない
2. 文字列連結（`+`）を使用
3. 閉じタグを `'<' + '/tag>'` のように分割してエスケープ
4. これによりHTMLパーサーが閉じタグとして認識しない

---

## 再発防止策

### ⚠️ 絶対に守るべきルール

1. **HTMLファイル内の`<script>`タグ内では、テンプレートリテラルにHTMLコードを含めない**
2. `document.write()`や`innerHTML`でHTMLを書く場合は：
   - 文字列連結を使う
   - 閉じタグを `'<' + '/tag>'` 形式でエスケープ
3. または、HTMLを別ファイルに分離する

### チェック方法

```bash
# HTMLファイル内でテンプレートリテラルに閉じタグが含まれていないか確認
grep -n '`.*</.*>' sales-task-core/index-kanban.html
```

出力があった場合は要注意！

### 同様の問題が起きやすいパターン

- `document.write()`
- `innerHTML = ` ...
- `outerHTML = ` ...
- `insertAdjacentHTML()`

これらでHTMLを動的生成する場合は特に注意。

---

## トラブルシューティング時の教訓

### ❌ やってしまった間違い

1. **ブラウザキャッシュの問題だと思い込んだ**
   - 実際はコードの問題だった
   - キャッシュクリアを何度も繰り返し、時間を浪費

2. **バージョン表記の不一致に気を取られた**
   - キャッシュログとAPP_VERSIONの不一致を問題視
   - これは表面的な問題で、本質的なエラーではなかった

3. **Git/Netlifyのデプロイ問題だと思い込んだ**
   - 本番と開発で同じファイルなのにエラーが異なる状況に混乱
   - 実際はローカルの問題

4. **何度も同じ調査を繰り返した**
   - ファイルの内容確認、バージョン確認を何度も実施
   - エラーメッセージの行番号付近を確認せず、遠回りした

### ✅ 正しいアプローチ

1. **エラーメッセージの行番号を最優先で確認する**
   - `index-kanban.html:10083` → まず10083行目とその前後を読む

2. **JavaScriptの構文エラーは、その直前のコードに原因がある**
   - "Unexpected end of input" = どこかで括弧が閉じていない
   - 10083行より前のコードを重点的に調査

3. **ブラウザのエラーとNode.jsのエラーは異なる**
   - HTMLコンテキストの問題はブラウザでしか発生しない
   - Node.jsでのシンタックスチェックが通っても安心しない

4. **テンプレートリテラルとHTMLの組み合わせは要注意**
   - 特に`<script>`タグ内でHTMLを生成する場合

---

## 関連ドキュメント

- [HTMLパーサーとJavaScriptの相互作用](https://html.spec.whatwg.org/multipage/scripting.html)
- [Escaping in script elements](https://mathiasbynens.be/notes/etago)

---

## コミット情報

- **修正コミット**: （この後作成）
- **変更ファイル**: `sales-task-core/index-kanban.html`
- **変更箇所**:
  - Line 10038-10055: `newWindow.document.write()`のエスケープ
  - Line 45: キャッシュログバージョン更新

---

**最終更新**: 2025-11-21
**担当者**: Claude Code
**レビュー**: 邨中天真

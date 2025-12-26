# 新規セッション開始時の必読ファイル

**作成日**: 2025-11-20
**最終更新**: 2025-12-26
**重要度**: 最優先

---

## 正しいプロジェクトディレクトリ

```
/home/muranaka-tenma/sales-task-manager/
```

**注意**: `/home/muranaka-tenma/タスク管理ツール/` は別プロジェクトです。

---

## セッション開始時に必ず読むファイル

### 1. TODO-Vシリーズ（最新から順に）

```
現在の最新: TODO-v017-2025-12-19.md
```

| ファイル | 内容 |
|---------|------|
| **TODO-v017-2025-12-19.md** | 最新（12/25-26のクリーンアップ含む） |
| TODO-v016〜v001 | 過去の履歴（必要に応じて参照） |

### 2. エラーログ（全件読む）

```
/home/muranaka-tenma/sales-task-manager/error-logs/
```

| 重要なエラーログ | 内容 |
|----------------|------|
| 2025-12-15-git-checkout-disaster.md | git checkoutによる1ヶ月分消失（絶対読む） |
| 2025-12-04-wrong-dev-url-repeated-mistake.md | 開発環境URL間違い |
| 2025-12-25-user-display-name-romaji-fix.md | 担当者ローマ字表示バグ |

---

## 絶対に守るルール

1. **破壊的gitコマンド禁止**
   - `git checkout --`
   - `git reset --hard`
   - `git clean -fd`
   - `git push --force`

2. **変更したらすぐコミット**

3. **コード削除前にファクトチェック**
   - 削除対象が本当に参照されていないか確認

---

## 開発環境

```
URL: http://localhost:8080/index-kanban.html
起動: cd sales-task-core && python3 -m http.server 8080
```

## 本番環境

```
URL: https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core/index-kanban.html
デプロイ: git push origin main（Netlify自動デプロイ）
```

---

## 現在のステータス（2025-12-26）

### 完了
- クリーンアップ: 34,440行削減
- emailToNameMap統合
- 開発環境URL統一

### 次のタスク
| 優先度 | タスク |
|--------|--------|
| 中 | roleMap統合 |
| 中 | console.log削減 |
| 高 | LocalStorage脱却（至上命題） |

---

## 主要ファイル

| ファイル | 用途 |
|---------|------|
| sales-task-core/index-kanban.html | メインアプリ（15,377行） |
| sales-task-core/firebase-config-auth-fix-20250819-132508.js | Firebase設定（使用中） |
| sales-task-core/firebase-config.js | Firebase設定（他HTMLで使用） |

---

**最終更新**: 2025-12-26

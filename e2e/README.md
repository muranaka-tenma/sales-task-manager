# E2Eテストスイート

## 📋 概要

Sales Task Managerの包括的なE2Eテスト（Playwright使用）

**総テスト数**: 251項目（段階的実装）
**現在実装済み**: 22項目（Phase 1 + Phase 2）

---

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
npm install
npx playwright install chromium
```

### 2. 環境変数設定

`.env`ファイルを作成（`.env.example`を参考に）:

```bash
cp .env.example .env
```

実際のパスワードを設定:

```env
DEV_PASSWORD=actual-password
ADMIN_PASSWORD=actual-password
USER_PASSWORD=actual-password
```

---

## 🧪 テスト実行

### 全テスト実行

```bash
npm test
```

### Phase別実行

```bash
# Phase 1のみ（今日の修正に直結）
npx playwright test phase1-today-fixes

# Phase 2のみ（データ整合性監視）
npx playwright test phase2-data-integrity
```

### デバッグモード

```bash
npm run test:debug
```

### UIモード（推奨）

```bash
npm run test:ui
```

### ヘッドフルモード（ブラウザ表示）

```bash
npm run test:headed
```

---

## 📊 実装済みテスト一覧

### Phase 1: 今日の修正に直結（17テスト）

#### 1. プロジェクトタスク作成後の表示問題修正
- ✅ TASK-PROJ-005: 作成後にプロジェクトビューに自動切り替え
- ✅ TASK-PROJ-006: 作成後にタスクが即座に表示される
- ✅ VIEW-002: プロジェクトビュー切り替え（全3プロジェクト）
- ✅ DATA-003: Firebase保存後にリロードしてもデータ一致

#### 2. 期限切れタスク赤色表示の修正
- ✅ VIEW-004: 期限切れタスクが赤色表示
- ✅ EDGE-005: 過去の日付を期限に設定

#### 3. プロジェクトタスク編集モーダルのFirebase IDクォート
- ✅ MODAL-002: タスク編集モーダル（プロジェクトタスク）
- ✅ MODAL-003: 編集モーダルのFirebase IDクォート
- ✅ ERROR-001: コンソールにエラーが出ていないか

#### 4. パスワード変更機能の動作確認
- ✅ MYPAGE-003: パスワード変更機能

#### 5. UI/ナビゲーション確認
- ✅ UI-001: ナビゲーション確認

#### 6. テンプレート機能確認
- ✅ TMPL-003: カテゴリ設定確認

### Phase 2: データ整合性・変更監視（5テスト）

- ✅ WATCH-001: タスク作成後にプロジェクトデータが変わらない
- ✅ WATCH-002: プロジェクトタスク作成後にプロジェクトstatusが変わらない
- ✅ WATCH-003: タスク編集後にプロジェクトデータが変わらない
- ✅ WATCH-004: カラム移動後にプロジェクトデータが変わらない
- ✅ WATCH-005: リロード後もプロジェクトデータが一致

---

## 📈 今後の実装予定

### Phase 3: Critical機能（+28テスト） - 1時間
- 認証（全ユーザーログイン）
- Slack通知
- プロジェクトstatus不変性

### Phase 4: 全機能網羅（+201テスト） - 8-10時間
- 251テスト全実装

---

## 🔍 テスト結果の確認

### HTMLレポート

```bash
npx playwright show-report
```

### スクリーンショット・動画

失敗時のスクリーンショットと動画は `test-results/` に保存されます。

---

## 🚨 注意事項

### 本番環境でのテスト

このテストは **本番環境（Netlify）** で実行されます。

- テストデータは実際のFirebaseに保存されます
- テスト実行前にバックアップ推奨
- テスト後にテストデータを削除してください

### データ変更監視

全テストで `beforeEach` / `afterEach` によるデータ変更監視を実施しています。

意図しないデータ変更が検出された場合、テストは失敗します。

---

## 📞 問い合わせ

テストに関する質問は Claude Code まで。

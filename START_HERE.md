# 🚨 新規セッション開始時の必読ファイル

**作成日**: 2025-11-20
**最終更新**: 2025-11-21
**重要度**: 🔴🔴🔴 最優先

---

## ⚠️ 必ず最初に読むべきドキュメント（更新: 2025-11-21）

**新規追加**: 以下のドキュメントが追加されました（2025-11-21）

### 📋 最優先ドキュメント（5分で読む）

1. **[VERIFIED_INFORMATION.md](./VERIFIED_INFORMATION.md)** ← **最重要！**
   - すべての正しいURL、パス、リンクが記載されている
   - 間違った情報を送らないための唯一の正確な情報源

2. **[HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md)**
   - セッション開始時に実行する5-10分のチェックリスト
   - すべてのチェック項目が✓になるまで作業を開始しない

3. **このファイル（START_HERE.md）**
   - 最新のTODOと要件定義へのリンク

---

## 📝 セッション開始時の標準手順（必須）

次回セッション開始時は、**必ず以下の順序で実行してください**。

---

## 📋 Step 1: 最新のTODOリストを読む

**必ず最新バージョンを読むこと！**

```
現在の最新: TODO-v006-2025-12-01-FINAL.md
```

### TODOファイルのバージョン履歴
- ❌ TODO-v001-2025-11-19.md（古い）
- ❌ TODO-v002-2025-11-19.md（古い）
- ❌ TODO-v003-2025-11-20.md（古い）
- ❌ TODO-v004-2025-11-20.md（古い）
- ❌ TODO-v005-2025-12-01.md（古い）
- ✅ **TODO-v006-2025-12-01-FINAL.md** ← **これを読め！（最終クリーンアップ版）**

---

## 📋 Step 2: 最新の要件定義を読む

**必ず最新バージョンを読むこと！**

```
現在の最新: handover/requirements/2025-12-01-ui-enhancement-phase1.md
```

### 要件定義ファイルのバージョン履歴
- ❌ handover/requirements/2025-11-10-new-requirements.md（古い、13項目のみ）
- ❌ handover/requirements/2025-11-20-comprehensive-requirements.md（古い）
- ✅ **handover/requirements/2025-12-01-ui-enhancement-phase1.md** ← **これを読め！（UI/UX Phase 1完了報告）**

---

## 🎯 現在の状況サマリー

### 本日完了したこと（2025-12-01）
1. ✅ **UI/UX Phase 1 完了**（絵文字削除、中央揃え、設定モーダル、ボタンサイズ、CSS詳細度問題、カラムカウンター、UI強化）
2. ✅ コメントメンション通知修正、全データ削除ボタン修正、カラム追加即時反映修正
3. ✅ **要件検証完了** - 複数選択削除機能、プロジェクト公開設定が実装済みと判明
4. ✅ **TODO大幅クリーンアップ** - 6項目削除、優先度再編成

### 次にやるべきこと（優先順位順）

#### 🔴🔴🔴 最優先（至上命題）
1. **LocalStorage完全脱却プロジェクト**（3-5時間）⚠️ 超重要

#### 🔴 高優先度 - パフォーマンス改善（6.5-9時間）
1. タスク作成・移動のリファクタリング（3-5時間）
2. ヘッダー・サイドバーのUI整理（1時間）← 新規追加
3. 新規タスク・複数選択ボタンの配置検討（30分-1時間）
4. はてなボタンの機能更新（2時間）

#### 🟡 中優先度（3.25時間）
1. 加藤・朝日の管理者権限修正（15分）← すぐにできる
2. ユーザー追加時のセッション上書き問題（1時間）
3. 統計ロジック確認・マイページ統計（2.25時間）

**詳細は TODO-v006-2025-12-01-FINAL.md を参照**

---

## 📁 プロジェクト構造

```
```
sales-task-manager/
├── START_HERE.md                    ← 今ここ（次回セッション開始時に読む）
├── TODO-v006-2025-12-01-FINAL.md   ← 最新TODO（必読）
├── REQUIREMENTS-VERIFICATION-2025-12-01.md  ← 要件検証レポート
├── handover/
│   └── requirements/
│       ├── 2025-12-01-ui-enhancement-phase1.md  ← 最新要件定義（必読）
│       └── 2025-11-20-comprehensive-requirements.md
├── error-logs/
│   ├── 2025-12-01-requirement-misunderstanding-text-alignment.md
│   └── 2025-12-01-css-not-applying-inline-style-override.md
├── sales-task-core/
│   ├── index-kanban.html           ← メインコード
│   ├── pj-settings.html            ← プロジェクト設定
│   └── ...
└── README.md                        ← プロジェクト概要
```

---

## 📚 重要ドキュメント一覧（2025-11-21追加）

### 必読ドキュメント
1. **[VERIFIED_INFORMATION.md](./VERIFIED_INFORMATION.md)** - 正確なURL・パス・リンク
2. **[HANDOVER_CHECKLIST.md](./HANDOVER_CHECKLIST.md)** - セッション開始チェックリスト
3. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - プロジェクト構造の明確化
4. **[TOOLING_INTEGRATION.md](./TOOLING_INTEGRATION.md)** - Git/Netlify/Firebase連携

### エラー対処（重要）
5. **[error-logs/](./error-logs/)** - エラー対処ログ（再発防止策）
   - **重要**: すべてのバグ修正時には必ずエラーログを作成すること
   - 同じミスを繰り返さないための参照資料
   - 作成ルールは [DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md) を参照

---

## 🚫 読んではいけないファイル（古い情報）

以下のファイルは**古いバージョン**です。読まないでください：

- ❌ TODO-v001-2025-11-19.md
- ❌ TODO-v002-2025-11-19.md
- ❌ TODO-v003-2025-11-20.md
- ❌ handover/requirements/2025-11-10-new-requirements.md

---

## 🔄 セッション開始時のチェックリスト

新しいセッションを開始したら、以下を確認してください：

- [ ] このファイル（START_HERE.md）を読んだ
- [ ] TODO-v006-2025-12-01-FINAL.md を読んだ
- [ ] REQUIREMENTS-VERIFICATION-2025-12-01.md を確認した
- [ ] エラーログ（2025-12-01）を確認した
- [ ] 次にやるべきタスク（至上命題: LocalStorage脱却）を把握した

---

## 📝 更新履歴

- **2025-12-01 (v006 FINAL)**: TODO大幅クリーンアップ
  - TODO-v006作成（14項目、13-19.5時間）← 6項目削除、6-7時間削減
  - 要件検証レポート作成（REQUIREMENTS-VERIFICATION-2025-12-01.md）
  - 複数選択削除機能、プロジェクト公開設定が実装済みと判明
  - LocalStorage完全脱却を最優先（至上命題）に格上げ
  - 低優先度4項目を完全削除（解決済み）

- **2025-12-01 (v005)**: UI/UX Phase 1 完了
  - TODO-v005作成（24項目、20-26.5時間）
  - UI/UX Phase 1 完了報告作成
  - エラーログ2件作成（要件理解失敗、CSS詳細度問題）
  - 絵文字削除、中央揃え、設定モーダル最適化、UI強化完了

- **2025-11-20 (v004)**: 初版作成
  - TODO-v004作成（22項目、18-23時間）
  - 包括的要件定義作成
  - 本番環境デプロイ完了

---

**最終更新**: 2025-12-01 (v006 FINAL)

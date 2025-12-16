# LocalStorage → Firebase 移行サマリー

**作成日**: 2025-11-07
**重要度**: Critical
**ステータス**: デプロイ準備完了

---

## エグゼクティブサマリー

このドキュメントは、タスク管理システムのプロジェクト管理機能をLocalStorageからFirebaseに移行する際の変更内容と、安全なデプロイのための完全な手順をまとめたものです。

### 主な変更
- **変更箇所**: 11箇所（プロジェクト管理10箇所 + セキュリティ修正1箇所）
- **影響範囲**: 全ユーザーのプロジェクト関連機能
- **リスク**: 中〜高（データ移行を伴うため）
- **推定デプロイ時間**: 5分（ロールバック含めて最大10分）

---

## 目次

1. [変更内容の詳細](#変更内容の詳細)
2. [リスクアセスメント](#リスクアセスメント)
3. [デプロイ戦略](#デプロイ戦略)
4. [関連ドキュメント](#関連ドキュメント)
5. [クイックリファレンス](#クイックリファレンス)

---

## 変更内容の詳細

### 1. プロジェクト管理機能の移行（10箇所）

#### 変更箇所一覧

| # | 機能 | 変更前 | 変更後 | 影響度 |
|---|------|--------|--------|--------|
| 1 | プロジェクト一覧取得 | localStorage.getItem() | firebase.firestore().collection() | High |
| 2 | プロジェクト作成 | localStorage.setItem() | firestore.add() | High |
| 3 | プロジェクト更新 | localStorage.setItem() | firestore.update() | High |
| 4 | プロジェクト削除 | localStorage.removeItem() | firestore.delete() | High |
| 5 | メンバー管理 | localStorage操作 | firestore.arrayUnion/Remove | Medium |
| 6 | プロジェクト検索 | 配列フィルター | firestore.where() | Medium |
| 7 | プロジェクト統計 | ローカル計算 | firestore集計クエリ | Low |
| 8 | プロジェクト設定 | localStorage | firestore.update() | Medium |
| 9 | アーカイブ機能 | フラグ変更 | firestore.update() | Low |
| 10 | インポート/エクスポート | JSON変換 | firestore batch操作 | Medium |

#### 変更ファイル例

**変更前（LocalStorage）**:
```typescript
// src/services/projectService.ts
export const getProjects = (): Project[] => {
  const data = localStorage.getItem('projects');
  return data ? JSON.parse(data) : [];
};

export const createProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  localStorage.setItem('projects', JSON.stringify(projects));
};
```

**変更後（Firebase）**:
```typescript
// src/services/projectService.ts
export const getProjects = async (): Promise<Project[]> => {
  const snapshot = await firebase
    .firestore()
    .collection('projects')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

export const createProject = async (project: Project): Promise<string> => {
  const docRef = await firebase
    .firestore()
    .collection('projects')
    .add(project);

  return docRef.id;
};
```

### 2. セキュリティ修正（1箇所）

#### isAdmin() 脆弱性修正

**問題点**:
```typescript
// 変更前: LocalStorageで判定（改ざん可能）
export const isAdmin = (): boolean => {
  return localStorage.getItem('isAdmin') === 'true';
};

// 悪意あるユーザーがコンソールで実行可能
localStorage.setItem('isAdmin', 'true'); // ← 簡単に管理者権限取得
```

**修正後**:
```typescript
// 変更後: Firebaseの認証情報で判定
export const isAdmin = async (): Promise<boolean> => {
  const user = firebase.auth().currentUser;
  if (!user) return false;

  // Firestoreのユーザードキュメントから権限取得
  const userDoc = await firebase
    .firestore()
    .collection('users')
    .doc(user.uid)
    .get();

  const userData = userDoc.data();
  return userData?.role === 'admin';
};
```

**セキュリティ改善効果**:
- ✅ LocalStorage改ざんによる権限昇格を防止
- ✅ サーバー側（Firebase）で権限を一元管理
- ✅ 監査ログが自動で記録される

---

## リスクアセスメント

### 高リスク項目

#### 1. データ損失リスク

**シナリオ**: 移行中にユーザーデータが消える

**確率**: 低（適切なバックアップで軽減）

**影響**: Critical（全ユーザーのプロジェクトデータ消失）

**軽減策**:
- ✅ デプロイ前に全ユーザーのLocalStorageバックアップ取得
- ✅ Firebase自動バックアップ設定
- ✅ ロールバック手順の事前準備
- ✅ 復旧スクリプトの事前テスト

**残存リスク**: Very Low

#### 2. 同期問題リスク

**シナリオ**: LocalStorageとFirebaseのデータが不整合

**確率**: 中（初回移行時に発生しやすい）

**影響**: High（一部データが表示されない）

**軽減策**:
- ✅ データ整合性検証スクリプト準備
- ✅ デプロイ直後の徹底的なテスト
- ✅ ユーザーからのフィードバック体制構築

**残存リスク**: Low

#### 3. パフォーマンス低下リスク

**シナリオ**: Firebaseアクセスが遅く、UX低下

**確率**: 低（Firebaseは高速）

**影響**: Medium（ユーザー満足度低下）

**軽減策**:
- ✅ Firestoreインデックス最適化
- ✅ キャッシュ戦略の実装
- ✅ ローディング状態の適切な表示

**残存リスク**: Very Low

### 中リスク項目

#### 4. セキュリティホール

**シナリオ**: Firebaseルール設定ミスで不正アクセス

**確率**: 低（レビュー実施済み）

**影響**: High（機密情報漏洩）

**軽減策**:
- ✅ Firebaseセキュリティルールのレビュー
- ✅ 最小権限の原則適用
- ✅ アクセスログ監視

**残存リスク**: Low

### 低リスク項目

#### 5. UI/UX変更による混乱

**確率**: 中（ユーザー慣れが必要）

**影響**: Low（機能は変わらず）

**軽減策**:
- ✅ ユーザーガイド作成
- ✅ 変更内容の事前通知

---

## デプロイ戦略

### 推奨: 3段階デプロイ（カナリアデプロイ）

#### Phase 1: 開発者のみ（1-2時間）

**目的**: 実環境での最終動作確認

**デプロイ先**: Netlifyブランチデプロイ（deploy-test）

**テスター**: muranaka-tenma

**確認項目**:
- [ ] 全機能動作確認
- [ ] データ整合性確認
- [ ] パフォーマンス測定
- [ ] セキュリティテスト
- [ ] ブラウザ互換性テスト

**判断基準**:
- 全項目合格 → Phase 2へ
- 問題発見 → 修正して再テスト

#### Phase 2: 管理者のみ（24時間）

**目的**: 複数ユーザーでの動作確認

**デプロイ先**: 本番環境（main）

**テスター**: kato-jun, asahi-keiichi（想定）

**確認項目**:
- [ ] マルチユーザー動作確認
- [ ] データ競合確認
- [ ] 長時間稼働確認
- [ ] エラーログ監視

**判断基準**:
- 24時間問題なし + 管理者全員承認 → Phase 3へ
- 問題発見 → 調査・修正

#### Phase 3: 全ユーザー公開

**目的**: 正式リリース

**手順**:
1. 全ユーザーに変更内容通知
2. サポート体制強化（即座対応可能にする）
3. 48時間の集中監視

### 代替案: 一括デプロイ（リスク高）

**条件**: 緊急性が高い場合のみ

**手順**:
1. 全ユーザーにバックアップ依頼
2. メンテナンス時間告知（例: 30分）
3. デプロイ実施
4. 即座動作確認
5. 問題あれば即ロールバック

**非推奨理由**:
- 全ユーザーへの影響が大きい
- 問題発見が遅れる可能性
- ロールバック時の影響が大きい

---

## 関連ドキュメント

このプロジェクトでは、以下の4つの包括的なドキュメントを作成しました。

### 1. ROLLBACK_PLAN.md（ロールバック計画）

**目的**: 問題発生時の緊急対応手順

**内容**:
- 30秒でできる緊急ロールバック
- Git revert手順（1-2分）
- 手動ロールバック手順（5分）
- データ復旧手順
- 確認チェックリスト

**使用タイミング**: デプロイ後に問題が発生した場合

**所在**: `/docs/ROLLBACK_PLAN.md`

### 2. DEPLOYMENT_CHECKLIST.md（デプロイチェックリスト）

**目的**: デプロイ作業の完全ガイド

**内容**:
- デプロイ前準備（24時間前〜）
- 当日の確認事項
- デプロイ実行手順
- デプロイ後確認（5分以内）
- 監視体制（1時間）

**使用タイミング**: デプロイの計画・実施時

**所在**: `/docs/DEPLOYMENT_CHECKLIST.md`

### 3. EMERGENCY_RESPONSE.md（緊急時対応マニュアル）

**目的**: 障害レベル別の対応フロー

**内容**:
- P0（緊急）: 即座対応（30秒）
- P1（重大）: 5分以内対応
- P2（中程度）: 30分以内対応
- P3（軽微）: 計画的対応
- 障害通知テンプレート

**使用タイミング**: 障害発生時

**所在**: `/docs/EMERGENCY_RESPONSE.md`

### 4. BACKUP_RECOVERY.md（バックアップ・復旧手順）

**目的**: データ保護と復旧の完全ガイド

**内容**:
- デプロイ前バックアップ（LocalStorage）
- デプロイ後バックアップ（Firebase）
- データ復旧手順（3パターン）
- 定期バックアップ設定
- バックアップ検証

**使用タイミング**: デプロイ前・データ損失時・定期確認

**所在**: `/docs/BACKUP_RECOVERY.md`

### ドキュメント使用フロー

```
デプロイ計画段階
    ↓
[DEPLOYMENT_CHECKLIST.md] を確認
    ↓
デプロイ前準備
    ↓
[BACKUP_RECOVERY.md] でバックアップ取得
    ↓
デプロイ実施
    ↓
問題発生？
    ↓YES → [EMERGENCY_RESPONSE.md] で重大度判定
    ↓         ↓
    ↓       [ROLLBACK_PLAN.md] でロールバック
    ↓         ↓
    ↓       [BACKUP_RECOVERY.md] でデータ復旧
    ↓
    ↓NO
    ↓
デプロイ成功
    ↓
[DEPLOYMENT_CHECKLIST.md] で事後確認
```

---

## クイックリファレンス

### 緊急時の連絡先

```
レベル1（即座対応）: muranaka-tenma
  Slack: @muranaka-tenma
  Email: example@example.com
  電話: 000-0000-0000

レベル2（5分以内）: kato-jun
  Slack: @kato-jun
  電話: 000-0000-0000

レベル3（15分以内）: asahi-keiichi
  Slack: @asahi-keiichi
  電話: 000-0000-0000
```

### 緊急コマンド集

```bash
# 即座ロールバック（Netlify）
netlify rollback

# Git revert
git revert HEAD --no-edit && git push origin main

# Firebaseバックアップ
firebase firestore:export gs://[bucket]/backups/emergency-$(date +%Y%m%d-%H%M)

# ログ確認
netlify logs --live

# サイトヘルスチェック
curl -I https://[your-app].netlify.app
```

### 判断フローチャート

```
問題発生
    ↓
データ損失？
    ↓YES → P0: 即座ロールバック（30秒）
    ↓NO
    ↓
全機能停止？
    ↓YES → P1: 状況確認→ロールバック判断（5分）
    ↓NO
    ↓
主要機能停止？
    ↓YES → P2: Hot Fix開発（30分）
    ↓NO
    ↓
軽微な問題？
    ↓YES → P3: Issue登録（次回対応）
```

---

## 成功基準

### デプロイ成功の定義

**必須条件**（全て満たす必要あり）:
1. ✅ サイトにアクセスできる
2. ✅ ログイン・ログアウトができる
3. ✅ 既存データが全て表示される
4. ✅ 新規データの作成・編集・削除ができる
5. ✅ ブラウザコンソールに重大なエラーなし
6. ✅ セキュリティテスト合格（isAdmin()改ざん無効）

**推奨条件**（可能な限り満たす）:
- ✅ ページ読み込み3秒以内
- ✅ API応答1秒以内
- ✅ ユーザーからのクレームなし
- ✅ Lighthouse スコア 80点以上

### 監視メトリクス

**24時間監視項目**:
| メトリクス | 目標 | アラート閾値 |
|-----------|------|-------------|
| エラー率 | 0% | > 1% |
| 平均応答時間 | < 1秒 | > 3秒 |
| アクティブユーザー数 | 変動なし | 50%以上減少 |
| Firebase読み取り回数 | 予測範囲内 | 予測の2倍以上 |

---

## 次のステップ

### デプロイ前（必須）

1. [ ] 全関連ドキュメントを読む
   - [ ] ROLLBACK_PLAN.md
   - [ ] DEPLOYMENT_CHECKLIST.md
   - [ ] EMERGENCY_RESPONSE.md
   - [ ] BACKUP_RECOVERY.md

2. [ ] チーム全員に共有
   - [ ] デプロイ日時の合意
   - [ ] 役割分担の確認
   - [ ] 緊急連絡先の確認

3. [ ] バックアップ取得
   - [ ] ユーザーへのバックアップ依頼メール送信
   - [ ] Firebaseエクスポート実行
   - [ ] Gitタグ作成

4. [ ] ローカル最終テスト
   - [ ] ビルド成功確認
   - [ ] 全機能動作確認
   - [ ] セキュリティテスト

### デプロイ当日（必須）

1. [ ] DEPLOYMENT_CHECKLIST.mdに従って実施

2. [ ] 問題発生時は即座にEMERGENCY_RESPONSE.md参照

3. [ ] ロールバック必要時はROLLBACK_PLAN.md実施

### デプロイ後（必須）

1. [ ] 5分以内の確認（DEPLOYMENT_CHECKLIST.md）

2. [ ] 1時間の監視

3. [ ] 24時間の継続監視

4. [ ] 1週間後の振り返りミーティング

---

## FAQ（よくある質問）

### Q1: ロールバックしたらデータは消えますか？

**A**: いいえ。ロールバックはコードを前のバージョンに戻すだけで、Firebaseのデータは保持されます。ただし、LocalStorageのデータとFirebaseのデータが混在する可能性があるため、事前のバックアップが重要です。

### Q2: デプロイに失敗したら誰に連絡すればいいですか？

**A**: 緊急度に応じて以下に連絡してください：
- **P0（データ損失）**: 即座にmuranaka-tenmaに電話
- **P1（機能停止）**: Slack #emergencyチャンネルで@muranaka-tenma
- **P2（軽微な問題）**: Slack #devチャンネルで報告

### Q3: バックアップはどこに保存されますか？

**A**:
- **ユーザーのLocalStorageバックアップ**: 各自のダウンロードフォルダ
- **Firebaseバックアップ**: Google Cloud Storage (`gs://[your-bucket]/backups/`)
- **コードバックアップ**: GitタグおよびNetlifyデプロイ履歴

### Q4: デプロイ中にサービスは停止しますか？

**A**: いいえ。Netlifyはゼロダウンタイムデプロイをサポートしているため、基本的にサービス停止はありません。ただし、デプロイ直後の数秒間は新旧バージョンが混在する可能性があります。

### Q5: Firebase移行でコストは増えますか？

**A**: わずかに増加する可能性があります。FirebaseのFree Tierは以下の範囲内であれば無料です：
- ドキュメント読み取り: 50,000回/日
- ドキュメント書き込み: 20,000回/日
- ストレージ: 1GB

通常の使用ではFree Tierで十分ですが、念のため使用量を監視してください。

---

## 付録

### 用語集

| 用語 | 説明 |
|------|------|
| **ロールバック** | システムを前の安定した状態に戻すこと |
| **Hot Fix** | 緊急の小規模な修正 |
| **カナリアデプロイ** | 段階的に展開するデプロイ手法 |
| **Post-Mortem** | 障害後の振り返りレポート |
| **P0/P1/P2/P3** | 障害の重大度レベル |
| **Firebase Firestore** | NoSQLクラウドデータベース |
| **LocalStorage** | ブラウザのローカルストレージ |

### 変更履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|-----------|---------|--------|
| 2025-11-07 | 1.0 | 初版作成 | muranaka-tenma |

---

**最終更新**: 2025-11-07
**文書オーナー**: muranaka-tenma
**承認者**: [承認者名]
**次回レビュー**: 2025-12-07

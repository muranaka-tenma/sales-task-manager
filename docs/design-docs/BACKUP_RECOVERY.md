# データバックアップ・復旧手順

**作成日**: 2025-11-07
**対象**: LocalStorage → Firebase 移行時のデータ保護
**重要度**: Critical

---

## 目次

1. [デプロイ前バックアップ](#デプロイ前バックアップ)
2. [デプロイ後バックアップ](#デプロイ後バックアップ)
3. [データ復旧手順](#データ復旧手順)
4. [定期バックアップ](#定期バックアップ)
5. [バックアップ検証](#バックアップ検証)

---

## デプロイ前バックアップ

### 1. LocalStorageバックアップ（ユーザー実施）

#### 自動バックアップスクリプト

**バックアップ取得**:
```javascript
/**
 * LocalStorageの全データをJSON形式でバックアップ
 * ブラウザのコンソールで実行
 */
(function() {
  // 1. LocalStorageからデータ取得
  const backupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    data: {}
  };

  // 全てのキーを取得
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      backupData.data[key] = value;
    } catch (error) {
      console.error(`Failed to backup key: ${key}`, error);
    }
  }

  // 2. JSONに変換
  const dataStr = JSON.stringify(backupData, null, 2);

  // 3. ダウンロード
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `localStorage-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(url);

  console.log('✅ バックアップ完了！');
  console.log(`📦 データサイズ: ${(dataStr.length / 1024).toFixed(2)} KB`);
  console.log(`🗂️ キー数: ${Object.keys(backupData.data).length}`);
})();
```

#### ユーザーへの案内メール

**件名**: 【重要】システムアップデート前のデータバックアップのお願い

**本文**:
```
皆さま

本日 [日時] にシステムアップデートを実施します。
念のため、以下の手順でデータのバックアップを取得してください。

【バックアップ手順】（所要時間: 1分）

1. タスク管理システムにログイン
   https://[your-app].netlify.app

2. ブラウザのコンソールを開く
   - Windows/Linux: F12キー または Ctrl+Shift+J
   - Mac: Command+Option+J

3. 以下のスクリプトをコピー＆ペースト
   [上記スクリプトを貼り付け]

4. Enterキーを押す

5. バックアップファイルが自動ダウンロードされます
   ファイル名: localStorage-backup-[日時].json

【保存場所】
ダウンロードフォルダに保存されます。
念のため1週間は削除しないでください。

【問題発生時】
万が一データが消えた場合、このファイルから復元できます。

ご協力よろしくお願いします。

---
問い合わせ先: support@example.com
```

#### バックアップ取得確認リスト

**主要ユーザーのバックアップ確認**:
- [ ] muranaka-tenma: 取得済み（時刻: _____）
- [ ] kato-jun: 取得済み（時刻: _____）
- [ ] asahi-keiichi: 取得済み（時刻: _____）

**バックアップ統計**:
- [ ] バックアップ取得者数: _____ 人
- [ ] 総データサイズ: _____ KB
- [ ] 平均キー数: _____ 個

### 2. 開発者側バックアップ

#### 現在の本番データスナップショット

```bash
# 1. Firebase Firestoreエクスポート（既存データ）
firebase firestore:export gs://[your-bucket]/backups/pre-migration-$(date +%Y%m%d-%H%M)

# 2. エクスポート完了確認
firebase firestore:export --list

# 3. バックアップURLを記録
# 記録: _______________
```

#### Gitタグでのコード保存

```bash
# 1. 現在の状態をタグ付け
git tag -a v1.0-pre-migration -m "Pre-migration snapshot: $(date)"

# 2. リモートにプッシュ
git push origin v1.0-pre-migration

# 3. タグ確認
git tag -l
git show v1.0-pre-migration
```

#### デプロイ情報の記録

```bash
# deployment-info.txt に記録
cat > deployment-info-$(date +%Y%m%d-%H%M).txt <<EOF
=== Deployment Information ===
Date: $(date)
Git Commit: $(git log -1 --format="%H")
Git Branch: $(git branch --show-current)
Git Tag: v1.0-pre-migration

Netlify Deploy:
- Site: [your-site-name]
- URL: https://[your-app].netlify.app
- Deploy ID: [Netlifyから取得]

Firebase Project:
- Project ID: [your-project-id]
- Firestore Backup: gs://[your-bucket]/backups/pre-migration-$(date +%Y%m%d-%H%M)

Contributors:
- muranaka-tenma
- [その他]

EOF

# 確認
cat deployment-info-$(date +%Y%m%d-%H%M).txt
```

---

## デプロイ後バックアップ

### 1. 移行直後のFirebaseバックアップ

```bash
# 1. デプロイ完了後すぐにエクスポート
firebase firestore:export gs://[your-bucket]/backups/post-migration-$(date +%Y%m%d-%H%M)

# 2. 成功確認
echo "Post-migration backup completed at $(date)" >> deployment-info.txt
```

### 2. データ移行検証

#### 移行前後のデータ比較スクリプト

```javascript
/**
 * LocalStorageとFirebaseのデータ整合性チェック
 * デプロイ直後にブラウザコンソールで実行
 */
async function verifyMigration() {
  console.log('🔍 データ移行検証を開始...');

  // LocalStorageバックアップを読み込む（手動でJSON貼り付け）
  const localStorageBackup = JSON.parse(prompt('LocalStorageバックアップJSONを貼り付けてください:'));

  // Firebaseから現在のデータ取得
  const firebaseData = {
    projects: [],
    tasks: [],
    users: []
  };

  // 例: Firestoreからプロジェクト取得
  const projectsSnapshot = await firebase.firestore().collection('projects').get();
  firebaseData.projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 比較
  const localProjects = JSON.parse(localStorageBackup.data.projects || '[]');
  const comparison = {
    localStorage: localProjects.length,
    firebase: firebaseData.projects.length,
    difference: Math.abs(localProjects.length - firebaseData.projects.length)
  };

  console.log('📊 比較結果:', comparison);

  if (comparison.difference === 0) {
    console.log('✅ データ整合性確認: 問題なし');
  } else {
    console.warn('⚠️ データ不一致が検出されました');
    console.log('LocalStorage:', localProjects);
    console.log('Firebase:', firebaseData.projects);
  }

  return comparison;
}

// 実行
verifyMigration();
```

#### 検証チェックリスト

**データ数の確認**:
- [ ] プロジェクト数: LocalStorage ___ 件 = Firebase ___ 件
- [ ] タスク数: LocalStorage ___ 件 = Firebase ___ 件
- [ ] ユーザー数: LocalStorage ___ 件 = Firebase ___ 件

**データ内容の確認**:
- [ ] プロジェクト名が一致
- [ ] タスクの説明が一致
- [ ] 日付フォーマットが正しい
- [ ] 添付ファイル参照が有効

**不一致がある場合**:
- [ ] 不一致の詳細を記録
- [ ] 原因を調査
- [ ] 必要に応じてデータ修正

---

## データ復旧手順

### シナリオ1: LocalStorageからの復旧（移行直後）

#### 完全復旧スクリプト

```javascript
/**
 * LocalStorageバックアップから完全復旧
 * ブラウザコンソールで実行
 */
async function restoreFromLocalStorage() {
  console.log('🔄 LocalStorageからの復旧を開始...');

  // 1. ファイル選択UI表示
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        // 2. バックアップデータ読み込み
        const backupData = JSON.parse(event.target.result);
        console.log('📦 バックアップデータ:', backupData);

        // 3. LocalStorageに復元
        let restoredCount = 0;
        for (const [key, value] of Object.entries(backupData.data)) {
          try {
            localStorage.setItem(key, value);
            restoredCount++;
          } catch (error) {
            console.error(`Failed to restore key: ${key}`, error);
          }
        }

        console.log(`✅ 復元完了: ${restoredCount}/${Object.keys(backupData.data).length} 件`);
        console.log('🔄 ページをリロードします...');

        // 4. リロード
        setTimeout(() => {
          location.reload();
        }, 2000);

      } catch (error) {
        console.error('❌ 復元エラー:', error);
        alert('復元に失敗しました。ファイルを確認してください。');
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// 実行
restoreFromLocalStorage();
```

#### 手順

1. **ユーザーに復旧スクリプト送信**

```
件名: データ復旧手順のご案内

お世話になっております。

データ復旧のため、以下の手順を実施してください。

【復旧手順】（所要時間: 2分）

1. タスク管理システムにログイン
2. ブラウザのコンソールを開く（F12）
3. 以下のスクリプトを貼り付けて実行
   [復旧スクリプト]
4. バックアップファイルを選択
5. 自動的にページがリロードされます

復旧完了後、データが正しく表示されることを確認してください。

問題があればすぐにご連絡ください。
support@example.com
```

2. **復旧確認**

- [ ] データが表示される
- [ ] プロジェクト一覧が正しい
- [ ] タスク一覧が正しい
- [ ] 機能が正常に動作する

### シナリオ2: Firebaseバックアップからの復旧

#### Firebase Importコマンド

```bash
# 1. バックアップ一覧確認
gsutil ls gs://[your-bucket]/backups/

# 2. 復旧するバックアップを選択
BACKUP_PATH="gs://[your-bucket]/backups/pre-migration-20251107-1400"

# 3. 現在のデータを別コレクションに退避（オプション）
firebase firestore:export gs://[your-bucket]/backups/pre-restore-$(date +%Y%m%d-%H%M)

# 4. バックアップから復元
firebase firestore:import $BACKUP_PATH

# 5. 復元確認
firebase firestore:indexes
```

#### 部分的復元（特定コレクションのみ）

```bash
# プロジェクトコレクションのみ復元
gcloud firestore import gs://[your-bucket]/backups/[backup-name] \
  --collection-ids=projects

# タスクコレクションのみ復元
gcloud firestore import gs://[your-bucket]/backups/[backup-name] \
  --collection-ids=tasks
```

### シナリオ3: 手動データ復旧（個別ユーザー）

#### CSVエクスポート・インポート

**エクスポートスクリプト**:
```javascript
/**
 * FirestoreデータをCSV形式でエクスポート
 */
async function exportToCSV(collectionName) {
  const snapshot = await firebase.firestore().collection(collectionName).get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // CSV変換
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
  ].join('\n');

  // ダウンロード
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${collectionName}-${new Date().toISOString()}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  console.log(`✅ ${collectionName} をCSVエクスポート完了`);
}

// 使用例
exportToCSV('projects');
exportToCSV('tasks');
```

**インポートスクリプト**:
```javascript
/**
 * CSVファイルからFirestoreにインポート
 */
async function importFromCSV(collectionName) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'text/csv';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      const csv = event.target.result;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');

      const batch = firebase.firestore().batch();
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => JSON.parse(v));
        const data = {};
        headers.forEach((h, idx) => {
          data[h] = values[idx];
        });

        const docRef = firebase.firestore().collection(collectionName).doc();
        batch.set(docRef, data);
        count++;

        // バッチは500件まで
        if (count % 500 === 0) {
          await batch.commit();
          console.log(`${count} 件インポート済み...`);
        }
      }

      await batch.commit();
      console.log(`✅ 合計 ${count} 件インポート完了`);
    };

    reader.readAsText(file);
  };

  input.click();
}

// 使用例
importFromCSV('projects');
```

---

## 定期バックアップ

### 自動バックアップスクリプト（Cron）

#### 毎日実行スクリプト

```bash
#!/bin/bash
# daily-backup.sh
# Firestore の定期バックアップ

PROJECT_ID="your-project-id"
BUCKET="gs://[your-bucket]/backups"
DATE=$(date +%Y%m%d-%H%M)

echo "=== Starting daily backup at $(date) ==="

# Firestoreエクスポート
gcloud firestore export ${BUCKET}/daily-${DATE} \
  --project=${PROJECT_ID}

# 成功確認
if [ $? -eq 0 ]; then
  echo "✅ Backup completed: ${BUCKET}/daily-${DATE}"

  # Slackに通知（オプション）
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Daily backup completed: '${DATE}'"}' \
    https://hooks.slack.com/services/YOUR/WEBHOOK/URL

  # 30日以上前のバックアップを削除
  gsutil -m rm -r ${BUCKET}/daily-$(date -d '30 days ago' +%Y%m%d)*

else
  echo "❌ Backup failed"

  # 失敗をSlackに通知
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"❌ Daily backup FAILED: '${DATE}'"}' \
    https://hooks.slack.com/services/YOUR/WEBHOOK/URL

  exit 1
fi
```

#### Cron設定

```bash
# crontab -e で編集
# 毎日深夜2時にバックアップ
0 2 * * * /path/to/daily-backup.sh >> /var/log/backup.log 2>&1
```

### 週次バックアップ（長期保存）

```bash
#!/bin/bash
# weekly-backup.sh

PROJECT_ID="your-project-id"
BUCKET="gs://[your-bucket]/backups"
DATE=$(date +%Y%m%d)

echo "=== Starting weekly backup at $(date) ==="

# 週次バックアップ（1年保存）
gcloud firestore export ${BUCKET}/weekly-${DATE} \
  --project=${PROJECT_ID}

# 1年以上前のバックアップを削除
gsutil -m rm -r ${BUCKET}/weekly-$(date -d '365 days ago' +%Y%m%d)*
```

```bash
# crontab設定（毎週日曜深夜3時）
0 3 * * 0 /path/to/weekly-backup.sh >> /var/log/backup.log 2>&1
```

---

## バックアップ検証

### 検証スクリプト

```bash
#!/bin/bash
# verify-backup.sh
# バックアップの整合性確認

BACKUP_PATH="gs://[your-bucket]/backups/daily-20251107-0200"

echo "=== Verifying backup: ${BACKUP_PATH} ==="

# 1. バックアップの存在確認
gsutil ls ${BACKUP_PATH}
if [ $? -ne 0 ]; then
  echo "❌ Backup not found: ${BACKUP_PATH}"
  exit 1
fi

# 2. ファイル数確認
FILE_COUNT=$(gsutil ls -r ${BACKUP_PATH} | wc -l)
echo "📁 File count: ${FILE_COUNT}"

if [ ${FILE_COUNT} -eq 0 ]; then
  echo "❌ Backup is empty"
  exit 1
fi

# 3. サイズ確認
SIZE=$(gsutil du -s ${BACKUP_PATH} | awk '{print $1}')
SIZE_MB=$((SIZE / 1024 / 1024))
echo "💾 Total size: ${SIZE_MB} MB"

if [ ${SIZE_MB} -lt 1 ]; then
  echo "⚠️ Backup size suspiciously small"
fi

# 4. テスト環境にリストア（オプション）
# gcloud firestore import ${BACKUP_PATH} --project=test-project

echo "✅ Backup verification completed"
```

### 復旧テスト（月次推奨）

```markdown
## 復旧テスト手順

### 準備
1. テスト用Firebaseプロジェクト作成
2. 最新バックアップを特定
3. テスト開始時刻を記録

### テスト実施
1. バックアップからテスト環境にリストア
   ```bash
   gcloud firestore import gs://[your-bucket]/backups/latest \
     --project=test-project-id
   ```

2. データ整合性確認
   - データ件数確認
   - ランダムサンプリング（10件）
   - リレーション確認

3. アプリケーション動作確認
   - テスト環境でアプリ起動
   - CRUD操作確認
   - 検索機能確認

4. 所要時間記録
   - リストア時間: _____ 分
   - 確認時間: _____ 分
   - 合計: _____ 分

### 結果記録
- [ ] テスト合格
- [ ] 問題点: _______________
- [ ] 改善アクション: _______________

### クリーンアップ
1. テストデータ削除
2. テストプロジェクト停止
```

---

## バックアップ管理ポリシー

### 保存期間

| バックアップ種類 | 頻度 | 保存期間 | 保存先 |
|-----------------|------|----------|--------|
| 日次バックアップ | 毎日深夜2時 | 30日 | gs://[bucket]/backups/daily-* |
| 週次バックアップ | 毎週日曜深夜3時 | 1年 | gs://[bucket]/backups/weekly-* |
| 月次バックアップ | 毎月1日深夜4時 | 3年 | gs://[bucket]/backups/monthly-* |
| イベントバックアップ | デプロイ前後 | 3ヶ月 | gs://[bucket]/backups/event-* |

### ストレージコスト管理

```bash
# バックアップサイズ確認
gsutil du -sh gs://[your-bucket]/backups/

# 古いバックアップの自動削除（Lifecycle設定）
# lifecycle.json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["backups/daily-"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 365,
          "matchesPrefix": ["backups/weekly-"]
        }
      }
    ]
  }
}

# 設定適用
gsutil lifecycle set lifecycle.json gs://[your-bucket]
```

---

## チェックリスト

### デプロイ前
- [ ] LocalStorageバックアップスクリプト準備
- [ ] ユーザーへのバックアップ案内メール送信
- [ ] 主要ユーザーのバックアップ取得確認
- [ ] Firebaseエクスポート実行
- [ ] Gitタグ作成
- [ ] デプロイ情報記録

### デプロイ後
- [ ] 移行直後のFirebaseバックアップ
- [ ] データ移行検証スクリプト実行
- [ ] データ整合性確認
- [ ] 復旧手順の動作確認

### 定期実施
- [ ] 日次バックアップ動作確認（毎週月曜）
- [ ] 週次バックアップ動作確認（毎月1日）
- [ ] バックアップ検証テスト（毎月）
- [ ] 復旧テスト（四半期ごと）

---

**最終更新**: 2025-11-07
**文書オーナー**: muranaka-tenma
**次回レビュー**: 2025-12-07

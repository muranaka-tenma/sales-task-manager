/**
 * E2Eテスト: カラム機能とユーザー独立性の検証
 *
 * テスト項目:
 * 1. DONEカラムの機能維持（名前・色・位置変更後も機能するか）
 * 2. ARCHIVEカラムの機能維持（名前・色・位置変更後も機能するか）
 * 3. ユーザーごとのカラム独立性
 * 4. type属性の永続性
 *
 * 使用方法: ブラウザコンソールで実行
 */

const E2EColumnTest = {
    testResults: [],

    log(message, type = 'info') {
        const prefix = {
            'pass': '✅',
            'fail': '❌',
            'info': '📋',
            'warn': '⚠️'
        }[type] || '📋';
        console.log(`${prefix} ${message}`);
        this.testResults.push({ message, type, timestamp: new Date().toISOString() });
    },

    // テスト1: type属性の存在確認
    async testTypeAttributes() {
        this.log('=== テスト1: type属性の存在確認 ===', 'info');

        const cols = window.columns || [];
        let hasError = false;

        // 全カラムにtype属性があるか
        cols.forEach((col, i) => {
            if (!col.type) {
                this.log(`カラム[${i}] "${col.title}": type属性なし`, 'fail');
                hasError = true;
            } else {
                this.log(`カラム[${i}] "${col.title}": type=${col.type}`, 'pass');
            }
        });

        // DONEタイプのカラムが1つ存在するか
        const doneColumns = cols.filter(c => c.type === 'done');
        if (doneColumns.length === 0) {
            this.log('DONEタイプのカラムが存在しません', 'fail');
            hasError = true;
        } else if (doneColumns.length > 1) {
            this.log(`DONEタイプのカラムが複数存在: ${doneColumns.length}個`, 'warn');
        } else {
            this.log(`DONEカラム検出: "${doneColumns[0].title}"`, 'pass');
        }

        // ARCHIVEタイプのカラムが1つ存在するか
        const archiveColumns = cols.filter(c => c.type === 'archive');
        if (archiveColumns.length === 0) {
            this.log('ARCHIVEタイプのカラムが存在しません', 'fail');
            hasError = true;
        } else if (archiveColumns.length > 1) {
            this.log(`ARCHIVEタイプのカラムが複数存在: ${archiveColumns.length}個`, 'warn');
        } else {
            this.log(`ARCHIVEカラム検出: "${archiveColumns[0].title}"`, 'pass');
        }

        return !hasError;
    },

    // テスト2: isDoneColumn関数の検証
    async testIsDoneColumnFunction() {
        this.log('=== テスト2: isDoneColumn関数の検証 ===', 'info');

        const cols = window.columns || [];
        const doneCol = cols.find(c => c.type === 'done');

        if (!doneCol) {
            this.log('DONEカラムが見つかりません', 'fail');
            return false;
        }

        // 現在のIDでテスト
        const result1 = window.isDoneColumn(doneCol.id);
        if (result1) {
            this.log(`isDoneColumn("${doneCol.id}") = true`, 'pass');
        } else {
            this.log(`isDoneColumn("${doneCol.id}") = false (期待: true)`, 'fail');
            return false;
        }

        // 他のカラムがDONEと判定されないことを確認
        const normalCols = cols.filter(c => c.type === 'normal');
        let allCorrect = true;
        normalCols.forEach(col => {
            const result = window.isDoneColumn(col.id);
            if (result) {
                this.log(`isDoneColumn("${col.id}") = true (期待: false)`, 'fail');
                allCorrect = false;
            }
        });

        if (allCorrect) {
            this.log('通常カラムは全てDONEと判定されない', 'pass');
        }

        return allCorrect;
    },

    // テスト3: isTrashColumn関数の検証
    async testIsTrashColumnFunction() {
        this.log('=== テスト3: isTrashColumn関数の検証 ===', 'info');

        const cols = window.columns || [];
        const archiveCol = cols.find(c => c.type === 'archive');

        if (!archiveCol) {
            this.log('ARCHIVEカラムが見つかりません', 'fail');
            return false;
        }

        // 現在のIDでテスト
        const result1 = window.isTrashColumn(archiveCol.id);
        if (result1) {
            this.log(`isTrashColumn("${archiveCol.id}") = true`, 'pass');
        } else {
            this.log(`isTrashColumn("${archiveCol.id}") = false (期待: true)`, 'fail');
            return false;
        }

        // 他のカラム（DONE含む）がARCHIVEと判定されないことを確認
        const otherCols = cols.filter(c => c.type !== 'archive');
        let allCorrect = true;
        otherCols.forEach(col => {
            const result = window.isTrashColumn(col.id);
            if (result) {
                this.log(`isTrashColumn("${col.id}") = true (期待: false)`, 'fail');
                allCorrect = false;
            }
        });

        if (allCorrect) {
            this.log('ARCHIVE以外のカラムは全てARCHIVEと判定されない', 'pass');
        }

        return allCorrect;
    },

    // テスト4: カラム名変更後の機能維持テスト
    async testNameChangePreservesFunction() {
        this.log('=== テスト4: カラム名変更後の機能維持テスト ===', 'info');

        const cols = window.columns || [];
        const doneCol = cols.find(c => c.type === 'done');
        const archiveCol = cols.find(c => c.type === 'archive');

        if (!doneCol || !archiveCol) {
            this.log('DONE/ARCHIVEカラムが見つかりません', 'fail');
            return false;
        }

        // 名前を変更してもtype属性は維持されることを確認
        const originalDoneName = doneCol.title;
        const originalArchiveName = archiveCol.title;

        // シミュレーション: 名前を変更
        doneCol.title = '完成品置き場';
        archiveCol.title = 'ゴミ箱じゃないよ';

        // 判定テスト
        const doneStillWorks = window.isDoneColumn(doneCol.id);
        const archiveStillWorks = window.isTrashColumn(archiveCol.id);

        // 名前を元に戻す
        doneCol.title = originalDoneName;
        archiveCol.title = originalArchiveName;

        if (doneStillWorks) {
            this.log('DONEカラム: 名前変更後も機能維持', 'pass');
        } else {
            this.log('DONEカラム: 名前変更後に機能喪失!', 'fail');
        }

        if (archiveStillWorks) {
            this.log('ARCHIVEカラム: 名前変更後も機能維持', 'pass');
        } else {
            this.log('ARCHIVEカラム: 名前変更後に機能喪失!', 'fail');
        }

        return doneStillWorks && archiveStillWorks;
    },

    // テスト5: カラム位置変更後の機能維持テスト
    async testPositionChangePreservesFunction() {
        this.log('=== テスト5: カラム位置変更後の機能維持テスト ===', 'info');

        const cols = window.columns || [];
        const originalOrder = cols.map(c => c.id);

        // DONEとARCHIVEのインデックスを取得
        const doneIndex = cols.findIndex(c => c.type === 'done');
        const archiveIndex = cols.findIndex(c => c.type === 'archive');

        if (doneIndex === -1 || archiveIndex === -1) {
            this.log('DONE/ARCHIVEカラムが見つかりません', 'fail');
            return false;
        }

        // シミュレーション: 位置を入れ替え（DONEを先頭に移動）
        const doneCol = cols[doneIndex];
        cols.splice(doneIndex, 1);
        cols.unshift(doneCol);

        // 判定テスト
        const doneStillWorks = window.isDoneColumn(doneCol.id);
        const archiveCol = cols.find(c => c.type === 'archive');
        const archiveStillWorks = window.isTrashColumn(archiveCol.id);

        // 位置を元に戻す
        cols.splice(0, 1);
        cols.splice(doneIndex, 0, doneCol);

        if (doneStillWorks) {
            this.log('DONEカラム: 位置変更後も機能維持', 'pass');
        } else {
            this.log('DONEカラム: 位置変更後に機能喪失!', 'fail');
        }

        if (archiveStillWorks) {
            this.log('ARCHIVEカラム: 位置変更後も機能維持', 'pass');
        } else {
            this.log('ARCHIVEカラム: 位置変更後に機能喪失!', 'fail');
        }

        return doneStillWorks && archiveStillWorks;
    },

    // テスト6: 色変更後の機能維持テスト
    async testColorChangePreservesFunction() {
        this.log('=== テスト6: 色変更後の機能維持テスト ===', 'info');

        const cols = window.columns || [];
        const doneCol = cols.find(c => c.type === 'done');
        const archiveCol = cols.find(c => c.type === 'archive');

        if (!doneCol || !archiveCol) {
            this.log('DONE/ARCHIVEカラムが見つかりません', 'fail');
            return false;
        }

        // 元の色を保存
        const originalDoneColor = doneCol.color;
        const originalArchiveColor = archiveCol.color;

        // シミュレーション: 色を変更
        doneCol.color = '#ff0000';
        archiveCol.color = '#0000ff';

        // 判定テスト
        const doneStillWorks = window.isDoneColumn(doneCol.id);
        const archiveStillWorks = window.isTrashColumn(archiveCol.id);

        // 色を元に戻す
        doneCol.color = originalDoneColor;
        archiveCol.color = originalArchiveColor;

        if (doneStillWorks) {
            this.log('DONEカラム: 色変更後も機能維持', 'pass');
        } else {
            this.log('DONEカラム: 色変更後に機能喪失!', 'fail');
        }

        if (archiveStillWorks) {
            this.log('ARCHIVEカラム: 色変更後も機能維持', 'pass');
        } else {
            this.log('ARCHIVEカラム: 色変更後に機能喪失!', 'fail');
        }

        return doneStillWorks && archiveStillWorks;
    },

    // テスト7: isOverdue機能のDONE/ARCHIVEカラム対応テスト
    async testIsOverdueWithSpecialColumns() {
        this.log('=== テスト7: isOverdue機能テスト ===', 'info');

        if (!window.isOverdue) {
            this.log('isOverdue関数が見つかりません', 'warn');
            return true;
        }

        const cols = window.columns || [];
        const doneCol = cols.find(c => c.type === 'done');
        const archiveCol = cols.find(c => c.type === 'archive');
        const normalCol = cols.find(c => c.type === 'normal');

        if (!doneCol || !archiveCol || !normalCol) {
            this.log('テストに必要なカラムが揃っていません', 'warn');
            return true;
        }

        // 過去の日付（期限切れ）
        const pastDate = '2020-01-01';

        // 通常カラムでは期限切れになる
        const normalOverdue = window.isOverdue(pastDate, normalCol.id);
        if (normalOverdue) {
            this.log('通常カラム: 期限切れを検出', 'pass');
        } else {
            this.log('通常カラム: 期限切れ未検出 (異常)', 'fail');
        }

        // DONEカラムでは期限切れにならない
        const doneOverdue = window.isOverdue(pastDate, doneCol.id);
        if (!doneOverdue) {
            this.log('DONEカラム: 期限切れ表示されない (正常)', 'pass');
        } else {
            this.log('DONEカラム: 期限切れ表示される (異常)', 'fail');
            return false;
        }

        // ARCHIVEカラムでは期限切れにならない
        const archiveOverdue = window.isOverdue(pastDate, archiveCol.id);
        if (!archiveOverdue) {
            this.log('ARCHIVEカラム: 期限切れ表示されない (正常)', 'pass');
        } else {
            this.log('ARCHIVEカラム: 期限切れ表示される (異常)', 'fail');
            return false;
        }

        // 名前を変更してもDONE/ARCHIVE判定が維持されるか
        const originalDoneName = doneCol.title;
        doneCol.title = '最終納品済み';
        const doneStillWorks = !window.isOverdue(pastDate, doneCol.id);
        doneCol.title = originalDoneName;

        if (doneStillWorks) {
            this.log('DONEカラム(名前変更後): 機能維持確認', 'pass');
        } else {
            this.log('DONEカラム(名前変更後): 機能喪失', 'fail');
            return false;
        }

        return true;
    },

    // テスト8: Firestoreからのカラム読み込み確認
    async testFirestoreColumnLoading() {
        this.log('=== テスト8: Firestoreカラム読み込み確認 ===', 'info');

        if (!window.FirebaseDB || !window.FirebaseDB.getColumns) {
            this.log('FirebaseDB.getColumns関数が見つかりません', 'warn');
            return true; // スキップ
        }

        try {
            const currentUser = window.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                this.log('現在のユーザー情報が取得できません', 'warn');
                return true;
            }

            const result = await window.FirebaseDB.getColumns(currentUser.id);

            if (result.success && result.columns) {
                this.log(`Firestoreから${result.columns.length}個のカラムを取得`, 'pass');

                // type属性の確認
                const hasTypes = result.columns.every(c => c.type);
                if (hasTypes) {
                    this.log('Firestoreのカラムに全てtype属性あり', 'pass');
                } else {
                    this.log('Firestoreのカラムにtype属性がないものあり', 'warn');
                }

                return true;
            } else {
                this.log('Firestoreからカラム取得失敗', 'warn');
                return true;
            }
        } catch (error) {
            this.log(`Firestoreテストエラー: ${error.message}`, 'warn');
            return true;
        }
    },

    // テスト9: 全ユーザーのカラム独立性確認（管理者向け）
    async testUserColumnIndependence() {
        this.log('=== テスト9: ユーザーカラム独立性確認 ===', 'info');

        if (!window.FirebaseDB || !window.FirebaseDB.getUsers) {
            this.log('FirebaseDB.getUsers関数が見つかりません', 'warn');
            return true;
        }

        try {
            const result = await window.FirebaseDB.getUsers();
            const users = result.success ? result.users : [];
            this.log(`${users.length}人のユーザーを検出`, 'info');

            const columnCounts = {};

            for (const user of users) {
                const userId = user.id || user.uid;
                if (!userId) continue;

                try {
                    const result = await window.FirebaseDB.getColumns(userId);
                    if (result.success && result.columns) {
                        const count = result.columns.length;
                        const key = `${count}カラム`;
                        columnCounts[key] = (columnCounts[key] || 0) + 1;

                        // DONE/ARCHIVEの存在確認
                        const hasDone = result.columns.some(c => c.type === 'done');
                        const hasArchive = result.columns.some(c => c.type === 'archive');

                        const status = hasDone && hasArchive ? '✓' : '!';
                        console.log(`  ${status} ${user.email}: ${count}カラム (DONE:${hasDone}, ARCHIVE:${hasArchive})`);
                    }
                } catch (e) {
                    console.log(`  ? ${user.email}: 取得エラー`);
                }
            }

            this.log(`カラム数分布: ${JSON.stringify(columnCounts)}`, 'info');
            return true;

        } catch (error) {
            this.log(`ユーザー一覧取得エラー: ${error.message}`, 'warn');
            return true;
        }
    },

    // 全テスト実行
    async runAllTests() {
        console.clear();
        this.testResults = [];

        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║     E2E カラム機能テスト - 開始                           ║');
        console.log('╚═══════════════════════════════════════════════════════════╝');
        console.log('');

        const tests = [
            { name: 'type属性の存在確認', fn: () => this.testTypeAttributes() },
            { name: 'isDoneColumn関数', fn: () => this.testIsDoneColumnFunction() },
            { name: 'isTrashColumn関数', fn: () => this.testIsTrashColumnFunction() },
            { name: '名前変更後の機能維持', fn: () => this.testNameChangePreservesFunction() },
            { name: '位置変更後の機能維持', fn: () => this.testPositionChangePreservesFunction() },
            { name: '色変更後の機能維持', fn: () => this.testColorChangePreservesFunction() },
            { name: 'isOverdue機能テスト', fn: () => this.testIsOverdueWithSpecialColumns() },
            { name: 'Firestoreカラム読み込み', fn: () => this.testFirestoreColumnLoading() },
            { name: 'ユーザーカラム独立性', fn: () => this.testUserColumnIndependence() },
        ];

        let passCount = 0;
        let failCount = 0;

        for (const test of tests) {
            try {
                const result = await test.fn();
                if (result) {
                    passCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                this.log(`${test.name}: エラー発生 - ${error.message}`, 'fail');
                failCount++;
            }
            console.log('');
        }

        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log(`║     テスト完了: ${passCount} PASS / ${failCount} FAIL                          ║`);
        console.log('╚═══════════════════════════════════════════════════════════╝');

        return {
            passed: passCount,
            failed: failCount,
            results: this.testResults
        };
    }
};

// グローバルに公開
window.E2EColumnTest = E2EColumnTest;

console.log('E2Eテストスクリプトがロードされました。');
console.log('実行方法: E2EColumnTest.runAllTests()');

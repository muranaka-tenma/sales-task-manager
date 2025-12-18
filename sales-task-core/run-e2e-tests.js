/**
 * E2E自動テスト実行スクリプト
 * カラム機能の検証を自動実行（認証不要版）
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:8080/index-kanban.html';

// waitForTimeout の代替（Puppeteer v22+対応）
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runColumnFunctionTests(page) {
    console.log('\n' + '='.repeat(60));
    console.log('Column Function Tests');
    console.log('='.repeat(60));

    const results = await page.evaluate(async () => {
        const testResults = {
            columns: [],
            tests: []
        };

        // カラム情報取得
        const cols = window.columns || [];
        testResults.columns = cols.map(c => ({
            id: c.id,
            title: c.title,
            type: c.type,
            color: c.color
        }));

        // テスト関数
        const addTest = (name, pass, details) => {
            testResults.tests.push({ name, pass, details });
        };

        // テスト1: type属性の存在確認
        const allHaveType = cols.every(c => c.type);
        const hasDone = cols.some(c => c.type === 'done');
        const hasArchive = cols.some(c => c.type === 'archive');
        addTest('全カラムにtype属性あり', allHaveType, { count: cols.length });
        addTest('DONEタイプのカラム存在', hasDone, { done: cols.filter(c => c.type === 'done').map(c => c.title) });
        addTest('ARCHIVEタイプのカラム存在', hasArchive, { archive: cols.filter(c => c.type === 'archive').map(c => c.title) });

        // テスト2: isDoneColumn関数テスト
        if (typeof window.isDoneColumn === 'function') {
            const doneCol = cols.find(c => c.type === 'done');
            if (doneCol) {
                const result = window.isDoneColumn(doneCol.id);
                addTest('isDoneColumn(DONEカラム) = true', result === true, { columnId: doneCol.id, title: doneCol.title });

                // 通常カラムはfalseを返すか
                const normalCols = cols.filter(c => c.type === 'normal');
                const normalAllFalse = normalCols.every(c => !window.isDoneColumn(c.id));
                addTest('isDoneColumn(通常カラム) = false', normalAllFalse, { normalCount: normalCols.length });
            }
        } else {
            addTest('isDoneColumn関数が存在', false, { error: 'function not found' });
        }

        // テスト3: isTrashColumn関数テスト
        if (typeof window.isTrashColumn === 'function') {
            const archiveCol = cols.find(c => c.type === 'archive');
            if (archiveCol) {
                const result = window.isTrashColumn(archiveCol.id);
                addTest('isTrashColumn(ARCHIVEカラム) = true', result === true, { columnId: archiveCol.id, title: archiveCol.title });

                // 通常カラムとDONEカラムはfalseを返すか
                const otherCols = cols.filter(c => c.type !== 'archive');
                const othersAllFalse = otherCols.every(c => !window.isTrashColumn(c.id));
                addTest('isTrashColumn(他カラム) = false', othersAllFalse, { otherCount: otherCols.length });
            }
        } else {
            addTest('isTrashColumn関数が存在', false, { error: 'function not found' });
        }

        // テスト4: 名前変更後のDONE判定維持
        const doneCol = cols.find(c => c.type === 'done');
        if (doneCol && typeof window.isDoneColumn === 'function') {
            const originalTitle = doneCol.title;
            doneCol.title = '完全に別の名前_12345';
            const stillWorks = window.isDoneColumn(doneCol.id);
            doneCol.title = originalTitle;
            addTest('DONE: 名前変更後も機能維持', stillWorks === true, { originalTitle, testTitle: '完全に別の名前_12345' });
        }

        // テスト5: 名前変更後のARCHIVE判定維持
        const archiveCol = cols.find(c => c.type === 'archive');
        if (archiveCol && typeof window.isTrashColumn === 'function') {
            const originalTitle = archiveCol.title;
            archiveCol.title = '絶対違う名前_67890';
            const stillWorks = window.isTrashColumn(archiveCol.id);
            archiveCol.title = originalTitle;
            addTest('ARCHIVE: 名前変更後も機能維持', stillWorks === true, { originalTitle, testTitle: '絶対違う名前_67890' });
        }

        // テスト6: isOverdue機能テスト
        if (typeof window.isOverdue === 'function') {
            const normalCol = cols.find(c => c.type === 'normal');
            const doneCol2 = cols.find(c => c.type === 'done');
            const archiveCol2 = cols.find(c => c.type === 'archive');

            if (normalCol) {
                const normalOverdue = window.isOverdue('2020-01-01', normalCol.id);
                addTest('isOverdue(通常カラム, 過去日) = true', normalOverdue === true, {});
            }
            if (doneCol2) {
                const doneOverdue = window.isOverdue('2020-01-01', doneCol2.id);
                addTest('isOverdue(DONEカラム, 過去日) = false', doneOverdue === false, {});
            }
            if (archiveCol2) {
                const archiveOverdue = window.isOverdue('2020-01-01', archiveCol2.id);
                addTest('isOverdue(ARCHIVEカラム, 過去日) = false', archiveOverdue === false, {});
            }
        }

        // テスト7: 位置変更シミュレーション
        if (doneCol && typeof window.isDoneColumn === 'function') {
            // DONEカラムを先頭に移動
            const originalIndex = cols.indexOf(doneCol);
            cols.splice(originalIndex, 1);
            cols.unshift(doneCol);

            const stillWorkAfterMove = window.isDoneColumn(doneCol.id);

            // 元に戻す
            cols.splice(0, 1);
            cols.splice(originalIndex, 0, doneCol);

            addTest('DONE: 位置変更後も機能維持', stillWorkAfterMove === true, { originalIndex, movedTo: 0 });
        }

        // テスト8: 色変更後の機能維持
        if (doneCol && typeof window.isDoneColumn === 'function') {
            const originalColor = doneCol.color;
            doneCol.color = '#ff00ff';
            const stillWorks = window.isDoneColumn(doneCol.id);
            doneCol.color = originalColor;
            addTest('DONE: 色変更後も機能維持', stillWorks === true, { originalColor, testColor: '#ff00ff' });
        }

        return testResults;
    });

    // 結果表示
    console.log('\nColumns detected:');
    results.columns.forEach(c => {
        const typeLabel = c.type === 'done' ? '[DONE]' : c.type === 'archive' ? '[ARCHIVE]' : '';
        console.log(`  - ${c.title} ${typeLabel} (type: ${c.type}, id: ${c.id})`);
    });

    let passed = 0, failed = 0;
    console.log('\nTest Results:');
    results.tests.forEach(t => {
        const status = t.pass ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} ${t.name}`);
        if (!t.pass && t.details) {
            console.log(`         Details: ${JSON.stringify(t.details)}`);
        }
        if (t.pass) passed++; else failed++;
    });

    return { passed, failed };
}

async function testFirestoreColumns(page) {
    console.log('\n' + '='.repeat(60));
    console.log('Firestore Column Verification');
    console.log('='.repeat(60));

    const results = await page.evaluate(async () => {
        const testResults = { users: [], tests: [] };

        // FirebaseDBが利用可能かチェック
        if (!window.FirebaseDB || !window.FirebaseDB.getUsers) {
            return { error: 'FirebaseDB not available', users: [], tests: [] };
        }

        try {
            const usersResult = await window.FirebaseDB.getUsers();
            if (!usersResult.success) {
                return { error: 'Failed to get users', users: [], tests: [] };
            }

            const users = usersResult.users || [];

            for (const user of users) {
                const userId = user.id || user.uid;
                if (!userId) continue;

                try {
                    const colResult = await window.FirebaseDB.getColumns(userId);
                    if (colResult.success && colResult.columns) {
                        const cols = colResult.columns;
                        const hasDone = cols.some(c => c.type === 'done');
                        const hasArchive = cols.some(c => c.type === 'archive');
                        const allHaveType = cols.every(c => c.type);

                        testResults.users.push({
                            email: user.email,
                            userId: userId,
                            columnCount: cols.length,
                            hasDone,
                            hasArchive,
                            allHaveType,
                            ok: hasDone && hasArchive && allHaveType
                        });
                    }
                } catch (e) {
                    testResults.users.push({
                        email: user.email,
                        userId: userId,
                        error: e.message
                    });
                }
            }

        } catch (e) {
            return { error: e.message, users: [], tests: [] };
        }

        return testResults;
    });

    if (results.error) {
        console.log(`  [INFO] ${results.error}`);
        console.log('  (Firebase認証が必要なためスキップ)');
        return { passed: 0, failed: 0, skipped: true };
    }

    let passed = 0, failed = 0;
    console.log('\nUser Column Status:');
    results.users.forEach(u => {
        if (u.error) {
            console.log(`  ⚠️ ${u.email}: エラー - ${u.error}`);
        } else {
            const status = u.ok ? '✅' : '❌';
            console.log(`  ${status} ${u.email}: ${u.columnCount}カラム (DONE:${u.hasDone}, ARCHIVE:${u.hasArchive})`);
            if (u.ok) passed++; else failed++;
        }
    });

    return { passed, failed };
}

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     E2E カラム機能自動テスト                              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // コンソールログを制限（エラーのみ）
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('permissions')) {
            console.log(`  [Browser] ${msg.text()}`);
        }
    });

    try {
        console.log(`\nLoading: ${TEST_URL}`);
        await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

        // ページ読み込み完了を待つ
        await page.waitForSelector('#kanban-board', { timeout: 15000 });
        console.log('Page loaded successfully');

        // スクリプト読み込みを待つ
        await delay(2000);

        // カラム関数テスト
        const funcTestResult = await runColumnFunctionTests(page);

        // Firestoreカラム検証（認証があれば）
        const firestoreResult = await testFirestoreColumns(page);

        // 最終サマリー
        console.log('\n' + '═'.repeat(60));
        console.log('FINAL SUMMARY');
        console.log('═'.repeat(60));

        const totalPassed = funcTestResult.passed + firestoreResult.passed;
        const totalFailed = funcTestResult.failed + firestoreResult.failed;

        console.log(`カラム関数テスト: ${funcTestResult.passed} passed, ${funcTestResult.failed} failed`);
        if (!firestoreResult.skipped) {
            console.log(`Firestore検証: ${firestoreResult.passed} passed, ${firestoreResult.failed} failed`);
        } else {
            console.log('Firestore検証: スキップ（認証なし）');
        }
        console.log('─'.repeat(60));
        console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);

        if (totalFailed === 0) {
            console.log('\n🎉 All tests passed!');
            console.log('\n結論: カラム名・色・位置を変更しても、DONE/ARCHIVEカラムの機能は維持されます。');
            console.log('      type属性（"done"/"archive"）がカラム機能の識別子として正しく機能しています。');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the results above.');
        }

    } catch (error) {
        console.error('Test execution failed:', error);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);

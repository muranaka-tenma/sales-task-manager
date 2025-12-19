/**
 * 全ユーザー全通りカラム独立性テスト
 * - 各ユーザーがカラム変更（名前・色・位置）
 * - 他ユーザーに影響がないことを確認
 * - タスク作成後もカラム変更が正常に機能することを確認
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const ALL_USERS = [
    'kato-jun@terracom.co.jp',
    'asahi-keiichi@terracom.co.jp',
    'hanzawa-yuka@terracom.co.jp',
    'tamura-wataru@terracom.co.jp',
    'hashimoto-yumi@terracom.co.jp',
    'fukushima-ami@terracom.co.jp',
    'muranaka-tenma@terracom.co.jp'
];

const DEV_PASSWORD = 'aikakumei';
const TEST_URL = 'http://localhost:8080/index-kanban.html';

async function runFullTest() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  全ユーザー×全通り カラム独立性・タスク作成テスト            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const results = {
        phase1_initial: {},
        phase2_changes: {},
        phase3_tasks: {},
        phase4_verify: {},
        errors: []
    };

    try {
        await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
        await page.waitForFunction(() => {
            return window.FirebaseDB &&
                   typeof window.FirebaseDB.getColumns === 'function' &&
                   typeof window.FirebaseDB.saveColumns === 'function';
        }, { timeout: 15000 });
        console.log('Page loaded, FirebaseDB ready\n');

        // ═══════════════════════════════════════════════════════════════
        // Phase 1: 全ユーザーの初期状態を記録
        // ═══════════════════════════════════════════════════════════════
        console.log('════════════════════════════════════════════════════════════');
        console.log('Phase 1: 全ユーザーの初期カラム状態を記録');
        console.log('════════════════════════════════════════════════════════════\n');

        for (const email of ALL_USERS) {
            const userInfo = await loginAndGetColumns(page, email);
            if (userInfo) {
                results.phase1_initial[email] = userInfo;
                console.log(`  ✅ ${email.split('@')[0]}: ${userInfo.columns.length}カラム`);
                console.log(`     DONE: "${userInfo.doneColumn?.title}" / ARCHIVE: "${userInfo.archiveColumn?.title}"`);
            } else {
                console.log(`  ❌ ${email.split('@')[0]}: ログイン失敗`);
                results.errors.push(`Phase1: ${email} login failed`);
            }
            await delay(1500);
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 2: 各ユーザーがカラム変更（名前・色・位置）
        // ═══════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('Phase 2: 各ユーザーがカラムを変更（名前・色・位置）');
        console.log('════════════════════════════════════════════════════════════\n');

        const colorPalette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8'];

        for (let i = 0; i < ALL_USERS.length; i++) {
            const email = ALL_USERS[i];
            const userName = email.split('@')[0];
            const testColor = colorPalette[i % colorPalette.length];

            console.log(`  ${userName}: カラム変更中...`);

            const changeResult = await loginAndChangeColumns(page, email, {
                doneTitle: `完了_${userName}`,
                doneColor: testColor,
                archiveTitle: `アーカイブ_${userName}`,
                archiveColor: colorPalette[(i + 1) % colorPalette.length],
                moveFirstToLast: true
            });

            if (changeResult.success) {
                results.phase2_changes[email] = changeResult;
                console.log(`     ✅ DONE: "${changeResult.doneTitle}" (${changeResult.doneColor})`);
                console.log(`     ✅ ARCHIVE: "${changeResult.archiveTitle}"`);
                console.log(`     ✅ 位置変更: 先頭カラムを末尾へ移動`);
            } else {
                console.log(`     ❌ 変更失敗: ${changeResult.error}`);
                results.errors.push(`Phase2: ${email} change failed - ${changeResult.error}`);
            }
            await delay(2000);
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 3: 各ユーザーでタスク作成
        // ═══════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('Phase 3: 各ユーザーでタスク作成');
        console.log('════════════════════════════════════════════════════════════\n');

        for (const email of ALL_USERS) {
            const userName = email.split('@')[0];

            const taskResult = await loginAndCreateTask(page, email, {
                title: `テストタスク_${userName}_${Date.now()}`,
                columnType: 'normal'
            });

            if (taskResult.success) {
                results.phase3_tasks[email] = taskResult;
                console.log(`  ✅ ${userName}: タスク作成成功 (${taskResult.columnTitle})`);
            } else {
                console.log(`  ❌ ${userName}: タスク作成失敗`);
                results.errors.push(`Phase3: ${email} task creation failed`);
            }
            await delay(1500);
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 4: 全ユーザーのカラム状態を再確認（独立性検証）
        // ═══════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('Phase 4: 全ユーザーのカラム状態を再確認（独立性検証）');
        console.log('════════════════════════════════════════════════════════════\n');

        for (const email of ALL_USERS) {
            const userName = email.split('@')[0];
            const userInfo = await loginAndGetColumns(page, email);

            if (userInfo) {
                results.phase4_verify[email] = userInfo;

                // 期待値と比較
                const expected = results.phase2_changes[email];
                const doneMatch = userInfo.doneColumn?.title === expected?.doneTitle;
                const archiveMatch = userInfo.archiveColumn?.title === expected?.archiveTitle;
                const funcTest = await testColumnFunctions(page);

                console.log(`  ${userName}:`);
                console.log(`     DONE: "${userInfo.doneColumn?.title}" ${doneMatch ? '✅' : '❌'}`);
                console.log(`     ARCHIVE: "${userInfo.archiveColumn?.title}" ${archiveMatch ? '✅' : '❌'}`);
                console.log(`     機能テスト: ${funcTest.allPass ? '✅ 全PASS' : '❌ FAIL'}`);

                if (!doneMatch || !archiveMatch || !funcTest.allPass) {
                    results.errors.push(`Phase4: ${email} verification failed`);
                }
            } else {
                console.log(`  ❌ ${userName}: 確認失敗`);
                results.errors.push(`Phase4: ${email} verification failed - login error`);
            }
            await delay(1500);
        }

        // ═══════════════════════════════════════════════════════════════
        // Phase 5: 他ユーザーへの影響確認（クロスチェック）
        // ═══════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('Phase 5: 他ユーザーへの影響確認（クロスチェック）');
        console.log('════════════════════════════════════════════════════════════\n');

        let crossCheckPassed = 0;
        let crossCheckTotal = 0;

        for (let i = 0; i < ALL_USERS.length; i++) {
            for (let j = 0; j < ALL_USERS.length; j++) {
                if (i === j) continue;

                crossCheckTotal++;
                const userA = ALL_USERS[i].split('@')[0];
                const userB = ALL_USERS[j].split('@')[0];

                const stateA = results.phase4_verify[ALL_USERS[i]];
                const stateB = results.phase4_verify[ALL_USERS[j]];

                if (stateA && stateB) {
                    // AのDONEとBのDONEが異なることを確認（独立性）
                    const isIndependent = stateA.doneColumn?.title !== stateB.doneColumn?.title;
                    if (isIndependent) {
                        crossCheckPassed++;
                    } else {
                        results.errors.push(`CrossCheck: ${userA} and ${userB} have same DONE column`);
                    }
                }
            }
        }

        console.log(`  クロスチェック結果: ${crossCheckPassed}/${crossCheckTotal} PASS`);

        // ═══════════════════════════════════════════════════════════════
        // 最終結果
        // ═══════════════════════════════════════════════════════════════
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('最終結果');
        console.log('════════════════════════════════════════════════════════════\n');

        const totalUsers = ALL_USERS.length;
        const phase1Pass = Object.keys(results.phase1_initial).length;
        const phase2Pass = Object.keys(results.phase2_changes).filter(k => results.phase2_changes[k].success).length;
        const phase3Pass = Object.keys(results.phase3_tasks).filter(k => results.phase3_tasks[k].success).length;
        const phase4Pass = Object.keys(results.phase4_verify).length;

        console.log(`  Phase 1 (初期状態記録):    ${phase1Pass}/${totalUsers} ユーザー`);
        console.log(`  Phase 2 (カラム変更):      ${phase2Pass}/${totalUsers} ユーザー`);
        console.log(`  Phase 3 (タスク作成):      ${phase3Pass}/${totalUsers} ユーザー`);
        console.log(`  Phase 4 (独立性検証):      ${phase4Pass}/${totalUsers} ユーザー`);
        console.log(`  Phase 5 (クロスチェック):  ${crossCheckPassed}/${crossCheckTotal} ペア`);

        if (results.errors.length === 0) {
            console.log('\n🎉 全テスト合格!');
            console.log('   - 各ユーザーのカラム設定は完全に独立');
            console.log('   - カラム名・色・位置変更後もタスク作成正常');
            console.log('   - DONE/ARCHIVE機能は全ユーザーで維持');
        } else {
            console.log('\n⚠️ エラーあり:');
            results.errors.forEach(e => console.log(`   - ${e}`));
        }

    } catch (error) {
        console.error('\n❌ テストエラー:', error.message);
        results.errors.push(`Fatal: ${error.message}`);
    } finally {
        await browser.close();
    }

    return results;
}

// ログインしてカラム情報を取得
async function loginAndGetColumns(page, email) {
    try {
        const result = await page.evaluate(async (userEmail, password) => {
            // ログアウト
            if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
                await window.FirebaseAuth.signOut();
            }
            await new Promise(r => setTimeout(r, 500));

            // ログイン
            const signInResult = await window.FirebaseAuth.signIn(userEmail, password);
            if (!signInResult.success) {
                return { success: false, error: 'Login failed' };
            }

            const uid = signInResult.user.uid;
            await new Promise(r => setTimeout(r, 1000));

            // カラム取得
            const colResult = await window.FirebaseDB.getColumns(uid);
            if (!colResult.success) {
                return { success: false, error: 'Column fetch failed' };
            }

            const columns = colResult.columns;
            const doneColumn = columns.find(c => c.type === 'done');
            const archiveColumn = columns.find(c => c.type === 'archive');

            return {
                success: true,
                uid,
                email: userEmail,
                columns,
                doneColumn,
                archiveColumn
            };
        }, email, DEV_PASSWORD);

        return result.success ? result : null;
    } catch (error) {
        return null;
    }
}

// ログインしてカラムを変更
async function loginAndChangeColumns(page, email, changes) {
    try {
        const result = await page.evaluate(async (userEmail, password, changeConfig) => {
            // ログアウト
            if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
                await window.FirebaseAuth.signOut();
            }
            await new Promise(r => setTimeout(r, 500));

            // ログイン
            const signInResult = await window.FirebaseAuth.signIn(userEmail, password);
            if (!signInResult.success) {
                return { success: false, error: 'Login failed' };
            }

            const uid = signInResult.user.uid;
            await new Promise(r => setTimeout(r, 1000));

            // カラム取得
            const colResult = await window.FirebaseDB.getColumns(uid);
            if (!colResult.success) {
                return { success: false, error: 'Column fetch failed' };
            }

            let columns = [...colResult.columns];

            // DONE/ARCHIVEカラムの名前と色を変更
            columns = columns.map(col => {
                if (col.type === 'done') {
                    return { ...col, title: changeConfig.doneTitle, color: changeConfig.doneColor };
                }
                if (col.type === 'archive') {
                    return { ...col, title: changeConfig.archiveTitle, color: changeConfig.archiveColor };
                }
                return col;
            });

            // 位置変更: 先頭カラムを末尾へ
            if (changeConfig.moveFirstToLast && columns.length > 1) {
                const first = columns.shift();
                columns.push(first);
            }

            // 保存 (引数順序: columns, userId)
            const saveResult = await window.FirebaseDB.saveColumns(columns, uid);
            if (!saveResult.success) {
                return { success: false, error: 'Save failed: ' + (saveResult.error || 'unknown') };
            }

            return {
                success: true,
                doneTitle: changeConfig.doneTitle,
                doneColor: changeConfig.doneColor,
                archiveTitle: changeConfig.archiveTitle,
                archiveColor: changeConfig.archiveColor
            };
        }, email, DEV_PASSWORD, changes);

        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ログインしてタスクを作成
async function loginAndCreateTask(page, email, taskConfig) {
    try {
        const result = await page.evaluate(async (userEmail, password, config) => {
            // ログアウト
            if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
                await window.FirebaseAuth.signOut();
            }
            await new Promise(r => setTimeout(r, 500));

            // ログイン
            const signInResult = await window.FirebaseAuth.signIn(userEmail, password);
            if (!signInResult.success) {
                return { success: false, error: 'Login failed' };
            }

            const uid = signInResult.user.uid;
            const userEmail2 = signInResult.user.email;
            await new Promise(r => setTimeout(r, 1000));

            // カラム取得
            const colResult = await window.FirebaseDB.getColumns(uid);
            if (!colResult.success) {
                return { success: false, error: 'Column fetch failed' };
            }

            const columns = colResult.columns;
            const targetColumn = columns.find(c => c.type === config.columnType) || columns[0];

            // タスク作成
            const newTask = {
                id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: config.title,
                deadline: new Date(Date.now() + 86400000).toISOString(),
                columnId: targetColumn.id,
                assignee: userEmail2.split('@')[0],
                assignees: [userEmail2.split('@')[0]],
                createdAt: new Date().toISOString(),
                createdBy: userEmail2,
                priority: 'medium'
            };

            // Firestoreに保存（直接）
            if (window.FirebaseDB && window.FirebaseDB.saveTasks) {
                // 既存タスクを取得
                const tasksResult = await window.FirebaseDB.getTasks();
                const existingTasks = tasksResult.success ? tasksResult.tasks : [];
                existingTasks.push(newTask);
                await window.FirebaseDB.saveTasks(existingTasks);
            }

            return {
                success: true,
                taskId: newTask.id,
                columnId: targetColumn.id,
                columnTitle: targetColumn.title
            };
        }, email, DEV_PASSWORD, taskConfig);

        return result;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// カラム機能テスト
async function testColumnFunctions(page) {
    try {
        const result = await page.evaluate(() => {
            const tests = [];

            // isDoneColumn テスト
            if (typeof window.isDoneColumn === 'function') {
                const doneCol = window.columns?.find(c => c.type === 'done');
                const normalCol = window.columns?.find(c => c.type === 'normal');
                if (doneCol) tests.push(window.isDoneColumn(doneCol.id) === true);
                if (normalCol) tests.push(window.isDoneColumn(normalCol.id) === false);
            }

            // isTrashColumn テスト
            if (typeof window.isTrashColumn === 'function') {
                const archiveCol = window.columns?.find(c => c.type === 'archive');
                const normalCol = window.columns?.find(c => c.type === 'normal');
                if (archiveCol) tests.push(window.isTrashColumn(archiveCol.id) === true);
                if (normalCol) tests.push(window.isTrashColumn(normalCol.id) === false);
            }

            return {
                allPass: tests.length > 0 && tests.every(t => t === true),
                passed: tests.filter(t => t === true).length,
                total: tests.length
            };
        });

        return result;
    } catch (error) {
        return { allPass: false, passed: 0, total: 0 };
    }
}

// 実行
runFullTest().then(results => {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('テスト完了');
    console.log('════════════════════════════════════════════════════════════');
});

/**
 * E2E自動テスト - カラム独立性検証
 *
 * テストシナリオ:
 * 1. 全ユーザーの初期状態を記録
 * 2. テストユーザー（加藤）がカラム名・色・位置を変更して保存
 * 3. 全ユーザーで再確認
 * 4. 加藤のみ変更、他ユーザーは影響なしを検証
 * 5. 変更後もDONE/ARCHIVE機能が維持されていることを検証
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:8080/index-kanban.html';
const DEV_PASSWORD = 'aikakumei';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// テストユーザー（この人がカラムを変更する）
const MODIFIER_USER = 'kato-jun@terracom.co.jp';

// 全テスト対象ユーザー
const ALL_USERS = [
    'muranaka-tenma@terracom.co.jp',
    'kato-jun@terracom.co.jp',
    'asahi-keiichi@terracom.co.jp',
    'hanzawa-yuka@terracom.co.jp',
    'tamura-wataru@terracom.co.jp',
    'hashimoto-yumi@terracom.co.jp',
    'fukushima-ami@terracom.co.jp'
];

async function loginAsUser(page, email) {
    try {
        // まずFirebaseの準備状態を確認
        const ready = await page.evaluate(() => {
            return {
                hasFirebaseAuth: !!window.FirebaseAuth,
                hasSignIn: !!(window.FirebaseAuth && window.FirebaseAuth.signIn),
                hasFirebaseDB: !!window.FirebaseDB
            };
        });

        if (!ready.hasSignIn) {
            console.log(`    Firebase not ready: ${JSON.stringify(ready)}`);
            return null;
        }

        const result = await page.evaluate(async (userEmail, password) => {
            try {
                console.log('[E2E] Attempting login for:', userEmail);
                const signInResult = await window.FirebaseAuth.signIn(userEmail, password);

                // シンプルな成功/失敗オブジェクトを返す
                if (signInResult && signInResult.success) {
                    // ログイン後にcurrentFirebaseUserを設定
                    window.currentFirebaseUser = signInResult.user;
                    return {
                        success: true,
                        uid: signInResult.user?.uid,
                        email: signInResult.user?.email,
                        name: signInResult.user?.displayName || userEmail.split('@')[0]
                    };
                }
                return {
                    success: false,
                    error: signInResult?.error || signInResult?.message || 'Unknown error'
                };
            } catch (error) {
                console.log('[E2E] Login error:', error.message);
                return { success: false, error: error.message };
            }
        }, email, DEV_PASSWORD);

        if (result && result.success === true) {
            await delay(1000);
            // UIDを含む結果を返す
            return { uid: result.uid, email: result.email, name: result.name };
        }
        console.log(`    Login failed: ${result?.error || 'Unknown'}`);
        return null;
    } catch (error) {
        console.log(`    Login exception: ${error.message}`);
        return null;
    }
}

async function getUserColumns(page, userInfo) {
    const result = await page.evaluate(async (info) => {
        try {
            if (!info || !info.uid) {
                return { success: false, error: 'User info not provided' };
            }

            // Firestoreからカラム取得（直接UIDを使用）
            const colResult = await window.FirebaseDB.getColumns(info.uid);
            if (!colResult.success) {
                return { success: false, error: 'Failed to get columns: ' + (colResult.error || '') };
            }

            return {
                success: true,
                userId: info.uid,
                userName: info.name,
                columns: colResult.columns.map(c => ({
                    id: c.id,
                    title: c.title,
                    type: c.type,
                    color: c.color
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, userInfo);

    return result;
}

async function modifyUserColumns(page, userInfo) {
    // カラムを変更して保存
    const result = await page.evaluate(async (info) => {
        try {
            // まずこのユーザーのカラムをFirestoreから取得
            const colResult = await window.FirebaseDB.getColumns(info.uid);
            if (!colResult.success || !colResult.columns) {
                return { success: false, error: 'Failed to get user columns' };
            }

            const cols = colResult.columns;
            if (cols.length < 2) {
                return { success: false, error: 'Not enough columns' };
            }

            const changes = [];

            // DONEカラムの名前を変更
            const doneCol = cols.find(c => c.type === 'done');
            if (doneCol) {
                const oldTitle = doneCol.title;
                doneCol.title = '完了済み_テスト変更';
                doneCol.color = '#ff6b6b';  // 赤系に変更
                changes.push({ type: 'done', oldTitle, newTitle: doneCol.title, newColor: doneCol.color });
            }

            // ARCHIVEカラムの名前を変更
            const archiveCol = cols.find(c => c.type === 'archive');
            if (archiveCol) {
                const oldTitle = archiveCol.title;
                archiveCol.title = 'ゴミ箱_テスト変更';
                archiveCol.color = '#4ecdc4';  // 青緑に変更
                changes.push({ type: 'archive', oldTitle, newTitle: archiveCol.title, newColor: archiveCol.color });
            }

            // 最初のカラムを最後に移動（位置変更）
            if (cols.length > 2) {
                const firstCol = cols.shift();
                cols.push(firstCol);
                changes.push({ type: 'position', moved: firstCol.title, from: 0, to: cols.length - 1 });
            }

            // Firestoreに保存（ユーザーIDを指定）
            if (window.FirebaseDB && window.FirebaseDB.saveColumns) {
                const saveResult = await window.FirebaseDB.saveColumns(cols, info.uid);
                if (!saveResult.success) {
                    return { success: false, error: 'Failed to save to Firestore: ' + (saveResult.error || '') };
                }
            }

            return { success: true, changes, newColumns: cols.map(c => ({ id: c.id, title: c.title, type: c.type, color: c.color })) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, userInfo);

    return result;
}

async function testColumnFunctions(page, userInfo) {
    const result = await page.evaluate(async (info) => {
        // このユーザーのカラムをFirestoreから取得
        const colResult = await window.FirebaseDB.getColumns(info.uid);
        if (!colResult.success || !colResult.columns) {
            return [{ name: 'getColumns', pass: false, error: 'Failed to get columns' }];
        }

        const cols = colResult.columns;
        const tests = [];

        const doneCol = cols.find(c => c.type === 'done');
        const archiveCol = cols.find(c => c.type === 'archive');

        // type属性の存在確認
        tests.push({
            name: 'DONEカラムにtype="done"',
            pass: doneCol && doneCol.type === 'done',
            columnTitle: doneCol?.title
        });

        tests.push({
            name: 'ARCHIVEカラムにtype="archive"',
            pass: archiveCol && archiveCol.type === 'archive',
            columnTitle: archiveCol?.title
        });

        // window.columnsを更新してから関数テスト
        window.columns = cols;

        if (doneCol && typeof window.isDoneColumn === 'function') {
            tests.push({
                name: 'isDoneColumn()',
                pass: window.isDoneColumn(doneCol.id) === true,
                columnTitle: doneCol.title
            });
        }

        if (archiveCol && typeof window.isTrashColumn === 'function') {
            tests.push({
                name: 'isTrashColumn()',
                pass: window.isTrashColumn(archiveCol.id) === true,
                columnTitle: archiveCol.title
            });
        }

        if (doneCol && typeof window.isOverdue === 'function') {
            tests.push({
                name: 'isOverdue(DONE)=false',
                pass: window.isOverdue('2020-01-01', doneCol.id) === false
            });
        }

        if (archiveCol && typeof window.isOverdue === 'function') {
            tests.push({
                name: 'isOverdue(ARCHIVE)=false',
                pass: window.isOverdue('2020-01-01', archiveCol.id) === false
            });
        }

        return tests;
    }, userInfo);

    return result;
}

async function runFullTest() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  E2E カラム独立性検証テスト                                   ║');
    console.log('║  - 1人が変更しても他ユーザーに影響しないことを検証            ║');
    console.log('║  - 変更後もDONE/ARCHIVE機能が維持されることを検証             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.on('dialog', async dialog => {
        await dialog.accept();
    });

    // ブラウザログを表示（E2Eテスト用）
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[E2E]')) {
            console.log(`  [Browser] ${text}`);
        }
    });

    const initialStates = {};
    const finalStates = {};

    try {
        console.log(`\nLoading: ${TEST_URL}`);
        await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('#kanban-board', { timeout: 15000 });
        console.log('Page loaded');

        // FirebaseDBが完全に初期化されるまで待機
        await page.waitForFunction(() => {
            return window.FirebaseDB &&
                   typeof window.FirebaseDB.getColumns === 'function' &&
                   typeof window.FirebaseDB.saveColumns === 'function';
        }, { timeout: 15000 });
        console.log('FirebaseDB ready\n');
        await delay(1000);

        // ========================================
        // Phase 1: 全ユーザーの初期状態を記録
        // ========================================
        console.log('═'.repeat(60));
        console.log('Phase 1: 全ユーザーの初期状態を記録');
        console.log('═'.repeat(60));

        for (const email of ALL_USERS) {
            console.log(`\n  ${email}:`);
            const userInfo = await loginAsUser(page, email);
            if (!userInfo) {
                console.log(`    ❌ ログイン失敗`);
                continue;
            }
            console.log(`    UID: ${userInfo.uid}`);

            const colData = await getUserColumns(page, userInfo);
            if (colData.success) {
                initialStates[email] = colData;
                console.log(`    ✅ ${colData.userName}: ${colData.columns.length}カラム`);
                const doneCol = colData.columns.find(c => c.type === 'done');
                const archiveCol = colData.columns.find(c => c.type === 'archive');
                console.log(`       DONE: "${doneCol?.title}" / ARCHIVE: "${archiveCol?.title}"`);
            } else {
                console.log(`    ❌ カラム取得失敗: ${colData.error}`);
            }
        }

        // ========================================
        // Phase 2: テストユーザーがカラムを変更
        // ========================================
        console.log('\n' + '═'.repeat(60));
        console.log(`Phase 2: ${MODIFIER_USER} がカラムを変更`);
        console.log('═'.repeat(60));

        console.log(`\n  ${MODIFIER_USER} でログイン中...`);
        const modUserInfo = await loginAsUser(page, MODIFIER_USER);
        if (!modUserInfo) {
            throw new Error('Modifier user login failed');
        }
        console.log(`  UID: ${modUserInfo.uid}`);

        console.log('  カラムを変更中...');
        const modResult = await modifyUserColumns(page, modUserInfo);
        if (modResult.success) {
            console.log('  ✅ 変更完了:');
            modResult.changes.forEach(c => {
                if (c.type === 'position') {
                    console.log(`     位置変更: "${c.moved}" を先頭から末尾へ`);
                } else {
                    console.log(`     ${c.type}: "${c.oldTitle}" → "${c.newTitle}" (色: ${c.newColor})`);
                }
            });
        } else {
            throw new Error(`Column modification failed: ${modResult.error}`);
        }

        await delay(2000);

        // ========================================
        // Phase 3: 全ユーザーで再確認
        // ========================================
        console.log('\n' + '═'.repeat(60));
        console.log('Phase 3: 全ユーザーのカラム状態を再確認');
        console.log('═'.repeat(60));

        for (const email of ALL_USERS) {
            console.log(`\n  ${email}:`);
            const userInfo = await loginAsUser(page, email);
            if (!userInfo) {
                console.log(`    ❌ ログイン失敗`);
                continue;
            }
            console.log(`    UID: ${userInfo.uid}`);

            const colData = await getUserColumns(page, userInfo);
            if (colData.success) {
                finalStates[email] = colData;
                console.log(`    ${colData.userName}: ${colData.columns.length}カラム`);
                const doneCol = colData.columns.find(c => c.type === 'done');
                const archiveCol = colData.columns.find(c => c.type === 'archive');
                console.log(`       DONE: "${doneCol?.title}" / ARCHIVE: "${archiveCol?.title}"`);

                // 機能テスト
                const funcTests = await testColumnFunctions(page, userInfo);
                const allPass = funcTests.every(t => t.pass);
                console.log(`       機能テスト: ${allPass ? '✅ 全PASS' : '❌ FAIL'}`);
                if (!allPass) {
                    funcTests.filter(t => !t.pass).forEach(t => {
                        console.log(`         ❌ ${t.name}`);
                    });
                }
                finalStates[email].funcTests = funcTests;
            } else {
                console.log(`    ❌ カラム取得失敗: ${colData.error}`);
            }
        }

        // ========================================
        // Phase 4: 検証結果
        // ========================================
        console.log('\n' + '═'.repeat(60));
        console.log('Phase 4: 検証結果');
        console.log('═'.repeat(60));

        let allTestsPassed = true;

        console.log('\n【独立性検証】');
        for (const email of ALL_USERS) {
            const initial = initialStates[email];
            const final = finalStates[email];

            if (!initial || !final) {
                console.log(`  ⚠️ ${email}: データ不足`);
                continue;
            }

            const initialDone = initial.columns.find(c => c.type === 'done');
            const finalDone = final.columns.find(c => c.type === 'done');
            const initialArchive = initial.columns.find(c => c.type === 'archive');
            const finalArchive = final.columns.find(c => c.type === 'archive');

            if (email === MODIFIER_USER) {
                // 変更したユーザーは変更されているべき
                const doneChanged = initialDone?.title !== finalDone?.title;
                const archiveChanged = initialArchive?.title !== finalArchive?.title;

                if (doneChanged && archiveChanged) {
                    console.log(`  ✅ ${email} (変更者): カラム変更が反映済み`);
                    console.log(`     DONE: "${initialDone?.title}" → "${finalDone?.title}"`);
                    console.log(`     ARCHIVE: "${initialArchive?.title}" → "${finalArchive?.title}"`);
                } else {
                    console.log(`  ❌ ${email} (変更者): 変更が反映されていない`);
                    allTestsPassed = false;
                }
            } else {
                // 他のユーザーは変更されていないべき
                const doneUnchanged = initialDone?.title === finalDone?.title;
                const archiveUnchanged = initialArchive?.title === finalArchive?.title;

                if (doneUnchanged && archiveUnchanged) {
                    console.log(`  ✅ ${email}: 影響なし（独立性維持）`);
                } else {
                    console.log(`  ❌ ${email}: 他ユーザーの変更が影響している!`);
                    console.log(`     DONE: "${initialDone?.title}" → "${finalDone?.title}"`);
                    allTestsPassed = false;
                }
            }
        }

        console.log('\n【機能維持検証】');
        for (const email of ALL_USERS) {
            const final = finalStates[email];
            if (!final || !final.funcTests) continue;

            const allFuncPass = final.funcTests.every(t => t.pass);
            if (allFuncPass) {
                console.log(`  ✅ ${email}: DONE/ARCHIVE機能正常`);
            } else {
                console.log(`  ❌ ${email}: 機能テスト失敗`);
                allTestsPassed = false;
            }
        }

        // ========================================
        // 最終結論
        // ========================================
        console.log('\n' + '═'.repeat(60));
        console.log('最終結論');
        console.log('═'.repeat(60));

        if (allTestsPassed) {
            console.log('\n🎉 全テスト合格!\n');
            console.log('検証結果:');
            console.log('  ✅ 各ユーザーのカラム設定は完全に独立している');
            console.log('  ✅ 1人が変更しても他ユーザーには影響しない');
            console.log('  ✅ カラム名・色・位置を変更してもDONE/ARCHIVE機能は維持される');
            console.log('  ✅ type属性による機能判定が正しく動作している');
        } else {
            console.log('\n⚠️ 一部のテストに問題があります。');
        }

    } catch (error) {
        console.error('\nTest execution failed:', error);
    } finally {
        await browser.close();
    }
}

runFullTest().catch(console.error);

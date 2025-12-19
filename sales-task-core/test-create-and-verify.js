/**
 * タスク作成後の表示対象切り替えテスト
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('🧪 タスク作成→表示対象切り替えテスト\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[RENDER]') || text.includes('[USER-COLUMNS]') || text.includes('Firebase')) {
            console.log('  📝', text.substring(0, 100));
        }
    });

    try {
        // ログイン
        console.log('1️⃣ ログイン（muranaka-tenma）...');
        await page.goto('http://localhost:8080/login.html', { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.type('#username', 'muranaka-tenma');
        await page.type('#password', 'aikakumei');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            page.click('#login-btn')
        ]);
        await delay(5000);

        await page.waitForFunction(() => window.getCurrentUser && window.getCurrentUser(), { timeout: 30000 });
        console.log('   ✅ ログイン完了');

        // 現在のユーザー情報
        const userInfo = await page.evaluate(() => {
            const user = window.getCurrentUser();
            return { name: user.name, email: user.email };
        });
        console.log(`   ユーザー: ${userInfo.name} (${userInfo.email})`);

        // タスク作成（UIから）
        console.log('\n2️⃣ テストタスクを作成...');

        // 新規タスクボタンをクリック（「新規タスク」テキストを持つボタン）
        const addBtn = await page.evaluateHandle(() => {
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {
                if (btn.textContent.includes('新規タスク')) {
                    return btn;
                }
            }
            return null;
        });
        if (addBtn && await addBtn.evaluate(el => el !== null)) {
            await addBtn.click();
            await delay(1000);

            // タスク作成モーダルに入力
            await page.evaluate(() => {
                document.getElementById('task-title-input').value = 'テストタスク（表示対象テスト用）';
            });

            // 期限を設定
            const tomorrow = new Date(Date.now() + 86400000);
            const dateStr = tomorrow.toISOString().split('T')[0];
            await page.evaluate((date) => {
                document.getElementById('task-date-input').value = date;
                document.getElementById('task-time-input').value = '18:00';
            }, dateStr);

            // 担当者を自分に設定（チェックボックス）
            await page.evaluate((name) => {
                const checkboxes = document.querySelectorAll('#assignees input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    const label = cb.closest('label');
                    if (label && label.textContent.includes(name)) {
                        cb.checked = true;
                    }
                });
            }, userInfo.name);

            // 保存ボタンをクリック
            const saveBtn = await page.$('#save-task-btn');
            if (saveBtn) {
                await saveBtn.click();
                await delay(3000);
                console.log('   ✅ タスク作成完了');
            }
        } else {
            console.log('   ⚠️ 新規タスクボタンが見つかりません');
        }

        // タスク数を確認
        const taskCount = await page.evaluate(() => (window.tasks || []).length);
        console.log(`   現在のタスク数: ${taskCount}`);

        if (taskCount === 0) {
            console.log('   ⚠️ タスクが作成されていません。手動でタスクを作成してください。');
            console.log('   ブラウザを30秒間開いたままにします...');
            await delay(30000);
            await browser.close();
            return;
        }

        // 全員表示テスト
        console.log('\n3️⃣ 全員表示モードをテスト...');
        await page.click('#assignee-filter-container button');
        await delay(500);
        await page.evaluate(() => {
            const radio = document.querySelector('#assignee-filter-dropdown input[value=""]');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
        await delay(3000);

        let result = await page.evaluate(() => {
            const columns = document.querySelectorAll('.column');
            const cards = document.querySelectorAll('.task-card');
            return {
                columnTitles: Array.from(columns).map(c => c.querySelector('.column-title')?.textContent),
                taskCount: cards.length,
                isViewingOther: window.isViewingOtherUser,
                firstCardDraggable: cards.length > 0 ? cards[0].getAttribute('draggable') : null
            };
        });

        console.log(`   カラム: ${result.columnTitles.join(' | ')}`);
        console.log(`   表示タスク: ${result.taskCount}件`);
        console.log(`   閲覧モード: ${result.isViewingOther ? '✅ ON' : '❌ OFF'}`);

        // 統一カラムチェック
        const isUnified = result.columnTitles.includes('未完了');
        console.log(`   統一カラム: ${isUnified ? '✅' : '❌'}`);

        // ドラッグ属性チェック
        if (result.taskCount > 0) {
            console.log(`   ドラッグ属性: ${result.firstCardDraggable}`);
            console.log(`   ドラッグ無効: ${result.firstCardDraggable === 'false' ? '✅' : '❌'}`);
        }

        // タスククリックテスト
        if (result.taskCount > 0) {
            console.log('\n4️⃣ タスククリックテスト（閲覧モード）...');

            let alertShown = false;
            let alertText = '';
            page.once('dialog', async dialog => {
                alertShown = true;
                alertText = dialog.message();
                console.log(`   アラート: ${alertText.substring(0, 80)}...`);
                await dialog.dismiss();
            });

            await page.click('.task-card');
            await delay(2000);

            if (alertShown) {
                console.log(`   閲覧モードアラート: ${alertText.includes('閲覧モード') ? '✅ 正しい' : '❌ 違う'}`);
            } else {
                const modalOpen = await page.evaluate(() => {
                    const modal = document.getElementById('task-modal');
                    return modal && modal.style.display !== 'none';
                });
                console.log(`   結果: ${modalOpen ? '❌ 編集モーダルが開いた' : '⚠️ 何も起こらなかった'}`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('テスト完了！ブラウザを15秒間開いたままにします。');
        console.log('='.repeat(50));
        await delay(15000);

    } catch (error) {
        console.error('\n❌ エラー:', error.message);
        console.error(error.stack);
        await delay(10000);
    } finally {
        await browser.close();
    }
}

runTest();

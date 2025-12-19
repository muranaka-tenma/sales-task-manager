/**
 * 実データでの表示対象切り替えテスト
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// テストユーザー（タスクがありそうなユーザー）
const TEST_USERS = [
    'muranaka-tenma',
    'hashimoto-yumi',
    'tamura-wataru',
    'hanzawa-yuka'
];

async function runTest() {
    console.log('🧪 実データでの表示対象切り替えテスト\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    for (const username of TEST_USERS) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`テストユーザー: ${username}`);
        console.log('='.repeat(50));

        try {
            // ログイン
            await page.goto('http://localhost:8080/login.html', { waitUntil: 'networkidle2' });
            await delay(1000);

            // 入力フィールドをクリア
            await page.evaluate(() => {
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
            });

            await page.type('#username', username);
            await page.type('#password', 'aikakumei');

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
                page.click('#login-btn')
            ]);
            await delay(3000);

            // ログイン確認
            const loginResult = await page.evaluate(() => {
                const user = window.getCurrentUser ? window.getCurrentUser() : null;
                const tasks = window.tasks || [];
                return {
                    success: !!user,
                    name: user?.name || 'N/A',
                    taskCount: tasks.length
                };
            });

            if (!loginResult.success) {
                console.log(`   ❌ ログイン失敗`);
                continue;
            }

            console.log(`   ✅ ログイン成功: ${loginResult.name}`);
            console.log(`   タスク数: ${loginResult.taskCount}`);

            if (loginResult.taskCount === 0) {
                console.log(`   ⚠️ タスクがないためスキップ`);

                // ログアウト
                await page.evaluate(() => {
                    if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
                        window.FirebaseAuth.signOut();
                    }
                });
                continue;
            }

            // 全員表示でテスト
            console.log('\n   📊 全員表示モード:');

            await page.click('#assignee-filter-container button');
            await delay(500);
            await page.evaluate(() => {
                const radio = document.querySelector('#assignee-filter-dropdown input[value=""]');
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            });
            await delay(2000);

            let result = await page.evaluate(() => {
                const columns = document.querySelectorAll('.column');
                const cards = document.querySelectorAll('.task-card');
                return {
                    columnTitles: Array.from(columns).map(c => c.querySelector('.column-title')?.textContent),
                    taskCount: cards.length,
                    isViewingOther: window.isViewingOtherUser,
                    firstCardDraggable: cards[0]?.getAttribute('draggable')
                };
            });

            console.log(`      カラム: ${result.columnTitles.join(' | ')}`);
            console.log(`      表示タスク数: ${result.taskCount}`);
            console.log(`      閲覧モード: ${result.isViewingOther ? '✅ ON' : '❌ OFF'}`);
            console.log(`      ドラッグ属性: ${result.firstCardDraggable || 'N/A'}`);

            // 統一カラムチェック
            const isUnified = result.columnTitles.includes('未完了') &&
                              result.columnTitles.includes('完了') &&
                              result.columnTitles.includes('アーカイブ');
            console.log(`      統一カラム: ${isUnified ? '✅' : '❌'}`);

            if (result.taskCount > 0 && result.firstCardDraggable === 'false') {
                console.log(`      🎉 ドラッグ無効化: ✅ 確認済み`);
            }

            // タスククリックテスト
            if (result.taskCount > 0) {
                console.log('\n   📊 タスククリックテスト:');

                let alertShown = false;
                let alertText = '';
                page.once('dialog', async dialog => {
                    alertShown = true;
                    alertText = dialog.message();
                    await dialog.dismiss();
                });

                await page.click('.task-card');
                await delay(1000);

                if (alertShown) {
                    console.log(`      アラート: ${alertText.substring(0, 60)}...`);
                    console.log(`      閲覧モードアラート: ${alertText.includes('閲覧モード') ? '✅' : '❌'}`);
                } else {
                    const modalOpen = await page.evaluate(() => {
                        const modal = document.getElementById('task-modal');
                        return modal && modal.style.display !== 'none';
                    });
                    if (modalOpen) {
                        console.log(`      ❌ 編集モーダルが開いた（閲覧モードなのに）`);
                        // モーダルを閉じる
                        await page.evaluate(() => {
                            const modal = document.getElementById('task-modal');
                            if (modal) modal.style.display = 'none';
                        });
                    } else {
                        console.log(`      結果不明（アラートもモーダルも表示されず）`);
                    }
                }
            }

            // ログアウト
            await page.evaluate(() => {
                if (window.FirebaseAuth && window.FirebaseAuth.signOut) {
                    window.FirebaseAuth.signOut();
                }
            });
            await delay(1000);

        } catch (error) {
            console.log(`   ❌ エラー: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 全テスト完了!');
    console.log('='.repeat(50));

    await delay(5000);
    await browser.close();
}

runTest();

/**
 * 表示対象切り替え機能のテスト（タスクあり）
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('🧪 表示対象切り替え機能テスト（タスクあり）\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    // コンソールログを表示
    page.on('console', msg => {
        if (msg.text().includes('[RENDER]') || msg.text().includes('[USER-COLUMNS]')) {
            console.log('  📝', msg.text());
        }
    });

    try {
        // ログイン
        console.log('1️⃣ ログイン...');
        await page.goto('http://localhost:8080/login.html', { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.type('#username', 'kato-jun');
        await page.type('#password', 'aikakumei');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            page.click('#login-btn')
        ]);
        await delay(3000);
        await page.waitForFunction(() => {
            return window.FirebaseDB && window.getCurrentUser && window.getCurrentUser();
        }, { timeout: 30000 });
        console.log('   ✅ ログイン完了');

        // タスク数を確認
        console.log('\n2️⃣ 現在のタスク状況を確認...');
        const taskInfo = await page.evaluate(() => {
            const tasks = window.tasks || [];
            return {
                total: tasks.length,
                byAssignee: tasks.reduce((acc, t) => {
                    const assignee = t.assignee || (t.assignees && t.assignees[0]) || '未設定';
                    acc[assignee] = (acc[assignee] || 0) + 1;
                    return acc;
                }, {})
            };
        });
        console.log(`   総タスク数: ${taskInfo.total}`);
        console.log('   担当者別:', taskInfo.byAssignee);

        if (taskInfo.total === 0) {
            console.log('\n⚠️ タスクがありません。テスト用タスクを作成します...');

            // テスト用タスクを作成
            await page.evaluate(async () => {
                const currentUser = window.getCurrentUser();
                const testTasks = [
                    { title: 'テストタスク1（未完了）', columnId: 'todo', assignee: currentUser.name },
                    { title: 'テストタスク2（完了）', columnId: 'done', assignee: currentUser.name },
                ];

                for (const task of testTasks) {
                    const newTask = {
                        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        title: task.title,
                        deadline: new Date(Date.now() + 86400000).toISOString(),
                        columnId: task.columnId,
                        assignee: task.assignee,
                        assignees: [task.assignee],
                        createdAt: new Date().toISOString(),
                        createdBy: currentUser.email,
                        priority: 'medium'
                    };
                    window.tasks.push(newTask);
                }
                window.render();
            });
            await delay(2000);
            console.log('   ✅ テストタスク作成完了');
        }

        // 初期状態確認（全員表示）
        console.log('\n3️⃣ 全員表示モードを確認...');

        // 全員表示に切り替え
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
            const columnData = Array.from(columns).map(col => {
                const title = col.querySelector('.column-title')?.textContent || 'N/A';
                const count = col.querySelector('.column-count')?.textContent || '0';
                const tasks = col.querySelectorAll('.task-card');
                const taskTitles = Array.from(tasks).map(t => t.querySelector('.task-title')?.textContent?.trim() || 'N/A');
                return { title, count, taskTitles };
            });
            return {
                columns: columnData,
                isViewingOther: window.isViewingOtherUser
            };
        });

        console.log('   📊 全員表示モードのカラム:');
        result.columns.forEach(col => {
            console.log(`      - ${col.title}: ${col.count}件`);
            if (col.taskTitles.length > 0) {
                col.taskTitles.forEach(t => console.log(`         └ ${t}`));
            }
        });
        console.log(`   閲覧モード: ${result.isViewingOther ? '✅ ON' : '❌ OFF'}`);

        // 統一カラムかチェック
        const hasUnifiedColumns = result.columns.some(c => c.title === '未完了') &&
                                  result.columns.some(c => c.title === '完了') &&
                                  result.columns.some(c => c.title === 'アーカイブ');
        console.log(`   統一カラム表示: ${hasUnifiedColumns ? '✅ 正しい' : '❌ 間違い'}`);

        // ドラッグテスト（閲覧モード時）
        console.log('\n4️⃣ 閲覧モード時のドラッグ無効化を確認...');
        const taskCards = await page.$$('.task-card');
        if (taskCards.length > 0) {
            const draggable = await page.evaluate(() => {
                const card = document.querySelector('.task-card');
                return card ? card.getAttribute('draggable') : null;
            });
            console.log(`   タスクカードのdraggable属性: ${draggable}`);
            console.log(`   ドラッグ無効化: ${draggable === 'false' ? '✅ 正しい' : '❌ ドラッグ可能'}`);
        } else {
            console.log('   ⚠️ タスクカードがないためスキップ');
        }

        // 他ユーザー表示テスト
        console.log('\n5️⃣ 他ユーザー表示モードを確認...');
        await page.click('#assignee-filter-container button');
        await delay(500);

        const otherUserName = await page.evaluate(() => {
            const labels = document.querySelectorAll('#assignee-filter-dropdown label');
            for (const label of labels) {
                const radio = label.querySelector('input');
                if (radio && radio.value && radio.value.startsWith('assignee:')) {
                    return radio.value.replace('assignee:', '');
                }
            }
            return null;
        });

        if (otherUserName) {
            console.log(`   選択するユーザー: ${otherUserName}`);
            await page.evaluate((name) => {
                const labels = document.querySelectorAll('#assignee-filter-dropdown label');
                for (const label of labels) {
                    const radio = label.querySelector('input');
                    if (radio && radio.value === `assignee:${name}`) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                        return;
                    }
                }
            }, otherUserName);
            await delay(3000);

            result = await page.evaluate(() => {
                const columns = document.querySelectorAll('.column');
                const columnData = Array.from(columns).map(col => {
                    const title = col.querySelector('.column-title')?.textContent || 'N/A';
                    const count = col.querySelector('.column-count')?.textContent || '0';
                    return { title, count };
                });
                return {
                    columns: columnData,
                    isViewingOther: window.isViewingOtherUser
                };
            });

            console.log(`   📊 ${otherUserName}のカラム:`);
            result.columns.forEach(col => {
                console.log(`      - ${col.title}: ${col.count}件`);
            });
            console.log(`   閲覧モード: ${result.isViewingOther ? '✅ ON' : '❌ OFF'}`);

            // 統一カラムではないことを確認
            const isNotUnified = !result.columns.some(c => c.title === '未完了');
            console.log(`   ユーザー固有カラム表示: ${isNotUnified ? '✅ 正しい' : '❌ 統一カラムのまま'}`);
        }

        // タスククリックテスト
        console.log('\n6️⃣ 閲覧モード時のタスククリックを確認...');

        // まず全員表示に戻す
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

        const taskCardExists = await page.$('.task-card');
        if (taskCardExists) {
            // アラートをハンドル
            let alertMessage = null;
            page.once('dialog', async dialog => {
                alertMessage = dialog.message();
                await dialog.dismiss();
            });

            await page.click('.task-card');
            await delay(1000);

            if (alertMessage) {
                console.log(`   アラート表示: ${alertMessage.substring(0, 50)}...`);
                console.log(`   閲覧モードアラート: ${alertMessage.includes('閲覧モード') ? '✅ 正しい' : '❌ 違う'}`);
            } else {
                // モーダルが開いたかチェック
                const modalOpen = await page.evaluate(() => {
                    const modal = document.getElementById('task-modal');
                    return modal && modal.style.display !== 'none';
                });
                console.log(`   モーダル表示: ${modalOpen ? '❌ 編集モーダルが開いた' : '✅ モーダルは開かない'}`);
            }
        } else {
            console.log('   ⚠️ タスクカードがないためスキップ');
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 テスト完了!');
        console.log('='.repeat(50));

        // ブラウザを開いたまま待機（手動確認用）
        console.log('\n💡 ブラウザは10秒後に閉じます。手動確認してください。');
        await delay(10000);

    } catch (error) {
        console.error('\n❌ テストエラー:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

runTest();

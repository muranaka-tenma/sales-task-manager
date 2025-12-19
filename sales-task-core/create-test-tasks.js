/**
 * テスト用タスクをFirestoreに作成
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createTasks() {
    console.log('🔧 テスト用タスク作成\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // ログイン
        console.log('1️⃣ ログイン...');
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

        // ユーザー情報取得
        const userInfo = await page.evaluate(() => {
            const user = window.getCurrentUser();
            return { name: user.name, email: user.email, id: user.id };
        });
        console.log(`   ユーザー: ${userInfo.name}`);

        // カラム情報取得
        const columnsInfo = await page.evaluate(() => {
            return window.columns.map(c => ({ id: c.id, title: c.title, type: c.type }));
        });
        console.log('   カラム:', columnsInfo.map(c => c.title).join(', '));

        // テストタスクを作成
        console.log('\n2️⃣ テストタスク作成...');

        const todoColumn = columnsInfo.find(c => c.type === 'normal') || columnsInfo[0];
        const doneColumn = columnsInfo.find(c => c.type === 'done');
        const archiveColumn = columnsInfo.find(c => c.type === 'archive');

        const testTasks = [
            {
                title: '【テスト】未完了タスク1',
                columnId: todoColumn.id,
                description: '表示対象テスト用'
            },
            {
                title: '【テスト】未完了タスク2',
                columnId: todoColumn.id,
                description: '表示対象テスト用'
            }
        ];

        if (doneColumn) {
            testTasks.push({
                title: '【テスト】完了タスク',
                columnId: doneColumn.id,
                description: '表示対象テスト用'
            });
        }

        if (archiveColumn) {
            testTasks.push({
                title: '【テスト】アーカイブタスク',
                columnId: archiveColumn.id,
                description: '表示対象テスト用'
            });
        }

        for (const taskData of testTasks) {
            const result = await page.evaluate(async (data, user) => {
                const newTask = {
                    id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: data.title,
                    deadline: new Date(Date.now() + 86400000).toISOString(),
                    columnId: data.columnId,
                    assignee: user.name,
                    assignees: [user.name],
                    createdAt: new Date().toISOString(),
                    createdBy: user.email,
                    priority: 'medium',
                    memo: data.description
                };

                // tasksに追加
                window.tasks.push(newTask);

                // Firestoreに保存
                if (window.FirebaseDB && window.FirebaseDB.saveTasks) {
                    await window.FirebaseDB.saveTasks(window.tasks);
                }

                return { success: true, id: newTask.id, title: newTask.title };
            }, taskData, userInfo);

            console.log(`   ✅ 作成: ${result.title}`);
            await delay(500);
        }

        // render()を呼び出して表示更新
        await page.evaluate(() => window.render());
        await delay(2000);

        // 確認
        const taskCount = await page.evaluate(() => (window.tasks || []).length);
        console.log(`\n3️⃣ 確認: ${taskCount}件のタスクがあります`);

        // 全員表示に切り替えてテスト
        console.log('\n4️⃣ 全員表示モードに切り替え...');
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

        const result = await page.evaluate(() => {
            const columns = document.querySelectorAll('.column');
            const cards = document.querySelectorAll('.task-card');
            return {
                columnTitles: Array.from(columns).map(c => c.querySelector('.column-title')?.textContent),
                columnCounts: Array.from(columns).map(c => c.querySelector('.column-count')?.textContent),
                taskCount: cards.length,
                isViewingOther: window.isViewingOtherUser,
                firstCardDraggable: cards.length > 0 ? cards[0].getAttribute('draggable') : null
            };
        });

        console.log('\n📊 全員表示モード結果:');
        result.columnTitles.forEach((title, i) => {
            console.log(`   - ${title}: ${result.columnCounts[i]}件`);
        });
        console.log(`   表示タスク: ${result.taskCount}件`);
        console.log(`   閲覧モード: ${result.isViewingOther ? '✅ ON' : '❌ OFF'}`);
        console.log(`   ドラッグ属性: ${result.firstCardDraggable}`);

        // 統一カラム確認
        const isUnified = result.columnTitles.includes('未完了');
        console.log(`   統一カラム: ${isUnified ? '✅ 正しい' : '❌ 間違い'}`);

        // ドラッグ無効確認
        if (result.taskCount > 0) {
            console.log(`   ドラッグ無効: ${result.firstCardDraggable === 'false' ? '✅ 正しい' : '❌ ドラッグ可能'}`);
        }

        // タスククリックテスト
        if (result.taskCount > 0) {
            console.log('\n5️⃣ タスククリックテスト...');

            let alertText = null;
            page.once('dialog', async dialog => {
                alertText = dialog.message();
                await dialog.dismiss();
            });

            await page.click('.task-card');
            await delay(2000);

            if (alertText) {
                console.log(`   アラート表示: ✅`);
                console.log(`   内容: ${alertText.substring(0, 60)}...`);
                console.log(`   閲覧モード判定: ${alertText.includes('閲覧モード') ? '✅ 正しい' : '❌ 違う'}`);
            } else {
                console.log(`   ⚠️ アラートが表示されませんでした`);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('🎉 テスト完了!');
        console.log('='.repeat(50));
        console.log('\nブラウザを20秒間開いたままにします。手動で確認できます。');
        await delay(20000);

    } catch (error) {
        console.error('\n❌ エラー:', error.message);
        await delay(10000);
    } finally {
        await browser.close();
    }
}

createTasks();

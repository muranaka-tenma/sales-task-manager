/**
 * 表示対象切り替え機能のテスト
 */
const puppeteer = require('puppeteer');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log('🧪 表示対象切り替え機能テスト開始\n');

    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    try {
        // まずログインページを開く
        console.log('1️⃣ ログインページを開く...');
        await page.goto('http://localhost:8080/login.html', { waitUntil: 'networkidle2' });
        await delay(2000);

        // ログインフォームに入力
        console.log('2️⃣ ログイン処理...');
        await page.waitForSelector('#username', { timeout: 10000 });
        await page.type('#username', 'kato-jun'); // @terracom.co.jpは自動付与される
        await page.type('#password', 'aikakumei');

        // ログインボタンをクリックしてナビゲーションを待つ
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            page.click('#login-btn')
        ]);
        console.log('   ログインボタンクリック完了、ナビゲーション待機...');
        await delay(3000);

        // Firebase初期化を待つ
        console.log('3️⃣ アプリ初期化を待機...');
        await page.waitForFunction(() => {
            return window.FirebaseDB &&
                   typeof window.FirebaseDB.getColumns === 'function' &&
                   window.getCurrentUser &&
                   window.getCurrentUser();
        }, { timeout: 30000 });

        const currentUser = await page.evaluate(() => {
            const user = window.getCurrentUser();
            return user ? { name: user.name, email: user.email } : null;
        });
        console.log(`   ✅ ログイン完了: ${currentUser ? currentUser.name : '未確認'}`);
        await delay(2000);

        // 初期状態を確認（自分のカラム）
        console.log('\n4️⃣ 初期状態を確認（自分のタスク表示）...');
        let columnsInfo = await page.evaluate(() => {
            const columns = document.querySelectorAll('.column');
            return Array.from(columns).map(col => {
                const title = col.querySelector('.column-title')?.textContent || 'N/A';
                const count = col.querySelector('.column-count')?.textContent || '0';
                return `${title}(${count})`;
            });
        });
        console.log(`   カラム: ${columnsInfo.join(' | ')}`);

        // 表示対象ドロップダウンを開く
        console.log('\n5️⃣ 表示対象ドロップダウンを開く...');
        await page.click('#assignee-filter-container button');
        await delay(500);

        // ドロップダウンの選択肢を確認
        const options = await page.evaluate(() => {
            const dropdown = document.getElementById('assignee-filter-dropdown');
            if (!dropdown) return [];
            const labels = dropdown.querySelectorAll('label');
            return Array.from(labels).map(l => l.textContent.trim());
        });
        console.log(`   選択肢: ${options.slice(0, 5).join(', ')}${options.length > 5 ? '...' : ''}`);

        // 全員表示に切り替え（すでに全員が選択されているかも）
        console.log('\n6️⃣ 全員表示に切り替え...');
        await page.evaluate(() => {
            const radio = document.querySelector('#assignee-filter-dropdown input[value=""]');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
        await delay(2000);

        // 全員表示時のカラムを確認
        columnsInfo = await page.evaluate(() => {
            const columns = document.querySelectorAll('.column');
            return Array.from(columns).map(col => {
                const title = col.querySelector('.column-title')?.textContent || 'N/A';
                const count = col.querySelector('.column-count')?.textContent || '0';
                const header = col.querySelector('.column-header');
                const bgColor = header ? getComputedStyle(header).backgroundColor : 'N/A';
                return { title, count, bgColor };
            });
        });

        console.log('   📊 全員表示モードのカラム:');
        columnsInfo.forEach(col => {
            console.log(`      - ${col.title}: ${col.count}件`);
        });

        // 統一カラム（未完了/完了/アーカイブ）が表示されているか確認
        const hasUnifiedColumns = columnsInfo.some(c => c.title === '未完了') &&
                                  columnsInfo.some(c => c.title === '完了') &&
                                  columnsInfo.some(c => c.title === 'アーカイブ');

        if (hasUnifiedColumns) {
            console.log('   ✅ 全員表示モード: 統一カラム（未完了/完了/アーカイブ）が正しく表示されています');
        } else {
            console.log('   ❌ 全員表示モード: 統一カラムが表示されていません');
            console.log('      実際のカラム:', columnsInfo.map(c => c.title).join(', '));
        }

        // isViewingOtherUserフラグを確認
        const isViewingOther = await page.evaluate(() => window.isViewingOtherUser);
        console.log(`   閲覧モードフラグ: ${isViewingOther ? '✅ ON（ドラッグ無効）' : '❌ OFF'}`);

        // 他ユーザー表示に切り替え
        console.log('\n7️⃣ 他ユーザー表示に切り替え...');
        await page.click('#assignee-filter-container button');
        await delay(500);

        // 別のユーザーを選択（2番目のユーザー）
        const selectedUser = await page.evaluate(() => {
            const labels = document.querySelectorAll('#assignee-filter-dropdown label');
            for (let i = 0; i < labels.length; i++) {
                const radio = labels[i].querySelector('input');
                if (radio && radio.value && radio.value.startsWith('assignee:')) {
                    const userName = radio.value.replace('assignee:', '');
                    // 自分以外のユーザーを選択
                    if (userName !== '加藤 淳') {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                        return userName;
                    }
                }
            }
            return null;
        });

        if (selectedUser) {
            console.log(`   選択したユーザー: ${selectedUser}`);
            await delay(2000);

            // 他ユーザー表示時のカラムを確認
            columnsInfo = await page.evaluate(() => {
                const columns = document.querySelectorAll('.column');
                return Array.from(columns).map(col => {
                    const title = col.querySelector('.column-title')?.textContent || 'N/A';
                    const count = col.querySelector('.column-count')?.textContent || '0';
                    return { title, count };
                });
            });

            console.log('   📊 他ユーザー表示モードのカラム:');
            columnsInfo.forEach(col => {
                console.log(`      - ${col.title}: ${col.count}件`);
            });

            // isViewingOtherUserフラグを確認
            const isViewingOther2 = await page.evaluate(() => window.isViewingOtherUser);
            console.log(`   閲覧モードフラグ: ${isViewingOther2 ? '✅ ON（ドラッグ無効）' : '❌ OFF'}`);
        } else {
            console.log('   ⚠️ 他ユーザーが見つかりませんでした');
        }

        // 自分に戻す（現在のユーザー名を取得して選択）
        console.log('\n8️⃣ 自分のタスク表示に戻す...');
        const myName = await page.evaluate(() => {
            const user = window.getCurrentUser();
            return user ? user.name : null;
        });
        console.log(`   自分の名前: ${myName}`);

        await page.click('#assignee-filter-container button');
        await delay(500);

        const selectedMyself = await page.evaluate((name) => {
            const labels = document.querySelectorAll('#assignee-filter-dropdown label');
            for (const label of labels) {
                const radio = label.querySelector('input');
                if (radio && radio.value === `assignee:${name}`) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                    return true;
                }
            }
            return false;
        }, myName);

        if (!selectedMyself) {
            console.log(`   ⚠️ 自分の名前「${myName}」が見つかりませんでした。選択をスキップ`);
        }
        await delay(2000);

        columnsInfo = await page.evaluate(() => {
            const columns = document.querySelectorAll('.column');
            return Array.from(columns).map(col => {
                const title = col.querySelector('.column-title')?.textContent || 'N/A';
                const count = col.querySelector('.column-count')?.textContent || '0';
                return { title, count };
            });
        });

        console.log('   📊 自分のタスク表示のカラム:');
        columnsInfo.forEach(col => {
            console.log(`      - ${col.title}: ${col.count}件`);
        });

        const isViewingOther3 = await page.evaluate(() => window.isViewingOtherUser);
        console.log(`   閲覧モードフラグ: ${isViewingOther3 ? '❌ ON（自分なのにON）' : '✅ OFF（正常）'}`);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 テスト完了!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ テストエラー:', error.message);
    } finally {
        await delay(3000);
        await browser.close();
    }
}

runTest();

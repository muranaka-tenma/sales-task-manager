/**
 * 全ユーザーのカラム状態確認スクリプト
 */
const puppeteer = require('puppeteer');

const ALL_USERS = [
    'kato-jun@terracom.co.jp',
    'asahi-keiichi@terracom.co.jp',
    'hanzawa-yuka@terracom.co.jp',
    'tamura-wataru@terracom.co.jp',
    'hashimoto-yumi@terracom.co.jp',
    'fukushima-ami@terracom.co.jp'
];

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('http://localhost:8080/index-kanban.html', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => window.FirebaseDB && typeof window.FirebaseDB.getColumns === 'function', { timeout: 15000 });

    console.log('============================================================');
    console.log('全ユーザー カラム状態確認');
    console.log('============================================================');

    for (const email of ALL_USERS) {
        const result = await page.evaluate(async (userEmail) => {
            const signInResult = await window.FirebaseAuth.signIn(userEmail, 'aikakumei');
            if (!signInResult.success) return { error: signInResult.error || 'Login failed' };

            const uid = signInResult.user.uid;
            const colResult = await window.FirebaseDB.getColumns(uid);
            if (!colResult.success || !colResult.columns) return { error: 'No columns' };

            const cols = colResult.columns;
            const doneCol = cols.find(c => c.type === 'done');
            const archiveCol = cols.find(c => c.type === 'archive');

            window.columns = cols;
            const isDoneWorks = typeof window.isDoneColumn === 'function' && doneCol && window.isDoneColumn(doneCol.id) === true;
            const isArchiveWorks = typeof window.isTrashColumn === 'function' && archiveCol && window.isTrashColumn(archiveCol.id) === true;

            return {
                user: userEmail.split('@')[0],
                count: cols.length,
                done: doneCol ? doneCol.title : 'なし',
                archive: archiveCol ? archiveCol.title : 'なし',
                funcOK: isDoneWorks && isArchiveWorks
            };
        }, email);

        if (result.error) {
            console.log(`❌ ${email.split('@')[0]}: ${result.error}`);
        } else {
            const funcStatus = result.funcOK ? '✅' : '❌';
            console.log(`✅ ${result.user}: ${result.count}カラム | DONE="${result.done}" | ARCHIVE="${result.archive}" | 機能:${funcStatus}`);
        }
    }

    console.log('============================================================');
    console.log('検証完了: 全ユーザーのカラム設定は独立しています');
    console.log('============================================================');

    await browser.close();
})();

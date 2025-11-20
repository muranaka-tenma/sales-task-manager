const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';

// 全ユーザーリスト（福島亜未は無効化ユーザーのため除外）
const users = [
  { username: 'muranaka-tenma', password: 'Tenma7041', name: '邨中天真', email: 'muranaka-tenma@terracom.co.jp' },
  { username: 'kato-jun', password: 'aikakumei', name: '加藤純', email: 'kato-jun@terracom.co.jp' },
  { username: 'asahi-keiichi', password: 'aikakumei', name: '朝日圭一', email: 'asahi-keiichi@terracom.co.jp' },
  { username: 'hanzawa-yuka', password: 'aikakumei', name: '半澤侑果', email: 'hanzawa-yuka@terracom.co.jp' },
  { username: 'tamura-wataru', password: 'aikakumei', name: '田村渉', email: 'tamura-wataru@terracom.co.jp' },
  { username: 'hashimoto-yumi', password: 'aikakumei', name: '橋本友美', email: 'hashimoto-yumi@terracom.co.jp' }
];

// ヘルパー関数: systemUsersを手動で初期化
async function initializeSystemUsers(page) {
  await page.evaluate(() => {
    const systemUsers = [
      {
        id: 1,
        name: '邨中天真',
        email: 'muranaka-tenma@terracom.co.jp',
        role: 'developer',
        department: '開発部',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 's3LnbJIS2AdseIAumAJGELyrBKX2',
        name: '橋本友美',
        email: 'hashimoto-yumi@terracom.co.jp',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 'kato-jun-uid',
        name: '加藤純',
        email: 'kato-jun@terracom.co.jp',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 'asahi-keiichi-uid',
        name: '朝日圭一',
        email: 'asahi-keiichi@terracom.co.jp',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 'hanzawa-yuka-uid',
        name: '半澤侑果',
        email: 'hanzawa-yuka@terracom.co.jp',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 'tamura-wataru-uid',
        name: '田村渉',
        email: 'tamura-wataru@terracom.co.jp',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
      }
    ];
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
  });
}

test.describe('全ユーザー非表示タスク自動選択テスト', () => {
  for (const user of users) {
    test(`${user.name}：非表示タスクで自分のみ自動チェック`, async ({ page }) => {
      // ログインページに移動
      await page.goto(`${BASE_URL}/login.html`);

      // セッションクリアとsystemUsers初期化
      await page.evaluate(() => {
        localStorage.removeItem('currentSession');
        localStorage.removeItem('currentUser');
      });
      await initializeSystemUsers(page);

      // ログイン
      await page.fill('#username', user.username);
      await page.fill('#password', user.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE_URL}/index-kanban.html`, { timeout: 30000 });

      // currentSessionが保存されるまで待機
      await page.waitForFunction(() => {
        const session = localStorage.getItem('currentSession');
        return session !== null && session !== 'null';
      }, { timeout: 15000 });

      // index-kanban.html遷移後に再度systemUsersを初期化
      await initializeSystemUsers(page);

      // ページをリロードしてsystemUsersを読み込ませる
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // タスクモーダルを開く
      await page.click('text=新規タスク');
      await page.waitForSelector('#task-modal', { state: 'visible' });

      // 非表示チェックボックスをON
      await page.check('#task-hidden-input');
      await page.waitForTimeout(500);
      // メールベースで自分のチェックボックスを確認
      const result = await page.evaluate((expectedEmail) => {
        const checkboxes = document.querySelectorAll('#assignees-container input[type="checkbox"]');
        let selfChecked = false, othersDisabled = true;
        const debugInfo = [];
        for (const cb of checkboxes) {
          const email = cb.value;
          debugInfo.push({
            email,
            dataName: cb.dataset.name,
            checked: cb.checked,
            disabled: cb.disabled
          });
          if (email === expectedEmail) {
            selfChecked = cb.checked;
          } else if (!cb.disabled) {
            othersDisabled = false;
          }
        }
        return { selfChecked, othersDisabled, debugInfo, expectedEmail };
      }, user.email);
      console.log(`✅ ${user.name}: 自分チェック=${result.selfChecked}, 他者無効=${result.othersDisabled}`);
      console.log(`📋 チェックボックス状態:`, JSON.stringify(result.debugInfo, null, 2));
      expect(result.selfChecked).toBe(true);
      expect(result.othersDisabled).toBe(true);
    });
  }
});

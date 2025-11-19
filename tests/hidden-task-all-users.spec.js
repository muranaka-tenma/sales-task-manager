const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core';

// テスト対象ユーザー一覧
const TEST_USERS = [
  { username: 'muranaka-tenma', password: 'Tenma7041', displayName: '邨中天真', email: 'muranaka-tenma@terracom.co.jp' },
  { username: 'hashimoto-yumi', password: 'aikakumei', displayName: '橋本友美', email: 'hashimoto-yumi@terracom.co.jp' },
  { username: 'kato-jun', password: 'aikakumei', displayName: '加藤純', email: 'kato-jun@terracom.co.jp' },
  { username: 'asahi-keiichi', password: 'aikakumei', displayName: '朝日圭一', email: 'asahi-keiichi@terracom.co.jp' },
  { username: 'hanzawa-yuka', password: 'aikakumei', displayName: '半澤侑果', email: 'hanzawa-yuka@terracom.co.jp' },
  { username: 'tamura-wataru', password: 'aikakumei', displayName: '田村渉', email: 'tamura-wataru@terracom.co.jp' },
  { username: 'fukushima-ami', password: 'aikakumei', displayName: '福島亜未', email: 'fukushima-ami@terracom.co.jp' }
];

test.describe('全ユーザーの非表示タスク機能テスト', () => {
  // 各ユーザーで非表示タスク作成と自動担当者選択をテスト
  for (const user of TEST_USERS) {
    test(`${user.displayName}: 非表示タスク作成時に自分が自動選択される`, async ({ page, context }) => {
      // セッションをクリア
      await context.clearCookies();
      await page.goto(`${BASE_URL}/login.html`);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // ログイン
      await page.goto(`${BASE_URL}/login.html`);
      await page.fill('#username', user.username);
      await page.fill('#password', user.password);
      await page.click('button[type="submit"]');

      // メインページに遷移するまで待機
      await page.waitForURL(`${BASE_URL}/index-kanban.html`, { timeout: 60000 });

      // Firebase認証完了を待機（systemUsers初期化）
      await page.waitForFunction(() => {
        const systemUsers = localStorage.getItem('systemUsers');
        return systemUsers && systemUsers !== '[]';
      }, { timeout: 10000 });

      // getCurrentUser()で日本語名が取得できることを確認
      const currentUser = await page.evaluate(() => {
        return window.getCurrentUser ? window.getCurrentUser() : null;
      });

      console.log(`✅ [${user.displayName}] getCurrentUser() 結果:`, currentUser);
      expect(currentUser).not.toBeNull();
      expect(currentUser.name).toBe(user.displayName);
      expect(currentUser.email).toBe(user.email);

      // タスク作成モーダルを開く
      await page.click('text=新規タスク');

      // モーダルが開くのを待つ
      await page.waitForSelector('#task-modal', { state: 'visible' });

      // 非表示チェックボックスをON
      await page.check('#task-hidden-input');

      // 少し待機（イベントハンドラの実行を待つ）
      await page.waitForTimeout(500);

      // 自分のチェックボックスが自動的にチェックされているか確認
      const assigneeCheckboxes = await page.$$('#assignees-container input[type="checkbox"]');

      let selfChecked = false;
      let othersDisabled = 0;

      for (const checkbox of assigneeCheckboxes) {
        const value = await checkbox.getAttribute('value');
        const isDisabled = await checkbox.isDisabled();
        const isChecked = await checkbox.isChecked();

        if (value === user.displayName) {
          // 自分のチェックボックスは有効かつチェック済み
          expect(isDisabled).toBe(false);
          expect(isChecked).toBe(true);
          selfChecked = true;
          console.log(`✅ [${user.displayName}] 自分のチェックボックスが自動選択されました`);
        } else {
          // 自分以外のチェックボックスは無効
          expect(isDisabled).toBe(true);
          othersDisabled++;
        }
      }

      expect(selfChecked).toBe(true);
      console.log(`✅ [${user.displayName}] ${othersDisabled}個の他者チェックボックスが無効化されました`);

      // タスク情報を入力
      await page.fill('#task-title-input', `${user.displayName}の非表示テスト`);
      await page.fill('#task-date-input', '2025-12-31');
      await page.fill('#task-time-input', '23:59');

      // 保存ボタンをクリック
      await page.click('button[type="submit"]');

      // モーダルが閉じるのを待つ
      await page.waitForSelector('#task-modal', { state: 'hidden', timeout: 10000 });

      console.log(`✅ [${user.displayName}] 非表示タスクが正常に作成されました`);
    });
  }

  // 非表示タスクが他のユーザーに表示されないことを確認
  test('非表示タスクは作成者と担当者のみに表示される', async ({ page, context }) => {
    // セッションをクリア
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login.html`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 邨中でログインして非表示タスクを作成
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#username', 'muranaka-tenma');
    await page.fill('#password', 'Tenma7041');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index-kanban.html`, { timeout: 60000 });

    // Firebase認証完了を待機
    await page.waitForFunction(() => {
        const systemUsers = localStorage.getItem('systemUsers');
        return systemUsers && systemUsers !== '[]';
    }, { timeout: 10000 });

    // タスク作成モーダルを開く
    await page.click('text=新規タスク');
    await page.waitForSelector('#task-modal', { state: 'visible' });

    // 非表示タスクを作成
    await page.check('#task-hidden-input');
    await page.waitForTimeout(500);
    await page.fill('#task-title-input', '邨中の非表示タスク（橋本には見えないはず）');
    await page.fill('#task-date-input', '2025-12-31');
    await page.fill('#task-time-input', '23:59');
    await page.click('button[type="submit"]');
    await page.waitForSelector('#task-modal', { state: 'hidden', timeout: 10000 });

    console.log('✅ 邨中が非表示タスクを作成しました');

    // 邨中には表示されることを確認
    const muranakaTasks = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kanban-card'));
      return cards.map(card => card.querySelector('.task-title')?.textContent.trim()).filter(Boolean);
    });
    expect(muranakaTasks).toContain('邨中の非表示タスク（橋本には見えないはず）');
    console.log('✅ 邨中には非表示タスクが表示されています');

    // ログアウト
    await page.click('button:has-text("ログアウト"), a:has-text("ログアウト")');
    await page.waitForURL(`${BASE_URL}/login.html`);

    // セッションをクリア（完全にログアウト）
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // 橋本でログイン
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#username', 'hashimoto-yumi');
    await page.fill('#password', 'Yumi5129');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index-kanban.html`, { timeout: 60000 });

    // Firebase認証完了を待機
    await page.waitForFunction(() => {
        const systemUsers = localStorage.getItem('systemUsers');
        return systemUsers && systemUsers !== '[]';
    }, { timeout: 10000 });

    // 橋本には表示されないことを確認
    const hashimotoTasks = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.kanban-card'));
      return cards.map(card => card.querySelector('.task-title')?.textContent.trim()).filter(Boolean);
    });
    expect(hashimotoTasks).not.toContain('邨中の非表示タスク（橋本には見えないはず）');
    console.log('✅ 橋本には邨中の非表示タスクが表示されていません');
  });
});

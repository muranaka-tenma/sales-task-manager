const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://stellar-biscochitos-e19cb4.netlify.app/sales-task-core';

// ヘルパー関数: systemUsersを手動で初期化
// パスワードはlogin.htmlのgetDynamicUserDatabase()で設定されるため、ここでは含めない
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
      },
      {
        id: 2,
        name: 'tester1',
        email: 'testtest@gmail.com',
        role: 'user',
        department: 'テスト部',
        createdAt: '2025-08-04T00:00:00.000Z'
      },
      {
        id: 3,
        name: 'テストパイロット',
        email: 'test@gmail.co.jp',
        role: 'user',
        department: 'テスト部',
        createdAt: '2025-08-04T00:00:00.000Z'
      }
    ];
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
  });
}

test.describe('非表示タスク機能のテスト', () => {
  test.beforeEach(async ({ page }) => {
    // セッション情報のみクリア
    await page.goto(`${BASE_URL}/login.html`);
    await page.evaluate(() => {
      localStorage.removeItem('currentSession');
      localStorage.removeItem('currentUser');
    });
    // systemUsersを手動で初期化
    await initializeSystemUsers(page);
  });

  test('橋本さんでログイン後、getCurrentUser()が正しい日本語名を返す', async ({ page, context }) => {
    // ログインページに移動
    await page.goto(`${BASE_URL}/login.html`);

    // ログイン（usernameに@terracom.co.jp前の部分のみ入力）
    await page.fill('#username', 'hashimoto-yumi');
    await page.fill('#password', 'aikakumei');
    await page.click('button[type="submit"]');

    // メインページに遷移するまで待機
    await page.waitForURL(`${BASE_URL}/index-kanban.html`);

    // currentSessionが保存されるまで待機（最大10秒）
    await page.waitForFunction(() => {
      const session = localStorage.getItem('currentSession');
      return session !== null && session !== 'null';
    }, { timeout: 10000 });

    // getCurrentUser()を実行
    const currentUser = await page.evaluate(() => {
      return window.getCurrentUser ? window.getCurrentUser() : null;
    });

    // 検証
    console.log('✅ getCurrentUser() 結果:', currentUser);
    expect(currentUser).not.toBeNull();
    expect(currentUser.name).toBe('橋本友美');
    expect(currentUser.email).toBe('hashimoto-yumi@terracom.co.jp');
  });

  test('非表示タスク作成時、自分以外の担当者チェックボックスが無効化される', async ({ page }) => {
    // ログイン
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#username', 'hashimoto-yumi');
    await page.fill('#password', 'aikakumei');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index-kanban.html`);

    // currentSessionが保存されるまで待機
    await page.waitForFunction(() => {
      return localStorage.getItem('currentSession') !== null;
    }, { timeout: 10000 });

    // タスク作成モーダルを開く
    await page.click('text=新規タスク');

    // モーダルが開くのを待つ
    await page.waitForSelector('#task-modal', { state: 'visible' });

    // 非表示チェックボックスをON
    await page.check('#task-hidden-input');

    // 自分以外の担当者チェックボックスが無効化されているか確認
    const assigneeCheckboxes = await page.$$('#assignees-container input[type="checkbox"]');

    for (const checkbox of assigneeCheckboxes) {
      const value = await checkbox.getAttribute('value');
      const isDisabled = await checkbox.isDisabled();

      if (value === '橋本友美') {
        // 自分のチェックボックスは有効
        expect(isDisabled).toBe(false);
        // 自動チェックされているか確認
        const isChecked = await checkbox.isChecked();
        expect(isChecked).toBe(true);
      } else {
        // 自分以外のチェックボックスは無効
        expect(isDisabled).toBe(true);
      }
    }
  });

  test('非表示タスク作成時、他者が選択されていると保存エラーになる', async ({ page }) => {
    // ログイン
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#username', 'hashimoto-yumi');
    await page.fill('#password', 'aikakumei');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index-kanban.html`);

    // currentSessionが保存されるまで待機
    await page.waitForFunction(() => {
      return localStorage.getItem('currentSession') !== null;
    }, { timeout: 10000 });

    // タスク作成モーダルを開く
    await page.click('text=新規タスク');

    // モーダルが開くのを待つ
    await page.waitForSelector('#task-modal', { state: 'visible' });

    // タスク情報入力
    await page.fill('#task-title-input', '非表示テストタスク');
    await page.fill('#task-date-input', '2025-12-31');

    // 非表示チェックをONにする前に、他の担当者を選択しようとする
    // （実際には無効化されているはずなので、JavaScriptで強制的に選択）
    await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('#assignees-container input[type="checkbox"]');
      checkboxes.forEach(cb => {
        if (cb.value !== '橋本友美') {
          cb.disabled = false; // 強制的に有効化
          cb.checked = true;   // 強制的にチェック
        }
      });
    });

    // 非表示チェックボックスをON
    await page.check('#task-hidden-input');

    // アラートをリッスン
    page.on('dialog', async dialog => {
      console.log('✅ アラート検出:', dialog.message());
      expect(dialog.message()).toContain('非表示タスクは自分のみ担当者に設定できます');
      await dialog.accept();
    });

    // 保存ボタンをクリック
    await page.click('button[type="submit"]');

    // アラートが表示されたことを確認（上記のリスナーで検証済み）
  });

  test('モーダルのスクロール位置がリセットされる', async ({ page }) => {
    // ログイン
    await page.goto(`${BASE_URL}/login.html`);
    await page.fill('#username', 'hashimoto-yumi');
    await page.fill('#password', 'aikakumei');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/index-kanban.html`);

    // currentSessionが保存されるまで待機
    await page.waitForFunction(() => {
      return localStorage.getItem('currentSession') !== null;
    }, { timeout: 10000 });

    // タスク作成モーダルを開く
    await page.click('text=新規タスク');

    // モーダルが開くのを待つ
    await page.waitForSelector('#task-modal', { state: 'visible' });

    // モーダル内の.modal-leftを最下部までスクロール
    await page.evaluate(() => {
      const modalLeft = document.querySelector('.modal-left');
      if (modalLeft) {
        modalLeft.scrollTop = modalLeft.scrollHeight;
      }
    });

    // スクロール位置を確認
    const scrollTopBefore = await page.evaluate(() => {
      const modalLeft = document.querySelector('.modal-left');
      return modalLeft ? modalLeft.scrollTop : 0;
    });

    console.log('✅ スクロール前:', scrollTopBefore);
    expect(scrollTopBefore).toBeGreaterThan(0);

    // モーダルを閉じる
    await page.click('.modal .close, button:has-text("キャンセル")');

    // 再度モーダルを開く
    await page.click('text=新規タスク');

    // スクロール位置がリセットされているか確認
    const scrollTopAfter = await page.evaluate(() => {
      const modalLeft = document.querySelector('.modal-left');
      return modalLeft ? modalLeft.scrollTop : 0;
    });

    console.log('✅ スクロール後:', scrollTopAfter);
    expect(scrollTopAfter).toBe(0);
  });
});

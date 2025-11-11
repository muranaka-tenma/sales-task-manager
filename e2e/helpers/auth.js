/**
 * 認証ヘルパー
 * 全ユーザーのログイン処理
 */

// テストユーザー（実際のパスワードは環境変数から取得）
const users = {
  developer: {
    email: 'muranaka-tenma@terracom.co.jp',
    name: '邨中天真',
    role: 'developer',
    password: process.env.DEV_PASSWORD || 'test-password',
  },
  admin1: {
    email: 'kato-jun@terracom.co.jp',
    name: '加藤純',
    role: 'admin',
    password: process.env.ADMIN_PASSWORD || 'test-password',
  },
  admin2: {
    email: 'asahi-keiichi@terracom.co.jp',
    name: '朝日圭一',
    role: 'admin',
    password: process.env.ADMIN_PASSWORD || 'test-password',
  },
  user1: {
    email: 'hashimoto-yumi@terracom.co.jp',
    name: '橋本友美',
    role: 'user',
    password: process.env.USER_PASSWORD || 'test-password',
  },
  user2: {
    email: 'tamura-wataru@terracom.co.jp',
    name: '田村渉',
    role: 'user',
    password: process.env.USER_PASSWORD || 'test-password',
  },
  user3: {
    email: 'hanzawa-yuka@terracom.co.jp',
    name: '半澤侑果',
    role: 'user',
    password: process.env.USER_PASSWORD || 'test-password',
  },
};

/**
 * ログイン処理
 * @param {import('@playwright/test').Page} page
 * @param {string} userType - 'developer' | 'admin1' | 'admin2' | 'user1' | 'user2' | 'user3'
 */
async function login(page, userType = 'developer') {
  const user = users[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  console.log(`🔐 Logging in as: ${user.name} (${user.role})`);

  // ログインページへ
  await page.goto('/sales-task-core/index-kanban.html');

  // ログインフォームが表示されるまで待機
  await page.waitForSelector('#email', { timeout: 10000 });

  // 認証情報入力
  await page.fill('#email', user.email);
  await page.fill('#password', user.password);

  // ログインボタンクリック
  await page.click('button[type="submit"]');

  // ログイン完了を待機（カンバンボードが表示される）
  await page.waitForSelector('.kanban-board', { timeout: 15000 });

  // Firebase認証完了を待機
  await page.waitForFunction(() => {
    return window.getCurrentUser && window.getCurrentUser() !== null;
  }, { timeout: 10000 });

  console.log(`✅ Login successful: ${user.name}`);

  return user;
}

/**
 * ログアウト処理
 * @param {import('@playwright/test').Page} page
 */
async function logout(page) {
  console.log('🚪 Logging out...');

  // ハンバーガーメニューを開く
  await page.click('#hamburger-menu');

  // ログアウトリンクをクリック
  await page.click('a[href*="logout"]');

  // ログインページへのリダイレクトを待機
  await page.waitForURL('**/index-kanban.html', { timeout: 10000 });

  console.log('✅ Logout successful');
}

/**
 * Firebaseスナップショット取得（データ変更監視用）
 * @param {import('@playwright/test').Page} page
 */
async function captureFirebaseSnapshot(page) {
  return await page.evaluate(async () => {
    const [projectsResult, usersResult] = await Promise.all([
      window.FirebaseDB.getProjects(true),
      window.FirebaseDB.getActiveUsers(),
    ]);

    return {
      projects: projectsResult.projects || [],
      users: usersResult || [],
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * データ変更検出
 * @param {Object} before - 変更前スナップショット
 * @param {Object} after - 変更後スナップショット
 * @param {Array<string>} allowedChanges - 許可する変更（例: ['projects.0.updatedAt']）
 */
function detectUnintendedChanges(before, after, allowedChanges = []) {
  const changes = [];

  // プロジェクトの比較
  if (before.projects.length !== after.projects.length) {
    changes.push({
      type: 'project_count_changed',
      before: before.projects.length,
      after: after.projects.length,
    });
  }

  before.projects.forEach((beforeProj, index) => {
    const afterProj = after.projects.find(p => p.id === beforeProj.id);
    if (!afterProj) {
      changes.push({
        type: 'project_deleted',
        project: beforeProj.name,
      });
      return;
    }

    // statusが変わっていないか
    if (beforeProj.status !== afterProj.status) {
      const changeKey = `projects.${index}.status`;
      if (!allowedChanges.includes(changeKey)) {
        changes.push({
          type: 'project_status_changed',
          project: beforeProj.name,
          before: beforeProj.status,
          after: afterProj.status,
        });
      }
    }

    // visibilityが変わっていないか
    if (beforeProj.visibility !== afterProj.visibility) {
      changes.push({
        type: 'project_visibility_changed',
        project: beforeProj.name,
        before: beforeProj.visibility,
        after: afterProj.visibility,
      });
    }
  });

  return changes;
}

module.exports = {
  users,
  login,
  logout,
  captureFirebaseSnapshot,
  detectUnintendedChanges,
};

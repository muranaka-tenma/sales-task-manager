/**
 * Phase 2: データ変更監視テスト（5テスト）
 *
 * ユーザーの最大懸念：「意図しないデータ変更が発生していないか」
 *
 * 全操作後にFirebaseデータをスナップショット比較し、
 * プロジェクトstatus、visibility、メンバーなどが勝手に変わっていないか検証
 */

const { test, expect } = require('@playwright/test');
const { login, captureFirebaseSnapshot, detectUnintendedChanges } = require('./helpers/auth');

test.describe('Phase 2: データ整合性・変更監視', () => {

  test('WATCH-001: タスク作成後にプロジェクトデータが変わらない', async ({ page }) => {
    console.log('📝 Testing: Project data unchanged after task creation');

    await login(page, 'developer');

    // スナップショット取得
    const before = await captureFirebaseSnapshot(page);

    console.log('📸 Before snapshot:', {
      projects: before.projects.length,
      users: before.users.length,
    });

    // タスク作成
    await page.click('#add-task-button');
    await page.waitForSelector('#task-modal', { state: 'visible' });

    const taskTitle = `監視テスト_${Date.now()}`;
    await page.fill('#task-title', taskTitle);
    await page.fill('#task-description', 'データ変更監視テスト');

    await page.click('#save-task');
    await page.waitForSelector('#task-modal', { state: 'hidden' });

    // Firebase保存完了を待機
    await page.waitForTimeout(2000);

    // スナップショット再取得
    const after = await captureFirebaseSnapshot(page);

    console.log('📸 After snapshot:', {
      projects: after.projects.length,
      users: after.users.length,
    });

    // プロジェクトデータの変更を検出
    const changes = detectUnintendedChanges(before, after);

    expect(changes).toHaveLength(0);

    if (changes.length > 0) {
      console.error('⚠️ 意図しない変更を検出:', JSON.stringify(changes, null, 2));
    } else {
      console.log('✅ No unintended changes detected');
    }
  });

  test('WATCH-002: プロジェクトタスク作成後にプロジェクトstatusが変わらない', async ({ page }) => {
    console.log('📝 Testing: Project status unchanged after project task creation');

    await login(page, 'developer');

    const before = await captureFirebaseSnapshot(page);

    // プロジェクトタスク作成
    await page.click('#add-task-button');
    await page.waitForSelector('#task-modal', { state: 'visible' });

    await page.selectOption('#task-project-select', { index: 1 }); // 最初のプロジェクト

    const taskTitle = `PJタスク監視_${Date.now()}`;
    await page.fill('#task-title', taskTitle);

    await page.click('#save-task');
    await page.waitForSelector('#task-modal', { state: 'hidden' });

    await page.waitForTimeout(2000);

    const after = await captureFirebaseSnapshot(page);

    // プロジェクトのstatus確認
    const changes = detectUnintendedChanges(before, after);

    expect(changes).toHaveLength(0);

    // 特にstatusの変更を確認
    before.projects.forEach((beforeProj, index) => {
      const afterProj = after.projects.find(p => p.id === beforeProj.id);
      if (afterProj) {
        expect(afterProj.status).toBe(beforeProj.status);
        console.log(`✅ Project "${beforeProj.name}" status unchanged: ${beforeProj.status}`);
      }
    });
  });

  test('WATCH-003: タスク編集後にプロジェクトデータが変わらない', async ({ page }) => {
    console.log('📝 Testing: Project data unchanged after task edit');

    await login(page, 'developer');

    const before = await captureFirebaseSnapshot(page);

    // 既存タスクを編集
    const taskCard = page.locator('.task-card').first();
    await taskCard.click();

    await page.waitForSelector('#task-modal', { state: 'visible' });

    // タイトルを変更
    const titleInput = page.locator('#task-title');
    const currentTitle = await titleInput.inputValue();
    await titleInput.fill(`${currentTitle}_edited_${Date.now()}`);

    await page.click('#save-task');
    await page.waitForSelector('#task-modal', { state: 'hidden' });

    await page.waitForTimeout(2000);

    const after = await captureFirebaseSnapshot(page);

    const changes = detectUnintendedChanges(before, after);

    expect(changes).toHaveLength(0);
    console.log('✅ No project data changed after task edit');
  });

  test('WATCH-004: カラム移動後にプロジェクトデータが変わらない', async ({ page }) => {
    console.log('📝 Testing: Project data unchanged after task column move');

    await login(page, 'developer');

    const before = await captureFirebaseSnapshot(page);

    // タスクカードを取得
    const taskCards = await page.$$('.task-card');

    if (taskCards.length === 0) {
      console.log('⚠️ No tasks found, skipping test');
      test.skip();
      return;
    }

    // 最初のタスクを「進行中」カラムに移動（ドラッグ&ドロップは複雑なので、直接API呼び出し）
    await page.evaluate(() => {
      const tasks = window.tasks || [];
      if (tasks.length > 0 && tasks[0].columnId !== 'inprogress') {
        tasks[0].columnId = 'inprogress';
        window.FirebaseDB.saveTasks(tasks);
      }
    });

    await page.waitForTimeout(2000);

    const after = await captureFirebaseSnapshot(page);

    const changes = detectUnintendedChanges(before, after);

    expect(changes).toHaveLength(0);
    console.log('✅ No project data changed after column move');
  });

  test('WATCH-005: リロード後もプロジェクトデータが一致', async ({ page }) => {
    console.log('📝 Testing: Project data consistent after reload');

    await login(page, 'developer');

    const before = await captureFirebaseSnapshot(page);

    // リロード
    await page.reload();
    await page.waitForSelector('.kanban-board');
    await page.waitForFunction(() => window.getCurrentUser && window.getCurrentUser() !== null);

    await page.waitForTimeout(1000);

    const after = await captureFirebaseSnapshot(page);

    // プロジェクト数が一致
    expect(after.projects.length).toBe(before.projects.length);

    // 各プロジェクトのstatusが一致
    before.projects.forEach(beforeProj => {
      const afterProj = after.projects.find(p => p.id === beforeProj.id);
      expect(afterProj).toBeDefined();
      expect(afterProj.status).toBe(beforeProj.status);
      expect(afterProj.visibility).toBe(beforeProj.visibility);
    });

    console.log('✅ Project data consistent after reload');
    console.log(`   - Projects: ${after.projects.length}`);
    console.log(`   - All statuses match`);
  });

});

console.log('📋 Phase 2 Tests: 5 tests for data integrity monitoring');

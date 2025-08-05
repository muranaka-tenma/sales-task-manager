// ============ タスク復旧機能アドオン ============
// このファイルをindex-kanban.htmlに読み込んで使用

function showTaskRecoveryModal() {
    let modal = document.getElementById('task-recovery-modal');
    if (!modal) {
        modal = createTaskRecoveryModal();
    }
    
    modal.style.display = 'block';
    loadAvailableBackups();
}

function createTaskRecoveryModal() {
    const modal = document.createElement('div');
    modal.id = 'task-recovery-modal';
    modal.style.cssText = `
        display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
        <div style="background-color: white; margin: 5% auto; padding: 20px; border-radius: 10px; width: 80%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>🔄 タスク復旧センター</h2>
                <span onclick="document.getElementById('task-recovery-modal').style.display='none'" style="cursor: pointer; font-size: 24px;">&times;</span>
            </div>
            
            <div style="margin-bottom: 20px; padding: 10px; background-color: #e3f2fd; border-radius: 5px;">
                <strong>💡 タスク復旧について</strong><br>
                システムは5分毎に自動バックアップを作成し、消失したタスクを復旧できます。
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>📊 現在の状況</h3>
                <div id="current-task-status" style="padding: 10px; background-color: #f5f5f5; border-radius: 5px; margin-top: 10px;">
                    読み込み中...
                </div>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>📦 利用可能なバックアップ</h3>
                <div id="backup-list-container" style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; margin-top: 10px;">
                    読み込み中...
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="createManualBackup()" style="padding: 10px 20px; background-color: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    💾 手動バックアップ作成
                </button>
                <button onclick="cleanupOldBackups()" style="padding: 10px 20px; background-color: #ff9800; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🧹 古いバックアップ削除
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    return modal;
}

function loadAvailableBackups() {
    const currentTasks = JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
    const statusDiv = document.getElementById('current-task-status');
    statusDiv.innerHTML = `
        <strong>現在のタスク数:</strong> ${currentTasks.length}件<br>
        <strong>最終更新:</strong> ${new Date().toLocaleString('ja-JP')}
    `;
    
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('salesTasksKanban_auto_backup_') || 
                   key.startsWith('salesTasksKanban_emergency_backup_') ||
                   key.startsWith('salesTasksKanban_backup_'))) {
            backupKeys.push(key);
        }
    }
    
    const backupListDiv = document.getElementById('backup-list-container');
    
    if (backupKeys.length === 0) {
        backupListDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">バックアップが見つかりませんでした</div>';
        return;
    }
    
    // タイムスタンプでソート（新しい順）
    backupKeys.sort((a, b) => {
        const aTime = parseInt(a.match(/_(\d+)$/)?.[1] || '0');
        const bTime = parseInt(b.match(/_(\d+)$/)?.[1] || '0');
        return bTime - aTime;
    });
    
    let html = '';
    backupKeys.forEach(key => {
        try {
            const backupData = localStorage.getItem(key);
            const backupTasks = JSON.parse(backupData);
            const timestamp = parseInt(key.match(/_(\d+)$/)?.[1] || '0');
            const date = new Date(timestamp);
            const backupType = key.includes('emergency') ? '🚨 緊急' : 
                             key.includes('auto') ? '⏰ 自動' : '📝 手動';
            
            html += `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div><strong>${backupType}</strong> ${date.toLocaleString('ja-JP')}</div>
                        <div style="font-size: 0.9rem; color: #666;">タスク数: ${backupTasks.length}件</div>
                    </div>
                    <div>
                        <button onclick="previewBackup('${key}')" style="padding: 5px 10px; margin-right: 5px; background-color: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">
                            👁️ 確認
                        </button>
                        <button onclick="restoreFromBackup('${key}')" style="padding: 5px 10px; background-color: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">
                            🔄 復旧
                        </button>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error('バックアップ読み込みエラー:', key, e);
        }
    });
    
    backupListDiv.innerHTML = html;
}

function previewBackup(backupKey) {
    try {
        const backupData = localStorage.getItem(backupKey);
        const backupTasks = JSON.parse(backupData);
        const timestamp = parseInt(backupKey.match(/_(\d+)$/)?.[1] || '0');
        const date = new Date(timestamp);
        
        let preview = `バックアップ詳細\n`;
        preview += `作成日時: ${date.toLocaleString('ja-JP')}\n`;
        preview += `タスク数: ${backupTasks.length}件\n\n`;
        
        if (backupTasks.length > 0) {
            preview += `タスク一覧:\n`;
            backupTasks.slice(0, 10).forEach((task, index) => {
                preview += `${index + 1}. ${task.title}\n`;
            });
            
            if (backupTasks.length > 10) {
                preview += `...他${backupTasks.length - 10}件\n`;
            }
        }
        
        alert(preview);
    } catch (e) {
        alert('バックアップの読み込みに失敗しました: ' + e.message);
    }
}

function restoreFromBackup(backupKey) {
    try {
        const backupData = localStorage.getItem(backupKey);
        const backupTasks = JSON.parse(backupData);
        const timestamp = parseInt(backupKey.match(/_(\d+)$/)?.[1] || '0');
        const date = new Date(timestamp);
        
        const confirmMessage = `${date.toLocaleString('ja-JP')}のバックアップから復旧しますか？\n\n` +
                             `復旧されるタスク数: ${backupTasks.length}件\n` +
                             `現在のタスク数: ${tasks.length}件\n\n` +
                             `※現在のタスクデータは上書きされます`;
        
        if (confirm(confirmMessage)) {
            // 現在のデータをバックアップ
            const currentBackupKey = `salesTasksKanban_before_restore_${Date.now()}`;
            localStorage.setItem(currentBackupKey, JSON.stringify(tasks));
            
            // バックアップから復旧
            tasks = backupTasks;
            localStorage.setItem('salesTasksKanban', JSON.stringify(tasks));
            
            // 画面を更新
            render();
            updateStats();
            
            document.getElementById('task-recovery-modal').style.display = 'none';
            alert(`✅ 復旧完了！\n${backupTasks.length}件のタスクを復旧しました。`);
        }
    } catch (e) {
        alert('復旧に失敗しました: ' + e.message);
    }
}

function createManualBackup() {
    try {
        const backupKey = `salesTasksKanban_manual_backup_${Date.now()}`;
        const currentTasks = JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
        localStorage.setItem(backupKey, JSON.stringify(currentTasks));
        
        alert(`✅ 手動バックアップを作成しました\n\nバックアップ名: ${backupKey}\nタスク数: ${currentTasks.length}件`);
        loadAvailableBackups(); // リストを更新
    } catch (e) {
        alert('バックアップの作成に失敗しました: ' + e.message);
    }
}

function cleanupOldBackups() {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('salesTasksKanban_auto_backup_') || 
                   key.startsWith('salesTasksKanban_emergency_backup_'))) {
            backupKeys.push(key);
        }
    }
    
    if (backupKeys.length <= 10) {
        alert('削除する古いバックアップがありません');
        return;
    }
    
    const sortedKeys = backupKeys.sort();
    const keysToDelete = sortedKeys.slice(0, sortedKeys.length - 10);
    
    if (confirm(`${keysToDelete.length}個の古いバックアップを削除しますか？`)) {
        keysToDelete.forEach(key => localStorage.removeItem(key));
        alert(`✅ ${keysToDelete.length}個のバックアップを削除しました`);
        loadAvailableBackups(); // リストを更新
    }
}

console.log('✅ タスク復旧機能アドオンが読み込まれました');
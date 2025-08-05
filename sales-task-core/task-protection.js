/**
 * タスクデータ保護システム - 緊急修正版
 * 
 * 問題：2回目のページ更新でタスクが消失する
 * 解決策：LocalStorageを監視し、タスクデータの変更を即座に検出・復旧
 */

// タスクデータ保護システムのグローバル変数
window.taskProtectionSystem = {
    isActive: false,
    lastKnownTaskCount: 0,
    backupInterval: null,
    monitorInterval: null,
    emergencyBackups: [],
    maxBackups: 20
};

// 緊急バックアップ作成
function createEmergencyBackup(reason = 'unknown') {
    try {
        const currentTasks = localStorage.getItem('salesTasksKanban');
        if (!currentTasks) return null;
        
        const parsedTasks = JSON.parse(currentTasks);
        const backupKey = `salesTasksKanban_emergency_${Date.now()}_${reason}`;
        const backup = {
            key: backupKey,
            data: currentTasks,
            taskCount: parsedTasks.length,
            timestamp: Date.now(),
            reason: reason
        };
        
        localStorage.setItem(backupKey, currentTasks);
        window.taskProtectionSystem.emergencyBackups.push(backup);
        
        // 最大バックアップ数を超えた場合、古いものを削除
        if (window.taskProtectionSystem.emergencyBackups.length > window.taskProtectionSystem.maxBackups) {
            const oldBackup = window.taskProtectionSystem.emergencyBackups.shift();
            localStorage.removeItem(oldBackup.key);
        }
        
        console.log(`🚨 [PROTECT] 緊急バックアップ作成: ${backupKey} (${parsedTasks.length}件)`);
        return backup;
    } catch (error) {
        console.error('❌ [PROTECT] 緊急バックアップ作成エラー:', error);
        return null;
    }
}

// タスクデータ監視
function monitorTaskData() {
    try {
        const currentTasks = localStorage.getItem('salesTasksKanban');
        const currentTaskCount = currentTasks ? JSON.parse(currentTasks).length : 0;
        
        // 前回の記録と比較
        if (window.taskProtectionSystem.lastKnownTaskCount > 0) {
            const difference = currentTaskCount - window.taskProtectionSystem.lastKnownTaskCount;
            
            if (difference < -1) { // 2個以上減少した場合
                console.warn(`⚠️ [PROTECT] タスク大幅減少を検出: ${window.taskProtectionSystem.lastKnownTaskCount} → ${currentTaskCount} (${difference})`);
                
                // 最新のバックアップから復旧を試行
                const latestBackup = window.taskProtectionSystem.emergencyBackups
                    .filter(b => b.taskCount >= window.taskProtectionSystem.lastKnownTaskCount)
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                
                if (latestBackup) {
                    console.log(`🔄 [PROTECT] 自動復旧実行: ${latestBackup.key}`);
                    localStorage.setItem('salesTasksKanban', latestBackup.data);
                    
                    // グローバル変数も更新
                    if (typeof window.tasks !== 'undefined') {
                        window.tasks = JSON.parse(latestBackup.data);
                        console.log('🔄 [PROTECT] グローバル変数も復旧');
                        
                        // 画面も更新
                        if (typeof window.render === 'function') {
                            window.render();
                            console.log('🎨 [PROTECT] 画面も更新');
                        }
                    }
                    
                    // アラート表示
                    setTimeout(() => {
                        alert(`🔄 タスクデータを自動復旧しました\n\n復旧されたタスク数: ${JSON.parse(latestBackup.data).length}件\n復旧元: ${latestBackup.reason}`);
                    }, 100);
                }
            } else if (difference > 0) {
                // タスクが増加した場合は正常な操作なのでバックアップ作成
                createEmergencyBackup('task_increase');
            }
        }
        
        // 記録を更新
        window.taskProtectionSystem.lastKnownTaskCount = currentTaskCount;
        
    } catch (error) {
        console.error('❌ [PROTECT] 監視エラー:', error);
    }
}

// 保護システム開始
function startTaskProtection() {
    if (window.taskProtectionSystem.isActive) {
        console.log('🛡️ [PROTECT] 保護システムは既に稼働中');
        return;
    }
    
    console.log('🛡️ [PROTECT] タスクデータ保護システム開始');
    
    // 初期バックアップ作成
    const initialTasks = localStorage.getItem('salesTasksKanban');
    if (initialTasks) {
        const parsedTasks = JSON.parse(initialTasks);
        window.taskProtectionSystem.lastKnownTaskCount = parsedTasks.length;
        createEmergencyBackup('system_start');
    }
    
    // 定期バックアップ（2分毎）
    window.taskProtectionSystem.backupInterval = setInterval(() => {
        createEmergencyBackup('periodic');
    }, 2 * 60 * 1000);
    
    // タスクデータ監視（10秒毎）
    window.taskProtectionSystem.monitorInterval = setInterval(monitorTaskData, 10 * 1000);
    
    // ページ離脱時にもバックアップ
    window.addEventListener('beforeunload', () => {
        createEmergencyBackup('page_unload');
    });
    
    // LocalStorage変更の監視
    window.addEventListener('storage', (e) => {
        if (e.key === 'salesTasksKanban') {
            console.log('🔍 [PROTECT] LocalStorage変更検出');
            setTimeout(monitorTaskData, 100); // 少し遅延して監視
        }
    });
    
    window.taskProtectionSystem.isActive = true;
    console.log('✅ [PROTECT] 保護システム稼働開始完了');
}

// 保護システム停止
function stopTaskProtection() {
    if (!window.taskProtectionSystem.isActive) {
        return;
    }
    
    console.log('🛑 [PROTECT] タスクデータ保護システム停止');
    
    if (window.taskProtectionSystem.backupInterval) {
        clearInterval(window.taskProtectionSystem.backupInterval);
    }
    
    if (window.taskProtectionSystem.monitorInterval) {
        clearInterval(window.taskProtectionSystem.monitorInterval);
    }
    
    window.taskProtectionSystem.isActive = false;
}

// 手動復旧機能
function manualRestore() {
    const backups = window.taskProtectionSystem.emergencyBackups
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    
    if (backups.length === 0) {
        alert('利用可能なバックアップがありません');
        return;
    }
    
    let message = 'どのバックアップから復旧しますか？\n\n';
    backups.forEach((backup, index) => {
        const date = new Date(backup.timestamp);
        message += `${index + 1}. ${date.toLocaleString()} - ${backup.taskCount}件 (${backup.reason})\n`;
    });
    
    const choice = prompt(message + '\n番号を入力してください (1-' + backups.length + '):');
    const choiceIndex = parseInt(choice) - 1;
    
    if (choiceIndex >= 0 && choiceIndex < backups.length) {
        const selectedBackup = backups[choiceIndex];
        localStorage.setItem('salesTasksKanban', selectedBackup.data);
        
        if (typeof window.tasks !== 'undefined') {
            window.tasks = JSON.parse(selectedBackup.data);
            if (typeof window.render === 'function') {
                window.render();
            }
        }
        
        alert(`✅ 復旧完了！\n${selectedBackup.taskCount}件のタスクを復旧しました。`);
    }
}

// グローバル関数として公開
window.startTaskProtection = startTaskProtection;
window.stopTaskProtection = stopTaskProtection;
window.createEmergencyBackup = createEmergencyBackup;
window.manualRestore = manualRestore;

// 自動開始（DOMContentLoaded後）
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        startTaskProtection();
    }, 2000); // 2秒後に開始（他の初期化処理の後）
});

console.log('🛡️ [PROTECT] タスク保護システム読み込み完了');
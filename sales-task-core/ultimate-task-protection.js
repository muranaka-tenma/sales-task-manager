/**
 * 究極のタスクデータ保護システム - 最終修正版
 * 
 * 問題: PJタスク作成後も通常タスクが消失し続ける
 * 解決: 全ての関数をインターセプトして完全保護
 */

console.log('🛡️ [ULTIMATE] 究極保護システム開始...');

// グローバル保護状態
window.ultimateProtection = {
    isActive: false,
    taskSnapshot: null,
    protectionLevel: 'MAXIMUM',
    interceptedFunctions: [],
    recoveryCount: 0
};

// タスクデータのスナップショット作成
function createTaskSnapshot(reason = 'unknown') {
    try {
        const currentTasks = localStorage.getItem('salesTasksKanban');
        if (!currentTasks) return null;
        
        const snapshot = {
            data: currentTasks,
            tasks: JSON.parse(currentTasks),
            timestamp: Date.now(),
            reason: reason,
            memoryTaskCount: typeof window.tasks !== 'undefined' ? window.tasks.length : 0
        };
        
        window.ultimateProtection.taskSnapshot = snapshot;
        console.log(`📸 [ULTIMATE] スナップショット作成: ${reason} (${snapshot.tasks.length}件)`);
        
        return snapshot;
    } catch (error) {
        console.error('❌ [ULTIMATE] スナップショット作成エラー:', error);
        return null;
    }
}

// 緊急復旧実行
function emergencyRecover(reason = 'unknown') {
    try {
        const snapshot = window.ultimateProtection.taskSnapshot;
        if (!snapshot) {
            console.error('❌ [ULTIMATE] 復旧用スナップショットがありません');
            return false;
        }
        
        console.log(`🔄 [ULTIMATE] 緊急復旧実行: ${reason}`);
        
        // LocalStorageを復旧
        localStorage.setItem('salesTasksKanban', snapshot.data);
        
        // メモリも復旧
        if (typeof window.tasks !== 'undefined') {
            window.tasks = [...snapshot.tasks];
            console.log('🔄 [ULTIMATE] メモリ復旧完了:', window.tasks.length, '件');
        }
        
        // 画面更新
        if (typeof window.render === 'function') {
            setTimeout(() => {
                window.render();
                console.log('🎨 [ULTIMATE] 画面更新完了');
            }, 100);
        }
        
        window.ultimateProtection.recoveryCount++;
        
        // ユーザー通知
        setTimeout(() => {
            alert(`🚨 タスクデータ消失を検出し、緊急復旧しました！\n\n復旧されたタスク数: ${snapshot.tasks.length}件\n復旧理由: ${reason}\n復旧回数: ${window.ultimateProtection.recoveryCount}`);
        }, 200);
        
        return true;
    } catch (error) {
        console.error('❌ [ULTIMATE] 緊急復旧エラー:', error);
        return false;
    }
}

// 関数インターセプター
function interceptFunction(obj, funcName, protectionCallback) {
    if (typeof obj[funcName] !== 'function') {
        console.warn(`⚠️ [ULTIMATE] 関数が見つかりません: ${funcName}`);
        return;
    }
    
    const originalFunc = obj[funcName];
    const protectedFuncName = `original_${funcName}_${Date.now()}`;
    
    // 元の関数を保存
    obj[protectedFuncName] = originalFunc;
    
    // 保護版関数で置き換え
    obj[funcName] = function(...args) {
        console.log(`🛡️ [ULTIMATE] インターセプト: ${funcName}`);
        
        // 実行前スナップショット
        const beforeSnapshot = createTaskSnapshot(`before_${funcName}`);
        
        try {
            // 元の関数を実行
            const result = originalFunc.apply(this, args);
            
            // 実行後の検証
            setTimeout(() => {
                protectionCallback(beforeSnapshot, funcName, args);
            }, 150);
            
            return result;
        } catch (error) {
            console.error(`❌ [ULTIMATE] ${funcName} 実行エラー:`, error);
            
            // エラー時も検証
            setTimeout(() => {
                protectionCallback(beforeSnapshot, funcName, args, error);
            }, 150);
            
            throw error;
        }
    };
    
    window.ultimateProtection.interceptedFunctions.push(funcName);
    console.log(`✅ [ULTIMATE] 関数保護設定: ${funcName}`);
}

// 保護コールバック
function protectionCallback(beforeSnapshot, funcName, args, error = null) {
    try {
        const currentTasks = localStorage.getItem('salesTasksKanban');
        const currentTaskCount = currentTasks ? JSON.parse(currentTasks).length : 0;
        const memoryTaskCount = typeof window.tasks !== 'undefined' ? window.tasks.length : 0;
        
        const beforeCount = beforeSnapshot ? beforeSnapshot.tasks.length : 0;
        
        console.log(`🔍 [ULTIMATE] 検証: ${funcName}`, {
            before: beforeCount,
            afterStorage: currentTaskCount,
            afterMemory: memoryTaskCount,
            error: !!error
        });
        
        // タスク大幅減少を検出
        if (beforeCount > 0 && (currentTaskCount < beforeCount - 1 || memoryTaskCount < beforeCount - 1)) {
            console.error(`🚨 [ULTIMATE] ${funcName}でタスク消失検出!`, {
                function: funcName,
                before: beforeCount,
                afterStorage: currentTaskCount,
                afterMemory: memoryTaskCount,
                args: args
            });
            
            // 緊急復旧実行
            emergencyRecover(`${funcName}_task_loss`);
        }
        
        // メモリとストレージの不整合を検出
        if (Math.abs(currentTaskCount - memoryTaskCount) > 1) {
            console.warn(`⚠️ [ULTIMATE] メモリ⇔ストレージ不整合検出: ${funcName}`, {
                storage: currentTaskCount,
                memory: memoryTaskCount
            });
            
            // より大きい方を採用
            if (memoryTaskCount > currentTaskCount && beforeSnapshot) {
                localStorage.setItem('salesTasksKanban', JSON.stringify(window.tasks));
                console.log('🔄 [ULTIMATE] ストレージをメモリで修正');
            }
        }
        
    } catch (verificationError) {
        console.error('❌ [ULTIMATE] 検証エラー:', verificationError);
    }
}

// 究極保護システム開始
function startUltimateProtection() {
    if (window.ultimateProtection.isActive) {
        console.log('🛡️ [ULTIMATE] 既に稼働中');
        return;
    }
    
    console.log('🛡️ [ULTIMATE] 究極保護システム開始');
    
    // 初期スナップショット
    createTaskSnapshot('system_start');
    
    // 重要関数を保護
    const functionsToProtect = [
        { obj: window, name: 'saveTask' },
        { obj: window, name: 'saveTasks' },
        { obj: window, name: 'createProjectTask' },
        { obj: window, name: 'render' },
        { obj: window, name: 'renderKanban' },
        { obj: window, name: 'loadTasksFromStorage' }
    ];
    
    functionsToProtect.forEach(({ obj, name }) => {
        try {
            interceptFunction(obj, name, protectionCallback);
        } catch (error) {
            console.warn(`⚠️ [ULTIMATE] ${name}の保護設定失敗:`, error);
        }
    });
    
    // localStorage変更の監視
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (key === 'salesTasksKanban') {
            console.log('🔍 [ULTIMATE] localStorage変更検出');
            
            // 変更前の状態を保存
            const beforeData = this.getItem(key);
            const beforeCount = beforeData ? JSON.parse(beforeData).length : 0;
            
            // 変更を実行
            originalSetItem.call(this, key, value);
            
            // 変更後の検証
            setTimeout(() => {
                try {
                    const afterCount = JSON.parse(value).length;
                    if (beforeCount > 0 && afterCount < beforeCount - 1) {
                        console.error('🚨 [ULTIMATE] localStorage直接変更でタスク消失検出!');
                        emergencyRecover('localStorage_direct_change');
                    }
                } catch (e) {
                    console.error('❌ [ULTIMATE] localStorage検証エラー:', e);
                }
            }, 50);
        } else {
            originalSetItem.call(this, key, value);
        }
    };
    
    // 定期監視（5秒毎）
    setInterval(() => {
        if (window.ultimateProtection.taskSnapshot) {
            const currentTasks = localStorage.getItem('salesTasksKanban');
            const currentCount = currentTasks ? JSON.parse(currentTasks).length : 0;
            const snapshotCount = window.ultimateProtection.taskSnapshot.tasks.length;
            
            if (snapshotCount > 0 && currentCount < snapshotCount - 1) {
                console.error('🚨 [ULTIMATE] 定期監視でタスク消失検出!');
                emergencyRecover('periodic_check');
            } else {
                // 正常な場合はスナップショット更新
                createTaskSnapshot('periodic_update');
            }
        }
    }, 5000);
    
    window.ultimateProtection.isActive = true;
    console.log(`✅ [ULTIMATE] 究極保護システム稼働開始 (${window.ultimateProtection.interceptedFunctions.length}個の関数を保護)`);
}

// 緊急復旧ボタン（グローバル関数）
window.ultimateRecover = function() {
    const snapshot = window.ultimateProtection.taskSnapshot;
    if (!snapshot) {
        alert('復旧用のスナップショットがありません');
        return;
    }
    
    if (confirm(`最新のスナップショットから復旧しますか？\n\nスナップショット日時: ${new Date(snapshot.timestamp).toLocaleString()}\nタスク数: ${snapshot.tasks.length}件`)) {
        emergencyRecover('manual_recovery');
    }
};

// 自動開始
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        startUltimateProtection();
    }, 1000);
});

console.log('🛡️ [ULTIMATE] 究極タスク保護システム読み込み完了');
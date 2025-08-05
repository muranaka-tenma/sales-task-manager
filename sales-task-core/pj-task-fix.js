/**
 * PJタスク作成時のタスク消失問題 - 緊急修正パッチ
 * 
 * 問題: PJタスク作成時に通常タスクが消失する
 * 原因: saveTask関数内でタスク保存処理の競合状態
 * 解決: saveTask関数の保護強化
 */

// 元のsaveTask関数を保護版で上書き
if (typeof window.originalSaveTask === 'undefined') {
    console.log('🔧 [PJ-FIX] PJタスク作成時の保護パッチを適用中...');
    
    // 元のsaveTasks関数を保存
    window.originalSaveTask = window.saveTask;
    
    // 保護版のsaveTask関数を作成
    window.saveTask = async function(event) {
        console.log('🛡️ [PJ-FIX] 保護版saveTask開始');
        
        try {
            // 作業前バックアップ
            if (typeof createEmergencyBackup === 'function') {
                createEmergencyBackup('before_pj_save');
                console.log('🛡️ [PJ-FIX] 作業前バックアップ作成');
            }
            
            // 現在のタスク数を記録
            const beforeTaskCount = tasks.length;
            console.log('🔍 [PJ-FIX] 作業前タスク数:', beforeTaskCount);
            
            // 元の処理を実行
            await window.originalSaveTask.call(this, event);
            
            // 作業後の検証
            setTimeout(() => {
                const afterTaskCount = tasks.length;
                const storedTasks = JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
                const storedTaskCount = storedTasks.length;
                
                console.log('🔍 [PJ-FIX] 作業後検証:', {
                    before: beforeTaskCount,
                    afterMemory: afterTaskCount,
                    afterStorage: storedTaskCount
                });
                
                // タスク数の大幅な減少を検出
                if (afterTaskCount < beforeTaskCount - 1 || storedTaskCount < beforeTaskCount - 1) {
                    console.error('🚨 [PJ-FIX] PJタスク作成時のタスク消失を検出!');
                    
                    // 緊急復旧
                    if (typeof createEmergencyBackup === 'function') {
                        const backups = window.taskProtectionSystem?.emergencyBackups || [];
                        const latestBackup = backups
                            .filter(b => b.reason === 'before_pj_save')
                            .sort((a, b) => b.timestamp - a.timestamp)[0];
                        
                        if (latestBackup && latestBackup.taskCount >= beforeTaskCount) {
                            console.log('🔄 [PJ-FIX] 緊急復旧実行:', latestBackup.key);
                            
                            // バックアップから復旧
                            const backupTasks = JSON.parse(latestBackup.data);
                            
                            // メモリを更新
                            window.tasks = backupTasks;
                            
                            // ストレージを更新
                            localStorage.setItem('salesTasksKanban', latestBackup.data);
                            
                            // 画面を更新
                            if (typeof render === 'function') {
                                render();
                            }
                            
                            // 通知
                            setTimeout(() => {
                                alert(`🚨 PJタスク作成時のデータ消失を検出し、自動復旧しました\n\n復旧されたタスク数: ${backupTasks.length}件\n\n作成したPJタスクは保持されています。`);
                            }, 500);
                            
                            console.log('✅ [PJ-FIX] 緊急復旧完了');
                        }
                    }
                }
            }, 200);
            
        } catch (error) {
            console.error('❌ [PJ-FIX] saveTask保護版でエラー:', error);
            
            // フォールバック: 元の関数を実行
            if (window.originalSaveTask) {
                return await window.originalSaveTask.call(this, event);
            }
        }
    };
    
    console.log('✅ [PJ-FIX] PJタスク作成保護パッチ適用完了');
}

// PJタスク作成ボタンの保護
if (typeof window.originalCreateProjectTask === 'undefined') {
    window.originalCreateProjectTask = window.createProjectTask;
    
    window.createProjectTask = function() {
        console.log('🛡️ [PJ-FIX] 保護版createProjectTask開始');
        
        // 作業前バックアップ
        if (typeof createEmergencyBackup === 'function') {
            createEmergencyBackup('before_create_pj_task');
        }
        
        // 元の処理を実行
        return window.originalCreateProjectTask.call(this);
    };
}

console.log('🛡️ [PJ-FIX] PJタスク作成保護システム初期化完了');
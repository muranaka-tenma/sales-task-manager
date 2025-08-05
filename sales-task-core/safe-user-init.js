/**
 * 安全なユーザーデータベース初期化
 * - 既存データを破壊しない
 * - タスクデータに影響を与えない
 * - 新規端末でも動作する
 */

console.log('🛡️ [SAFE-INIT] 安全な初期化システム起動');

// 安全な初期化関数（既存データを保護）
window.safeInitializeUserDatabase = function() {
    console.log('🔧 [SAFE-INIT] 安全な初期化開始...');
    
    try {
        // 1. 既存のユーザーデータを確認
        const existingUsers = localStorage.getItem('systemUsers');
        
        if (!existingUsers) {
            // 2. 新規端末の場合のみ、最小限の初期化
            console.log('📝 [SAFE-INIT] 新規端末を検出 - 最小限の初期化を実行');
            
            const minimalUsers = [
                {
                    id: 1,
                    name: '邨中天真',
                    email: 'muranaka-tenma@terracom.co.jp',
                    password: 'Tenma7041',
                    role: 'developer',
                    department: '開発部',
                    createdAt: new Date().toISOString()
                }
            ];
            
            localStorage.setItem('systemUsers', JSON.stringify(minimalUsers));
            localStorage.setItem('taskAssignees', JSON.stringify(['邨中天真']));
            
            console.log('✅ [SAFE-INIT] 最小限の初期化完了');
            return true;
        }
        
        // 3. 既存データがある場合は何もしない
        console.log('✅ [SAFE-INIT] 既存ユーザーデータ検出 - 保護モード');
        
        // 4. 担当者リストだけ確認・修復
        const users = JSON.parse(existingUsers);
        const assignees = users.map(u => u.name);
        const currentAssignees = JSON.parse(localStorage.getItem('taskAssignees') || '[]');
        
        if (currentAssignees.length === 0 && assignees.length > 0) {
            localStorage.setItem('taskAssignees', JSON.stringify(assignees));
            console.log('🔧 [SAFE-INIT] 担当者リストを修復:', assignees);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [SAFE-INIT] 初期化エラー:', error);
        return false;
    }
};

// グローバル関数として公開
window.initializeUserDatabase = window.safeInitializeUserDatabase;

console.log('✅ [SAFE-INIT] 安全な初期化システム準備完了');
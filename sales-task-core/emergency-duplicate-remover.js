// 🆘 緊急診断・修復スクリプト
// ブラウザのコンソールでこのファイル全体をコピペして実行してください

console.log('🆘 緊急診断開始...');

// 1. 現在のタスク配列状況
console.log('=== 現在のタスク配列状況 ===');
console.log('window.tasks:', window.tasks ? window.tasks.length : 'undefined');
console.log('global tasks:', typeof tasks !== 'undefined' ? tasks.length : 'undefined');

// 2. Firebase接続状況  
console.log('=== Firebase接続状況 ===');
console.log('Firebase Auth:', !!window.FirebaseAuth);
console.log('Firebase DB:', !!window.FirebaseDB);
console.log('Current User:', window.firebaseAuth?.currentUser?.email || 'なし');

// 3. 強制的にFirebaseから最新データを取得して表示
async function emergencyFixAndDisplay() {
    try {
        console.log('🔍 Firebase強制取得テスト開始...');
        
        // Firebase接続確認
        if (!window.FirebaseDB) {
            console.log('❌ Firebase接続が見つかりません');
            return;
        }
        
        console.log('✅ Firebase接続OK');
        
        // タスク取得
        const result = await window.FirebaseDB.getTasks();
        console.log('✅ Firebase直接取得結果:', {
            success: result.success,
            taskCount: result.tasks ? result.tasks.length : 0,
            error: result.error || 'なし'
        });
        
        if (result.success && result.tasks && result.tasks.length > 0) {
            console.log('📋 Firebase保存済みタスク（最初の5件）:');
            result.tasks.slice(0, 5).forEach((task, index) => {
                console.log(`  ${index + 1}. ${task.title} (${task.status || 'ステータスなし'})`);
            });
            
            // グローバル変数に強制セット
            window.tasks = result.tasks;
            if (typeof tasks !== 'undefined') {
                tasks = result.tasks;
            }
            console.log('🔄 グローバル変数に強制セット完了');
            
            // 強制描画
            if (typeof render === 'function') {
                render();
                console.log('🎨 強制描画完了');
            } else {
                console.log('⚠️ render関数が見つかりません');
            }
        } else {
            console.log('⚠️ Firebase にタスクがありません');
        }
        
    } catch (error) {
        console.error('❌ 緊急診断エラー:', error);
    }
}

// 4. 実行関数
console.log('=== 使用可能な関数 ===');
console.log('  - emergencyFixAndDisplay(): Firebase強制取得と表示');
console.log('');
console.log('🆘 緊急診断完了 - 関数を実行してください');
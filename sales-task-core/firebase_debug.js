
console.log('🔍 Firebase診断スクリプト開始...');

// 現在の認証状態を確認
const authUser = window.firebaseAuth?.currentUser;
console.log('🔐 認証状態:', {
  hasAuth: \!\!authUser,
  email: authUser?.email,
  uid: authUser?.uid
});

// Firebaseから直接タスクを取得
if (window.FirebaseDB) {
  window.FirebaseDB.getTasks().then(result => {
    console.log('📊 Firebase直接取得結果:', {
      success: result.success,
      taskCount: result.tasks ? result.tasks.length : 0,
      error: result.error || 'なし'
    });
    
    if (result.tasks && result.tasks.length > 0) {
      console.log('📋 Firebase保存済みタスク一覧:');
      result.tasks.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title || 'タイトルなし'} (作成者: ${task.createdBy || 'unknown'})`);
      });
    } else {
      console.log('⚠️ Firebaseにタスクが保存されていません');
    }
  }).catch(error => {
    console.error('❌ Firebase取得エラー:', error);
  });
} else {
  console.error('❌ FirebaseDB が利用できません');
}

// 現在のグローバルタスク配列を確認
console.log('🌐 グローバルタスク配列:', {
  exists: typeof window.tasks \!== 'undefined',
  length: window.tasks ? window.tasks.length : 'undefined',
  type: typeof window.tasks
});


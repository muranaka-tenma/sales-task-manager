
// コンソールで実行する診断コマンド
console.log('=== 🔍 Firebase診断開始 ===');

// 1. Firebase認証状態を確認
const currentUser = window.firebaseAuth?.currentUser;
console.log('🔐 Firebase認証状態:', {
  hasFirebaseAuth: \!\!window.firebaseAuth,
  hasCurrentUser: \!\!currentUser,
  userEmail: currentUser?.email || 'なし',
  userUID: currentUser?.uid || 'なし',
  isAuthenticated: \!\!currentUser
});

// 2. LocalStorage認証セッションを確認
const localSession = JSON.parse(localStorage.getItem('currentSession') || 'null');
console.log('💾 LocalStorageセッション:', {
  hasSession: \!\!localSession,
  userEmail: localSession?.user?.email || 'なし',
  expiresAt: localSession?.expiresAt || 'なし'
});

// 3. 認証なしでFirebaseにアクセスを試行
console.log('🧪 認証なしFirebaseアクセステスト...');
if (window.FirebaseDB) {
  // 一時的に認証チェックをバイパスしてタスクを取得
  import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js').then(({ collection, getDocs }) => {
    getDocs(collection(window.firebaseDB, 'tasks')).then(querySnapshot => {
      console.log('📊 認証バイパステスト結果:', {
        taskCount: querySnapshot.size,
        success: true
      });
      
      const allTasks = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allTasks.push({
          id: doc.id,
          title: data.title?.substring(0, 30) + '...',
          createdBy: data.createdBy,
          createdAt: data.createdAt
        });
      });
      
      console.log('📋 Firebase保存済み全タスク:');
      allTasks.forEach((task, i) => {
        console.log(`  ${i+1}. ${task.title} (作成者: ${task.createdBy})`);
      });
      
    }).catch(error => {
      console.error('❌ 認証バイパステスト失敗:', error);
    });
  });
}

console.log('=== 🔍 診断完了 ===');


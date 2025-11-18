/**
 * Firebase設定と初期化
 * マルチユーザー対応のため、LocalStorageからFirebaseに移行
 */

// Firebase SDKのインポート（CDN版）
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAHScwiAkvJ3qwl_VcdDDyzM_Zb37osBMs",
  authDomain: "sales-task-manager-af356.firebaseapp.com",
  projectId: "sales-task-manager-af356",
  storageBucket: "sales-task-manager-af356.firebasestorage.app",
  messagingSenderId: "953432845897",
  appId: "1:953432845897:web:bf441cb3590ce1fc455998"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔥 Firebase初期化完了');

// デバッグ: 認証状態の変化を監視
onAuthStateChanged(auth, (user) => {
  // 🔧 グローバル変数に設定（非表示タスク自動選択で使用）
  window.currentFirebaseUser = user;

  if (user) {
    console.log('🔐 [AUTH-DEBUG] ユーザーログイン検出:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      }
    });
  } else {
    console.log('👤 [AUTH-DEBUG] ユーザーログアウト検出:', {
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// グローバルに公開
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;

// Firebase Auth関数群
window.FirebaseAuth = {
  // ログイン
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase認証成功:', userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ Firebase認証エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ユーザー作成
  createUser: async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestoreにユーザー情報を保存
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName,
        role: 'user',
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log('✅ Firebase ユーザー作成成功:', email);
      return { success: true, user: user };
    } catch (error) {
      console.error('❌ Firebase ユーザー作成エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ログアウト
  signOut: async () => {
    try {
      await signOut(auth);
      console.log('✅ Firebase ログアウト成功');
      return { success: true };
    } catch (error) {
      console.error('❌ Firebase ログアウトエラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 認証状態監視
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // 現在のユーザー取得
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // パスワード変更
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('ログインしていません');
      }

      // 再認証（セキュリティのため現在のパスワード確認）
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('✅ 再認証成功');

      // パスワード更新
      await updatePassword(user, newPassword);
      console.log('✅ Firebase パスワード更新成功:', user.email);

      return { success: true };
    } catch (error) {
      console.error('❌ Firebase パスワード更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Firestore データベース関数群
window.FirebaseDB = {
  // タスク作成
  createTask: async (taskData) => {
    try {
      const user = auth.currentUser;
      
      // 🔧 修正: 認証なしでも匿名タスク作成を許可
      const taskToCreate = {
        ...taskData,
        userId: user?.uid || 'anonymous',
        createdBy: user?.email || 'anonymous_user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🆕 [CREATE-TASK] タスク作成開始:', {
        title: taskData.title?.substring(0, 30) + '...',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous_user',
        device: navigator.platform,
        taskId: taskData.id || 'new',
        timestamp: new Date().toISOString(),
        authState: user ? 'ログイン中' : '未認証'
      });

      const docRef = await addDoc(collection(db, 'tasks'), taskToCreate);

      console.log('✅ [CREATE-TASK] Firestore保存成功:', {
        firestoreId: docRef.id,
        title: taskData.title?.substring(0, 30) + '...',
        userId: user?.uid || 'anonymous',
        timestamp: new Date().toISOString()
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ [CREATE-TASK] Firestore保存エラー:', error.message, error.code);
      return { success: false, error: error.message };
    }
  },

  // タスク更新
  updateTask: async (taskId, updates) => {
    try {
      const user = auth.currentUser;

      await updateDoc(doc(db, 'tasks', taskId), {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'anonymous_user'
      });

      console.log('✅ タスク更新成功:', taskId);
      return { success: true };
    } catch (error) {
      console.error('❌ タスク更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // タスク削除
  deleteTask: async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      console.log('✅ タスク削除成功:', taskId);
      return { success: true };
    } catch (error) {
      console.error('❌ タスク削除エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 全タスク取得（リアルタイム同期対応）
  getTasks: async () => {
    try {
      const user = auth.currentUser;
      
      // 🔧 修正: 認証状態をログ出力するが、認証なしでも続行
      console.log('🔍 [GET-TASKS] 認証状態確認:', {
        hasCurrentUser: !!user,
        userEmail: user?.email || '未認証',
        authState: user ? 'ログイン中' : '未認証'
      });
      
      // 認証なしでも全タスクを取得（チーム共有のため）
      if (!user) {
        console.log('⚠️ [GET-TASKS] 未認証状態ですが、全タスク取得を試行します');
      }

      console.log('🔍 [GET-TASKS] タスク取得開始:', {
        userId: user?.uid || '未認証',
        email: user?.email || '未認証',
        device: navigator.platform,
        timestamp: new Date().toISOString()
      });

      // 🎯 チーム共有タスク管理 - 全タスクを取得（ユーザー別フィルタリング削除）
      console.log('🌐 [TEAM-MODE] 全ユーザー共有タスクを取得中...');
      const q = query(
        collection(db, 'tasks')
        // where('createdBy', '==', user.email) // 削除：個人フィルタリングを無効化
        // orderBy('createdAt', 'desc') // インデックス構築待ち
      );

      return new Promise((resolve, reject) => {
        let isFirstLoad = true;
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const tasks = [];
          console.log('📡 [REALTIME] onSnapshot発火:', {
            docCount: querySnapshot.size,
            isEmpty: querySnapshot.empty,
            hasPendingWrites: querySnapshot.metadata.hasPendingWrites,
            fromCache: querySnapshot.metadata.fromCache,
            isFirstLoad
          });

          querySnapshot.forEach((doc) => {
            const taskData = { id: doc.id, ...doc.data() };
            tasks.push(taskData);
            console.log('📋 [TASK-DATA]', doc.id.substring(0, 8) + '...:', {
              title: taskData.title?.substring(0, 20) + '...',
              status: taskData.status,
              createdAt: taskData.createdAt,
              userId: taskData.userId
            });
          });
          
          console.log('✅ タスク取得成功:', tasks.length, '件', isFirstLoad ? '(初回)' : '(リアルタイム更新)');
          
          if (isFirstLoad) {
            // 初回読み込み
            isFirstLoad = false;
            resolve({ success: true, tasks: tasks, unsubscribe: unsubscribe });
          } else {
            // リアルタイム更新: グローバルタスク配列を更新して再レンダリング
            if (window.tasks !== undefined && window.render) {
              // 🔧 修正: 一時的にタスクデータを保護
              const previousTasksLength = window.tasks ? window.tasks.length : 0;
              
              window.tasks = tasks;
              // Firebase専用モード - LocalStorageは無効
              
              console.log('🔄 [REALTIME] タスクがリアルタイム更新:', {
                previous: previousTasksLength,
                current: tasks.length,
                timestamp: new Date().toISOString()
              });
              
              // 🔧 修正: ページ更新時も必ず再描画を実行
              window.render();
              console.log('🔄 [REALTIME] 再レンダリング実行 (ページ更新時も含む)');
            } else {
              console.warn('⚠️ [REALTIME] window.tasksまたはrenderが利用できません');
            }
          }
        }, (error) => {
          console.error('❌ タスク取得エラー:', error.message, error.code);
          if (isFirstLoad) {
            reject({ success: false, error: error.message });
          }
        });
      });
    } catch (error) {
      console.error('❌ タスク取得エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ユーザー情報取得
  getUserInfo: async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        console.log('✅ ユーザー情報取得成功:', docSnap.data().email);
        return { success: true, user: docSnap.data() };
      } else {
        console.log('❌ ユーザー情報が見つかりません');
        return { success: false, error: 'ユーザー情報が見つかりません' };
      }
    } catch (error) {
      console.error('❌ ユーザー情報取得エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 全ユーザー一覧取得（管理者機能）
  getAllUsers: async () => {
    try {
      const querySnapshot = collection(db, 'users');
      const usersData = [];
      const docs = await getDocs(querySnapshot);
      
      docs.forEach((doc) => {
        usersData.push({ uid: doc.id, ...doc.data() });
      });
      
      console.log('✅ 全ユーザー取得成功:', usersData.length, '件');
      return { success: true, users: usersData };
    } catch (error) {
      console.error('❌ 全ユーザー取得エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 有効なユーザーのみ取得（無効化・非表示ユーザーを除外）
  getActiveUsers: async () => {
    try {
      const result = await window.FirebaseDB.getAllUsers();
      if (!result.success) {
        console.error('❌ [ACTIVE-USERS] ユーザー取得失敗:', result.error);
        return { success: false, users: [], error: result.error };
      }

      // displayName → name へのマッピングとフィルタリング
      const activeUsers = result.users
        .filter(user => !user.isHidden && !user.isDisabled)
        .map(user => ({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Unknown',
          email: user.email,
          role: user.role || 'user',
          isActive: user.isActive !== false,
          isHidden: user.isHidden || false,
          isDisabled: user.isDisabled || false,
          createdAt: user.createdAt,
          displayName: user.displayName // 互換性のため残す
        }));

      console.log(`✅ [ACTIVE-USERS] ${result.users.length}人中 ${activeUsers.length}人が有効`);
      return { success: true, users: activeUsers };
    } catch (error) {
      console.error('❌ [ACTIVE-USERS] エラー:', error.message);
      return { success: false, users: [], error: error.message };
    }
  },

  // ユーザー情報更新
  updateUserInfo: async (uid, updates) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ ユーザー情報更新成功:', uid);
      return { success: true };
    } catch (error) {
      console.error('❌ ユーザー情報更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // ユーザー削除
  deleteUser: async (uid) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      console.log('✅ ユーザー削除成功:', uid);
      return { success: true };
    } catch (error) {
      console.error('❌ ユーザー削除エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // タスクテンプレート作成
  createTemplate: async (templateData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      const templateToCreate = {
        ...templateData,
        userId: user.uid,
        createdBy: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('🆕 [CREATE-TEMPLATE] テンプレート作成開始:', {
        name: templateData.name?.substring(0, 30) + '...',
        userId: user.uid,
        userEmail: user.email,
        device: navigator.platform,
        timestamp: new Date().toISOString()
      });

      const docRef = await addDoc(collection(db, 'templates'), templateToCreate);

      console.log('✅ [CREATE-TEMPLATE] Firestore保存成功:', {
        firestoreId: docRef.id,
        name: templateData.name?.substring(0, 30) + '...',
        userId: user.uid,
        timestamp: new Date().toISOString()
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ [CREATE-TEMPLATE] Firestore保存エラー:', error.message, error.code);
      return { success: false, error: error.message };
    }
  },

  // テンプレート更新
  updateTemplate: async (templateId, updates) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      await updateDoc(doc(db, 'templates', templateId), {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      });

      console.log('✅ テンプレート更新成功:', templateId);
      return { success: true };
    } catch (error) {
      console.error('❌ テンプレート更新エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // テンプレート削除
  deleteTemplate: async (templateId) => {
    try {
      await deleteDoc(doc(db, 'templates', templateId));
      console.log('✅ テンプレート削除成功:', templateId);
      return { success: true };
    } catch (error) {
      console.error('❌ テンプレート削除エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 全テンプレート取得（リアルタイム同期対応）
  getTemplates: async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      console.log('🔍 [GET-TEMPLATES] テンプレート取得開始:', {
        userId: user.uid,
        email: user.email,
        device: navigator.platform,
        timestamp: new Date().toISOString()
      });

      // 🎯 チーム共有テンプレート管理 - 全テンプレートを取得
      console.log('🌐 [TEAM-MODE] 全ユーザー共有テンプレートを取得中...');
      const q = query(
        collection(db, 'templates')
        // where('userId', '==', user.uid) // 削除：個人フィルタリングを無効化
        // orderBy('createdAt', 'desc') // 一時的にコメントアウト
      );

      return new Promise((resolve, reject) => {
        let isFirstLoad = true;
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const templates = [];
          console.log('📡 [TEMPLATE-REALTIME] onSnapshot発火:', {
            docCount: querySnapshot.size,
            isEmpty: querySnapshot.empty,
            hasPendingWrites: querySnapshot.metadata.hasPendingWrites,
            fromCache: querySnapshot.metadata.fromCache,
            isFirstLoad
          });

          querySnapshot.forEach((doc) => {
            const templateData = { id: doc.id, ...doc.data() };
            templates.push(templateData);
            console.log('📝 [TEMPLATE-DATA]', doc.id.substring(0, 8) + '...:', {
              name: templateData.name?.substring(0, 20) + '...',
              createdAt: templateData.createdAt,
              userId: templateData.userId
            });
          });
          
          console.log('✅ テンプレート取得成功:', templates.length, '件', isFirstLoad ? '(初回)' : '(リアルタイム更新)');
          
          if (isFirstLoad) {
            // 初回読み込み
            isFirstLoad = false;
            resolve({ success: true, templates: templates, unsubscribe: unsubscribe });
          } else {
            // リアルタイム更新: グローバルテンプレート配列を更新
            if (window.taskTemplates !== undefined) {
              window.taskTemplates = templates;
              localStorage.setItem('taskTemplates', JSON.stringify(templates));
              // テンプレート一覧の再読み込み
              if (window.loadTemplateList) {
                window.loadTemplateList();
              }
              if (window.loadTemplateManagementList) {
                window.loadTemplateManagementList();
              }
              console.log('🔄 [REALTIME] テンプレートがリアルタイム更新されました - グローバル配列更新・UI再読み込み実行');
            }
          }
        }, (error) => {
          console.error('❌ テンプレート取得エラー:', error.message, error.code);
          if (isFirstLoad) {
            reject({ success: false, error: error.message });
          }
        });
      });
    } catch (error) {
      console.error('❌ テンプレート取得エラー:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// 既存データ移行関数
window.FirebaseMigration = {
  // LocalStorageからFirebaseへのデータ移行
  migrateFromLocalStorage: async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      console.log('🔄 LocalStorageからFirebaseへのデータ移行を開始...');

      // タスクデータ移行
      const localTasks = JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
      let migratedCount = 0;

      for (const task of localTasks) {
        const result = await window.FirebaseDB.createTask(task);
        if (result.success) {
          migratedCount++;
        }
      }

      console.log(`✅ データ移行完了: ${migratedCount}/${localTasks.length} タスク`);
      return { success: true, migratedCount: migratedCount, totalCount: localTasks.length };
    } catch (error) {
      console.error('❌ データ移行エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 既存ユーザーをFirebase Authに移行
  migrateUsers: async () => {
    try {
      console.log('🔄 既存ユーザーのFirebase移行を開始...');
      
      const localUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
      const migrationResults = [];

      for (const user of localUsers) {
        // パスワードが分かっているユーザーのみ移行
        if (user.email && user.password) {
          const result = await window.FirebaseAuth.createUser(
            user.email, 
            user.password, 
            user.name
          );
          migrationResults.push({
            email: user.email,
            name: user.name,
            success: result.success,
            error: result.error
          });
        }
      }

      console.log('✅ ユーザー移行完了:', migrationResults);
      return { success: true, results: migrationResults };
    } catch (error) {
      console.error('❌ ユーザー移行エラー:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Firebase認証状態確認ヘルパー
window.FirebaseDebug = {
  // 認証状態の詳細確認
  checkAuthState: () => {
    const currentUser = auth.currentUser || window.FirebaseAuth?.getCurrentUser();
    const authState = {
      isAuthenticated: !!currentUser,
      user: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified
      } : null,
      firebaseModules: {
        hasFirebaseAuth: !!window.FirebaseAuth,
        hasFirebaseDB: !!window.FirebaseDB,
        hasAuthObject: !!window.firebaseAuth
      },
      localStorage: {
        hasSessionData: !!localStorage.getItem('currentSession'),
        hasSystemUsers: !!localStorage.getItem('systemUsers'),
        hasTasks: !!localStorage.getItem('salesTasksKanban'),
        hasTemplates: !!localStorage.getItem('taskTemplates')
      },
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('🔍 [DEBUG] 認証状態フル診断:', JSON.stringify(authState, null, 2));
    return authState;
  },

  // リアルタイム同期テスト（手動）
  testRealtimeSync: async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('❌ 認証が必要です');
      console.log('❌ [SYNC-TEST] 認証が必要です');
      return;
    }

    console.log('🧪 [SYNC-TEST] リアルタイム同期テスト開始...');
    
    // テストタスクを作成
    const testTask = {
      title: `🧪同期テスト ${new Date().toLocaleTimeString()}`,
      description: 'リアルタイム同期確認用のテストタスク',
      columnId: 'todo',
      priority: 'low',
      assignee: user.email,
      isTestTask: true
    };

    try {
      const result = await window.FirebaseDB.createTask(testTask);
      if (result.success) {
        console.log('✅ [SYNC-TEST] テストタスク作成成功:', result.id);
        console.log('📱 [SYNC-TEST] 他のデバイスでリアルタイム更新されるかご確認ください');
        alert(`✅ 同期テストタスクを作成しました！\n他のデバイスで「🧪同期テスト」タスクが表示されるか確認してください。`);
      }
    } catch (error) {
      console.error('❌ [SYNC-TEST] テストタスク作成失敗:', error);
      alert(`❌ 同期テスト失敗: ${error.message}`);
    }
  },

  // 認証状態をアラートで表示（コンソール不要）
  showAuthState: () => {
    const currentUser = auth.currentUser || window.FirebaseAuth?.getCurrentUser();
    const message = currentUser 
      ? `✅ ログイン中\nユーザー: ${currentUser.email}\nUID: ${currentUser.uid.substring(0, 8)}...`
      : '❌ 未ログイン';
    
    alert(message);
    return window.FirebaseDebug.checkAuthState();
  },

  // タスク同期状況を診断
  diagnoseTasks: async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('❌ 認証が必要です。ログインしてから実行してください。');
        return;
      }

      console.log('🔍 [TASK-DIAGNOSIS] タスク同期診断開始...');
      
      // Firebaseからタスクを直接取得
      let firebaseTasks = [];
      let firebaseResult = null;
      try {
        firebaseResult = await window.FirebaseDB.getTasks();
        firebaseTasks = firebaseResult.tasks || [];
        console.log('📡 [TASK-DIAGNOSIS] Firebase結果:', firebaseResult);
        console.log('📡 [TASK-DIAGNOSIS] Firebaseタスク:', firebaseTasks.length + '件');
        
        // Firebaseタスクの詳細情報
        firebaseTasks.slice(0, 5).forEach((task, index) => {
          console.log(`🔥 [FB-TASK-${index}]`, {
            id: task.id,
            title: task.title?.substring(0, 30),
            createdBy: task.createdBy,
            assignee: task.assignee,
            projectId: task.projectId
          });
        });
      } catch (error) {
        console.error('❌ [TASK-DIAGNOSIS] Firebase取得エラー:', error);
      }

      // LocalStorageからタスクを取得
      const localTasks = JSON.parse(localStorage.getItem('salesTasksKanban') || '[]');
      console.log('💾 [TASK-DIAGNOSIS] LocalStorageタスク:', localTasks.length + '件');
      
      // LocalStorageタスクの詳細情報
      localTasks.slice(0, 5).forEach((task, index) => {
        console.log(`💾 [LS-TASK-${index}]`, {
          id: task.id,
          title: task.title?.substring(0, 30),
          createdBy: task.createdBy || 'unknown',
          assignee: task.assignee,
          projectId: task.projectId
        });
      });

      // 現在表示されているタスクを取得
      const displayedTasks = window.tasks || [];
      console.log('👁️ [TASK-DIAGNOSIS] 表示中タスク:', displayedTasks.length + '件');

      // ID重複チェック
      const firebaseIds = new Set(firebaseTasks.map(t => t.id));
      const localIds = new Set(localTasks.map(t => t.id));
      const displayedIds = new Set(displayedTasks.map(t => t.id));
      
      const idOverlap = {
        firebaseOnly: firebaseTasks.filter(t => !localIds.has(t.id)).length,
        localOnly: localTasks.filter(t => !firebaseIds.has(t.id)).length,
        both: firebaseTasks.filter(t => localIds.has(t.id)).length
      };

      // 診断結果をまとめる
      const diagnosis = {
        firebase: firebaseTasks.length,
        localStorage: localTasks.length,
        displayed: displayedTasks.length,
        firebaseAuthUser: user.email,
        idOverlap: idOverlap,
        lastSync: new Date().toISOString()
      };

      console.log('📊 [TASK-DIAGNOSIS] 診断結果:', diagnosis);

      // ユーザーフレンドリーな結果表示
      const message = `📊 詳細タスク同期診断結果

Firebase: ${firebaseTasks.length}件
ローカル: ${localTasks.length}件 
表示中: ${displayedTasks.length}件

ID重複状況:
・Firebase限定: ${idOverlap.firebaseOnly}件
・ローカル限定: ${idOverlap.localOnly}件  
・両方にある: ${idOverlap.both}件

ログインユーザー: ${user.email}

${firebaseTasks.length === 0 ? '⚠️ Firebaseにタスクがありません' : '✅ Firebase接続OK'}
${displayedTasks.length === 0 ? '⚠️ タスクが表示されていません' : '✅ タスク表示OK'}
${idOverlap.firebaseOnly > 0 ? '⚠️ Firebase限定タスクあり - 同期問題の可能性' : ''}

詳細はコンソールログをご確認ください。`;

      alert(message);
      return diagnosis;

    } catch (error) {
      console.error('❌ [TASK-DIAGNOSIS] 診断エラー:', error);
      alert('❌ 診断中にエラーが発生しました: ' + error.message);
    }
  },

  // 新規タスク作成後の同期テスト
  testTaskCreationSync: async (taskTitle = null) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('❌ 認証が必要です。ログインしてから実行してください。');
        return;
      }

      const title = taskTitle || `🧪新規作成同期テスト ${new Date().toLocaleTimeString()}`;
      console.log('🧪 [SYNC-TEST] タスク作成同期テスト開始:', title);
      
      // 作成前のタスク数を記録
      const beforeTasks = window.tasks || [];
      console.log('🧪 [SYNC-TEST] 作成前タスク数:', beforeTasks.length);

      // テストタスクを作成
      const testTask = {
        title: title,
        description: 'マルチユーザー同期テスト用のタスクです',
        columnId: 'todo',
        priority: 'medium',
        assignee: user.email,
        createdAt: new Date().toISOString(),
        isTestTask: true
      };

      const result = await window.FirebaseDB.createTask(testTask);
      if (result.success) {
        console.log('✅ [SYNC-TEST] Firebaseタスク作成成功:', result.id);
        
        // 3秒待ってリアルタイム同期を確認
        setTimeout(() => {
          const afterTasks = window.tasks || [];
          console.log('🧪 [SYNC-TEST] 3秒後タスク数:', afterTasks.length);
          
          const newTask = afterTasks.find(t => t.title === title);
          const syncResult = {
            before: beforeTasks.length,
            after: afterTasks.length,
            taskFound: !!newTask,
            taskId: newTask ? newTask.id : null
          };
          
          console.log('🧪 [SYNC-TEST] 同期結果:', syncResult);
          
          const message = `🧪 タスク作成同期テスト結果

作成前: ${syncResult.before}件
作成後: ${syncResult.after}件
新規タスク検出: ${syncResult.taskFound ? '✅ あり' : '❌ なし'}

${syncResult.taskFound ? 
  '✅ リアルタイム同期正常動作！\n他のユーザーでも表示されているはずです。' : 
  '⚠️ リアルタイム同期に問題があります。\nFirebaseDebug.forceReloadTasks()を実行してください。'}`;
          
          alert(message);
        }, 3000);
        
        return { success: true, taskId: result.id, title: title };
      } else {
        console.error('❌ [SYNC-TEST] タスク作成失敗:', result.error);
        alert('❌ タスク作成に失敗しました: ' + result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ [SYNC-TEST] 同期テストエラー:', error);
      alert('❌ 同期テスト中にエラーが発生しました: ' + error.message);
      return { success: false, error: error.message };
    }
  },

  // 強制的にFirebaseから最新タスクを再読み込み
  forceReloadTasks: async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('❌ 認証が必要です。ログインしてから実行してください。');
        return;
      }

      console.log('🔄 [FORCE-RELOAD] Firebase強制再読み込み開始...');
      
      // 現在のタスク表示状況
      const currentTasks = window.tasks || [];
      console.log('🔄 [FORCE-RELOAD] 現在の表示タスク数:', currentTasks.length);

      // Firebaseから強制的に最新データを取得
      const result = await window.FirebaseDB.getTasks();
      if (result.success && result.tasks) {
        console.log('🔄 [FORCE-RELOAD] Firebase新データ取得:', result.tasks.length, '件');
        
        // グローバルタスク配列を直接更新
        window.tasks = result.tasks;
        
        // Firebase専用モード - LocalStorage更新は無効
        
        // 画面を再描画
        if (window.render) {
          window.render();
          console.log('🔄 [FORCE-RELOAD] 画面再描画完了');
        }
        
        alert(`✅ 強制再読み込み完了\n\nFirebaseから ${result.tasks.length} 件のタスクを取得し、表示を更新しました。`);
        
        return {
          success: true,
          oldCount: currentTasks.length,
          newCount: result.tasks.length
        };
      } else {
        console.error('❌ [FORCE-RELOAD] Firebase取得失敗:', result.error);
        alert('❌ Firebase取得に失敗しました: ' + result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ [FORCE-RELOAD] 強制再読み込みエラー:', error);
      alert('❌ 強制再読み込み中にエラーが発生しました: ' + error.message);
      return { success: false, error: error.message };
    }
  },

  // 🆘 重複タスク削除機能
  removeDuplicateTasks: async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('❌ 認証が必要です。ログインしてから実行してください。');
        return;
      }

      console.log('🔍 [DUPLICATE-REMOVAL] 重複タスク検出開始...');
      
      const result = await window.FirebaseDB.getTasks();
      if (!result.success) {
        alert('❌ タスク取得に失敗しました: ' + result.error);
        return;
      }

      const tasks = result.tasks;
      console.log('📋 [DUPLICATE-REMOVAL] 全タスク数:', tasks.length);

      // タスクIDごとにグループ化して重複を検出
      const taskGroups = {};
      tasks.forEach(task => {
        const id = task.id;
        if (!taskGroups[id]) {
          taskGroups[id] = [];
        }
        taskGroups[id].push(task);
      });

      // 重複タスクを検出
      const duplicates = [];
      Object.keys(taskGroups).forEach(id => {
        if (taskGroups[id].length > 1) {
          duplicates.push({
            id: id,
            count: taskGroups[id].length,
            tasks: taskGroups[id]
          });
        }
      });

      console.log('🔍 [DUPLICATE-REMOVAL] 重複検出結果:', duplicates.length, '種類の重複タスク');

      if (duplicates.length === 0) {
        alert('✅ 重複タスクは見つかりませんでした。');
        return;
      }

      // 重複詳細をログ出力
      duplicates.forEach(dup => {
        console.log(`🔁 [DUPLICATE] ID: ${dup.id} - ${dup.count}個の重複`);
        dup.tasks.forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.title} (Firebase Doc ID: ${task.firebaseId || 'N/A'})`);
        });
      });

      const totalDuplicates = duplicates.reduce((sum, dup) => sum + (dup.count - 1), 0);
      const proceed = confirm(`⚠️ ${duplicates.length}種類の重複タスクを発見しました。\n合計 ${totalDuplicates} 個の重複を削除しますか？\n\n削除対象: 各グループの2番目以降のタスク`);

      if (!proceed) {
        console.log('🚫 [DUPLICATE-REMOVAL] ユーザーがキャンセルしました');
        return;
      }

      // 重複削除実行
      let deletedCount = 0;
      for (const dup of duplicates) {
        // 最初のタスクを残し、2番目以降を削除
        for (let i = 1; i < dup.tasks.length; i++) {
          const taskToDelete = dup.tasks[i];
          const deleteResult = await window.FirebaseDB.deleteTask(taskToDelete.firebaseId || taskToDelete.id);
          if (deleteResult.success) {
            deletedCount++;
            console.log(`🗑️ [DUPLICATE-REMOVAL] 削除成功: ${taskToDelete.title}`);
          } else {
            console.error(`❌ [DUPLICATE-REMOVAL] 削除失敗: ${taskToDelete.title}`, deleteResult.error);
          }
        }
      }

      alert(`✅ 重複削除完了！\n${deletedCount}個の重複タスクを削除しました。\n\nページを更新して確認してください。`);
      
      // 画面を更新
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('❌ [DUPLICATE-REMOVAL] エラー:', error);
      alert('❌ 重複削除中にエラーが発生しました: ' + error.message);
    }
  }
};

// グローバルに公開（確実にアクセス可能にする）
window.removeFirebaseDuplicates = window.FirebaseDebug.removeDuplicateTasks;

console.log('🔥 Firebase統合システム準備完了');
console.log('🧪 デバッグツール利用方法:');
console.log('  - 認証状態確認: FirebaseDebug.showAuthState()');
console.log('  - タスク同期診断: FirebaseDebug.diagnoseTasks() ← 詳細診断！');
console.log('  - 新規作成同期テスト: FirebaseDebug.testTaskCreationSync() ← NEW！');
console.log('  - 強制再読み込み: FirebaseDebug.forceReloadTasks()');
console.log('  - 🆘 重複タスク削除: FirebaseDebug.removeDuplicateTasks() または removeFirebaseDuplicates() ← NEW！');
console.log('  - 旧同期テスト: FirebaseDebug.testRealtimeSync()');
console.log('  - 詳細ログ: FirebaseDebug.checkAuthState() (コンソールのみ)');
console.log('');
console.log('🚨 マルチユーザー問題の調査:');
console.log('   1. FirebaseDebug.testTaskCreationSync() でリアルタイム同期テスト');
console.log('   2. 他ユーザーでFirebaseDebug.forceReloadTasks() で確認');
console.log('   3. FirebaseDebug.diagnoseTasks() で詳細診断');
console.log('   4. 🆘 removeFirebaseDuplicates() で重複削除');
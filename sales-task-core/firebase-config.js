/**
 * Firebase設定と初期化
 * マルチユーザー対応のため、LocalStorageからFirebaseに移行
 */

// Firebase SDKのインポート（CDN版）
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
  }
};

// Firestore データベース関数群
window.FirebaseDB = {
  // タスク作成
  createTask: async (taskData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid,
        createdBy: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('✅ タスク作成成功:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ タスク作成エラー:', error.message);
      return { success: false, error: error.message };
    }
  },

  // タスク更新
  updateTask: async (taskId, updates) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      await updateDoc(doc(db, 'tasks', taskId), {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
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

  // 全タスク取得
  getTasks: async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('認証が必要です');

      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const tasks = [];
          querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
          });
          console.log('✅ タスク取得成功:', tasks.length, '件');
          resolve({ success: true, tasks: tasks, unsubscribe: unsubscribe });
        }, (error) => {
          console.error('❌ タスク取得エラー:', error.message);
          reject({ success: false, error: error.message });
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

console.log('🔥 Firebase統合システム準備完了');
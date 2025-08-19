// 🔥 Firebase完全統合設定 - LocalStorage依存削除版
// 最終更新: 2025-08-19 13:30 - タスク消失問題根本解決

// Firebase設定の完全初期化（正しいプロジェクト: sales-task-manager-af356）
const firebaseConfig = {
    apiKey: "AIzaSyAHScwiAkvJ3qwl_VcdDDyzM_Zb37osBMs",
    authDomain: "sales-task-manager-af356.firebaseapp.com",
    projectId: "sales-task-manager-af356",
    storageBucket: "sales-task-manager-af356.firebasestorage.app",
    messagingSenderId: "953432845897",
    appId: "1:953432845897:web:bf441cb3590ce1fc455998"
};

// Firebase初期化（バージョン統一: 10.7.1）
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🚫 LocalStorage完全削除モード
console.log('🔥 Firebase完全統合モード - LocalStorage依存削除');

// Firebase認証状態監視
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('🔐 Firebase認証成功:', user.email);
        window.currentFirebaseUser = user;
    } else {
        console.log('⚠️ Firebase未認証');
        window.currentFirebaseUser = null;
    }
});

// セッション管理 - Firebase専用
window.getCurrentUser = function() {
    if (window.currentFirebaseUser) {
        return {
            id: window.currentFirebaseUser.uid,
            name: window.currentFirebaseUser.email.split('@')[0],
            email: window.currentFirebaseUser.email,
            role: window.currentFirebaseUser.email === 'muranaka-tenma@terracom.co.jp' ? 'developer' : 'user',
            isLoggedIn: true
        };
    }
    return {
        id: null,
        name: 'ゲスト',
        email: null,
        role: 'guest',
        isLoggedIn: false
    };
};

// タスク管理 - Firebase専用
window.FirebaseDB = {
    async saveTasks(tasks) {
        try {
            console.log('💾 [FIREBASE] タスク保存開始:', tasks.length);
            const user = window.getCurrentUser();
            if (!user) throw new Error('認証が必要です');

            // 既存タスクをクリア後、新しいタスクを保存
            const tasksRef = collection(db, 'tasks');
            const snapshot = await getDocs(tasksRef);
            
            // 削除処理
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, 'tasks', docSnap.id));
            }
            
            // 新規保存
            for (const task of tasks) {
                await addDoc(tasksRef, {
                    ...task,
                    userId: user.id,
                    updatedAt: new Date().toISOString()
                });
            }
            
            console.log('✅ [FIREBASE] タスク保存完了:', tasks.length);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク保存エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async getTasks() {
        try {
            console.log('📥 [FIREBASE] タスク取得開始');
            const user = window.getCurrentUser();
            if (!user) {
                console.warn('⚠️ [FIREBASE] 認証なし - 空配列を返します');
                return { success: true, tasks: [] };
            }

            const tasksRef = collection(db, 'tasks');
            const q = query(tasksRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('✅ [FIREBASE] タスク取得完了:', tasks.length);
            return { success: true, tasks: tasks };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク取得エラー:', error);
            return { success: false, error: error.message, tasks: [] };
        }
    },

    async createTask(task) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            const docRef = await addDoc(collection(db, 'tasks'), {
                ...task,
                userId: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ [FIREBASE] タスク作成完了:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク作成エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async updateTask(taskId, taskData) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            await updateDoc(doc(db, 'tasks', taskId), {
                ...taskData,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ [FIREBASE] タスク更新完了:', taskId);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク更新エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteTask(taskId) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            await deleteDoc(doc(db, 'tasks', taskId));
            
            console.log('✅ [FIREBASE] タスク削除完了:', taskId);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク削除エラー:', error);
            return { success: false, error: error.message };
        }
    }
};

// Firebase認証ログイン
window.FirebaseAuth = {
    currentUser: null,
    
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            window.currentFirebaseUser = userCredential.user;
            console.log('🔐 Firebase認証成功:', email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Firebase認証エラー:', error);
            return { success: false, error: error.message };
        }
    },

    getCurrentUser() {
        return window.getCurrentUser();
    },

    get currentUser() {
        return window.currentFirebaseUser;
    }
};

console.log('🔥 Firebase完全統合システム初期化完了');
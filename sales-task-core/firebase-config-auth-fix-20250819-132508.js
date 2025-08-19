// 🔥 Firebase完全統合設定 - LocalStorage依存削除版
// 最終更新: 2025-08-19 13:30 - タスク消失問題根本解決

// Firebase設定の完全初期化
const firebaseConfig = {
    apiKey: "AIzaSyBxSsYF4JFRYBNWrJgtG3LR9EUrvR4ZdOo",
    authDomain: "sales-task-manager-20250731.firebaseapp.com",
    projectId: "sales-task-manager-20250731",
    storageBucket: "sales-task-manager-20250731.appspot.com",
    messagingSenderId: "502695005041",
    appId: "1:502695005041:web:14d6a9c9b3a1d0b5e2b8f1"
};

// Firebase初期化
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';

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
            role: window.currentFirebaseUser.email === 'muranaka-tenma@terracom.co.jp' ? 'developer' : 'user'
        };
    }
    return null;
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
            if (!user) throw new Error('認証が必要です');

            return new Promise((resolve) => {
                const tasksRef = collection(db, 'tasks');
                const q = query(tasksRef, orderBy('createdAt', 'desc'));
                
                onSnapshot(q, (snapshot) => {
                    const tasks = [];
                    snapshot.forEach((doc) => {
                        tasks.push({ id: doc.id, ...doc.data() });
                    });
                    console.log('✅ [FIREBASE] タスク取得完了:', tasks.length);
                    resolve({ success: true, tasks: tasks });
                });
            });
        } catch (error) {
            console.error('❌ [FIREBASE] タスク取得エラー:', error);
            return { success: false, error: error.message, tasks: [] };
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

    get currentUser() {
        return window.currentFirebaseUser;
    }
};

console.log('🔥 Firebase完全統合システム初期化完了');
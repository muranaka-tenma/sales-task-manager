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
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Firestore設定 - リアルタイムリスナー無効化でWebchannel接続エラーを回避
const db = getFirestore(app);

// FCM初期化
const messaging = getMessaging(app);
console.log('📨 [FCM] Firebase Cloud Messaging初期化完了');

// 接続エラー回避: リアルタイム機能を使用しない設定
// ※onSnapshotを使用せず、getDocs()による手動更新のみ使用
console.log('🔧 [FIREBASE CONFIG] Firestore設定: リアルタイムリスナー無効化');

// 🚫 LocalStorage完全削除モード
console.log('🔥 Firebase完全統合モード - LocalStorage依存削除');

// Firebase認証状態監視
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('🔐 Firebase認証成功:', user.email);
        window.currentFirebaseUser = user;
        
        // 接続状態確認
        console.log('🔍 [FIREBASE DEBUG] 認証後の接続状態:', {
            uid: user.uid,
            email: user.email,
            projectId: db.app.options.projectId,
            timestamp: new Date().toISOString()
        });
        
        // ハンバーガーメニューを更新（診断ボタンも含む）
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
                console.log('🍔 [FIREBASE] Firebase認証後にメニューを更新');
            }
        }, 100);
    } else {
        console.log('⚠️ Firebase未認証');
        window.currentFirebaseUser = null;
        
        // ログアウト時もハンバーガーメニューを更新（診断ボタンも含む）
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
                console.log('🍔 [FIREBASE] Firebase未認証時にメニューを更新');
            }
        }, 100);
    }
});

// セッション管理 - Firebase専用
window.getCurrentUser = function() {
    if (window.currentFirebaseUser) {
        // 正しい権限マッピング
        const roleMap = {
            'muranaka-tenma@terracom.co.jp': 'developer',
            'kato-jun@terracom.co.jp': 'admin',
            'asahi-keiichi@terracom.co.jp': 'admin',
            'hanzawa-yuka@terracom.co.jp': 'user',
            'tamura-wataru@terracom.co.jp': 'user',
            'hashimoto-yumi@terracom.co.jp': 'user',
            'fukushima-ami@terracom.co.jp': 'user'
        };
        
        const userRole = roleMap[window.currentFirebaseUser.email] || 'user';
        
        return {
            id: window.currentFirebaseUser.uid,
            name: window.currentFirebaseUser.email.split('@')[0],
            email: window.currentFirebaseUser.email,
            role: userRole,
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

// 無効化チェック専用関数（別途定義）
window.checkUserDisabled = async function() {
    if (!window.currentFirebaseUser) return false;
    
    try {
        const usersResult = await window.FirebaseDB.getUsers();
        if (usersResult.success) {
            const currentUserData = usersResult.users.find(u => u.email === window.currentFirebaseUser.email);
            if (currentUserData && currentUserData.isDisabled) {
                console.log('🚫 [AUTH] 無効化されたユーザーのアクセスを拒否:', window.currentFirebaseUser.email);
                
                // 強制ログアウト
                if (auth.currentUser) {
                    await auth.signOut();
                }
                window.currentFirebaseUser = null;
                
                alert('このアカウントは無効化されています。\n管理者にお問い合わせください。');
                window.location.href = 'login.html';
                return true;
            }
        }
    } catch (error) {
        console.error('⚠️ [AUTH] 無効化チェックエラー:', error);
    }
    return false;
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
            
            // taskIdが数値の場合は文字列に変換
            let documentId;
            if (typeof taskId === 'object' && taskId.id) {
                documentId = String(taskId.id);
            } else if (typeof taskId === 'number') {
                documentId = String(taskId);
            } else if (typeof taskId === 'string') {
                documentId = taskId;
            } else {
                console.error('❌ [FIREBASE] 無効なタスクID:', taskId, typeof taskId);
                return { success: false, error: '無効なタスクIDです' };
            }
            
            console.log('🗑️ [FIREBASE] タスク削除実行:', documentId);
            await deleteDoc(doc(db, 'tasks', documentId));
            
            console.log('✅ [FIREBASE] タスク削除完了:', documentId);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // プロジェクト管理機能（pj-create.html対応）
    async getProjects() {
        try {
            console.log('📥 [FIREBASE] プロジェクト取得開始');
            const user = window.getCurrentUser();
            if (!user) {
                console.warn('⚠️ [FIREBASE] 認証なし - 空配列を返します');
                return { success: true, projects: [] };
            }

            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const projects = [];
            snapshot.forEach((doc) => {
                projects.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('✅ [FIREBASE] プロジェクト取得完了:', projects.length);
            return { success: true, projects: projects };
        } catch (error) {
            console.error('❌ [FIREBASE] プロジェクト取得エラー:', error);
            return { success: false, error: error.message, projects: [] };
        }
    },

    async saveProject(project) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            // プロジェクトIDが指定されている場合はそれを使用、未指定の場合は自動生成
            const projectData = {
                ...project,
                userId: user.id,
                createdBy: user.name,
                createdAt: project.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // プロジェクトIDが既に存在する場合は、そのIDを使用してドキュメントを作成
            let docRef;
            if (project.id) {
                docRef = doc(db, 'projects', project.id);
                await setDoc(docRef, projectData);
                console.log('✅ [FIREBASE] プロジェクト保存完了（指定ID）:', project.id);
                return { success: true, id: project.id };
            } else {
                docRef = await addDoc(collection(db, 'projects'), projectData);
                console.log('✅ [FIREBASE] プロジェクト保存完了（自動ID）:', docRef.id);
                return { success: true, id: docRef.id };
            }
        } catch (error) {
            console.error('❌ [FIREBASE] プロジェクト保存エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // ユーザー管理機能
    async getUsers() {
        try {
            console.log('👥 [FIREBASE] ユーザー一覧取得開始');
            const user = window.getCurrentUser();
            if (!user) {
                console.warn('⚠️ [FIREBASE] 認証なし - 空配列を返します');
                return { success: true, users: [] };
            }

            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const users = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('✅ [FIREBASE] ユーザー取得完了:', users.length);
            return { success: true, users: users };
        } catch (error) {
            console.error('❌ [FIREBASE] ユーザー取得エラー:', error);
            return { success: false, error: error.message, users: [] };
        }
    },

    async deleteUser(userId) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            console.log('🗑️ [FIREBASE] ユーザー削除実行:', userId);
            await deleteDoc(doc(db, 'users', userId));
            
            console.log('✅ [FIREBASE] ユーザー削除完了:', userId);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] ユーザー削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async saveUser(userObj) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            const userDocId = userObj.uid || userObj.id || Date.now().toString();
            console.log('💾 [FIREBASE] ユーザー情報保存中:', userDocId);
            
            await setDoc(doc(db, 'users', userDocId), {
                ...userObj,
                updatedAt: new Date().toISOString()
            });
            
            console.log('✅ [FIREBASE] ユーザー情報保存完了:', userDocId);
            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] ユーザー保存エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // Firebase Authユーザーの完全削除（管理者専用）
    async deleteAuthUser(email) {
        try {
            const currentUser = window.getCurrentUser();
            if (!currentUser || (currentUser.role !== 'developer' && currentUser.role !== 'admin')) {
                return { success: false, error: '管理者権限が必要です' };
            }
            
            console.log('🗑️ [FIREBASE-AUTH] Firebase Authユーザー削除を試行:', email);
            
            // 注意: フロントエンドからはFirebase Authのユーザー削除は制限されている
            // 実際の削除は管理者がFirebase Consoleで行う必要がある
            console.log('⚠️ [FIREBASE-AUTH] Firebase Authからの削除はFirebase Consoleで実行してください');
            
            return { 
                success: true, 
                message: 'Firestoreからは削除済み。Firebase Authからの削除はFirebase Consoleで実行してください。',
                requiresManualDeletion: true
            };
        } catch (error) {
            console.error('❌ [FIREBASE-AUTH] 削除処理エラー:', error);
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

    async createUser(email, password, displayName) {
        try {
            console.log('🔥 [AUTH] Firebase Authユーザー作成中:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('✅ [AUTH] Firebase Authユーザー作成成功:', userCredential.user.uid);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ [AUTH] Firebase Authユーザー作成エラー:', error);
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

// FCM通知機能
window.FCMNotification = {
    // FCMトークンを取得
    async getToken() {
        try {
            // サービスワーカーが登録されているか確認
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) {
                    console.log('📨 [FCM] サービスワーカー登録中...');
                    await navigator.serviceWorker.register('./firebase-messaging-sw.js');
                }
            }
            
            // 通知権限を要求
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('⚠️ [FCM] 通知権限が拒否されました');
                return null;
            }
            
            // FCMトークンを取得
            const currentToken = await getToken(messaging);
            
            if (currentToken) {
                console.log('✅ [FCM] トークン取得成功:', currentToken);
                
                // トークンをFirestoreに保存
                const user = window.getCurrentUser();
                if (user && user.id) {
                    await this.saveToken(user.id, currentToken);
                }
                
                return currentToken;
            } else {
                console.log('⚠️ [FCM] トークンを取得できませんでした');
                return null;
            }
        } catch (error) {
            console.error('❌ [FCM] トークン取得エラー:', error);
            return null;
        }
    },
    
    // トークンをFirestoreに保存
    async saveToken(userId, token) {
        try {
            await setDoc(doc(db, 'fcmTokens', userId), {
                token: token,
                userId: userId,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ [FCM] トークン保存完了');
        } catch (error) {
            console.error('❌ [FCM] トークン保存エラー:', error);
        }
    },
    
    // 通知を送信（Firestoreに保存）
    async sendNotification(notification) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }
            
            // 通知データをFirestoreに保存
            const notificationData = {
                ...notification,
                senderId: user.id,
                senderName: user.name,
                createdAt: new Date().toISOString(),
                read: false
            };
            
            await addDoc(collection(db, 'notifications'), notificationData);
            console.log('✅ [FCM] 通知送信完了');
            
            return { success: true };
        } catch (error) {
            console.error('❌ [FCM] 通知送信エラー:', error);
            return { success: false, error: error.message };
        }
    },
    
    // フォアグラウンドでメッセージを受信
    initMessageListener() {
        onMessage(messaging, (payload) => {
            console.log('📨 [FCM] メッセージ受信:', payload);
            
            // 通知の表示
            if (payload.notification) {
                const notificationTitle = payload.notification.title || 'タスク管理システム';
                const notificationOptions = {
                    body: payload.notification.body || '新しい通知があります',
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    data: payload.data
                };
                
                // 既存の通知システムにもフォールバック
                if (window.showNotification) {
                    window.showNotification(notificationTitle, notificationOptions.body, 'info');
                }
                
                // ブラウザ通知も表示
                if (Notification.permission === 'granted') {
                    new Notification(notificationTitle, notificationOptions);
                }
            }
        });
        
        console.log('✅ [FCM] メッセージリスナー設定完了');
    },
    
    // 通知履歴を取得
    async getNotifications(userId) {
        try {
            const notificationsRef = collection(db, 'notifications');
            const q = query(notificationsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const notifications = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // 自分宛の通知のみ取得
                if (data.targetUserId === userId || data.targetUsers?.includes(userId)) {
                    notifications.push({ id: doc.id, ...data });
                }
            });
            
            console.log('✅ [FCM] 通知履歴取得完了:', notifications.length);
            return { success: true, notifications: notifications };
        } catch (error) {
            console.error('❌ [FCM] 通知履歴取得エラー:', error);
            return { success: false, error: error.message, notifications: [] };
        }
    }
};

console.log('🔥 Firebase完全統合システム初期化完了');
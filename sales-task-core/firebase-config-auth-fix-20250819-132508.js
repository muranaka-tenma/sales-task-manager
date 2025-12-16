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
import { getFirestore, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// FCM削除: import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// グローバルにauthオブジェクトを公開（認証状態監視用）
window.firebaseAuth = auth;

// FCM削除: const messaging = getMessaging(app);
// FCM削除: console.log('📨 [FCM] Firebase Cloud Messaging初期化完了');

// 接続エラー回避: リアルタイム機能を使用しない設定
// ※onSnapshotを使用せず、getDocs()による手動更新のみ使用

// Firebase認証状態監視
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.currentFirebaseUser = user;

        // systemUsersをFirebaseから初期化
        try {
            if (window.FirebaseDB && window.FirebaseDB.getUsers) {
                const firebaseUsers = await window.FirebaseDB.getUsers();
                if (firebaseUsers.success && firebaseUsers.users.length > 0) {
                    localStorage.setItem('systemUsers', JSON.stringify(firebaseUsers.users));
                }
            }
        } catch (error) {
            console.error('❌ systemUsers初期化エラー:', error);
        }

        // セッション情報をローカルストレージに保存
        let displayName;
        try {
            const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
            const targetEmail = user.email.trim().toLowerCase();
            const matchedUser = systemUsers.find(u => u.email && u.email.trim().toLowerCase() === targetEmail);

            if (matchedUser && matchedUser.name) {
                displayName = matchedUser.name;
            } else {
                displayName = user.email === 'muranaka-tenma@terracom.co.jp' ? '邨中天真' :
                             user.displayName || user.email.split('@')[0];
            }
        } catch (error) {
            displayName = user.email === 'muranaka-tenma@terracom.co.jp' ? '邨中天真' :
                         user.displayName || user.email.split('@')[0];
        }

        const roleMap = {
            'muranaka-tenma@terracom.co.jp': 'developer',
            'kato-jun@terracom.co.jp': 'admin',
            'asahi-keiichi@terracom.co.jp': 'admin',
            'hanzawa-yuka@terracom.co.jp': 'user',
            'tamura-wataru@terracom.co.jp': 'user',
            'hashimoto-yumi@terracom.co.jp': 'user',
            'fukushima-ami@terracom.co.jp': 'user'
        };

        const sessionData = {
            user: {
                id: user.uid,
                name: displayName,
                email: user.email,
                role: roleMap[user.email] || 'user'
            },
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('currentSession', JSON.stringify(sessionData));

        // ハンバーガーメニューを更新
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
            }
            // ヘッダーのユーザー名を更新
            const headerUserName = document.getElementById('header-user-name');
            if (headerUserName) {
                headerUserName.textContent = displayName;
            }
        }, 100);
    } else {
        window.currentFirebaseUser = null;

        // ログアウト時もメニューを更新
        setTimeout(() => {
            if (window.updateHamburgerMenu) {
                window.updateHamburgerMenu();
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

        // systemUsersから日本語名を取得（非表示タスクの担当者自動選択で必要）
        let displayName;
        try {
            const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
            const targetEmail = window.currentFirebaseUser.email.trim().toLowerCase();

            // 大文字小文字無視・空白トリムで比較
            const matchedUser = systemUsers.find(u =>
                u.email && u.email.trim().toLowerCase() === targetEmail
            );

            if (matchedUser && matchedUser.name) {
                displayName = matchedUser.name;
            } else {
                // フォールバック: FirebaseのdisplayNameまたはemail prefixを使用
                displayName = window.currentFirebaseUser.displayName || window.currentFirebaseUser.email.split('@')[0];
            }
        } catch (error) {
            // エラー時はFirebaseのdisplayNameまたはemail prefixを使用
            displayName = window.currentFirebaseUser.displayName || window.currentFirebaseUser.email.split('@')[0];
        }

        return {
            id: window.currentFirebaseUser.uid,
            name: displayName,
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
            const user = window.getCurrentUser();
            if (!user) throw new Error('認証が必要です');

            // 安全チェック: 空配列や極端に少ないタスクは保存しない
            if (!tasks || !Array.isArray(tasks)) {
                console.error('❌ [SAVE-TASKS] 無効なタスク配列');
                return { success: false, error: '無効なタスク配列' };
            }

            // 警告: タスク数が急激に減少した場合
            const tasksRef = collection(db, 'tasks');
            const currentSnapshot = await getDocs(tasksRef);
            const currentCount = currentSnapshot.docs.length;

            if (currentCount > 10 && tasks.length < currentCount * 0.5) {
                console.error(`❌ [SAVE-TASKS] データ消失防止: 現在${currentCount}件 → ${tasks.length}件への大幅削減を拒否`);
                return { success: false, error: `データ消失防止: ${currentCount}件から${tasks.length}件への保存は拒否されました` };
            }

            // 差分更新: 既存タスクをMapで管理
            const existingTaskMap = new Map();
            currentSnapshot.forEach(doc => {
                existingTaskMap.set(doc.id, doc.data());
            });

            // 新しいタスクのIDセット
            const newTaskIds = new Set();

            // タスクを更新または追加
            for (const task of tasks) {
                const taskId = task.firebaseId || task.id;

                if (taskId && existingTaskMap.has(taskId)) {
                    // 既存タスクを更新
                    await updateDoc(doc(db, 'tasks', taskId), {
                        ...task,
                        userId: user.id,
                        updatedAt: new Date().toISOString()
                    });
                    newTaskIds.add(taskId);
                } else if (taskId && typeof taskId === 'string' && taskId.length > 10) {
                    // FirebaseIDっぽいが存在しない場合は新規作成
                    const docRef = await addDoc(tasksRef, {
                        ...task,
                        userId: user.id,
                        updatedAt: new Date().toISOString()
                    });
                    newTaskIds.add(docRef.id);
                } else {
                    // 新規タスクを追加
                    const docRef = await addDoc(tasksRef, {
                        ...task,
                        userId: user.id,
                        updatedAt: new Date().toISOString()
                    });
                    newTaskIds.add(docRef.id);
                }
            }

            // 削除されたタスクを削除（差分のみ）
            for (const [docId] of existingTaskMap) {
                if (!newTaskIds.has(docId)) {
                    // タスクが明示的に削除された場合のみ削除
                    const taskInNew = tasks.find(t => (t.firebaseId || t.id) === docId);
                    if (!taskInNew) {
                        await deleteDoc(doc(db, 'tasks', docId));
                        console.log(`🗑️ [SAVE-TASKS] タスク削除: ${docId}`);
                    }
                }
            }

            console.log(`✅ [SAVE-TASKS] 差分更新完了: ${tasks.length}件`);
            return { success: true };
        } catch (error) {
            console.error('❌ [SAVE-TASKS] エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async getTasks() {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: true, tasks: [] };
            }

            const tasksRef = collection(db, 'tasks');
            const q = query(tasksRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const tasks = [];
            snapshot.forEach((doc) => {
                tasks.push({ ...doc.data(), id: doc.id });
            });

            return { success: true, tasks: tasks };
        } catch (error) {
            return { success: false, error: error.message, tasks: [] };
        }
    },

    async createTask(task) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            const { id, ...taskWithoutId } = task;

            const docRef = await addDoc(collection(db, 'tasks'), {
                ...taskWithoutId,
                userId: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ タスク作成エラー:', error);
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

            return { success: true };
        } catch (error) {
            console.error('❌ タスク更新エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteTask(taskId) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            let documentId;
            if (typeof taskId === 'object' && taskId.id) {
                documentId = String(taskId.id);
            } else if (typeof taskId === 'number') {
                documentId = String(taskId);
            } else if (typeof taskId === 'string') {
                documentId = taskId;
            } else {
                return { success: false, error: '無効なタスクIDです' };
            }

            await deleteDoc(doc(db, 'tasks', documentId));

            return { success: true };
        } catch (error) {
            console.error('❌ [FIREBASE] タスク削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // プロジェクト管理機能
    async getProjects(forceRefresh = false) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: true, projects: [] };
            }

            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const projects = [];
            snapshot.forEach((doc) => {
                projects.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, projects: projects };
        } catch (error) {
            console.error('❌ プロジェクト取得エラー:', error);
            return { success: false, error: error.message, projects: [] };
        }
    },

    // 既存プロジェクトのcreatedBy修正
    async fixProjectCreatedBy() {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            const projectsRef = collection(db, 'projects');
            const snapshot = await getDocs(projectsRef);

            let fixedCount = 0;
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                if (data.createdBy && !data.createdBy.includes('@')) {
                    const updates = {
                        createdBy: user.email,
                        visibility: data.visibility || 'public',
                        members: data.members || [user.email],
                        updatedAt: new Date().toISOString()
                    };
                    await updateDoc(doc(db, 'projects', docSnap.id), updates);
                    fixedCount++;
                }
            }

            return { success: true, fixedCount };
        } catch (error) {
            console.error('❌ プロジェクト修正エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // 既存プロジェクトにstatusフィールドを追加
    async fixProjectStatus() {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            const projectsRef = collection(db, 'projects');
            const snapshot = await getDocs(projectsRef);

            let fixedCount = 0;
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                if (!data.status) {
                    const updates = {
                        status: 'active',
                        updatedAt: new Date().toISOString()
                    };
                    await updateDoc(doc(db, 'projects', docSnap.id), updates);
                    fixedCount++;
                }
            }

            return { success: true, fixedCount };
        } catch (error) {
            console.error('❌ プロジェクトstatus移行エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async saveProject(project) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            if (project.id) {
                const existingDoc = await getDoc(doc(db, 'projects', project.id));

                if (existingDoc.exists()) {
                    const projectData = {
                        ...project,
                        updatedAt: new Date().toISOString()
                    };
                    await updateDoc(doc(db, 'projects', project.id), projectData);
                    return { success: true, id: project.id, isUpdate: true };
                } else {
                    const projectData = {
                        ...project,
                        userId: user.id,
                        createdBy: user.email,
                        visibility: project.visibility || 'public',
                        members: project.members || [user.email],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    await setDoc(doc(db, 'projects', project.id), projectData);
                    return { success: true, id: project.id, isUpdate: false };
                }
            } else {
                const projectData = {
                    ...project,
                    userId: user.id,
                    createdBy: user.email,
                    visibility: project.visibility || 'public',
                    members: project.members || [user.email],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, 'projects'), projectData);
                return { success: true, id: docRef.id, isUpdate: false };
            }
        } catch (error) {
            console.error('❌ プロジェクト保存エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteProject(projectId) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            await deleteDoc(doc(db, 'projects', projectId));
            return { success: true };
        } catch (error) {
            console.error('❌ プロジェクト削除エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // ユーザー管理機能
    async getUsers() {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: true, users: [] };
            }

            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            const users = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, users: users };
        } catch (error) {
            console.error('❌ ユーザー取得エラー:', error);
            return { success: false, error: error.message, users: [] };
        }
    },

    // 有効なユーザーのみ取得
    async getActiveUsers() {
        try {
            const result = await window.FirebaseDB.getUsers();
            if (!result.success) {
                return { success: false, users: [], error: result.error };
            }

            const activeUsers = result.users
                .filter(user => !user.isHidden && !user.isDisabled)
                .map(user => ({
                    uid: user.id || user.uid,
                    name: user.displayName || user.name || user.email?.split('@')[0] || 'Unknown',
                    email: user.email,
                    role: user.role || 'user',
                    isActive: user.isActive !== false,
                    isHidden: user.isHidden || false,
                    isDisabled: user.isDisabled || false,
                    createdAt: user.createdAt,
                    displayName: user.displayName || user.name
                }));

            return { success: true, users: activeUsers };
        } catch (error) {
            return { success: false, users: [], error: error.message };
        }
    },

    async deleteUser(userId) {
        try {
            const user = window.getCurrentUser();
            if (!user) {
                return { success: false, error: '認証が必要です' };
            }

            await deleteDoc(doc(db, 'users', userId));
            return { success: true };
        } catch (error) {
            console.error('❌ ユーザー削除エラー:', error);
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

            await setDoc(doc(db, 'users', userDocId), {
                ...userObj,
                updatedAt: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('❌ ユーザー保存エラー:', error);
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

            return {
                success: true,
                message: 'Firestoreからは削除済み。Firebase Authからの削除はFirebase Consoleで実行してください。',
                requiresManualDeletion: true
            };
        } catch (error) {
            console.error('❌ Auth削除処理エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // カラム設定取得（2025-12-16復旧: kanbanColumns Firestore移行）
    async getColumns(userId) {
        try {
            const targetUserId = userId || window.currentFirebaseUser?.uid;
            if (!targetUserId) {
                return { success: false, error: '認証が必要です', columns: null };
            }

            const columnsDocRef = doc(db, 'users', targetUserId, 'settings', 'columns');
            const columnsDoc = await getDoc(columnsDocRef);

            if (columnsDoc.exists()) {
                const data = columnsDoc.data();
                return { success: true, columns: data.columns || null, updatedAt: data.updatedAt };
            }

            return { success: true, columns: null };
        } catch (error) {
            console.error('❌ [COLUMNS] 取得エラー:', error);
            return { success: false, error: error.message, columns: null };
        }
    },

    // カラム設定保存（2025-12-16復旧: kanbanColumns Firestore移行）
    async saveColumns(columns, userId) {
        try {
            const user = window.getCurrentUser();
            const targetUserId = userId || user?.id;
            if (!targetUserId) {
                return { success: false, error: '認証が必要です' };
            }

            const columnsDocRef = doc(db, 'users', targetUserId, 'settings', 'columns');
            await setDoc(columnsDocRef, {
                columns: columns,
                updatedAt: new Date().toISOString(),
                updatedBy: user?.email || 'unknown'
            });

            console.log('[COLUMNS] Firestore保存完了:', columns.length + '件');
            return { success: true };
        } catch (error) {
            console.error('❌ [COLUMNS] 保存エラー:', error);
            return { success: false, error: error.message };
        }
    },

    // LocalStorage→Firestoreマイグレーション（2025-12-16復旧）
    async migrateColumnsToFirestore() {
        try {
            const user = window.getCurrentUser();
            if (!user?.id) {
                return { success: false, error: '認証が必要です' };
            }

            // LocalStorageからカラム設定を取得
            const localColumns = localStorage.getItem('kanbanColumns');
            if (!localColumns) {
                console.log('[COLUMNS] LocalStorageにカラム設定なし、マイグレーション不要');
                return { success: true, migrated: false };
            }

            // Firestoreに既存設定があるか確認
            const existingResult = await this.getColumns(user.id);
            if (existingResult.success && existingResult.columns) {
                console.log('[COLUMNS] Firestoreに既存設定あり、マイグレーションスキップ');
                return { success: true, migrated: false, reason: 'already_exists' };
            }

            // LocalStorageの設定をFirestoreに保存
            const columns = JSON.parse(localColumns);

            // 「ゴミ箱」→「アーカイブ」への自動リネーム
            const migratedColumns = columns.map(col => {
                if (col.id === 'trash' && col.title === 'ゴミ箱') {
                    return { ...col, title: 'アーカイブ' };
                }
                return col;
            });

            const saveResult = await this.saveColumns(migratedColumns, user.id);
            if (saveResult.success) {
                console.log('[COLUMNS] LocalStorage→Firestoreマイグレーション完了');
                return { success: true, migrated: true };
            }

            return { success: false, error: saveResult.error };
        } catch (error) {
            console.error('❌ [COLUMNS] マイグレーションエラー:', error);
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
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Firebase認証エラー:', error);
            return { success: false, error: error.message };
        }
    },

    async createUser(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('❌ Authユーザー作成エラー:', error);
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
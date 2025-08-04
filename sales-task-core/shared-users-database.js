/**
 * 共有ユーザーデータベース - 全デバイス対応
 * 
 * 問題解決：LocalStorageの制限によるマルチデバイス問題を解決
 * - 中央集権化されたユーザーデータ
 * - 全デバイスで同じユーザー情報を参照
 * - 新規デバイスでも即座にログイン可能
 */

// 全デバイス共通のユーザーデータベース（本来はサーバーサイドで管理すべき）
const SHARED_USERS_DATABASE = [
    {
        id: 1,
        name: '邨中天真',
        email: 'muranaka-tenma@terracom.co.jp', 
        password: 'admin123',
        role: 'developer',
        department: '開発部',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 2,
        name: 'テストユーザー',
        email: 'test@terracom.co.jp',
        password: 'test123', 
        role: 'user',
        department: '営業部',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 3,
        name: 'システム管理者',
        email: 'admin@terracom.co.jp',
        password: 'admin123',
        role: 'admin', 
        department: 'システム部',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 4,
        name: '加藤純',
        email: 'kato-jun@terracom.co.jp',
        password: 'kato123',
        role: 'admin',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 5,
        name: '朝日圭一',
        email: 'asahi-keiichi@terracom.co.jp',
        password: 'asahi123',
        role: 'admin',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 6,
        name: '半澤侑果',
        email: 'hanzawa-yuka@terracom.co.jp',
        password: 'hanzawa123',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 7,
        name: '田村渉',
        email: 'tamura-wataru@terracom.co.jp',
        password: 'tamura123',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 8,
        name: '橋本友美',
        email: 'hashimoto-yumi@terracom.co.jp',
        password: 'hashimoto123',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    },
    {
        id: 9,
        name: '福島亜未',
        email: 'fukushima-ami@terracom.co.jp',
        password: 'fukushima123',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z',
        isActive: true
    }
];

/**
 * ユーザーデータベースの初期化（強制同期）
 * 全デバイスで同じデータを使用するよう強制的に同期
 */
function initializeSharedUserDatabase() {
    console.log('🔄 [SHARED-DB] 共有ユーザーデータベース初期化開始...');
    
    try {
        // 既存のローカルデータを取得
        const existingUsers = localStorage.getItem('systemUsers');
        
        if (existingUsers) {
            // 既存データがある場合はバックアップ
            const backupKey = `systemUsers_backup_${Date.now()}`;
            localStorage.setItem(backupKey, existingUsers);
            console.log(`📦 [SHARED-DB] 既存データをバックアップ: ${backupKey}`);
            
            // 既存ユーザーとマージ（上書きではなく統合）
            try {
                const currentUsers = JSON.parse(existingUsers);
                const mergedUsers = [...currentUsers];
                
                // 共有データベースのユーザーで不足しているものを追加
                SHARED_USERS_DATABASE.forEach(sharedUser => {
                    const exists = currentUsers.find(u => u.email === sharedUser.email);
                    if (!exists) {
                        mergedUsers.push(sharedUser);
                        console.log(`➕ [SHARED-DB] 不足ユーザーを追加: ${sharedUser.name}`);
                    }
                });
                
                // マージしたデータを保存
                localStorage.setItem('systemUsers', JSON.stringify(mergedUsers));
                
                // 担当者リストも更新
                const assignees = mergedUsers.map(user => user.name);
                localStorage.setItem('taskAssignees', JSON.stringify(assignees));
                
                console.log('✅ [SHARED-DB] 既存データとマージ完了');
                console.log(`👥 [SHARED-DB] 利用可能ユーザー: ${mergedUsers.length}名`);
                
            } catch (e) {
                console.error('❌ [SHARED-DB] マージエラー、デフォルトを使用:', e);
                // マージに失敗した場合のみデフォルトを使用
                localStorage.setItem('systemUsers', JSON.stringify(SHARED_USERS_DATABASE));
            }
        } else {
            // 初回起動時のみデフォルトユーザーを設定
            localStorage.setItem('systemUsers', JSON.stringify(SHARED_USERS_DATABASE));
            
            // 担当者リストも設定
            const assignees = SHARED_USERS_DATABASE
                .filter(user => user.isActive)
                .map(user => user.name);
            localStorage.setItem('taskAssignees', JSON.stringify(assignees));
            
            console.log('✅ [SHARED-DB] 初回起動: デフォルトユーザーを設定');
        }
        
        return true;
    } catch (error) {
        console.error('❌ [SHARED-DB] 初期化エラー:', error);
        return false;
    }
}

/**
 * ユーザー認証（共有データベース使用）
 */
function authenticateFromSharedDB(email, password) {
    console.log('🔐 [SHARED-DB] 認証試行:', email);
    
    const user = SHARED_USERS_DATABASE.find(u => 
        u.email === email && 
        u.password === password && 
        u.isActive
    );
    
    if (user) {
        console.log('✅ [SHARED-DB] 認証成功:', user.name, `[${user.role}]`);
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        };
    } else {
        console.log('❌ [SHARED-DB] 認証失敗:', email);
        
        // 利用可能なアカウント一覧を表示（デバッグ用）
        console.log('📋 [SHARED-DB] 利用可能アカウント:');
        SHARED_USERS_DATABASE
            .filter(u => u.isActive)
            .forEach(u => console.log(`  - ${u.email} (パスワード: ${u.password})`));
            
        return {
            success: false,
            message: `ユーザー "${email}" の認証に失敗しました。利用可能なアカウントを確認してください。`
        };
    }
}

/**
 * 新規ユーザー追加（共有データベースに追加）
 * ※ 実際の運用では管理者権限チェックとサーバーサイド処理が必要
 */
function addUserToSharedDB(userData) {
    const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        department: userData.department,
        createdAt: new Date().toISOString(),
        isActive: true
    };
    
    // 重複チェック
    const exists = SHARED_USERS_DATABASE.find(u => u.email === userData.email);
    if (exists) {
        return {
            success: false,
            message: 'このメールアドレスは既に登録されています'
        };
    }
    
    // 共有データベースに追加
    SHARED_USERS_DATABASE.push(newUser);
    
    // LocalStorageも更新
    localStorage.setItem('systemUsers', JSON.stringify(SHARED_USERS_DATABASE));
    
    // 担当者リストも更新
    const assignees = SHARED_USERS_DATABASE
        .filter(user => user.isActive)
        .map(user => user.name);
    localStorage.setItem('taskAssignees', JSON.stringify(assignees));
    
    console.log('✅ [SHARED-DB] 新規ユーザー追加:', newUser.name, newUser.email);
    
    return {
        success: true,
        user: newUser
    };
}

/**
 * ユーザー一覧取得
 */
function getUsersFromSharedDB() {
    return SHARED_USERS_DATABASE.filter(user => user.isActive);
}

// グローバルに公開
window.initializeSharedUserDatabase = initializeSharedUserDatabase;
window.authenticateFromSharedDB = authenticateFromSharedDB;
window.addUserToSharedDB = addUserToSharedDB;
window.getUsersFromSharedDB = getUsersFromSharedDB;

// ページ読み込み時に自動初期化 - 無効化（ユーザーデータ保護のため）
// if (typeof window !== 'undefined') {
//     window.addEventListener('DOMContentLoaded', () => {
//         initializeSharedUserDatabase();
//     });
// }
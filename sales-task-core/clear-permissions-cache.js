/**
 * 権限キャッシュクリア・強制修正スクリプト
 * ブラウザのコンソールで実行してください
 */

function clearAndFixPermissions() {
    console.log('🔧 [PERMISSION-RESET] 権限キャッシュクリア・強制修正開始...');
    
    // 正しい権限マッピング
    const correctRoles = {
        'muranaka-tenma@terracom.co.jp': 'developer',
        'kato-jun@terracom.co.jp': 'admin',
        'asahi-keiichi@terracom.co.jp': 'admin',
        'hanzawa-yuka@terracom.co.jp': 'user',
        'tamura-wataru@terracom.co.jp': 'user',
        'hashimoto-yumi@terracom.co.jp': 'user',
        'fukushima-ami@terracom.co.jp': 'user'
    };
    
    // 1. systemUsers を修正
    const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    console.log('📋 [BEFORE] 修正前の権限状況:', systemUsers.map(u => `${u.name}: ${u.role}`));
    
    systemUsers.forEach(user => {
        const correctRole = correctRoles[user.email];
        if (correctRole) {
            console.log(`🔧 [FIX] ${user.name}: ${user.role} → ${correctRole}`);
            user.role = correctRole;
        }
    });
    
    localStorage.setItem('systemUsers', JSON.stringify(systemUsers));
    
    // 2. currentSession を修正
    const currentSession = JSON.parse(localStorage.getItem('currentSession') || 'null');
    if (currentSession && currentSession.user && correctRoles[currentSession.user.email]) {
        const correctRole = correctRoles[currentSession.user.email];
        console.log(`🔧 [SESSION-FIX] ${currentSession.user.name}: ${currentSession.user.role} → ${correctRole}`);
        currentSession.user.role = correctRole;
        localStorage.setItem('currentSession', JSON.stringify(currentSession));
    }
    
    // 3. 修正後の状況確認
    console.log('📋 [AFTER] 修正後の権限状況:', systemUsers.map(u => {
        const emoji = u.role === 'developer' ? '👨‍💻' : u.role === 'admin' ? '👤' : '🧑‍💼';
        return `${emoji} ${u.name}: ${u.role}`;
    }));
    
    console.log('✅ [PERMISSION-RESET] 権限修正完了！ページをリロードしてください。');
    
    // 自動リロード（3秒後）
    setTimeout(() => {
        console.log('🔄 ページをリロードします...');
        window.location.reload();
    }, 3000);
}

// 自動実行
clearAndFixPermissions();
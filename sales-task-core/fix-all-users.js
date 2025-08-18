// 🔧 完全ユーザー権限修復スクリプト
// ブラウザコンソールで実行してください

console.log('🔧 systemUsers完全修復開始...');

// 正しいユーザー構成
const correctUsers = [
    {
        id: 1,
        name: '邨中天真',
        email: 'muranaka-tenma@terracom.co.jp',
        password: 'Tenma7041',
        role: 'developer',
        department: '開発部',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 2,
        name: '加藤純',
        email: 'kato-jun@terracom.co.jp',
        password: 'aikakumei',
        role: 'admin',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 3,
        name: '朝日圭一',
        email: 'asahi-keiichi@terracom.co.jp',
        password: 'aikakumei',
        role: 'admin',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 4,
        name: '半澤侑果',
        email: 'hanzawa-yuka@terracom.co.jp',
        password: 'aikakumei',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 5,
        name: '田村渉',
        email: 'tamura-wataru@terracom.co.jp',
        password: 'aikakumei',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 6,
        name: '橋本友美',
        email: 'hashimoto-yumi@terracom.co.jp',
        password: 'aikakumei',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    },
    {
        id: 7,
        name: '福島亜未',
        email: 'fukushima-ami@terracom.co.jp',
        password: 'aikakumei',
        role: 'user',
        department: '-',
        createdAt: '2025-08-04T00:00:00.000Z'
    }
];

// 現在のデータをバックアップ
const currentUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
const backupKey = `systemUsers_backup_${Date.now()}`;
localStorage.setItem(backupKey, JSON.stringify(currentUsers));
console.log(`📦 現在のデータをバックアップ: ${backupKey}`);

// 正しいデータを設定
localStorage.setItem('systemUsers', JSON.stringify(correctUsers));

// 担当者リストも更新
const assignees = correctUsers.map(u => u.name);
localStorage.setItem('taskAssignees', JSON.stringify(assignees));

console.log('✅ systemUsers完全修復完了');
console.log('👥 登録ユーザー:');
correctUsers.forEach(user => {
    const roleEmoji = user.role === 'developer' ? '👨‍💻' : 
                     user.role === 'admin' ? '👤' : '🧑‍💼';
    console.log(`  ${roleEmoji} ${user.name} (${user.email}) - ${user.role}`);
});

console.log('🔄 ページをリロードします...');
setTimeout(() => location.reload(), 2000);
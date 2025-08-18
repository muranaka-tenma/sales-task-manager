// 1行ずつ実行してください - 権限修復コマンド

// Step 1: 現在の状況確認
const session = JSON.parse(localStorage.getItem('currentSession') || 'null'); console.log('現在のセッション:', session?.user?.name, session?.user?.role);

// Step 2: systemUsersが空の場合の緊急修復
const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]'); if(systemUsers.length === 0) { const correctUsers = [{"id":1,"name":"邨中天真","email":"muranaka-tenma@terracom.co.jp","password":"Tenma7041","role":"developer","department":"開発部","createdAt":"2025-08-04T00:00:00.000Z"},{"id":2,"name":"加藤純","email":"kato-jun@terracom.co.jp","password":"aikakumei","role":"admin","department":"-","createdAt":"2025-08-04T00:00:00.000Z"},{"id":3,"name":"朝日圭一","email":"asahi-keiichi@terracom.co.jp","password":"aikakumei","role":"admin","department":"-","createdAt":"2025-08-04T00:00:00.000Z"},{"id":4,"name":"半澤侑果","email":"hanzawa-yuka@terracom.co.jp","password":"aikakumei","role":"user","department":"-","createdAt":"2025-08-04T00:00:00.000Z"},{"id":5,"name":"田村渉","email":"tamura-wataru@terracom.co.jp","password":"aikakumei","role":"user","department":"-","createdAt":"2025-08-04T00:00:00.000Z"},{"id":6,"name":"橋本友美","email":"hashimoto-yumi@terracom.co.jp","password":"aikakumei","role":"user","department":"-","createdAt":"2025-08-04T00:00:00.000Z"},{"id":7,"name":"福島亜未","email":"fukushima-ami@terracom.co.jp","password":"aikakumei","role":"user","department":"-","createdAt":"2025-08-04T00:00:00.000Z"}]; localStorage.setItem('systemUsers', JSON.stringify(correctUsers)); console.log('✅ systemUsers緊急修復完了'); } else { console.log('systemUsers存在:', systemUsers.length, '名'); }

// Step 3: 権限修復
const users = JSON.parse(localStorage.getItem('systemUsers') || '[]'); const correctRoles = {'muranaka-tenma@terracom.co.jp': 'developer', 'kato-jun@terracom.co.jp': 'admin', 'asahi-keiichi@terracom.co.jp': 'admin', 'hanzawa-yuka@terracom.co.jp': 'user', 'tamura-wataru@terracom.co.jp': 'user', 'hashimoto-yumi@terracom.co.jp': 'user', 'fukushima-ami@terracom.co.jp': 'user'}; let fixed = false; users.forEach(user => { const correctRole = correctRoles[user.email]; if (correctRole && user.role \!== correctRole) { console.log('🔧 権限修正:', user.name, user.role, '→', correctRole); user.role = correctRole; fixed = true; }}); if(fixed) { localStorage.setItem('systemUsers', JSON.stringify(users)); console.log('✅ 権限修復完了'); }

// Step 4: セッション修復
const currentSession = JSON.parse(localStorage.getItem('currentSession') || 'null'); if(currentSession && currentSession.user && correctRoles[currentSession.user.email]) { const correctRole = correctRoles[currentSession.user.email]; if(currentSession.user.role \!== correctRole) { currentSession.user.role = correctRole; localStorage.setItem('currentSession', JSON.stringify(currentSession)); console.log('🔧 セッション権限修復:', currentSession.user.name, '→', correctRole); }}

// Step 5: 確認
const finalSession = JSON.parse(localStorage.getItem('currentSession') || 'null'); console.log('✅ 修復完了 - 現在のユーザー:', finalSession?.user?.name, finalSession?.user?.role);


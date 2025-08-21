// Firebase Cloud Messaging サービスワーカー
// バックグラウンド通知処理

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

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
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// バックグラウンドメッセージ処理
messaging.onBackgroundMessage(function(payload) {
    console.log('📨 [FCM-SW] バックグラウンド通知受信:', payload);

    const notificationTitle = payload.data?.title || payload.notification?.title || 'タスク管理通知';
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || '新しい通知があります',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: payload.data?.tag || 'task-notification',
        data: {
            taskId: payload.data?.taskId,
            type: payload.data?.type,
            url: payload.data?.url || '/',
            timestamp: Date.now()
        },
        actions: [
            {
                action: 'view',
                title: '確認',
                icon: '/icon-32x32.png'
            },
            {
                action: 'close',
                title: '閉じる',
                icon: '/icon-32x32.png'
            }
        ],
        requireInteraction: payload.data?.requireInteraction === 'true',
        silent: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック処理
self.addEventListener('notificationclick', function(event) {
    console.log('🔔 [FCM-SW] 通知クリック:', event.notification.data);
    
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // アプリを開く
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // 既にアプリが開いている場合はフォーカス
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes('index-kanban.html') && 'focus' in client) {
                    return client.focus();
                }
            }
            // アプリが開いていない場合は新しいウィンドウを開く
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

console.log('📨 [FCM-SW] Firebase Messaging サービスワーカー初期化完了');
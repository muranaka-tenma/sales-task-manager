const CACHE_NAME = 'sales-task-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/enhanced-task-manager.html',
  '/sales-workflow-builder.html',
  '/mobile-app.html',
  '/admin-dashboard.html',
  '/manifest.json'
];

// インストール時のキャッシュ処理
self.addEventListener('install', event => {
  console.log('Service Worker: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: ファイルをキャッシュ中...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: キャッシュ完了');
        return self.skipWaiting();
      })
  );
});

// アクティベーション時の古いキャッシュ削除
self.addEventListener('activate', event => {
  console.log('Service Worker: アクティベート中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: アクティベート完了');
      return self.clients.claim();
    })
  );
});

// フェッチイベント処理（オフライン対応）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュから返すか、ネットワークから取得
        if (response) {
          console.log('Service Worker: キャッシュから提供:', event.request.url);
          return response;
        }

        console.log('Service Worker: ネットワークから取得:', event.request.url);
        return fetch(event.request).then(response => {
          // 有効なレスポンスでない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // ネットワークエラー時のフォールバック
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// プッシュ通知対応（将来拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/manifest.json',
      badge: '/manifest.json',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'タスクを確認',
          icon: '/manifest.json'
        },
        {
          action: 'close',
          title: '閉じる',
          icon: '/manifest.json'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// バックグラウンド同期（将来拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: バックグラウンド同期実行');
    event.waitUntil(
      // 同期処理をここに実装
      Promise.resolve()
    );
  }
});

// メッセージ処理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: 登録完了');
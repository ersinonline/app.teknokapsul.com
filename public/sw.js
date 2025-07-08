const CACHE_NAME = 'teknokapsul-v1.0.0';
const STATIC_CACHE = 'teknokapsul-static-v1.0.0';
const DYNAMIC_CACHE = 'teknokapsul-dynamic-v1.0.0';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/',
  'firestore.googleapis.com',
  'firebase.googleapis.com'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip Google Analytics and ads requests
  if (url.hostname.includes('google.com') || url.hostname.includes('google.com.tr') || 
      url.hostname.includes('googletagmanager.com') || url.hostname.includes('google-analytics.com')) {
    return;
  }
  
  // Determine caching strategy based on request type
  let strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  
  if (isStaticAsset(url)) {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (isAPIRequest(url)) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  event.respondWith(handleRequest(request, strategy));
});

// Handle requests based on caching strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
    default:
      return staleWhileRevalidate(request, cache);
  }
}

// Cache-first strategy
async function cacheFirst(request, cache) {
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache-first strategy failed:', error);
    return getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return getOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('Network request failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// Check if request is for static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) || 
         url.pathname.includes('/static/') ||
         url.pathname.includes('/icons/');
}

// Check if request is for API
function isAPIRequest(url) {
  return API_ENDPOINTS.some(endpoint => 
    url.pathname.startsWith(endpoint) || url.hostname.includes(endpoint)
  );
}

// Get offline fallback response
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/') || new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>TeknoCapsule - Çevrimdışı</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .offline-container {
            max-width: 400px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 { margin: 0 0 10px 0; font-size: 24px; }
          p { margin: 0 0 20px 0; opacity: 0.9; }
          .retry-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .retry-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📱</div>
          <h1>Çevrimdışı Modu</h1>
          <p>İnternet bağlantınızı kontrol edin ve tekrar deneyin.</p>
          <button class="retry-btn" onclick="window.location.reload()">Tekrar Dene</button>
        </div>
      </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // Return generic offline response for other requests
  return new Response(
    JSON.stringify({ 
      error: 'Çevrimdışı', 
      message: 'Bu içerik çevrimdışı kullanılamıyor' 
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      status: 503
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-payments') {
    event.waitUntil(syncOfflinePayments());
  }
  
  if (event.tag === 'background-sync-subscriptions') {
    event.waitUntil(syncOfflineSubscriptions());
  }
});

// Sync offline payments when connection is restored
async function syncOfflinePayments() {
  try {
    // Get offline payments from IndexedDB
    const offlinePayments = await getOfflineData('payments');
    
    for (const payment of offlinePayments) {
      try {
        // Attempt to sync with server
        await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payment)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData('payments', payment.id);
      } catch (error) {
        console.error('Failed to sync payment:', payment.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline subscriptions
async function syncOfflineSubscriptions() {
  try {
    const offlineSubscriptions = await getOfflineData('subscriptions');
    
    for (const subscription of offlineSubscriptions) {
      try {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        });
        
        await removeOfflineData('subscriptions', subscription.id);
      } catch (error) {
        console.error('Failed to sync subscription:', subscription.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'Yeni bir bildiriminiz var',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Görüntüle',
        icon: '/icons/icon-192x192.svg'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/icons/icon-192x192.svg'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'TeknoKapsül';
  }
  
  event.waitUntil(
    self.registration.showNotification('TeknoKapsül', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    // Simplified - in real implementation, use IndexedDB
    resolve([]);
  });
}

function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    // Simplified - in real implementation, use IndexedDB
    resolve();
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
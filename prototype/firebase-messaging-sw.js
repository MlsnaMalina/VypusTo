/* ─── Firebase Messaging Service Worker ───────────────────────────────────
   Handles FCM background push messages when the app is not in focus.
   Served at /firebase-messaging-sw.js (via Vercel rewrite from /prototype/).
   ─────────────────────────────────────────────────────────────────────── */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyB6KsXhkbLEYW8c8ON3CdhPxnhrHLOQVs0',
  authDomain:        'vypusto.firebaseapp.com',
  projectId:         'vypusto',
  storageBucket:     'vypusto.firebasestorage.app',
  messagingSenderId: '417059191204',
  appId:             '1:417059191204:web:52cff6c9ef1371b3a16931',
});

const messaging = firebase.messaging();

/* Background push message → show OS notification */
messaging.onBackgroundMessage(payload => {
  const notif = payload.notification || {};
  const data  = payload.data        || {};
  self.registration.showNotification(notif.title || 'VypusTo', {
    body:  notif.body  || '',
    icon:  notif.icon  || '/icon-192.png',
    badge: '/favicon-32.png',
    tag:   data.tag    || 'vypusto-notif',
    requireInteraction: data.requireInteraction === 'true',
    data:  { url: data.url || '/' },
  });
});

/* Tap on notification → open / focus the app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
      const existing = ws.find(w => w.url.startsWith(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

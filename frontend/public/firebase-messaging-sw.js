/* eslint-disable no-undef */
/* Firebase Messaging background handler — runs in service worker scope */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getMessaging, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging.js';

const app = initializeApp({
  apiKey: "AIzaSyA-sXrVhJgEVvx3PfoiXVp8-8cRn8pZ3D0",
  authDomain: "jobpulse-5ed2d.firebaseapp.com",
  projectId: "jobpulse-5ed2d",
  storageBucket: "jobpulse-5ed2d.firebasestorage.app",
  messagingSenderId: "829494175503",
  appId: "1:829494175503:web:51997b8758d59f7869f5a2",
});

const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title || 'JobPulse';
  const options = {
    body: payload.notification?.body || 'New job alert',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

import { useEffect, useState, useCallback } from 'react';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../firebase';

export const useForegroundMessages = () => {
  const [messages, setMessages] = useState([]);

  const dismiss = useCallback((index) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'JobPulse';
      const body = payload.notification?.body || '';
      const url = payload.data?.url || '/';

      // Show a system notification even when the app is in the foreground
      // so the device plays the notification sound. The browser will chime
      // for any Notification created while permission is granted.
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const sysNotification = new Notification(title, {
          body,
          icon: '/icons/icon-192.png',
          tag: `job-${Date.now()}`,
          data: { url },
        });

        sysNotification.onclick = () => {
          window.focus();
          if (url && url !== '/') window.open(url, '_blank', 'noopener,noreferrer');
          sysNotification.close();
        };

        // Auto-close after 8 seconds
        setTimeout(() => sysNotification.close(), 8000);
      }

      // Also show the in-app toast
      const notification = {
        title,
        body,
        url,
        receivedAt: Date.now(),
      };

      setMessages((prev) => [...prev, notification]);

      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.receivedAt !== notification.receivedAt));
      }, 8000);
    });

    return unsubscribe;
  }, []);

  return { messages, dismiss };
};

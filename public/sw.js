self.addEventListener('push', event => {
 let payload = {};
 try { payload = event.data ? event.data.json() : {}; } catch {}
 event.waitUntil(self.registration.showNotification(payload.title || 'Louvor ICABV', { body: payload.body || '', icon: '/logo.png', badge: '/logo.png', tag: payload.tag, data: { href: payload.href || '/' } }));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 const target = new URL(event.notification.data?.href || '/', self.location.origin);
 if (target.origin !== self.location.origin) return;
 event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(all => { const tab = all.find(client => new URL(client.url).origin === target.origin); if (tab) { tab.navigate(target.href); return tab.focus(); } return clients.openWindow(target.href); }));
});

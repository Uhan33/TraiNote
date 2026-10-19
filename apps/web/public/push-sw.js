// 회원 운동일지 알림 — vite.config 의 workbox.importScripts 로 서비스 워커에 포함
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'TraiNote', {
      body: data.body,
      icon: '/icon-192.png',
      data: { url: data.url || '/member/workouts' },
    }),
  )
})

// 알림을 누르면 열려 있는 회원 화면을 앞으로, 없으면 새로 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data.url
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).pathname.startsWith('/member'))
      return open ? open.focus() : self.clients.openWindow(url)
    }),
  )
})

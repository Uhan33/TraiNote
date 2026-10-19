// 웹 푸시 알림 (회원 운동일지·운영자 새 문의) — vite.config 의 workbox.importScripts 로 서비스 워커에 포함
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

// 알림을 누르면 같은 앱(회원 /member · 트레이너 그 외)의 열린 창을 그 화면으로, 없으면 새로 열기
const isMember = (path) => path.startsWith('/member')
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data.url
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(async (windows) => {
      const open = windows.find((w) => isMember(new URL(w.url).pathname) === isMember(url))
      if (!open) return self.clients.openWindow(url)
      await open.focus()
      return open.navigate(url).catch(() => {})
    }),
  )
})

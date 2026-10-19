// 홈 화면에 추가한 앱(PWA)으로 실행 중인지 — iOS Safari 는 navigator.standalone
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

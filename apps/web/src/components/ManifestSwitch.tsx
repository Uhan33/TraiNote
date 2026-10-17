import { useEffect } from 'react'
import { useLocation } from 'react-router'

// 회원 화면(/member)에서는 회원 앱 manifest 로 연결 — 회원이 홈 화면에 추가하면 /member 로 열림
// 트레이너 manifest 는 빌드 때 vite-plugin-pwa 가 넣음 (개발 서버에는 없음 → 아무것도 안 함)
const TRAINER = '/manifest.webmanifest'
const MEMBER = '/member.webmanifest'

export default function ManifestSwitch() {
  const member = useLocation().pathname.startsWith('/member')
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (link) link.setAttribute('href', member ? MEMBER : TRAINER)
  }, [member])
  return null
}

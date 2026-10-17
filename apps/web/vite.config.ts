import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// 릴리즈 버전은 루트 package.json 하나가 기준
const { version } = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8')) as { version: string }

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  // 배포와 같은 구조(같은 출처 /api)로 개발 — 쿠키·경로 동작이 운영과 동일
  // LAN=1 이면 같은 와이파이의 폰에서 접속 가능 (pnpm dev:phone). API 는 이 서버가 프록시하므로 따로 열 필요 없음
  server: { host: process.env.LAN === '1', proxy: { '/api': 'http://localhost:4000' } },
  preview: { host: process.env.LAN === '1', proxy: { '/api': 'http://localhost:4000' } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // 아이콘 PNG 는 scripts/gen-icons.mjs 로 만든 임시 "T" — 디자인 나오면 public/ 의 파일만 교체
      manifest: {
        name: 'TraiNote',
        short_name: 'TraiNote',
        lang: 'ko',
        display: 'standalone',
        // 트레이너 앱. 앱을 열면 랜딩(/)이 아니라 바로 운동일지
        // 회원 앱은 public/member.webmanifest (회원 화면에서 ManifestSwitch 가 연결을 바꿔 줌)
        id: '/workouts',
        start_url: '/workouts',
        // 앱 범위를 사이트 전체로 — 다른 메뉴로 가도 브라우저 주소창이 뜨지 않게
        scope: '/',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})

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
  server: { proxy: { '/api': 'http://localhost:4000' } },
  preview: { proxy: { '/api': 'http://localhost:4000' } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // ponytail: 아이콘은 favicon.svg 하나. 홈 화면 설치용 192/512 PNG 는 디자인 나오면 추가
      manifest: {
        name: 'TraiNote',
        short_name: 'TraiNote',
        lang: 'ko',
        display: 'standalone',
        // 트레이너 앱. 앱을 열면 랜딩(/)이 아니라 바로 운동일지
        // 회원 앱은 추후 /member 전용 진입점(member.html) + 별도 manifest(id: '/member')
        id: '/workouts',
        start_url: '/workouts',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})

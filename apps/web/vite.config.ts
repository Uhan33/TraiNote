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
        start_url: '/',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})

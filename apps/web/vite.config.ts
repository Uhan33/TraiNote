import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createServer, defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// 릴리즈 버전은 루트 package.json 하나가 기준
const { version } = JSON.parse(readFileSync(path.resolve(import.meta.dirname, '../../package.json'), 'utf8')) as { version: string }

// 회원 화면 전용 HTML(member.html) — index.html 과 같고 manifest 만 회원 앱 것으로.
// iOS 는 홈 화면 추가 시 처음 읽은 manifest 를 쓰므로 /member 는 처음부터 회원 manifest 로 내려줘야 함 (Caddy 가 /member* → member.html)
// (vite-plugin-pwa 가 manifest 링크를 다 쓴 뒤 만들어야 해서 빌드 마지막 단계에서 파일로 복사)
const memberHtml = (): Plugin => {
  let outDir = 'dist'
  return {
    name: 'member-html',
    apply: 'build',
    enforce: 'post',
    configResolved: (config) => void (outDir = path.resolve(config.root, config.build.outDir)),
    closeBundle() {
      const index = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const member = index.replace('href="/manifest.webmanifest"', 'href="/member.webmanifest"')
      if (member === index) this.error('member.html: index.html 에서 manifest 링크를 찾지 못함')
      writeFileSync(path.join(outDir, 'member.html'), member)
    },
  }
}

// 랜딩(/) 을 미리 그린 HTML(landing.html) — 검색 로봇(특히 JS 실행이 약한 네이버)이 내용을 읽게 (Caddy 가 / → landing.html)
// index.html 에 넣지 않는 이유: 다른 화면(/workouts 등)도 index.html 을 받으므로 로딩 중 랜딩이 비침
const landingHtml = (): Plugin => {
  let outDir = 'dist'
  return {
    name: 'landing-html',
    apply: 'build',
    enforce: 'post',
    configResolved: (config) => void (outDir = path.resolve(config.root, config.build.outDir)),
    async closeBundle() {
      const server = await createServer({
        configFile: false,
        root: import.meta.dirname,
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false },
        define: { __APP_VERSION__: JSON.stringify(version) },
        resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
        plugins: [react()],
      })
      try {
        const { render } = (await server.ssrLoadModule('/src/features/landing/prerender.tsx')) as { render: () => string }
        const index = readFileSync(path.join(outDir, 'index.html'), 'utf8')
        const placeholder = '<div id="root"><div class="splash">TraiNote</div></div>'
        if (!index.includes(placeholder)) this.error('landing.html: index.html 에서 root 를 찾지 못함')
        writeFileSync(path.join(outDir, 'landing.html'), index.replace(placeholder, `<div id="root">${render()}</div>`))
      } finally {
        await server.close()
      }
    },
  }
}

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
    memberHtml(),
    landingHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      // 서비스 워커가 모든 화면 이동에 index.html(트레이너 manifest)을 주지 않도록 회원 화면은 서버(member.html)로
      // 회원 일지 알림(push) 처리는 public/push-sw.js
      workbox: { navigateFallbackDenylist: [/^\/member(\/|$)/], importScripts: ['/push-sw.js'] },
      // 아이콘 PNG 는 scripts/gen-icons.mjs 로 만든 임시 "T" — 디자인 나오면 public/ 의 파일만 교체
      manifest: {
        name: 'TraiNote',
        short_name: 'TraiNote',
        lang: 'ko',
        display: 'standalone',
        // 트레이너 앱. 앱을 열면 랜딩(/)이 아니라 바로 운동일지
        // 회원 앱은 public/member.webmanifest — /member 는 member.html 로 처음부터 연결 (위 memberHtml)
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

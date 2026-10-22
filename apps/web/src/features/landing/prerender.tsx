import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import LandingPage from './LandingPage'

// 빌드 때 랜딩을 HTML 로 (vite.config 의 landingHtml) — 감싸는 div 는 main.tsx 와 같게
export const render = () =>
  renderToString(
    <StaticRouter location="/">
      <div className="mx-auto min-h-dvh max-w-md md:max-w-none">
        <LandingPage />
      </div>
    </StaticRouter>,
  )

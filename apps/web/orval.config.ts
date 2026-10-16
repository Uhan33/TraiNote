import { defineConfig } from 'orval'

// api 를 띄운 상태에서 `pnpm --filter web gen:api` 실행
export default defineConfig({
  api: {
    input: 'http://localhost:4000/docs-json',
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',
      baseUrl: { runtime: 'import.meta.env.VITE_API_URL' },
    },
  },
})

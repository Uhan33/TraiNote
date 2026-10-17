import { defineConfig } from 'orval'

// api 를 띄운 상태에서 `pnpm --filter web gen:api` 실행 (다른 주소의 api 면 API_SPEC=http://.../docs-json)
export default defineConfig({
  api: {
    input: process.env.API_SPEC ?? 'http://localhost:4000/docs-json',
    output: {
      target: 'src/api/generated.ts',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: { path: 'src/api/fetcher.ts', name: 'customFetch' },
        // 성공 응답 본문만 반환 (에러는 customFetch 가 ApiError 로 throw)
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
})

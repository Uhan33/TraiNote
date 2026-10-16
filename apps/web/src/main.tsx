import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import AppLayout, { ComingSoon } from '@/components/AppLayout'
import WorkoutEditPage from '@/features/workouts/WorkoutEditPage'
import WorkoutsPage, { NoMemberSelected } from '@/features/workouts/WorkoutsPage'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto min-h-dvh max-w-md lg:max-w-none">
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/workouts" replace />} />
              <Route path="workouts" element={<WorkoutsPage />}>
                <Route index element={<NoMemberSelected />} />
                <Route path=":memberId" element={<WorkoutEditPage />} />
              </Route>
              <Route path="homework" element={<ComingSoon />} />
              <Route path="meals" element={<ComingSoon />} />
              <Route path="body" element={<ComingSoon />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './index.css'
import AppLayout, { ComingSoon } from '@/components/AppLayout'
import LoginPage from '@/features/auth/LoginPage'
import RequireAuth, { GuestOnly } from '@/features/auth/RequireAuth'
import SignupPage from '@/features/auth/SignupPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutEditPage from '@/features/workouts/WorkoutEditPage'
import WorkoutsPage, { NoMemberSelected } from '@/features/workouts/WorkoutsPage'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto min-h-dvh max-w-md lg:max-w-none">
          <Routes>
            {/* / 는 추후 랜딩페이지 */}
            <Route index element={<Navigate to="/workouts" replace />} />
            <Route element={<GuestOnly />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="workouts" element={<WorkoutsPage />}>
                  <Route index element={<NoMemberSelected />} />
                  <Route path=":memberId" element={<WorkoutEditPage />} />
                </Route>
                <Route path="homework" element={<ComingSoon />} />
                <Route path="meals" element={<ComingSoon />} />
                <Route path="body" element={<ComingSoon />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

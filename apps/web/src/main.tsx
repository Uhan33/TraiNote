import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import AppLayout, { ComingSoon } from '@/components/AppLayout'
import BodyDetailPage from '@/features/body/BodyDetailPage'
import BodyPage from '@/features/body/BodyPage'
import LoginPage from '@/features/auth/LoginPage'
import RequireAuth, { GuestOnly } from '@/features/auth/RequireAuth'
import SignupPage from '@/features/auth/SignupPage'
import LandingPage from '@/features/landing/LandingPage'
import MemberBodyPage from '@/features/member-view/MemberBodyPage'
import MemberEntryPage from '@/features/member-view/MemberEntryPage'
import MemberHomeworkPage from '@/features/member-view/MemberHomeworkPage'
import MemberLayout from '@/features/member-view/MemberLayout'
import MemberSettingsPage from '@/features/member-view/MemberSettingsPage'
import MemberWorkoutsPage from '@/features/member-view/MemberWorkoutsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutEditPage from '@/features/workouts/WorkoutEditPage'
import WorkoutsPage, { NoMemberSelected } from '@/features/workouts/WorkoutsPage'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="mx-auto min-h-dvh max-w-md md:max-w-none">
          <Routes>
            <Route index element={<LandingPage />} />
            {/* 회원용 화면 — 트레이너 로그인과 무관, 회원 코드 입력 → 회원 토큰 */}
            <Route path="member">
              <Route index element={<MemberEntryPage />} />
              <Route element={<MemberLayout />}>
                <Route path="workouts" element={<MemberWorkoutsPage />} />
                <Route path="homework" element={<MemberHomeworkPage />} />
                <Route path="meals" element={<ComingSoon />} />
                <Route path="body" element={<MemberBodyPage />} />
                <Route path="settings" element={<MemberSettingsPage />} />
              </Route>
            </Route>
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
                <Route path="body" element={<BodyPage />}>
                  <Route index element={<NoMemberSelected />} />
                  <Route path=":memberId" element={<BodyDetailPage />} />
                </Route>
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)

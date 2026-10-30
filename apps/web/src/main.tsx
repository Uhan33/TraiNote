import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, createRoutesFromElements, Outlet, Route } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import AppLayout, { ComingSoon } from '@/components/AppLayout'
import ManifestSwitch from '@/components/ManifestSwitch'
import MemberSplit from '@/components/MemberSplit'
import BodyDetailPage from '@/features/body/BodyDetailPage'
import LoginPage from '@/features/auth/LoginPage'
import RequireAuth, { GuestOnly } from '@/features/auth/RequireAuth'
import SignupPage from '@/features/auth/SignupPage'
import LandingPage from '@/features/landing/LandingPage'
import PrivacyPage from '@/features/landing/PrivacyPage'
import MemberBodyPage from '@/features/member-view/MemberBodyPage'
import MemberEntryPage from '@/features/member-view/MemberEntryPage'
import MemberHomeworkPage from '@/features/member-view/MemberHomeworkPage'
import MemberLayout from '@/features/member-view/MemberLayout'
import MemberPersonalPage from '@/features/member-view/MemberPersonalPage'
import MemberPersonalWritePage from '@/features/member-view/MemberPersonalWritePage'
import NotificationSettings from '@/components/NotificationSettings'
import NoticesPage from '@/components/NoticesPage'
import { MEMBER_PUSH, MEMBER_PUSH_DESCRIPTION } from '@/features/member-view/push'
import { TRAINER_PUSH, TRAINER_PUSH_DESCRIPTION } from '@/features/settings/push'
import MemberSettingsPage from '@/features/member-view/MemberSettingsPage'
import MemberWorkoutsPage from '@/features/member-view/MemberWorkoutsPage'
import AdminInquiriesPage from '@/features/settings/AdminInquiriesPage'
import InquiriesPage from '@/features/settings/InquiriesPage'
import InquiryPage from '@/features/settings/InquiryPage'
import SettingsPage from '@/features/settings/SettingsPage'
import PersonalDetailPage from '@/features/personal/PersonalDetailPage'
import WorkoutEditPage from '@/features/workouts/WorkoutEditPage'
import WorkoutsPage, { NoMemberSelected } from '@/features/workouts/WorkoutsPage'

const queryClient = new QueryClient()

// 데이터 라우터 — 작성 중인 일지를 두고 나갈 때(뒤로가기 제스처 포함) useBlocker 로 확인
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Root />}>
      <Route index element={<LandingPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      {/* 회원용 화면 — 트레이너 로그인과 무관, 회원 코드 입력 → 회원 토큰 */}
      <Route path="member">
        <Route index element={<MemberEntryPage />} />
        <Route element={<MemberLayout />}>
          <Route path="workouts" element={<MemberWorkoutsPage />} />
          <Route path="personal" element={<MemberPersonalPage />} />
          <Route path="personal/write" element={<MemberPersonalWritePage />} />
          <Route path="homework" element={<MemberHomeworkPage />} />
          <Route path="meals" element={<ComingSoon />} />
          <Route path="body" element={<MemberBodyPage />} />
          <Route path="settings" element={<MemberSettingsPage />} />
          <Route path="settings/notices" element={<NoticesPage audience="member" backTo="/member/settings" />} />
          <Route
            path="settings/notifications"
            element={<NotificationSettings audience={MEMBER_PUSH} backTo="/member/settings" description={MEMBER_PUSH_DESCRIPTION} />}
          />
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
          <Route path="personal" element={<MemberSplit title="개인운동" base="/personal" showUnread />}>
            <Route index element={<NoMemberSelected />} />
            <Route path=":memberId" element={<PersonalDetailPage />} />
          </Route>
          <Route path="homework" element={<ComingSoon />} />
          <Route path="meals" element={<ComingSoon />} />
          <Route path="body" element={<MemberSplit title="성장" base="/body" />}>
            <Route index element={<NoMemberSelected />} />
            <Route path=":memberId" element={<BodyDetailPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="settings/notifications"
            element={<NotificationSettings audience={TRAINER_PUSH} backTo="/settings" description={TRAINER_PUSH_DESCRIPTION} />}
          />
          <Route path="settings/notices" element={<NoticesPage audience="trainer" backTo="/settings" />} />
          <Route path="settings/inquiry" element={<InquiryPage />} />
          <Route path="settings/inquiries" element={<InquiriesPage />} />
          <Route path="settings/admin/inquiries" element={<AdminInquiriesPage />} />
        </Route>
      </Route>
    </Route>,
  ),
)

function Root() {
  return (
    <>
      <ManifestSwitch />
      <div className="mx-auto min-h-dvh max-w-md md:max-w-none">
        <Outlet />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)

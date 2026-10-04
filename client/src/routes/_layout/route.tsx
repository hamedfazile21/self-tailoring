import Header from '#/components/layout/header'
import Sidebar from '#/components/layout/sidebar'
import { isSignedIn } from '#/lib/auth'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout')({
  /**
   * Guards every route nested under this layout. Running here rather than in a
   * component means the protected UI never renders for a signed-out visitor.
   */
  beforeLoad: ({ location }) => {
    if (!isSignedIn()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: AppLayoutComponent,
})

function AppLayoutComponent() {
  return (
    <div className="flex min-h-screen items-start">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

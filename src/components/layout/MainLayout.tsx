import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/app'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

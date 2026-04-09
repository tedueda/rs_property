import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import {
  LayoutDashboard, Building2, Home, DoorOpen, Users, Banknote,
  CreditCard, AlertTriangle, Settings, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { path: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { path: '/companies', label: '会社管理', icon: Building2 },
  { path: '/properties-mgmt', label: '物件管理', icon: Home },
  { path: '/rooms', label: '部屋管理', icon: DoorOpen },
  { path: '/tenants-mgmt', label: '入居者管理', icon: Users },
  { path: '/charges', label: '家賃請求管理', icon: Banknote },
  { path: '/payments', label: '入金管理', icon: CreditCard },
  { path: '/arrears-mgmt', label: '未収・滞納管理', icon: AlertTriangle },
  { path: '/settings/users', label: '設定', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStore()

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r bg-white transition-all duration-300",
        // Desktop
        "hidden lg:block",
        sidebarCollapsed ? "lg:w-16" : "lg:w-60"
      )}>
        <div className="flex h-14 items-center justify-between border-b px-3">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-sm">資金管理システム</span>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-2 overflow-y-auto h-[calc(100vh-3.5rem)]">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen w-64 border-r bg-white transition-transform duration-300 lg:hidden",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-14 items-center justify-between border-b px-3">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-sm">資金管理システム</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-2 overflow-y-auto h-[calc(100vh-3.5rem)]">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

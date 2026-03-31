import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app'
import {
  LayoutDashboard, Building2, DoorOpen, FileText, ScanLine, FileCheck,
  Users, Banknote, AlertTriangle, Wrench, FolderOpen, Settings, Map, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { path: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { path: '/properties', label: '物件管理', icon: Building2 },
  { path: '/units', label: '部屋管理', icon: DoorOpen },
  { path: '/applications', label: '申込管理', icon: FileText },
  { path: '/ocr-jobs', label: 'OCRジョブ', icon: ScanLine },
  { path: '/template-mappings', label: '帳票マッピング', icon: Map },
  { path: '/contracts', label: '契約管理', icon: FileCheck },
  { path: '/tenants', label: '入居者', icon: Users },
  { path: '/rent', label: '家賃管理', icon: Banknote },
  { path: '/arrears', label: '未収管理', icon: AlertTriangle },
  { path: '/repairs', label: '修繕管理', icon: Wrench },
  { path: '/documents', label: '書類管理', icon: FolderOpen },
  { path: '/settings/users', label: '設定', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-60"
    )}>
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!sidebarCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-sm">RS不動産管理</span>
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
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
  )
}

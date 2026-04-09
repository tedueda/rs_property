import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { LogOut, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { user, signOut } = useAuth()
  const { sidebarCollapsed, setMobileMenuOpen } = useAppStore()

  return (
    <header className={`fixed top-0 z-30 h-14 border-b bg-white transition-all duration-300 right-0 ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'} left-0`}>
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.full_name || user?.email}</span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">{(user?.full_name || 'U')[0]}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />プロフィール</DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />ログアウト</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

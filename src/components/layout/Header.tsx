import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { user, signOut } = useAuth()
  const { sidebarCollapsed } = useAppStore()

  return (
    <header className={`fixed top-0 z-30 h-14 border-b bg-background transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-60'} right-0`}>
      <div className="flex h-full items-center justify-between px-4">
        <div />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.full_name || user?.email}</span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="text-xs">{(user?.full_name || 'U')[0]}</AvatarFallback>
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

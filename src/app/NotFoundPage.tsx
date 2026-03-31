import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">ページが見つかりませんでした</p>
        <Link to="/dashboard"><Button className="mt-6"><Home className="mr-2 h-4 w-4" />ダッシュボードへ</Button></Link>
      </div>
    </div>
  )
}

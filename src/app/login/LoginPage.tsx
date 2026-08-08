import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Building2, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { isAuthenticated, isLoading, signIn } = useAuth()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await signIn(loginId, password)
      if (error) setError('ログインに失敗しました。ID・パスワードまたは通信状態を確認してください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">資金管理システム</CardTitle>
          <CardDescription>不動産管理グループ 資金管理アプリ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="loginId">ログインID</Label>
              <Input id="loginId" type="email" placeholder="user@example.com" value={loginId} onChange={(e) => setLoginId(e.target.value)} required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />ログイン中...</> : 'ログイン'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link to="/reset-password" className="text-sm text-blue-600 hover:underline">
            パスワードをお忘れの方
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

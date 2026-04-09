import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2, CheckCircle } from 'lucide-react'

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isDemoMode) return
    // Supabase will automatically pick up the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via password reset link - ready to update
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setLoading(true)

    if (isDemoMode) {
      setSuccess(true)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">パスワード再設定</CardTitle>
          <CardDescription>新しいパスワードを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-sm text-gray-600">
                パスワードが更新されました。
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                ログインへ
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input id="password" type="password" placeholder="8文字以上" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード確認</Label>
                <Input id="confirmPassword" type="password" placeholder="もう一度入力" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />更新中...</> : 'パスワードを更新'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

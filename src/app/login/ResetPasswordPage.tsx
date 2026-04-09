import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Building2, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

export function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isDemoMode) {
      setSuccess(true)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      setError('パスワードリセットメールの送信に失敗しました')
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
          <CardTitle className="text-2xl">パスワードリセット</CardTitle>
          <CardDescription>登録済みメールアドレスを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-sm text-gray-600">
                パスワードリセット用のメールを送信しました。<br />
                メールに記載されたリンクからパスワードを再設定してください。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />送信中...</> : 'リセットメールを送信'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link to="/login" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            ログインに戻る
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

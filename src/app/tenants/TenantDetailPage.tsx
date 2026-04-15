import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useTenant } from '@/lib/supabase/hooks'

export function TenantDetailPage() {
  const { id } = useParams()
  const { data: tenant, loading } = useTenant(id)

  useEffect(() => { document.title = `${tenant?.full_name || '入居者詳細'} - RS不動産管理` }, [tenant?.full_name])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!tenant) {
    return <div className="text-center py-20 text-muted-foreground">入居者が見つかりません</div>
  }

  return (
    <div>
      <PageHeader title={`入居者詳細: ${tenant.full_name}`} backTo="/tenants" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">氏名</span><span className="text-sm font-medium">{tenant.full_name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">フリガナ</span><span className="text-sm">{tenant.full_name_kana || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">電話番号</span><span className="text-sm">{tenant.phone || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">メール</span><span className="text-sm">{tenant.email || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">現住所</span><span className="text-sm">{tenant.current_address || '-'}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>契約情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">登録日</span><span className="text-sm">{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('ja-JP') : '-'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

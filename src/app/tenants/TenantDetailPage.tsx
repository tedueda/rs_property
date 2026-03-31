import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TenantDetailPage() {
  const { id: _id } = useParams()
  useEffect(() => { document.title = '入居者詳細 - RS不動産管理' }, [])

  return (
    <div>
      <PageHeader title="入居者詳細: 田中太郎" backTo="/tenants" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">氏名</span><span className="text-sm font-medium">田中太郎</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">フリガナ</span><span className="text-sm">タナカタロウ</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">電話番号</span><span className="text-sm">090-1234-5678</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">メール</span><span className="text-sm">tanaka@example.com</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>契約情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">物件</span><span className="text-sm font-medium">サンハイツA棟 101号室</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約開始日</span><span className="text-sm">2024-04-01</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">賃料</span><span className="text-sm font-bold">¥75,000</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

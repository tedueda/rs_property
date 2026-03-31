import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer } from 'lucide-react'

export function ContractDetailPage() {
  const { id } = useParams()
  useEffect(() => { document.title = `契約詳細 CTR-${id?.padStart(3, '0')} - RS不動産管理` }, [id])

  return (
    <div>
      <PageHeader title={`契約詳細: CTR-${id?.padStart(3, '0')}`} backTo="/contracts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" />印刷</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" />PDF出力</Button>
            <Button><FileText className="mr-2 h-4 w-4" />契約書生成</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>契約情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約種別</span><span className="text-sm font-medium">新規契約</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">ステータス</span><Badge variant="success">有効</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約開始日</span><span className="text-sm">2026-04-01</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約終了日</span><span className="text-sm">2028-03-31</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">賃料</span><span className="text-sm font-bold">¥82,000</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">管理費</span><span className="text-sm">¥5,000</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>物件・入居者情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">物件名</span><span className="text-sm font-medium">パークビュー横浜</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">号室</span><span className="text-sm">301号室</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約者</span><span className="text-sm font-medium">山田一郎</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">申込番号</span><span className="text-sm">APP-2026-003</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

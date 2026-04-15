import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, Printer, Loader2 } from 'lucide-react'
import { useContract } from '@/lib/supabase/hooks'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  active: { label: '有効', variant: 'success' },
  draft: { label: '下書き', variant: 'secondary' },
  expired: { label: '満了', variant: 'warning' },
  terminated: { label: '解約', variant: 'destructive' },
}

export function ContractDetailPage() {
  const { id } = useParams()
  const { data: contract, loading } = useContract(id)

  useEffect(() => { document.title = `契約詳細 - RS不動産管理` }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!contract) {
    return <div className="text-center py-20 text-muted-foreground">契約が見つかりません</div>
  }

  const st = statusMap[contract.status] || { label: contract.status, variant: 'secondary' as const }

  return (
    <div>
      <PageHeader title={`契約詳細: CTR-${contract.id.slice(0, 6)}`} backTo="/contracts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" />印刷</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" />PDF出力</Button>
            <Button><FileText className="mr-2 h-4 w-4" />契約書生成</Button>
          </div>
        } />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>契約情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約種別</span><span className="text-sm font-medium">{contract.contract_type === 'new' ? '新規契約' : '更新契約'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">ステータス</span><Badge variant={st.variant}>{st.label}</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約開始日</span><span className="text-sm">{contract.start_date}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">契約終了日</span><span className="text-sm">{contract.end_date || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">賃料</span><span className="text-sm font-bold">¥{(contract.rent_amount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">管理費</span><span className="text-sm">¥{(contract.management_fee || 0).toLocaleString()}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>物件情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">物件名</span><span className="text-sm font-medium">{contract.property?.name || '-'}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

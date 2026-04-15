import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Pencil, Loader2 } from 'lucide-react'
import { useRepair } from '@/lib/supabase/hooks'
import { REPAIR_STATUSES, REPAIR_PRIORITIES } from '@/lib/constants'

export function RepairDetailPage() {
  const { id } = useParams()
  const { data: repair, loading } = useRepair(id)

  useEffect(() => { document.title = '修繕詳細 - RS不動産管理' }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!repair) {
    return <div className="text-center py-20 text-muted-foreground">修繕が見つかりません</div>
  }

  const st = REPAIR_STATUSES[repair.status]
  const pr = REPAIR_PRIORITIES[repair.priority]

  return (
    <div>
      <PageHeader title={`修繕詳細: ${repair.title}`} backTo="/repairs"
        actions={<Button variant="outline"><Pencil className="mr-2 h-4 w-4" />編集</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>修繕情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">タイトル</span><span className="text-sm font-medium">{repair.title}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">物件</span><span className="text-sm">{repair.property?.name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">ステータス</span><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">優先度</span><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pr.color}`}>{pr.label}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">受付日</span><span className="text-sm">{repair.received_date}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">担当者</span><span className="text-sm">{repair.staff_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">業者</span><span className="text-sm">{repair.vendor_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">見積額</span><span className="text-sm font-bold">¥{(repair.estimated_cost || 0).toLocaleString()}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>写真</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">写真をアップロード</p>
              <Button variant="outline" className="mt-3" size="sm">ファイルを選択</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

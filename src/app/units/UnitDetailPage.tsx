import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UNIT_STATUSES } from '@/lib/constants'
import { Pencil, Loader2 } from 'lucide-react'
import { useUnit } from '@/lib/supabase/hooks'

export function UnitDetailPage() {
  const { id } = useParams()
  const { data: unit, loading } = useUnit(id)

  useEffect(() => { document.title = `${unit?.property?.name || ''} ${unit?.unit_number || ''} - RS不動産管理` }, [unit])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!unit) {
    return <div className="text-center py-20 text-muted-foreground">部屋が見つかりません</div>
  }

  const statusInfo = UNIT_STATUSES[unit.status]

  return (
    <div>
      <PageHeader title={`${unit.property?.name || ''} ${unit.unit_number}号室`} backTo="/units"
        actions={<Button variant="outline"><Pencil className="mr-2 h-4 w-4" />編集</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">状態</span><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">物件</span><span className="text-sm font-medium">{unit.property?.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">号室</span><span className="text-sm font-medium">{unit.unit_number}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">階数</span><span className="text-sm font-medium">{unit.floor}F</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">間取り</span><span className="text-sm font-medium">{unit.layout}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">面積</span><span className="text-sm font-medium">{unit.area_sqm}m²</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">賃料情報</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">賃料</span><span className="text-sm font-bold">¥{(unit.rent_amount || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">管理費</span><span className="text-sm">¥{(unit.management_fee || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">水道代</span><span className="text-sm">¥{(unit.water_fee || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">駐車場代</span><span className="text-sm">¥{(unit.parking_fee || 0).toLocaleString()}</span></div>
            <div className="border-t pt-2 flex items-center justify-between"><span className="text-sm font-medium">合計</span><span className="text-sm font-bold">¥{((unit.rent_amount || 0) + (unit.management_fee || 0) + (unit.water_fee || 0) + (unit.parking_fee || 0)).toLocaleString()}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">初期費用</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">敷金</span><span className="text-sm">¥{(unit.deposit || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">礼金</span><span className="text-sm">¥{(unit.key_money || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">保証金</span><span className="text-sm">¥{(unit.guarantee_deposit || 0).toLocaleString()}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">解約引</span><span className="text-sm">¥{(unit.cancellation_fee || 0).toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

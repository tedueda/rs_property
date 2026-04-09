import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { DOCUMENT_STATUSES, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

interface AlertDocument {
  id: string
  title: string
  company_name: string
  category_name: string
  status: string
  contract_end_date: string
  renewal_date?: string
  days_remaining: number
  alert_type: 'expired' | 'expiring_soon' | 'renewal_due'
}

const today = new Date()

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const DEMO_ALERTS: AlertDocument[] = [
  { id: '8', title: 'オーナーズ 火災保険証券', company_name: '株式会社オーナーズ', category_name: '保証会社契約書', status: 'expired', contract_end_date: '2025-03-31', days_remaining: daysUntil('2025-03-31'), alert_type: 'expired' },
  { id: '3', title: 'NYコーポ 保証会社契約', company_name: 'N・Yコーポレーション株式会社', category_name: '保証会社契約書', status: 'renewal_pending', contract_end_date: '2025-05-31', renewal_date: '2025-04-01', days_remaining: daysUntil('2025-05-31'), alert_type: 'renewal_due' },
  { id: '1', title: '林建設 賃貸借契約書 101号室', company_name: '林建設株式会社', category_name: '入居契約書', status: 'active', contract_end_date: '2026-03-31', renewal_date: '2026-02-01', days_remaining: daysUntil('2026-03-31'), alert_type: 'expiring_soon' },
  { id: '4', title: 'オーナーズ 事務所賃貸契約', company_name: '株式会社オーナーズ', category_name: '入居契約書', status: 'active', contract_end_date: '2026-12-31', days_remaining: daysUntil('2026-12-31'), alert_type: 'expiring_soon' },
  { id: '2', title: '林建設 借入契約書 三井住友銀行', company_name: '林建設株式会社', category_name: '借入契約書', status: 'active', contract_end_date: '2028-01-14', renewal_date: '2027-11-15', days_remaining: daysUntil('2028-01-14'), alert_type: 'expiring_soon' },
]

export function DocumentAlertsPage() {
  useAuth()
  const [alerts, setAlerts] = useState<AlertDocument[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setAlerts(DEMO_ALERTS)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('documents')
      .select('*, category:document_categories(category_name), company:companies(name)')
      .is('deleted_at', null)
      .not('contract_end_date', 'is', null)
      .order('contract_end_date', { ascending: true })
    const items: AlertDocument[] = (data || []).map((d: Record<string, unknown>) => {
      const endDate = d.contract_end_date as string
      const days = daysUntil(endDate)
      let alertType: AlertDocument['alert_type'] = 'expiring_soon'
      if (days < 0) alertType = 'expired'
      else if (d.renewal_date && daysUntil(d.renewal_date as string) <= 90) alertType = 'renewal_due'
      return {
        id: d.id as string, title: d.title as string,
        company_name: (d.company as Record<string, unknown>)?.name as string || '-',
        category_name: (d.category as Record<string, unknown>)?.category_name as string || '-',
        status: d.status as string, contract_end_date: endDate,
        renewal_date: d.renewal_date as string | undefined,
        days_remaining: days, alert_type: alertType,
      }
    })
    setAlerts(items)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const expired = alerts.filter(a => a.alert_type === 'expired')
  const renewalDue = alerts.filter(a => a.alert_type === 'renewal_due')
  const expiringSoon = alerts.filter(a => a.alert_type === 'expiring_soon')

  const AlertIcon = ({ type }: { type: AlertDocument['alert_type'] }) => {
    if (type === 'expired') return <AlertTriangle className="h-4 w-4 text-red-500" />
    if (type === 'renewal_due') return <Clock className="h-4 w-4 text-yellow-500" />
    return <CheckCircle2 className="h-4 w-4 text-blue-500" />
  }

  const DaysLabel = ({ days }: { days: number }) => {
    if (days < 0) return <span className="text-red-600 font-bold">{Math.abs(days)}日超過</span>
    if (days <= 30) return <span className="text-red-500 font-bold">あと{days}日</span>
    if (days <= 90) return <span className="text-yellow-600 font-medium">あと{days}日</span>
    return <span className="text-gray-600">あと{days}日</span>
  }

  const renderTable = (items: AlertDocument[], title: string) => (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title} ({items.length}件)</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>書類名</TableHead>
              <TableHead>会社</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>契約終了日</TableHead>
              <TableHead>残り日数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">該当する書類はありません</TableCell></TableRow>
            ) : items.map(a => {
              const st = DOCUMENT_STATUSES[a.status as keyof typeof DOCUMENT_STATUSES]
              return (
                <TableRow key={a.id}>
                  <TableCell><AlertIcon type={a.alert_type} /></TableCell>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.company_name}</TableCell>
                  <TableCell>{a.category_name}</TableCell>
                  <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                  <TableCell className="text-sm">{formatDate(a.contract_end_date)}</TableCell>
                  <TableCell><DaysLabel days={a.days_remaining} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader title="更新期限アラート" description="契約終了日・更新日が近い書類を一覧表示します" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-red-600">{expired.length}</p>
            <p className="text-sm text-muted-foreground">期限切れ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-yellow-600">{renewalDue.length}</p>
            <p className="text-sm text-muted-foreground">更新手続き必要</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-600">{expiringSoon.length}</p>
            <p className="text-sm text-muted-foreground">期限前</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          {renderTable(expired, '期限切れ書類')}
          {renderTable(renewalDue, '更新手続きが必要な書類')}
          {renderTable(expiringSoon, '今後期限を迎える書類')}
        </div>
      )}
    </div>
  )
}

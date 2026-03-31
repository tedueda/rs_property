import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Building2, DoorOpen, Users, FileText, FileCheck, AlertTriangle, Wrench, ScanLine, ArrowRight } from 'lucide-react'
import type { DashboardStats, DashboardAlerts } from '@/types'

const defaultStats: DashboardStats = { total_properties: 12, total_units: 248, occupied_units: 221, vacant_units: 27, pending_applications: 8, contracts_this_month: 5, arrears_count: 3, active_repairs: 7 }
const defaultAlerts: DashboardAlerts = { ocr_unconfirmed: 4, mapping_unconfirmed: 2, contracts_not_created: 3, payments_unconfirmed: 6, arrears_count: 3, repairs_incomplete: 7, new_templates_detected: 1 }

export function DashboardPage() {
  const [stats] = useState<DashboardStats>(defaultStats)
  const [alerts] = useState<DashboardAlerts>(defaultAlerts)

  useEffect(() => { document.title = 'ダッシュボード - RS不動産管理' }, [])

  const kpiCards = [
    { label: '管理物件数', value: stats.total_properties, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '総戸数', value: stats.total_units, icon: DoorOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '入居中', value: stats.occupied_units, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '空室数', value: stats.vacant_units, icon: DoorOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '申込中', value: stats.pending_applications, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '今月契約', value: stats.contracts_this_month, icon: FileCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: '未収件数', value: stats.arrears_count, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '修繕対応中', value: stats.active_repairs, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const alertItems = [
    { label: 'OCR未確認', count: alerts.ocr_unconfirmed, link: '/ocr-jobs', variant: 'warning' as const },
    { label: 'マッピング未確定', count: alerts.mapping_unconfirmed, link: '/template-mappings', variant: 'warning' as const },
    { label: '契約書未作成', count: alerts.contracts_not_created, link: '/contracts', variant: 'info' as const },
    { label: '入金未確認', count: alerts.payments_unconfirmed, link: '/rent', variant: 'warning' as const },
    { label: '滞納', count: alerts.arrears_count, link: '/arrears', variant: 'destructive' as const },
    { label: '修繕未完了', count: alerts.repairs_incomplete, link: '/repairs', variant: 'secondary' as const },
    { label: '新規帳票検出', count: alerts.new_templates_detected, link: '/template-mappings', variant: 'info' as const },
  ]

  return (
    <div>
      <PageHeader title="ダッシュボード" description="業務概況" />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-2 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">アラート・タスク</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertItems.filter(a => a.count > 0).map((alert) => (
                <Link key={alert.label} to={alert.link} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.variant}>{alert.count}件</Badge>
                    <span className="text-sm font-medium">{alert.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">最近の申込</CardTitle>
              <Link to="/applications" className="text-sm text-primary hover:underline">すべて表示</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: '田中太郎', property: 'サンハイツA棟', unit: '301号室', status: 'screening' },
                { name: '佐藤花子', property: 'グリーンコート', unit: '205号室', status: 'submitted' },
                { name: '山田一郎', property: 'パークビュー', unit: '102号室', status: 'approved' },
              ].map((app, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.property} {app.unit}</p>
                  </div>
                  <Badge variant={app.status === 'approved' ? 'success' : app.status === 'screening' ? 'warning' : 'info'}>
                    {app.status === 'screening' ? '審査中' : app.status === 'approved' ? '承認済' : '申込済'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">OCR要確認</CardTitle>
              <Link to="/ocr-jobs" className="text-sm text-primary hover:underline">すべて表示</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { file: '申込書_20260325.pdf', status: 'completed', fields: 3 },
                { file: '申込書_20260324.jpg', status: 'completed', fields: 5 },
              ].map((job, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <ScanLine className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{job.file}</p>
                      <p className="text-xs text-muted-foreground">未確認項目: {job.fields}件</p>
                    </div>
                  </div>
                  <Badge variant="warning">要確認</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">未収一覧</CardTitle>
              <Link to="/arrears" className="text-sm text-primary hover:underline">すべて表示</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { tenant: '鈴木健一', amount: 85000, months: 2 },
                { tenant: '高橋美和', amount: 72000, months: 1 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{item.tenant}</p>
                    <p className="text-xs text-muted-foreground">{item.months}ヶ月滞納</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">¥{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

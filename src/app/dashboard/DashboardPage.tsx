import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/constants'
import type { DashboardStats, CompanySummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Home, DoorOpen, Users, Banknote, AlertTriangle, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const DEMO_STATS: DashboardStats = {
  total_companies: 6,
  total_properties: 12,
  total_rooms: 85,
  occupied_rooms: 68,
  vacant_rooms: 17,
  total_tenants: 68,
  monthly_charges_count: 68,
  monthly_charges_total: 5780000,
  payments_count: 62,
  payments_total: 5200000,
  arrears_count: 8,
  arrears_total: 580000,
}

const DEMO_COMPANY_SUMMARIES: CompanySummary[] = [
  { company_id: '1', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', properties_count: 4, rooms_count: 30, charges_count: 25, charges_total: 2100000, payments_count: 23, payments_total: 1900000, arrears_count: 3, arrears_total: 200000 },
  { company_id: '2', company_name: 'N\u30fbY\u30b3\u30fc\u30dd\u30ec\u30fc\u30b7\u30e7\u30f3\u682a\u5f0f\u4f1a\u793e', properties_count: 3, rooms_count: 20, charges_count: 16, charges_total: 1400000, payments_count: 15, payments_total: 1350000, arrears_count: 2, arrears_total: 50000 },
  { company_id: '3', company_name: '\u682a\u5f0f\u4f1a\u793e\u30aa\u30fc\u30ca\u30fc\u30ba', properties_count: 2, rooms_count: 15, charges_count: 12, charges_total: 980000, payments_count: 11, payments_total: 880000, arrears_count: 1, arrears_total: 100000 },
  { company_id: '4', company_name: '\u682a\u5f0f\u4f1a\u793e\u7167', properties_count: 2, rooms_count: 12, charges_count: 10, charges_total: 800000, payments_count: 9, payments_total: 720000, arrears_count: 1, arrears_total: 80000 },
  { company_id: '5', company_name: '\u682a\u5f0f\u4f1a\u793eA', properties_count: 1, rooms_count: 5, charges_count: 3, charges_total: 300000, payments_count: 2, payments_total: 200000, arrears_count: 1, arrears_total: 100000 },
  { company_id: '6', company_name: '\u682a\u5f0f\u4f1a\u793eB', properties_count: 0, rooms_count: 3, charges_count: 2, charges_total: 200000, payments_count: 2, payments_total: 150000, arrears_count: 0, arrears_total: 50000 },
]

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  variant?: 'default' | 'danger' | 'success'
}

function StatCard({ title, value, icon, description, variant = 'default' }: StatCardProps) {
  const colorClass = variant === 'danger' ? 'text-red-600' : variant === 'success' ? 'text-green-600' : 'text-blue-600'
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={colorClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setStats(DEMO_STATS)
      setCompanySummaries(DEMO_COMPANY_SUMMARIES)
      setLoading(false)
      return
    }
    try {
      const [
        { count: companiesCount },
        { count: propertiesCount },
        { count: roomsCount },
        { count: occupiedCount },
        { count: tenantsCount },
        { data: charges },
        { data: payments },
        { data: arrearsData },
        { data: companiesData },
      ] = await Promise.all([
        supabase.from('companies').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('rooms').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('rooms').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('status', 'occupied'),
        supabase.from('tenants').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('monthly_charges').select('billed_total, company_id').is('deleted_at', null),
        supabase.from('payment_records').select('paid_amount').is('deleted_at', null),
        supabase.from('arrears_records').select('arrears_amount, company_id').is('deleted_at', null).in('status', ['outstanding', 'partially_paid']),
        supabase.from('companies').select('id, name').is('deleted_at', null),
      ])

      const chargesTotal = (charges || []).reduce((sum: number, c: Record<string, number>) => sum + Number(c.billed_total), 0)
      const paymentsTotal = (payments || []).reduce((sum: number, p: Record<string, number>) => sum + Number(p.paid_amount), 0)
      const arrearsTotal = (arrearsData || []).reduce((sum: number, a: Record<string, number>) => sum + Number(a.arrears_amount), 0)

      setStats({
        total_companies: companiesCount || 0,
        total_properties: propertiesCount || 0,
        total_rooms: roomsCount || 0,
        occupied_rooms: occupiedCount || 0,
        vacant_rooms: (roomsCount || 0) - (occupiedCount || 0),
        total_tenants: tenantsCount || 0,
        monthly_charges_count: (charges || []).length,
        monthly_charges_total: chargesTotal,
        payments_count: (payments || []).length,
        payments_total: paymentsTotal,
        arrears_count: (arrearsData || []).length,
        arrears_total: arrearsTotal,
      })

      const summaries: CompanySummary[] = (companiesData || []).map((company: Record<string, string>) => {
        const companyCharges = (charges || []).filter((c: Record<string, string>) => c.company_id === company.id)
        const companyArrears = (arrearsData || []).filter((a: Record<string, string>) => a.company_id === company.id)
        return {
          company_id: company.id,
          company_name: company.name,
          properties_count: 0,
          rooms_count: 0,
          charges_count: companyCharges.length,
          charges_total: companyCharges.reduce((s: number, c: Record<string, number>) => s + Number(c.billed_total), 0),
          payments_count: 0,
          payments_total: 0,
          arrears_count: companyArrears.length,
          arrears_total: companyArrears.reduce((s: number, a: Record<string, number>) => s + Number(a.arrears_amount), 0),
        }
      })
      setCompanySummaries(summaries)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  if (!stats) return null

  const chartData = companySummaries.map(c => ({
    name: c.company_name.replace('\u682a\u5f0f\u4f1a\u793e', '(\u682a)').substring(0, 10),
    '\u8acb\u6c42\u984d': c.charges_total,
    '\u672a\u53ce\u984d': c.arrears_total,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9'}</h1>
        <p className="text-muted-foreground mt-1">{'\u30b0\u30eb\u30fc\u30d7\u5168\u4f53\u306e\u8cc7\u91d1\u7ba1\u7406\u30b5\u30de\u30ea\u30fc'}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title={'\u7ba1\u7406\u4f1a\u793e'} value={`${stats.total_companies}\u793e`} icon={<Building2 className="h-5 w-5" />} />
        <StatCard title={'\u7ba1\u7406\u7269\u4ef6'} value={`${stats.total_properties}\u4ef6`} icon={<Home className="h-5 w-5" />} />
        <StatCard title={'\u90e8\u5c4b\u6570'} value={`${stats.total_rooms}\u5ba4`} icon={<DoorOpen className="h-5 w-5" />} description={`\u5165\u5c45${stats.occupied_rooms} / \u7a7a\u5ba4${stats.vacant_rooms}`} />
        <StatCard title={'\u5165\u5c45\u8005'} value={`${stats.total_tenants}\u540d`} icon={<Users className="h-5 w-5" />} />
        <StatCard title={'\u6708\u6b21\u8acb\u6c42'} value={formatCurrency(stats.monthly_charges_total)} icon={<Banknote className="h-5 w-5" />} description={`${stats.monthly_charges_count}\u4ef6`} />
        <StatCard title={'\u672a\u53ce\u7dcf\u984d'} value={formatCurrency(stats.arrears_total)} icon={<AlertTriangle className="h-5 w-5" />} description={`${stats.arrears_count}\u4ef6`} variant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{'\u5165\u91d1\u72b6\u6cc1\u30b5\u30de\u30ea\u30fc'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{'\u6708\u6b21\u8acb\u6c42\u7dcf\u984d'}</span>
                <span className="font-mono font-medium">{formatCurrency(stats.monthly_charges_total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{'\u5165\u91d1\u7dcf\u984d'}</span>
                <span className="font-mono font-medium text-green-600">{formatCurrency(stats.payments_total)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-sm font-medium">{'\u5dee\u984d\uff08\u672a\u56de\u53ce\uff09'}</span>
                <span className="font-mono font-bold text-red-600">{formatCurrency(stats.monthly_charges_total - stats.payments_total)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.monthly_charges_total > 0 ? Math.min(100, (stats.payments_total / stats.monthly_charges_total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {'\u56de\u53ce\u7387'}: {stats.monthly_charges_total > 0 ? ((stats.payments_total / stats.monthly_charges_total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{'\u4f1a\u793e\u5225 \u8acb\u6c42\u30fb\u672a\u53ce'}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}\u4e07`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey={'\u8acb\u6c42\u984d'} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey={'\u672a\u53ce\u984d'} fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">{'\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{'\u4f1a\u793e\u5225\u30b5\u30de\u30ea\u30fc'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{'\u4f1a\u793e\u540d'}</TableHead>
                  <TableHead className="text-right">{'\u7269\u4ef6\u6570'}</TableHead>
                  <TableHead className="text-right">{'\u90e8\u5c4b\u6570'}</TableHead>
                  <TableHead className="text-right">{'\u8acb\u6c42\u4ef6\u6570'}</TableHead>
                  <TableHead className="text-right">{'\u8acb\u6c42\u7dcf\u984d'}</TableHead>
                  <TableHead className="text-right">{'\u672a\u53ce\u4ef6\u6570'}</TableHead>
                  <TableHead className="text-right">{'\u672a\u53ce\u7dcf\u984d'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companySummaries.map((cs) => (
                  <TableRow key={cs.company_id}>
                    <TableCell className="font-medium">{cs.company_name}</TableCell>
                    <TableCell className="text-right">{cs.properties_count}</TableCell>
                    <TableCell className="text-right">{cs.rooms_count}</TableCell>
                    <TableCell className="text-right">{cs.charges_count}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(cs.charges_total)}</TableCell>
                    <TableCell className="text-right">{cs.arrears_count > 0 ? <span className="text-red-600 font-medium">{cs.arrears_count}</span> : '0'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{cs.arrears_total > 0 ? <span className="text-red-600">{formatCurrency(cs.arrears_total)}</span> : formatCurrency(0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

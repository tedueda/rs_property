import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { formatCurrency, maskAccountNumber, ALLOWED_FILE_EXTENSIONS } from '@/lib/constants'
import type { BankAccountBalance, RepaymentSchedule } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Loader2, Upload, Landmark, CalendarClock, TrendingDown, FileText,
  Building2, Home, DoorOpen, Users, Banknote, CreditCard, AlertTriangle,
  Receipt, Wallet, Send, FolderOpen, History, ClipboardCheck, Bell, UserCog,
  ArrowLeftRight, BarChart3, Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEMO_BANK_BALANCES: BankAccountBalance[] = [
  { account_id: '1', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', bank_name: '\u4e09\u4e95\u4f4f\u53cb\u9280\u884c', branch_name: '\u5927\u962a\u4e2d\u592e\u652f\u5e97', account_number_masked: '****4567', current_balance: 15800000 },
  { account_id: '2', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', bank_name: '\u308a\u305d\u306a\u9280\u884c', branch_name: '\u672c\u753a\u652f\u5e97', account_number_masked: '****5678', current_balance: 8200000 },
  { account_id: '3', company_name: 'N\u30fbY\u30b3\u30fc\u30dd\u30ec\u30fc\u30b7\u30e7\u30f3', bank_name: '\u4e09\u83f1UFJ\u9280\u884c', branch_name: '\u6885\u7530\u652f\u5e97', account_number_masked: '****6789', current_balance: 12500000 },
  { account_id: '4', company_name: '\u682a\u5f0f\u4f1a\u793e\u30aa\u30fc\u30ca\u30fc\u30ba', bank_name: '\u95a2\u897f\u307f\u3089\u3044\u9280\u884c', branch_name: '\u5929\u738b\u5bfa\u652f\u5e97', account_number_masked: '****7890', current_balance: 3200000 },
  { account_id: '5', company_name: '\u682a\u5f0f\u4f1a\u793e\u7167', bank_name: '\u4e09\u4e95\u4f4f\u53cb\u9280\u884c', branch_name: '\u96e3\u6ce2\u652f\u5e97', account_number_masked: '****8901', current_balance: 6700000 },
  { account_id: '6', company_name: '\u682a\u5f0f\u4f1a\u793eA', bank_name: '\u6c60\u7530\u6cc9\u5dde\u9280\u884c', branch_name: '\u5832\u652f\u5e97', account_number_masked: '****9012', current_balance: 2100000 },
]

const DEMO_REPAYMENT_SCHEDULE: RepaymentSchedule[] = [
  { id: '1', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', lender_name: '\u4e09\u4e95\u4f4f\u53cb\u9280\u884c', monthly_repayment_amount: 500000, withdrawal_day: 27, next_withdrawal_date: '2026-04-27', account_balance: 15800000, is_at_risk: false },
  { id: '2', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', lender_name: '\u308a\u305d\u306a\u9280\u884c', monthly_repayment_amount: 350000, withdrawal_day: 25, next_withdrawal_date: '2026-04-25', account_balance: 8200000, is_at_risk: false },
  { id: '3', company_name: 'N\u30fbY\u30b3\u30fc\u30dd\u30ec\u30fc\u30b7\u30e7\u30f3', lender_name: '\u4e09\u83f1UFJ\u9280\u884c', monthly_repayment_amount: 800000, withdrawal_day: 10, next_withdrawal_date: '2026-05-10', account_balance: 12500000, is_at_risk: false },
  { id: '4', company_name: '\u682a\u5f0f\u4f1a\u793e\u30aa\u30fc\u30ca\u30fc\u30ba', lender_name: '\u65e5\u672c\u653f\u7b56\u91d1\u878d\u516c\u5eab', monthly_repayment_amount: 200000, withdrawal_day: 15, next_withdrawal_date: '2026-04-15', account_balance: 3200000, is_at_risk: false },
  { id: '5', company_name: '\u682a\u5f0f\u4f1a\u793e\u7167', lender_name: '\u4e09\u4e95\u4f4f\u53cb\u9280\u884c', monthly_repayment_amount: 450000, withdrawal_day: 27, next_withdrawal_date: '2026-04-27', account_balance: 6700000, is_at_risk: false },
]

const daysUntilDate = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

interface ExpiringContract { id: string; title: string; company_name: string; contract_end_date: string; days_remaining: number }
interface RecentUpload { id: string; file_name: string; created_at: string; status: string }

const DEMO_EXPIRING_CONTRACTS: ExpiringContract[] = [
  { id: '3', title: 'NY\u30b3\u30fc\u30dd \u4fdd\u8a3c\u4f1a\u793e\u5951\u7d04', company_name: 'N\u30fbY\u30b3\u30fc\u30dd\u30ec\u30fc\u30b7\u30e7\u30f3\u682a\u5f0f\u4f1a\u793e', contract_end_date: '2026-05-31', days_remaining: daysUntilDate('2026-05-31') },
  { id: '1', title: '\u6797\u5efa\u8a2d \u8cc3\u8cb8\u501f\u5951\u7d04\u66f8 101\u53f7\u5ba4', company_name: '\u6797\u5efa\u8a2d\u682a\u5f0f\u4f1a\u793e', contract_end_date: '2026-08-31', days_remaining: daysUntilDate('2026-08-31') },
  { id: '4', title: '\u30aa\u30fc\u30ca\u30fc\u30ba \u4e8b\u52d9\u6240\u8cc3\u8cb8\u5951\u7d04', company_name: '\u682a\u5f0f\u4f1a\u793e\u30aa\u30fc\u30ca\u30fc\u30ba', contract_end_date: '2027-03-31', days_remaining: daysUntilDate('2027-03-31') },
]

const DEMO_RECENT_UPLOADS: RecentUpload[] = [
  { id: '1', file_name: '\u901a\u5e33_\u6797\u5efa\u8a2d_202604.pdf', created_at: '2026-04-08', status: 'confirmed' },
  { id: '2', file_name: '\u9818\u53ce\u66f8_\u4fee\u7e55\u5de5\u4e8b.jpg', created_at: '2026-04-06', status: 'review_pending' },
  { id: '3', file_name: '\u5165\u5c45\u5951\u7d04\u66f8_\u4f50\u85e4.pdf', created_at: '2026-04-04', status: 'extracted' },
]

const UPLOAD_STATUS_LABELS: Record<string, string> = {
  uploaded: '\u53d6\u8fbc\u6e08', processing: '\u51e6\u7406\u4e2d', extracted: '\u62bd\u51fa\u6e08',
  review_pending: '\u78ba\u8a8d\u5f85\u3061', confirmed: '\u78ba\u5b9a\u6e08', error: '\u30a8\u30e9\u30fc',
}

interface PanelItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
}

const PANEL_ITEMS: PanelItem[] = [
  { label: '\u5bb6\u8cc3\u8acb\u6c42\u7ba1\u7406', icon: Banknote, path: '/charges', description: '\u6708\u6b21\u8acb\u6c42\u306e\u7ba1\u7406' },
  { label: '\u5165\u91d1\u7ba1\u7406', icon: CreditCard, path: '/payments', description: '\u5165\u91d1\u7167\u5408\u30fb\u7ba1\u7406' },
  { label: '\u672a\u53ce\u30fb\u6ede\u7d0d\u7ba1\u7406', icon: AlertTriangle, path: '/arrears-mgmt', description: '\u672a\u53ce\u91d1\u306e\u8ffd\u8de1' },
  { label: '\u7d4c\u8cbb\u7ba1\u7406', icon: Receipt, path: '/expenses', description: '\u7d4c\u8cbb\u306e\u8a18\u9332\u30fb\u7ba1\u7406' },
  { label: '\u7d66\u4e0e\u7ba1\u7406', icon: Wallet, path: '/payroll', description: '\u7d66\u4e0e\u8a08\u7b97\u30fb\u652f\u6255\u3044' },
  { label: '\u8fd4\u6e08\u7ba1\u7406', icon: CalendarClock, path: '/loan-repayments', description: '\u501f\u5165\u8fd4\u6e08\u4e88\u5b9a' },
  { label: '\u9280\u884c\u53d6\u5f15', icon: ArrowLeftRight, path: '/bank-transactions', description: '\u5165\u51fa\u91d1\u660e\u7d30' },
  { label: '\u8cc7\u91d1\u79fb\u52d5', icon: Send, path: '/fund-transfers', description: '\u53e3\u5ea7\u9593\u306e\u632f\u66ff' },
  { label: '\u66f8\u985e\u7ba1\u7406', icon: FileText, path: '/documents', description: '\u5951\u7d04\u66f8\u30fb\u66f8\u985e' },
  { label: '\u66f4\u65b0\u671f\u9650', icon: Bell, path: '/document-alerts', description: '\u671f\u9650\u30a2\u30e9\u30fc\u30c8' },
  { label: '\u53d6\u8fbc\u78ba\u8a8d', icon: ClipboardCheck, path: '/import-review', description: '\u53d6\u8fbc\u30c7\u30fc\u30bf\u78ba\u8a8d' },
  { label: '\u53d6\u8fbc\u5c65\u6b74', icon: History, path: '/import-history', description: '\u904e\u53bb\u306e\u53d6\u8fbc\u8a18\u9332' },
  { label: '\u6708\u6b21\u53ce\u652f', icon: BarChart3, path: '/monthly-income-expense', description: '\u6708\u6b21P&L' },
  { label: '\u4f1a\u793e\u7ba1\u7406', icon: Building2, path: '/companies', description: '\u30de\u30b9\u30bf\u7ba1\u7406' },
  { label: '\u7269\u4ef6\u7ba1\u7406', icon: Home, path: '/properties-mgmt', description: '\u7269\u4ef6\u60c5\u5831' },
  { label: '\u90e8\u5c4b\u7ba1\u7406', icon: DoorOpen, path: '/rooms', description: '\u90e8\u5c4b\u60c5\u5831' },
  { label: '\u5165\u5c45\u8005\u7ba1\u7406', icon: Users, path: '/tenants-mgmt', description: '\u5165\u5c45\u8005\u60c5\u5831' },
  { label: '\u5f93\u696d\u54e1\u7ba1\u7406', icon: UserCog, path: '/employees', description: '\u5f93\u696d\u54e1\u30de\u30b9\u30bf' },
  { label: '\u9280\u884c\u53e3\u5ea7', icon: Landmark, path: '/bank-accounts', description: '\u53e3\u5ea7\u30de\u30b9\u30bf' },
  { label: '\u7d4c\u8cbb\u30ab\u30c6\u30b4\u30ea', icon: FolderOpen, path: '/expense-categories', description: '\u30ab\u30c6\u30b4\u30ea\u7ba1\u7406' },
  { label: '\u66f8\u985e\u30ab\u30c6\u30b4\u30ea', icon: FolderOpen, path: '/document-categories', description: '\u30ab\u30c6\u30b4\u30ea\u7ba1\u7406' },
]

function StatCard({ title, value, icon, description, variant }: { title: string; value: string; icon: React.ReactNode; description?: string; variant?: 'danger' }) {
  return (
    <Card className={variant === 'danger' ? 'border-red-200' : ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{title}</span></div>
        <p className={`text-lg font-bold ${variant === 'danger' ? 'text-red-600' : ''}`}>{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const [bankBalances, setBankBalances] = useState<BankAccountBalance[]>([])
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([])
  const [arrearsCount, setArrearsCount] = useState(0)
  const [arrearsTotal, setArrearsTotal] = useState(0)
  const [expenseTotal, setExpenseTotal] = useState(0)
  const [payrollTotal, setPayrollTotal] = useState(0)
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([])
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([])
  const [pendingImports, setPendingImports] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setBankBalances(DEMO_BANK_BALANCES)
      setRepaymentSchedule(DEMO_REPAYMENT_SCHEDULE)
      setArrearsCount(8)
      setArrearsTotal(580000)
      setExpenseTotal(637500)
      setPayrollTotal(1377000)
      setExpiringContracts(DEMO_EXPIRING_CONTRACTS)
      setRecentUploads(DEMO_RECENT_UPLOADS)
      setPendingImports(2)
      setLoading(false)
      return
    }
    try {
      const [
        { data: companiesData },
        { data: arrearsData },
        { data: bankAccts },
        { data: loans },
        { data: expenses },
        { data: payrolls },
      ] = await Promise.all([
        supabase.from('companies').select('id, name').is('deleted_at', null),
        supabase.from('arrears_records').select('arrears_amount').is('deleted_at', null).in('status', ['outstanding', 'partially_paid']),
        supabase.from('bank_accounts').select('id, company_id, bank_name, branch_name, account_number, current_balance').is('deleted_at', null),
        supabase.from('loan_repayments').select('id, company_id, bank_account_id, lender_name, monthly_repayment_amount, withdrawal_day, next_withdrawal_date').is('deleted_at', null).eq('status', 'scheduled'),
        supabase.from('expense_records').select('amount').is('deleted_at', null),
        supabase.from('payroll_records').select('net_payment').is('deleted_at', null),
      ])

      const companyMap = Object.fromEntries((companiesData || []).map((c: Record<string, string>) => [c.id, c.name]))
      const accountMap = Object.fromEntries((bankAccts || []).map((a: Record<string, string | number>) => [a.id, a]))

      setArrearsCount((arrearsData || []).length)
      setArrearsTotal((arrearsData || []).reduce((s: number, a: Record<string, number>) => s + Number(a.arrears_amount), 0))

      setBankBalances((bankAccts || []).map((a: Record<string, string | number>) => ({
        account_id: String(a.id), company_name: companyMap[a.company_id as string] || '',
        bank_name: String(a.bank_name), branch_name: String(a.branch_name || ''),
        account_number_masked: maskAccountNumber(String(a.account_number)), current_balance: Number(a.current_balance),
      })))

      setRepaymentSchedule((loans || []).map((l: Record<string, string | number>) => {
        const acctBalance = Number((accountMap[l.bank_account_id as string] as Record<string, number>)?.current_balance) || 0
        return {
          id: String(l.id), company_name: companyMap[l.company_id as string] || '',
          lender_name: String(l.lender_name), monthly_repayment_amount: Number(l.monthly_repayment_amount),
          withdrawal_day: Number(l.withdrawal_day), next_withdrawal_date: String(l.next_withdrawal_date || ''),
          account_balance: acctBalance, is_at_risk: acctBalance > 0 && acctBalance < Number(l.monthly_repayment_amount) * 2,
        }
      }))

      setExpenseTotal((expenses || []).reduce((s: number, e: Record<string, number>) => s + Number(e.amount), 0))
      setPayrollTotal((payrolls || []).reduce((s: number, p: Record<string, number>) => s + Number(p.net_payment), 0))

      const [{ data: expiringDocs }, { data: recentFiles }, { count: pendingCount }] = await Promise.all([
        supabase.from('documents').select('id, title, company_id, contract_end_date').is('deleted_at', null).not('contract_end_date', 'is', null).order('contract_end_date', { ascending: true }).limit(5),
        supabase.from('uploaded_files').select('id, file_name, created_at, status').order('created_at', { ascending: false }).limit(5),
        supabase.from('extracted_data_candidates').select('*', { count: 'exact', head: true }).eq('review_status', 'pending'),
      ])

      const today = new Date()
      setExpiringContracts((expiringDocs || []).map((d: Record<string, string>) => {
        const endDate = new Date(d.contract_end_date)
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return { id: d.id, title: d.title, company_name: companyMap[d.company_id] || '', contract_end_date: d.contract_end_date, days_remaining: daysRemaining }
      }))
      setRecentUploads((recentFiles || []).map((f: Record<string, string>) => ({ id: f.id, file_name: f.file_name, created_at: f.created_at, status: f.status })))
      setPendingImports(pendingCount || 0)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files.length > 0) navigate('/file-upload', { state: { droppedFiles: Array.from(e.dataTransfer.files) } })
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) navigate('/file-upload', { state: { droppedFiles: Array.from(e.target.files) } })
  }

  const chartData = Object.values(
    bankBalances.reduce<Record<string, { name: string; balance: number }>>((acc, b) => {
      const name = b.company_name.replace('\u682a\u5f0f\u4f1a\u793e', '(\u682a)').substring(0, 12)
      if (!acc[b.company_name]) acc[b.company_name] = { name, balance: 0 }
      acc[b.company_name].balance += b.current_balance
      return acc
    }, {})
  )

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{'\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9'}</h1>
        <p className="text-muted-foreground mt-1">{'\u30b0\u30eb\u30fc\u30d7\u5168\u4f53\u306e\u8cc7\u91d1\u7ba1\u7406\u30b5\u30de\u30ea\u30fc'}</p>
      </div>

      {/* Section 1: File Import Area */}
      <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
        <CardContent className="py-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-3 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="text-center">
              <p className="text-lg font-semibold">{isDragging ? '\u30d5\u30a1\u30a4\u30eb\u3092\u30c9\u30ed\u30c3\u30d7\u3057\u3066\u304f\u3060\u3055\u3044' : '\u30d5\u30a1\u30a4\u30eb\u53d6\u8fbc'}</p>
              <p className="text-sm text-muted-foreground mt-1">{'\u30c9\u30e9\u30c3\u30b0&\u30c9\u30ed\u30c3\u30d7 \u307e\u305f\u306f \u30af\u30ea\u30c3\u30af\u3057\u3066\u30d5\u30a1\u30a4\u30eb\u3092\u9078\u629e'}</p>
              <p className="text-xs text-muted-foreground mt-1">{'\u5bfe\u5fdc\u5f62\u5f0f: JPG, PNG, HEIF, PDF, Excel, Word'}</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept={ALLOWED_FILE_EXTENSIONS} multiple onChange={handleFileSelect} />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/file-upload') }}>
                <Upload className="h-4 w-4 mr-1" />{'\u30d5\u30a1\u30a4\u30eb\u53d6\u8fbc\u753b\u9762\u3078'}
              </Button>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate('/import-history') }}>
                <History className="h-4 w-4 mr-1" />{'\u53d6\u8fbc\u5c65\u6b74'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Important KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title={'\u9280\u884c\u7dcf\u6b8b\u9ad8'} value={formatCurrency(bankBalances.reduce((s, b) => s + b.current_balance, 0))} icon={<Landmark className="h-4 w-4" />} />
        <StatCard title={'\u6708\u6b21\u8fd4\u6e08\u7dcf\u984d'} value={formatCurrency(repaymentSchedule.reduce((s, r) => s + r.monthly_repayment_amount, 0))} icon={<CalendarClock className="h-4 w-4" />} variant="danger" />
        <StatCard title={'\u672a\u53ce\u7dcf\u984d'} value={formatCurrency(arrearsTotal)} icon={<AlertTriangle className="h-4 w-4" />} description={`${arrearsCount}\u4ef6`} variant="danger" />
        <StatCard title={'\u78ba\u8a8d\u5f85\u3061\u53d6\u8fbc'} value={`${pendingImports}\u4ef6`} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard title={'\u7d4c\u8cbb+\u7d66\u4e0e'} value={formatCurrency(expenseTotal + payrollTotal)} icon={<Receipt className="h-4 w-4" />} />
      </div>

      {/* Bank Balances + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" />{'\u4f1a\u793e\u5225\u9280\u884c\u53e3\u5ea7\u6b8b\u9ad8'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{'\u4f1a\u793e\u540d'}</TableHead>
                    <TableHead>{'\u9280\u884c\u540d'}</TableHead>
                    <TableHead>{'\u53e3\u5ea7\u756a\u53f7'}</TableHead>
                    <TableHead className="text-right">{'\u6b8b\u9ad8'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankBalances.map((b) => (
                    <TableRow key={b.account_id}>
                      <TableCell className="text-sm">{b.company_name}</TableCell>
                      <TableCell className="font-medium text-sm">{b.bank_name}</TableCell>
                      <TableCell className="font-mono text-sm">{b.account_number_masked}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(b.current_balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{'\u4f1a\u793e\u5225\u6b8b\u9ad8\u6bd4\u8f03'}</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}\u4e07`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="balance" name={'\u6b8b\u9ad8'} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">{'\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093'}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Repayment + Expiring Contracts + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />{'\u4eca\u6708\u306e\u8fd4\u6e08\u4e88\u5b9a'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{'\u5f15\u843d\u65e5'}</TableHead>
                  <TableHead>{'\u501f\u5165\u5148'}</TableHead>
                  <TableHead className="text-right">{'\u6708\u984d'}</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...repaymentSchedule].sort((a, b) => a.withdrawal_day - b.withdrawal_day).map((r) => (
                  <TableRow key={r.id} className={r.is_at_risk ? 'bg-red-50' : undefined}>
                    <TableCell className="font-mono text-center text-sm">{r.withdrawal_day}{'\u65e5'}</TableCell>
                    <TableCell className="text-sm">{r.lender_name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatCurrency(r.monthly_repayment_amount)}</TableCell>
                    <TableCell>{r.is_at_risk && <TrendingDown className="h-4 w-4 text-red-500" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />{'\u66f4\u65b0\u671f\u9650\u304c\u8fd1\u3044\u5951\u7d04\u66f8'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{'\u66f8\u985e\u540d'}</TableHead>
                  <TableHead className="text-right">{'\u6b8b\u65e5\u6570'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringContracts.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">{'\u8a72\u5f53\u306a\u3057'}</TableCell></TableRow>
                ) : expiringContracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.title}</TableCell>
                    <TableCell className="text-right">
                      <span className={c.days_remaining <= 0 ? 'text-red-600 font-bold' : c.days_remaining <= 90 ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                        {c.days_remaining < 0 ? `${Math.abs(c.days_remaining)}\u65e5\u8d85\u904e` : `${c.days_remaining}\u65e5`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />{'\u6700\u8fd1\u306e\u53d6\u8fbc'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{'\u30d5\u30a1\u30a4\u30eb\u540d'}</TableHead>
                  <TableHead>{'\u72b6\u614b'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">{'\u30c7\u30fc\u30bf\u306a\u3057'}</TableCell></TableRow>
                ) : recentUploads.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-sm"><div className="flex items-center gap-1"><FileText className="h-3 w-3 text-muted-foreground shrink-0" /><span className="truncate">{u.file_name}</span></div></TableCell>
                    <TableCell className="text-xs">{UPLOAD_STATUS_LABELS[u.status] || u.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Panel Menu */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{'\u6a5f\u80fd\u30e1\u30cb\u30e5\u30fc'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          {PANEL_ITEMS.map((item) => (
            <Card key={item.path} className="cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors" onClick={() => navigate(item.path)}>
              <CardContent className="pt-4 pb-3 px-3 text-center">
                <item.icon className="h-6 w-6 mx-auto text-blue-600 mb-1.5" />
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

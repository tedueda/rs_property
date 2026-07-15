import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { formatCurrency, maskAccountNumber } from '@/lib/constants'
import type { BankAccountBalance, RepaymentSchedule } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Loader2, Upload, Landmark, CalendarClock, TrendingDown, FileText,
  Building2, Home, DoorOpen, Users, Banknote, CreditCard, AlertTriangle,
  Receipt, Wallet, Send, FolderOpen, ClipboardCheck, Bell, UserCog,
  ArrowLeftRight, BarChart3, Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEMO_BANK_BALANCES: BankAccountBalance[] = [
  { account_id: '1', company_name: '林建設株式会社', bank_name: '三井住友銀行', branch_name: '大阪中央支店', account_number_masked: '****4567', current_balance: 15800000 },
  { account_id: '2', company_name: '林建設株式会社', bank_name: 'りそな銀行', branch_name: '本町支店', account_number_masked: '****5678', current_balance: 8200000 },
  { account_id: '3', company_name: 'N・Yコーポレーション', bank_name: '三菱UFJ銀行', branch_name: '梅田支店', account_number_masked: '****6789', current_balance: 12500000 },
  { account_id: '4', company_name: '株式会社オーナーズ', bank_name: '関西みらい銀行', branch_name: '天王寺支店', account_number_masked: '****7890', current_balance: 3200000 },
  { account_id: '5', company_name: '株式会社照', bank_name: '三井住友銀行', branch_name: '難波支店', account_number_masked: '****8901', current_balance: 6700000 },
  { account_id: '6', company_name: '株式会社A', bank_name: '池田泉州銀行', branch_name: '堲支店', account_number_masked: '****9012', current_balance: 2100000 },
]

const DEMO_REPAYMENT_SCHEDULE: RepaymentSchedule[] = [
  { id: '1', company_name: '林建設株式会社', lender_name: '三井住友銀行', monthly_repayment_amount: 500000, withdrawal_day: 27, next_withdrawal_date: '2026-04-27', account_balance: 15800000, is_at_risk: false },
  { id: '2', company_name: '林建設株式会社', lender_name: 'りそな銀行', monthly_repayment_amount: 350000, withdrawal_day: 25, next_withdrawal_date: '2026-04-25', account_balance: 8200000, is_at_risk: false },
  { id: '3', company_name: 'N・Yコーポレーション', lender_name: '三菱UFJ銀行', monthly_repayment_amount: 800000, withdrawal_day: 10, next_withdrawal_date: '2026-05-10', account_balance: 12500000, is_at_risk: false },
  { id: '4', company_name: '株式会社オーナーズ', lender_name: '日本政策金融公庫', monthly_repayment_amount: 200000, withdrawal_day: 15, next_withdrawal_date: '2026-04-15', account_balance: 3200000, is_at_risk: false },
  { id: '5', company_name: '株式会社照', lender_name: '三井住友銀行', monthly_repayment_amount: 450000, withdrawal_day: 27, next_withdrawal_date: '2026-04-27', account_balance: 6700000, is_at_risk: false },
]

const daysUntilDate = (dateStr: string) => Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

interface ExpiringContract { id: string; title: string; company_name: string; contract_end_date: string; days_remaining: number }
interface RecentUpload { id: string; file_name: string; created_at: string; status: string }

const DEMO_EXPIRING_CONTRACTS: ExpiringContract[] = [
  { id: '3', title: 'NYコーポ 保証会社契約', company_name: 'N・Yコーポレーション株式会社', contract_end_date: '2026-05-31', days_remaining: daysUntilDate('2026-05-31') },
  { id: '1', title: '林建設 賃貸借契約書 101号室', company_name: '林建設株式会社', contract_end_date: '2026-08-31', days_remaining: daysUntilDate('2026-08-31') },
  { id: '4', title: 'オーナーズ 事務所賃貸契約', company_name: '株式会社オーナーズ', contract_end_date: '2027-03-31', days_remaining: daysUntilDate('2027-03-31') },
]

const DEMO_RECENT_UPLOADS: RecentUpload[] = [
  { id: '1', file_name: '通帳_林建設_202604.pdf', created_at: '2026-04-08', status: 'confirmed' },
  { id: '2', file_name: '領収書_修繕工事.jpg', created_at: '2026-04-06', status: 'review_pending' },
  { id: '3', file_name: '入居契約書_佐藤.pdf', created_at: '2026-04-04', status: 'extracted' },
]

const UPLOAD_STATUS_LABELS: Record<string, string> = {
  uploaded: '取込済', processing: '処理中', extracted: '抽出済',
  review_pending: '確認待ち', confirmed: '確定済', error: 'エラー',
}

interface PanelItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
}

const PANEL_ITEMS: PanelItem[] = [
  { label: '家賃請求管理', icon: Banknote, path: '/charges', description: '月次請求の管理' },
  { label: '入金管理', icon: CreditCard, path: '/payments', description: '入金照合・管理' },
  { label: '未収・滞納管理', icon: AlertTriangle, path: '/arrears-mgmt', description: '未収金の追跡' },
  { label: '経費管理', icon: Receipt, path: '/expenses', description: '経費の記録・管理' },
  { label: '給与管理', icon: Wallet, path: '/payroll', description: '給与計算・支払い' },
  { label: '返済管理', icon: CalendarClock, path: '/loan-repayments', description: '借入返済予定' },
  { label: '銀行取引', icon: ArrowLeftRight, path: '/bank-transactions', description: '入出金明細' },
  { label: '資金移動', icon: Send, path: '/fund-transfers', description: '口座間の振替' },
  { label: '書類管理', icon: FileText, path: '/documents', description: '契約書・書類' },
  { label: '更新期限', icon: Bell, path: '/document-alerts', description: '期限アラート' },
  { label: '物件管理台帳', icon: FileText, path: '/property-ledger', description: '台帳の読込・閲覧' },
  { label: '月次収支', icon: BarChart3, path: '/monthly-income-expense', description: '月次P&L' },
  { label: '会社管理', icon: Building2, path: '/companies', description: 'マスタ管理' },
  { label: '物件管理', icon: Home, path: '/properties-mgmt', description: '物件情報' },
  { label: '部屋管理', icon: DoorOpen, path: '/rooms', description: '部屋情報' },
  { label: '入居者管理', icon: Users, path: '/tenants-mgmt', description: '入居者情報' },
  { label: '従業員管理', icon: UserCog, path: '/employees', description: '従業員マスタ' },
  { label: '銀行口座', icon: Landmark, path: '/bank-accounts', description: '口座マスタ' },
  { label: '経費カテゴリ', icon: FolderOpen, path: '/expense-categories', description: 'カテゴリ管理' },
  { label: '書類カテゴリ', icon: FolderOpen, path: '/document-categories', description: 'カテゴリ管理' },
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
    if (e.dataTransfer.files.length > 0) navigate('/property-ledger', { state: { droppedFiles: Array.from(e.dataTransfer.files) } })
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) navigate('/property-ledger', { state: { droppedFiles: Array.from(e.target.files) } })
  }

  const chartData = Object.values(
    bankBalances.reduce<Record<string, { name: string; balance: number }>>((acc, b) => {
      const name = b.company_name.replace('株式会社', '(株)').substring(0, 12)
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
        <h1 className="text-2xl font-bold tracking-tight">{'ダッシュボード'}</h1>
        <p className="text-muted-foreground mt-1">{'グループ全体の資金管理サマリー'}</p>
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
              <p className="text-lg font-semibold">{isDragging ? '台帳ファイルをドロップしてください' : '物件管理台帳を読み込む'}</p>
              <p className="text-sm text-muted-foreground mt-1">DOCX・HTML・Excel・PDFから台帳データを登録します</p>
              <p className="text-xs text-muted-foreground mt-1">ファイルを選択後、内容を確認してデータベースに登録できます</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept=".docx,.html,.htm,.xlsx,.xls,.pdf" multiple onChange={handleFileSelect} />
            <Button variant="outline" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); navigate('/property-ledger') }}>
              <Upload className="h-4 w-4 mr-1" />物件管理台帳を開く
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Important KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard title={'銀行総残高'} value={formatCurrency(bankBalances.reduce((s, b) => s + b.current_balance, 0))} icon={<Landmark className="h-4 w-4" />} />
        <StatCard title={'月次返済総額'} value={formatCurrency(repaymentSchedule.reduce((s, r) => s + r.monthly_repayment_amount, 0))} icon={<CalendarClock className="h-4 w-4" />} variant="danger" />
        <StatCard title={'未収総額'} value={formatCurrency(arrearsTotal)} icon={<AlertTriangle className="h-4 w-4" />} description={`${arrearsCount}件`} variant="danger" />
        <StatCard title={'確認待ち取込'} value={`${pendingImports}件`} icon={<ClipboardCheck className="h-4 w-4" />} />
        <StatCard title={'経費+給与'} value={formatCurrency(expenseTotal + payrollTotal)} icon={<Receipt className="h-4 w-4" />} />
      </div>

      {/* Bank Balances + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" />{'会社別銀行口座残高'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{'会社名'}</TableHead>
                    <TableHead>{'銀行名'}</TableHead>
                    <TableHead>{'口座番号'}</TableHead>
                    <TableHead className="text-right">{'残高'}</TableHead>
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
          <CardHeader><CardTitle className="text-base">{'会社別残高比較'}</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="balance" name={'残高'} fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">{'データがありません'}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Repayment + Expiring Contracts + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4" />{'今月の返済予定'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{'引落日'}</TableHead>
                  <TableHead>{'借入先'}</TableHead>
                  <TableHead className="text-right">{'月額'}</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...repaymentSchedule].sort((a, b) => a.withdrawal_day - b.withdrawal_day).map((r) => (
                  <TableRow key={r.id} className={r.is_at_risk ? 'bg-red-50' : undefined}>
                    <TableCell className="font-mono text-center text-sm">{r.withdrawal_day}{'日'}</TableCell>
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
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />{'更新期限が近い契約書'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{'書類名'}</TableHead>
                  <TableHead className="text-right">{'残日数'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringContracts.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">{'該当なし'}</TableCell></TableRow>
                ) : expiringContracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-medium">{c.title}</TableCell>
                    <TableCell className="text-right">
                      <span className={c.days_remaining <= 0 ? 'text-red-600 font-bold' : c.days_remaining <= 90 ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                        {c.days_remaining < 0 ? `${Math.abs(c.days_remaining)}日超過` : `${c.days_remaining}日`}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" />{'最近の取込'}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{'ファイル名'}</TableHead>
                  <TableHead>{'状態'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUploads.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center py-4 text-muted-foreground">{'データなし'}</TableCell></TableRow>
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
        <h2 className="text-lg font-semibold mb-3">{'機能メニュー'}</h2>
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

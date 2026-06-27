import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEdit } from '@/lib/permissions'
import type { LoanRepayment, Company, BankAccount } from '@/types'
import { LOAN_REPAYMENT_STATUSES, formatCurrency, formatDate, maskAccountNumber } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
]

const DEMO_ACCOUNTS: BankAccount[] = [
  { id: '1', company_id: '1', bank_name: '三井住友銀行', branch_name: '大阪中央支店', account_type: 'ordinary', account_number: '1234567', account_holder: '林建設', current_balance: 15800000, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', bank_name: 'りそな銀行', branch_name: '本町支店', account_type: 'ordinary', account_number: '2345678', account_holder: '林建設', current_balance: 8200000, created_at: '', updated_at: '' },
  { id: '3', company_id: '2', bank_name: '三菱UFJ銀行', branch_name: '梅田支店', account_type: 'ordinary', account_number: '3456789', account_holder: 'NYコーポ', current_balance: 12500000, created_at: '', updated_at: '' },
  { id: '4', company_id: '3', bank_name: '関西みらい銀行', branch_name: '天王寺支店', account_type: 'checking', account_number: '4567890', account_holder: 'オーナーズ', current_balance: 3200000, created_at: '', updated_at: '' },
  { id: '5', company_id: '4', bank_name: '三井住友銀行', branch_name: '難波支店', account_type: 'ordinary', account_number: '5678901', account_holder: '株式会社照', current_balance: 6700000, created_at: '', updated_at: '' },
]

const DEMO_LOANS: LoanRepayment[] = [
  { id: '1', company_id: '1', bank_account_id: '1', lender_name: '三井住友銀行', monthly_repayment_amount: 500000, withdrawal_day: 27, next_withdrawal_date: '2025-04-27', status: 'scheduled', notes: '不動産投資ローン', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', bank_account_id: '2', lender_name: 'りそな銀行', monthly_repayment_amount: 350000, withdrawal_day: 25, next_withdrawal_date: '2025-04-25', status: 'scheduled', notes: '事業資金', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', bank_account_id: '3', lender_name: '三菱UFJ銀行', monthly_repayment_amount: 800000, withdrawal_day: 10, next_withdrawal_date: '2025-05-10', status: 'completed', notes: '建設資金', created_at: '', updated_at: '' },
  { id: '4', company_id: '3', bank_account_id: '4', lender_name: '日本政策金融公庫', monthly_repayment_amount: 200000, withdrawal_day: 15, next_withdrawal_date: '2025-04-15', status: 'scheduled', notes: '創業融資', created_at: '', updated_at: '' },
  { id: '5', company_id: '4', bank_account_id: '5', lender_name: '三井住友銀行', monthly_repayment_amount: 450000, withdrawal_day: 27, next_withdrawal_date: '2025-04-27', status: 'scheduled', notes: '設備投資', created_at: '', updated_at: '' },
]

interface LoanForm {
  company_id: string
  bank_account_id: string
  lender_name: string
  monthly_repayment_amount: number
  withdrawal_day: number
  next_withdrawal_date: string
  status: string
  notes: string
}

const emptyForm: LoanForm = { company_id: '', bank_account_id: '', lender_name: '', monthly_repayment_amount: 0, withdrawal_day: 27, next_withdrawal_date: '', status: 'scheduled', notes: '' }

export function LoanRepaymentsPage() {
  const { user } = useAuth()
  const editable = canEdit(user)
  const [loans, setLoans] = useState<LoanRepayment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<LoanForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setLoans(DEMO_LOANS); setCompanies(DEMO_COMPANIES); setAccounts(DEMO_ACCOUNTS); setLoading(false); return }
    const [{ data: lr }, { data: co }, { data: acc }] = await Promise.all([
      supabase.from('loan_repayments').select('*').is('deleted_at', null).order('withdrawal_day', { ascending: true }),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('bank_accounts').select('*').is('deleted_at', null).order('bank_name'),
    ])
    setLoans(lr || []); setCompanies(co as Company[] || []); setAccounts(acc || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (id: string, list: { id: string; name: string }[]) => list.find(i => i.id === id)?.name || ''
  const getAccountLabel = (id: string) => {
    const a = accounts.find(a => a.id === id)
    return a ? `${a.bank_name} ${maskAccountNumber(a.account_number)}` : ''
  }
  const getAccountBalance = (id: string) => accounts.find(a => a.id === id)?.current_balance || 0

  const filteredAccounts = form.company_id ? accounts.filter(a => a.company_id === form.company_id) : accounts

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (l: LoanRepayment) => {
    setEditingId(l.id)
    setForm({
      company_id: l.company_id, bank_account_id: l.bank_account_id || '', lender_name: l.lender_name,
      monthly_repayment_amount: l.monthly_repayment_amount, withdrawal_day: l.withdrawal_day,
      next_withdrawal_date: l.next_withdrawal_date || '', status: l.status, notes: l.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.company_id || !form.lender_name.trim() || !form.monthly_repayment_amount) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setLoans(prev => prev.map(l => l.id === editingId ? { ...l, ...form } as LoanRepayment : l))
      } else {
        setLoans(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as LoanRepayment])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('loan_repayments').update(form).eq('id', editingId) }
    else { await supabase.from('loan_repayments').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setLoans(prev => prev.filter(l => l.id !== deleteId)) }
    else { await supabase.from('loan_repayments').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = loans.filter(l => !filterCompany || l.company_id === filterCompany)
  const totalMonthly = filtered.reduce((sum, l) => sum + Number(l.monthly_repayment_amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="返済予定管理" description="毎月の銀行返済を管理します" actionLabel={editable ? '返済を登録' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterCompany || 'all'} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての会社</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">月次返済総額</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthly)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">返済件数</p><p className="text-2xl font-bold">{filtered.length}件</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">返済予定一覧（引落日順）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">引落日</TableHead>
                    <TableHead className="hidden sm:table-cell">会社</TableHead>
                    <TableHead>借入先</TableHead>
                    <TableHead>引落口座</TableHead>
                    <TableHead className="text-right">月額返済</TableHead>
                    <TableHead className="text-right hidden md:table-cell">口座残高</TableHead>
                    <TableHead className="hidden md:table-cell">次回引落</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="w-12"></TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(loan => {
                    const balance = getAccountBalance(loan.bank_account_id || '')
                    const isAtRisk = balance > 0 && balance < loan.monthly_repayment_amount * 2
                    return (
                      <TableRow key={loan.id} className={isAtRisk ? 'bg-red-50' : undefined}>
                        <TableCell className="font-mono text-center">{loan.withdrawal_day}日</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{getName(loan.company_id, companies)}</TableCell>
                        <TableCell className="font-medium">{loan.lender_name}</TableCell>
                        <TableCell className="text-sm">{getAccountLabel(loan.bank_account_id || '')}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(loan.monthly_repayment_amount)}</TableCell>
                        <TableCell className="text-right font-mono hidden md:table-cell">{loan.bank_account_id ? formatCurrency(balance) : '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{loan.next_withdrawal_date ? formatDate(loan.next_withdrawal_date) : '-'}</TableCell>
                        <TableCell><StatusBadge status={loan.status} statusMap={LOAN_REPAYMENT_STATUSES} /></TableCell>
                        <TableCell>{isAtRisk && <span title="残高不足リスク"><AlertTriangle className="h-4 w-4 text-red-500" /></span>}</TableCell>
                        {editable && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(loan)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => { setDeleteId(loan.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? '返済を編集' : '返済を登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id || 'none'} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v, bank_account_id: '' })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>借入先 <span className="text-red-500">*</span></Label>
              <Input value={form.lender_name} onChange={e => setForm({ ...form, lender_name: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>引落口座</Label>
              <Select value={form.bank_account_id || 'none'} onValueChange={v => setForm({ ...form, bank_account_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未設定</SelectItem>
                  {filteredAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {a.branch_name} ({maskAccountNumber(a.account_number)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>月額返済額 <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.monthly_repayment_amount} onChange={e => setForm({ ...form, monthly_repayment_amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>引落日 (1〜31)</Label>
              <Input type="number" min={1} max={31} value={form.withdrawal_day} onChange={e => setForm({ ...form, withdrawal_day: parseInt(e.target.value) || 27 })} />
            </div>
            <div className="space-y-2">
              <Label>次回引落日</Label>
              <Input type="date" value={form.next_withdrawal_date} onChange={e => setForm({ ...form, next_withdrawal_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>状態</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LOAN_REPAYMENT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.lender_name.trim() || !form.monthly_repayment_amount}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="返済予定を削除" description="この返済予定を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

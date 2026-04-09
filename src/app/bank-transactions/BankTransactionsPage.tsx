import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEdit } from '@/lib/permissions'
import type { BankTransaction, BankAccount } from '@/types'
import { TRANSACTION_TYPES, formatCurrency, formatDate, maskAccountNumber } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2 } from 'lucide-react'

const DEMO_ACCOUNTS: BankAccount[] = [
  { id: '1', company_id: '1', bank_name: '三井住友銀行', branch_name: '大阪中央支店', account_type: 'ordinary', account_number: '1234567', account_holder: '林建設', current_balance: 15800000, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', bank_name: 'りそな銀行', branch_name: '本町支店', account_type: 'ordinary', account_number: '2345678', account_holder: '林建設', current_balance: 8200000, created_at: '', updated_at: '' },
  { id: '3', company_id: '2', bank_name: '三菱UFJ銀行', branch_name: '梅田支店', account_type: 'ordinary', account_number: '3456789', account_holder: 'NYコーポ', current_balance: 12500000, created_at: '', updated_at: '' },
  { id: '4', company_id: '3', bank_name: '関西みらい銀行', branch_name: '天王寺支店', account_type: 'checking', account_number: '4567890', account_holder: 'オーナーズ', current_balance: 3200000, created_at: '', updated_at: '' },
]

const DEMO_TRANSACTIONS: BankTransaction[] = [
  { id: '1', bank_account_id: '1', transaction_date: '2025-04-01', transaction_type: 'deposit', description: '家賃入金（3月分）', amount: 2100000, balance_after: 15800000, created_at: '', updated_at: '' },
  { id: '2', bank_account_id: '1', transaction_date: '2025-04-05', transaction_type: 'withdrawal', description: '経費支払い アスクル', amount: 32000, balance_after: 15768000, created_at: '', updated_at: '' },
  { id: '3', bank_account_id: '2', transaction_date: '2025-04-10', transaction_type: 'withdrawal', description: '銀行返済 住宅ローン', amount: 500000, balance_after: 7700000, created_at: '', updated_at: '' },
  { id: '4', bank_account_id: '3', transaction_date: '2025-04-15', transaction_type: 'deposit', description: '家賃入金（4月分）', amount: 1400000, balance_after: 13900000, created_at: '', updated_at: '' },
  { id: '5', bank_account_id: '1', transaction_date: '2025-04-20', transaction_type: 'withdrawal', description: '給与支払い', amount: 650000, balance_after: 15118000, created_at: '', updated_at: '' },
  { id: '6', bank_account_id: '4', transaction_date: '2025-04-22', transaction_type: 'withdrawal', description: '修繕費 外壁工事', amount: 350000, balance_after: 2850000, created_at: '', updated_at: '' },
]

interface TxForm {
  bank_account_id: string
  transaction_date: string
  transaction_type: string
  description: string
  amount: number
  balance_after: number
  notes: string
}

const emptyForm: TxForm = { bank_account_id: '', transaction_date: '', transaction_type: 'deposit', description: '', amount: 0, balance_after: 0, notes: '' }

export function BankTransactionsPage() {
  const { user } = useAuth()
  const editable = canEdit(user)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TxForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterAccount, setFilterAccount] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setTransactions(DEMO_TRANSACTIONS); setAccounts(DEMO_ACCOUNTS); setLoading(false); return }
    const [{ data: tx }, { data: acc }] = await Promise.all([
      supabase.from('bank_transactions').select('*').is('deleted_at', null).order('transaction_date', { ascending: false }),
      supabase.from('bank_accounts').select('*').is('deleted_at', null).order('bank_name'),
    ])
    setTransactions(tx || []); setAccounts(acc || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getAccountLabel = (id: string) => {
    const a = accounts.find(a => a.id === id)
    return a ? `${a.bank_name} ${maskAccountNumber(a.account_number)}` : ''
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (t: BankTransaction) => {
    setEditingId(t.id)
    setForm({
      bank_account_id: t.bank_account_id, transaction_date: t.transaction_date,
      transaction_type: t.transaction_type, description: t.description || '',
      amount: t.amount, balance_after: t.balance_after || 0, notes: t.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.bank_account_id || !form.transaction_date || !form.amount) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...form } as BankTransaction : t))
      } else {
        setTransactions(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as BankTransaction])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('bank_transactions').update(form).eq('id', editingId) }
    else { await supabase.from('bank_transactions').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const filtered = transactions.filter(t => {
    if (filterAccount && t.bank_account_id !== filterAccount) return false
    if (filterType && t.transaction_type !== filterType) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="銀行取引管理" description="銀行口座の入出金履歴を管理します" actionLabel={editable ? '取引を登録' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterAccount || 'all'} onValueChange={v => setFilterAccount(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="口座で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての口座</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {maskAccountNumber(a.account_number)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType || 'all'} onValueChange={v => setFilterType(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="種別" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(TRANSACTION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>口座</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="text-right hidden md:table-cell">取引後残高</TableHead>
                    {editable && <TableHead className="w-16">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{formatDate(tx.transaction_date)}</TableCell>
                      <TableCell className="text-sm">{getAccountLabel(tx.bank_account_id)}</TableCell>
                      <TableCell><StatusBadge status={tx.transaction_type} statusMap={TRANSACTION_TYPES} /></TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell className={`text-right font-mono ${tx.transaction_type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.transaction_type === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell">{tx.balance_after != null ? formatCurrency(tx.balance_after) : '-'}</TableCell>
                      {editable && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(tx)}><Pencil className="h-4 w-4" /></Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? '取引を編集' : '取引を登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>口座 <span className="text-red-500">*</span></Label>
              <Select value={form.bank_account_id || 'none'} onValueChange={v => setForm({ ...form, bank_account_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {a.branch_name} ({maskAccountNumber(a.account_number)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>取引日 <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>種別</Label>
              <Select value={form.transaction_type} onValueChange={v => setForm({ ...form, transaction_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRANSACTION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>摘要</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>金額 <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>取引後残高</Label>
              <Input type="number" value={form.balance_after} onChange={e => setForm({ ...form, balance_after: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.bank_account_id || !form.transaction_date || !form.amount}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

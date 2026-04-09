import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditExpenses } from '@/lib/permissions'
import type { FundTransfer, BankAccount } from '@/types'
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2, ArrowRight } from 'lucide-react'

const DEMO_ACCOUNTS: BankAccount[] = [
  { id: '1', company_id: '1', bank_name: '三井住友銀行', branch_name: '大阪中央支店', account_type: 'ordinary', account_number: '1234567', account_holder: '林建設', current_balance: 15800000, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', bank_name: 'りそな銀行', branch_name: '本町支店', account_type: 'ordinary', account_number: '2345678', account_holder: '林建設', current_balance: 8200000, created_at: '', updated_at: '' },
  { id: '3', company_id: '2', bank_name: '三菱UFJ銀行', branch_name: '梅田支店', account_type: 'ordinary', account_number: '3456789', account_holder: 'NYコーポ', current_balance: 12500000, created_at: '', updated_at: '' },
  { id: '4', company_id: '3', bank_name: '関西みらい銀行', branch_name: '天王寺支店', account_type: 'checking', account_number: '4567890', account_holder: 'オーナーズ', current_balance: 3200000, created_at: '', updated_at: '' },
  { id: '5', company_id: '4', bank_name: '三井住友銀行', branch_name: '難波支店', account_type: 'ordinary', account_number: '5678901', account_holder: '株式会社照', current_balance: 6700000, created_at: '', updated_at: '' },
  { id: '6', company_id: '5', bank_name: '池田泉州銀行', branch_name: '堺支店', account_type: 'ordinary', account_number: '6789012', account_holder: '株式会社A', current_balance: 2100000, created_at: '', updated_at: '' },
]

const DEMO_TRANSFERS: FundTransfer[] = [
  { id: '1', transfer_date: '2025-04-01', from_account_id: '1', to_account_id: '2', amount: 2000000, reason: '返済資金の移動', created_at: '', updated_at: '' },
  { id: '2', transfer_date: '2025-04-05', from_account_id: '3', to_account_id: '4', amount: 500000, reason: '経費支払準備', created_at: '', updated_at: '' },
  { id: '3', transfer_date: '2025-04-10', from_account_id: '1', to_account_id: '5', amount: 3000000, reason: '工事費用振替', created_at: '', updated_at: '' },
  { id: '4', transfer_date: '2025-04-15', from_account_id: '2', to_account_id: '6', amount: 1000000, reason: '運転資金', created_at: '', updated_at: '' },
]

interface TransferForm {
  transfer_date: string
  from_account_id: string
  to_account_id: string
  amount: number
  reason: string
  notes: string
}

const emptyForm: TransferForm = { transfer_date: '', from_account_id: '', to_account_id: '', amount: 0, reason: '', notes: '' }

export function FundTransfersPage() {
  const { user } = useAuth()
  const editable = canEditExpenses(user)
  const [transfers, setTransfers] = useState<FundTransfer[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<TransferForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterAccount, setFilterAccount] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setTransfers(DEMO_TRANSFERS); setAccounts(DEMO_ACCOUNTS); setLoading(false); return }
    const [{ data: ft }, { data: acc }] = await Promise.all([
      supabase.from('fund_transfer_records').select('*').is('deleted_at', null).order('transfer_date', { ascending: false }),
      supabase.from('bank_accounts').select('*').is('deleted_at', null).order('bank_name'),
    ])
    setTransfers(ft || []); setAccounts(acc || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getAccountLabel = (id: string) => {
    const a = accounts.find(a => a.id === id)
    return a ? `${a.bank_name} ${maskAccountNumber(a.account_number)}` : ''
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (t: FundTransfer) => {
    setEditingId(t.id)
    setForm({
      transfer_date: t.transfer_date, from_account_id: t.from_account_id,
      to_account_id: t.to_account_id, amount: t.amount, reason: t.reason || '', notes: t.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.from_account_id || !form.to_account_id || !form.transfer_date || !form.amount) return
    if (form.from_account_id === form.to_account_id) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setTransfers(prev => prev.map(t => t.id === editingId ? { ...t, ...form } as FundTransfer : t))
      } else {
        setTransfers(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as FundTransfer])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('fund_transfer_records').update(form).eq('id', editingId) }
    else { await supabase.from('fund_transfer_records').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setTransfers(prev => prev.filter(t => t.id !== deleteId)) }
    else { await supabase.from('fund_transfer_records').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = transfers.filter(t => {
    if (filterAccount && t.from_account_id !== filterAccount && t.to_account_id !== filterAccount) return false
    return true
  })

  const totalAmount = filtered.reduce((sum, t) => sum + Number(t.amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="資金移動管理" description="口座間の資金移動を管理します" actionLabel={editable ? '資金移動を登録' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterAccount || 'all'} onValueChange={v => setFilterAccount(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="口座で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての口座</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {maskAccountNumber(a.account_number)}</SelectItem>)}
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
                    <TableHead>振込元</TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>振込先</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="hidden md:table-cell">理由</TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{formatDate(t.transfer_date)}</TableCell>
                      <TableCell className="text-sm">{getAccountLabel(t.from_account_id)}</TableCell>
                      <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell className="text-sm">{getAccountLabel(t.to_account_id)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(t.amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.reason}</TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(t.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length > 0 && (
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={4} className="text-right">合計</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(totalAmount)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? '資金移動を編集' : '資金移動を登録'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>日付 <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.transfer_date} onChange={e => setForm({ ...form, transfer_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>振込元口座 <span className="text-red-500">*</span></Label>
              <Select value={form.from_account_id || 'none'} onValueChange={v => setForm({ ...form, from_account_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {a.branch_name} ({maskAccountNumber(a.account_number)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>振込先口座 <span className="text-red-500">*</span></Label>
              <Select value={form.to_account_id || 'none'} onValueChange={v => setForm({ ...form, to_account_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{accounts.filter(a => a.id !== form.from_account_id).map(a => <SelectItem key={a.id} value={a.id}>{a.bank_name} {a.branch_name} ({maskAccountNumber(a.account_number)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>金額 <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>理由</Label>
              <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.from_account_id || !form.to_account_id || !form.transfer_date || !form.amount || form.from_account_id === form.to_account_id}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="資金移動を削除" description="この資金移動を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

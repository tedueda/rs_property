import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEdit } from '@/lib/permissions'
import type { BankAccount, Company } from '@/types'
import { ACCOUNT_TYPES, formatCurrency, maskAccountNumber } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
  { id: '5', name: '株式会社A', created_at: '', updated_at: '' },
  { id: '6', name: '株式会社B', created_at: '', updated_at: '' },
]

const DEMO_ACCOUNTS: BankAccount[] = [
  { id: '1', company_id: '1', bank_name: '三井住友銀行', branch_name: '大阪中央支店', account_type: 'ordinary', account_number: '1234567', account_holder: '林建設株式会社', current_balance: 15800000, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', bank_name: 'りそな銀行', branch_name: '本町支店', account_type: 'ordinary', account_number: '2345678', account_holder: '林建設株式会社', current_balance: 8200000, created_at: '', updated_at: '' },
  { id: '3', company_id: '2', bank_name: '三菱UFJ銀行', branch_name: '梅田支店', account_type: 'ordinary', account_number: '3456789', account_holder: 'N・Yコーポレーション', current_balance: 12500000, created_at: '', updated_at: '' },
  { id: '4', company_id: '3', bank_name: '関西みらい銀行', branch_name: '天王寺支店', account_type: 'checking', account_number: '4567890', account_holder: '株式会社オーナーズ', current_balance: 3200000, created_at: '', updated_at: '' },
  { id: '5', company_id: '4', bank_name: '三井住友銀行', branch_name: '難波支店', account_type: 'ordinary', account_number: '5678901', account_holder: '株式会社照', current_balance: 6700000, created_at: '', updated_at: '' },
  { id: '6', company_id: '5', bank_name: '池田泉州銀行', branch_name: '堺支店', account_type: 'ordinary', account_number: '6789012', account_holder: '株式会社A', current_balance: 2100000, created_at: '', updated_at: '' },
]

interface AccountForm {
  company_id: string
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
  current_balance: number
  notes: string
}

const emptyForm: AccountForm = { company_id: '', bank_name: '', branch_name: '', account_type: 'ordinary', account_number: '', account_holder: '', current_balance: 0, notes: '' }

export function BankAccountsPage() {
  const { user } = useAuth()
  const editable = canEdit(user)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<AccountForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setAccounts(DEMO_ACCOUNTS); setCompanies(DEMO_COMPANIES); setLoading(false); return }
    const [{ data: acc }, { data: co }] = await Promise.all([
      supabase.from('bank_accounts').select('*').is('deleted_at', null).order('created_at', { ascending: true }),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
    ])
    setAccounts(acc || []); setCompanies(co || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (id: string, list: { id: string; name: string }[]) => list.find(i => i.id === id)?.name || ''

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (a: BankAccount) => {
    setEditingId(a.id)
    setForm({
      company_id: a.company_id, bank_name: a.bank_name, branch_name: a.branch_name || '',
      account_type: a.account_type, account_number: a.account_number, account_holder: a.account_holder,
      current_balance: a.current_balance, notes: a.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.company_id || !form.bank_name.trim() || !form.account_number.trim() || !form.account_holder.trim()) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setAccounts(prev => prev.map(a => a.id === editingId ? { ...a, ...form } as BankAccount : a))
      } else {
        setAccounts(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as BankAccount])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('bank_accounts').update(form).eq('id', editingId) }
    else { await supabase.from('bank_accounts').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setAccounts(prev => prev.filter(a => a.id !== deleteId)) }
    else { await supabase.from('bank_accounts').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = accounts.filter(a => !filterCompany || a.company_id === filterCompany)
  const totalBalance = filtered.reduce((sum, a) => sum + Number(a.current_balance), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="銀行口座管理" description="会社別の銀行口座を管理します" actionLabel={editable ? '口座を追加' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterCompany || 'all'} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての会社</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">口座数</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">残高合計</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBalance)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">平均残高</p><p className="text-2xl font-bold">{formatCurrency(filtered.length > 0 ? Math.round(totalBalance / filtered.length) : 0)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会社</TableHead>
                    <TableHead>銀行名</TableHead>
                    <TableHead className="hidden sm:table-cell">支店名</TableHead>
                    <TableHead className="hidden md:table-cell">種別</TableHead>
                    <TableHead>口座番号</TableHead>
                    <TableHead className="hidden lg:table-cell">名義人</TableHead>
                    <TableHead className="text-right">残高</TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(acc => (
                    <TableRow key={acc.id}>
                      <TableCell className="text-sm">{getName(acc.company_id, companies)}</TableCell>
                      <TableCell className="font-medium">{acc.bank_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{acc.branch_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{ACCOUNT_TYPES[acc.account_type as keyof typeof ACCOUNT_TYPES]?.label || acc.account_type}</TableCell>
                      <TableCell className="font-mono text-sm">{maskAccountNumber(acc.account_number)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{acc.account_holder}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(acc.current_balance)}</TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(acc)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(acc.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? '口座を編集' : '口座を追加'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id || 'none'} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>銀行名 <span className="text-red-500">*</span></Label>
              <Input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>支店名</Label>
              <Input value={form.branch_name} onChange={e => setForm({ ...form, branch_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>口座種別</Label>
              <Select value={form.account_type} onValueChange={v => setForm({ ...form, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>口座番号 <span className="text-red-500">*</span></Label>
              <Input value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>名義人 <span className="text-red-500">*</span></Label>
              <Input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>現在残高</Label>
              <Input type="number" value={form.current_balance} onChange={e => setForm({ ...form, current_balance: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.bank_name.trim() || !form.account_number.trim() || !form.account_holder.trim()}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="口座を削除" description="この口座を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

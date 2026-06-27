import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditExpenses } from '@/lib/permissions'
import type { ExpenseRecord, Company, ExpenseCategory } from '@/types'
import { EXPENSE_STATUSES, PAYMENT_METHODS, formatCurrency, formatDate } from '@/lib/constants'
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
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
  { id: '5', name: '株式会社A', created_at: '', updated_at: '' },
  { id: '6', name: '株式会社B', created_at: '', updated_at: '' },
]

const DEMO_CATEGORIES: ExpenseCategory[] = [
  { id: '1', category_name: '事務用品費', sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', category_name: '通信費', sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', category_name: '水道光熱費', sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', category_name: '修繕費', sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', category_name: '保険料', sort_order: 5, created_at: '', updated_at: '' },
  { id: '6', category_name: '租税公課', sort_order: 6, created_at: '', updated_at: '' },
  { id: '7', category_name: '交通費', sort_order: 7, created_at: '', updated_at: '' },
  { id: '8', category_name: '雑費', sort_order: 10, created_at: '', updated_at: '' },
]

const DEMO_EXPENSES: ExpenseRecord[] = [
  { id: '1', company_id: '1', payment_date: '2025-04-05', vendor_name: 'アスクル株式会社', description: 'コピー用紙・トナー', amount: 32000, category_id: '1', payment_method: 'bank_transfer', status: 'paid', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', payment_date: '2025-04-10', vendor_name: 'NTT西日本', description: '光回線月額', amount: 5500, category_id: '2', payment_method: 'direct_debit', status: 'paid', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', payment_date: '2025-04-15', vendor_name: '関西電力', description: '電気料金', amount: 45000, category_id: '3', payment_method: 'direct_debit', status: 'scheduled', created_at: '', updated_at: '' },
  { id: '4', company_id: '3', payment_date: '2025-04-20', vendor_name: '大和修繕工業', description: '屋上防水工事', amount: 350000, category_id: '4', payment_method: 'bank_transfer', status: 'pending', created_at: '', updated_at: '' },
  { id: '5', company_id: '1', payment_date: '2025-04-01', vendor_name: '東京海上日動', description: '火災保険年払', amount: 120000, category_id: '5', payment_method: 'bank_transfer', status: 'paid', created_at: '', updated_at: '' },
  { id: '6', company_id: '4', payment_date: '2025-04-25', vendor_name: '大阪市', description: '固定資産税 第1期', amount: 85000, category_id: '6', payment_method: 'bank_transfer', status: 'scheduled', created_at: '', updated_at: '' },
]

interface ExpenseForm {
  company_id: string
  payment_date: string
  vendor_name: string
  description: string
  amount: number
  category_id: string
  payment_method: string
  status: string
  notes: string
}

const emptyForm: ExpenseForm = { company_id: '', payment_date: '', vendor_name: '', description: '', amount: 0, category_id: '', payment_method: 'bank_transfer', status: 'pending', notes: '' }

export function ExpensesPage() {
  const { user } = useAuth()
  const editable = canEditExpenses(user)
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setExpenses(DEMO_EXPENSES); setCompanies(DEMO_COMPANIES); setCategories(DEMO_CATEGORIES)
      setLoading(false); return
    }
    const [{ data: exp }, { data: co }, { data: cat }] = await Promise.all([
      supabase.from('expense_records').select('*').is('deleted_at', null).order('payment_date', { ascending: false }),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('expense_categories').select('*').is('deleted_at', null).order('sort_order'),
    ])
    setExpenses(exp || []); setCompanies(co as Company[] || []); setCategories(cat || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (id: string, list: { id: string; name?: string; category_name?: string }[]) => {
    const item = list.find(i => i.id === id)
    return item ? (item.name || item.category_name || '') : ''
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (e: ExpenseRecord) => {
    setEditingId(e.id)
    setForm({
      company_id: e.company_id, payment_date: e.payment_date, vendor_name: e.vendor_name,
      description: e.description || '', amount: e.amount, category_id: e.category_id || '',
      payment_method: e.payment_method, status: e.status, notes: e.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.company_id || !form.vendor_name.trim() || !form.payment_date) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setExpenses(prev => prev.map(e => e.id === editingId ? { ...e, ...form } as ExpenseRecord : e))
      } else {
        setExpenses(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ExpenseRecord])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('expense_records').update(form).eq('id', editingId) }
    else { await supabase.from('expense_records').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setExpenses(prev => prev.filter(e => e.id !== deleteId)) }
    else { await supabase.from('expense_records').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = expenses.filter(e => {
    if (filterCompany && e.company_id !== filterCompany) return false
    if (filterCategory && e.category_id !== filterCategory) return false
    if (filterStatus && e.status !== filterStatus) return false
    return true
  })

  const monthlyTotal = filtered.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="経費管理" description="会社別の経費を管理します" actionLabel={editable ? '経費を登録' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterCompany || 'all'} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="会社" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory || 'all'} onValueChange={v => setFilterCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="カテゴリ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(EXPENSE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>経費一覧 ({filtered.length}件)</span>
            <span className="text-lg font-bold">合計: {formatCurrency(monthlyTotal)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>支払日</TableHead>
                    <TableHead className="hidden sm:table-cell">会社</TableHead>
                    <TableHead>支払先</TableHead>
                    <TableHead className="hidden md:table-cell">カテゴリ</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead className="hidden lg:table-cell">支払方法</TableHead>
                    <TableHead>状態</TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(exp => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-sm">{formatDate(exp.payment_date)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{getName(exp.company_id, companies)}</TableCell>
                      <TableCell className="font-medium">{exp.vendor_name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{getName(exp.category_id || '', categories)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(exp.amount)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{PAYMENT_METHODS[exp.payment_method as keyof typeof PAYMENT_METHODS]?.label || exp.payment_method}</TableCell>
                      <TableCell><StatusBadge status={exp.status} statusMap={EXPENSE_STATUSES} /></TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(exp.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? '経費を編集' : '経費を登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id || 'none'} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>支払日 <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>金額 <span className="text-red-500">*</span></Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>支払先 <span className="text-red-500">*</span></Label>
              <Input value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>摘要</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select value={form.category_id || 'none'} onValueChange={v => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未分類</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>支払方法</Label>
              <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状態</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.vendor_name.trim() || !form.payment_date}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="経費を削除" description="この経費を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

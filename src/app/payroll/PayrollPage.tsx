import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditExpenses } from '@/lib/permissions'
import type { PayrollRecord, Company, Employee } from '@/types'
import { PAYROLL_STATUSES, formatCurrency, formatMonth, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2 } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
]

const DEMO_EMPLOYEES: Employee[] = [
  { id: '1', company_id: '1', employee_name: '田中太郎', status: 'active', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', employee_name: '鈴木花子', status: 'active', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', employee_name: '佐藤一郎', status: 'active', created_at: '', updated_at: '' },
  { id: '4', company_id: '3', employee_name: '山田次郎', status: 'on_leave', created_at: '', updated_at: '' },
  { id: '5', company_id: '4', employee_name: '高橋美咲', status: 'active', created_at: '', updated_at: '' },
]

const DEMO_PAYROLL: PayrollRecord[] = [
  { id: '1', company_id: '1', employee_id: '1', target_month: '2025-04', base_salary: 350000, allowance: 30000, deduction: 55000, net_payment: 325000, payment_date: '2025-04-25', status: 'paid', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', employee_id: '2', target_month: '2025-04', base_salary: 300000, allowance: 20000, deduction: 48000, net_payment: 272000, payment_date: '2025-04-25', status: 'paid', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', employee_id: '3', target_month: '2025-04', base_salary: 280000, allowance: 15000, deduction: 42000, net_payment: 253000, payment_date: '2025-04-25', status: 'confirmed', created_at: '', updated_at: '' },
  { id: '4', company_id: '3', employee_id: '4', target_month: '2025-04', base_salary: 260000, allowance: 10000, deduction: 38000, net_payment: 232000, status: 'draft', created_at: '', updated_at: '' },
  { id: '5', company_id: '4', employee_id: '5', target_month: '2025-04', base_salary: 320000, allowance: 25000, deduction: 50000, net_payment: 295000, payment_date: '2025-04-25', status: 'confirmed', created_at: '', updated_at: '' },
]

interface PayrollForm {
  company_id: string
  employee_id: string
  target_month: string
  base_salary: number
  allowance: number
  deduction: number
  net_payment: number
  payment_date: string
  status: string
  notes: string
}

const emptyForm: PayrollForm = { company_id: '', employee_id: '', target_month: '', base_salary: 0, allowance: 0, deduction: 0, net_payment: 0, payment_date: '', status: 'draft', notes: '' }

export function PayrollPage() {
  const { user } = useAuth()
  const editable = canEditExpenses(user)
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PayrollForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setRecords(DEMO_PAYROLL); setCompanies(DEMO_COMPANIES); setEmployees(DEMO_EMPLOYEES)
      setLoading(false); return
    }
    const [{ data: pr }, { data: co }, { data: emp }] = await Promise.all([
      supabase.from('payroll_records').select('*').is('deleted_at', null).order('target_month', { ascending: false }),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('employees').select('id, company_id, employee_name, status').is('deleted_at', null).order('employee_name'),
    ])
    setRecords(pr || []); setCompanies(co as Company[] || []); setEmployees(emp as Employee[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (id: string, list: { id: string; name?: string; employee_name?: string }[]) => {
    const item = list.find(i => i.id === id)
    return item ? (item.name || item.employee_name || '') : ''
  }

  const filteredEmployees = form.company_id ? employees.filter(e => e.company_id === form.company_id) : employees

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (r: PayrollRecord) => {
    setEditingId(r.id)
    setForm({
      company_id: r.company_id, employee_id: r.employee_id, target_month: r.target_month,
      base_salary: r.base_salary, allowance: r.allowance, deduction: r.deduction,
      net_payment: r.net_payment, payment_date: r.payment_date || '', status: r.status, notes: r.notes || '',
    })
    setDialogOpen(true)
  }

  const updateNetPayment = (f: PayrollForm) => ({ ...f, net_payment: f.base_salary + f.allowance - f.deduction })

  const handleSave = async () => {
    if (!form.company_id || !form.employee_id || !form.target_month) return
    setSaving(true)
    const payload = updateNetPayment(form)
    if (isDemoMode) {
      if (editingId) {
        setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } as PayrollRecord : r))
      } else {
        setRecords(prev => [...prev, { id: String(Date.now()), ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as PayrollRecord])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('payroll_records').update(payload).eq('id', editingId) }
    else { await supabase.from('payroll_records').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const filtered = records.filter(r => {
    if (filterCompany && r.company_id !== filterCompany) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const totalNet = filtered.reduce((sum, r) => sum + Number(r.net_payment), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="給与管理" description="従業員別の月次給与を管理します" actionLabel={editable ? '給与を登録' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterCompany || 'all'} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="会社" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus || 'all'} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(PAYROLL_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>給与一覧 ({filtered.length}件)</span>
            <span className="text-lg font-bold">支給合計: {formatCurrency(totalNet)}</span>
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
                    <TableHead>支給月</TableHead>
                    <TableHead className="hidden sm:table-cell">会社</TableHead>
                    <TableHead>従業員</TableHead>
                    <TableHead className="text-right hidden md:table-cell">基本給</TableHead>
                    <TableHead className="text-right hidden md:table-cell">手当</TableHead>
                    <TableHead className="text-right hidden md:table-cell">控除</TableHead>
                    <TableHead className="text-right">差引支給額</TableHead>
                    <TableHead className="hidden lg:table-cell">支給日</TableHead>
                    <TableHead>状態</TableHead>
                    {editable && <TableHead className="w-16">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatMonth(r.target_month)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{getName(r.company_id, companies)}</TableCell>
                      <TableCell className="font-medium">{getName(r.employee_id, employees)}</TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell">{formatCurrency(r.base_salary)}</TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell">{formatCurrency(r.allowance)}</TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell text-red-600">{formatCurrency(r.deduction)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatCurrency(r.net_payment)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{r.payment_date ? formatDate(r.payment_date) : '-'}</TableCell>
                      <TableCell><StatusBadge status={r.status} statusMap={PAYROLL_STATUSES} /></TableCell>
                      {editable && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? '給与を編集' : '給与を登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id || 'none'} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v, employee_id: '' })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>従業員 <span className="text-red-500">*</span></Label>
              <Select value={form.employee_id || 'none'} onValueChange={v => setForm({ ...form, employee_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                <SelectContent>{filteredEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.employee_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>支給月 <span className="text-red-500">*</span></Label>
              <Input type="month" value={form.target_month} onChange={e => setForm({ ...form, target_month: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>支給日</Label>
              <Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>基本給</Label>
              <Input type="number" value={form.base_salary} onChange={e => { const f = { ...form, base_salary: parseInt(e.target.value) || 0 }; setForm(updateNetPayment(f)) }} />
            </div>
            <div className="space-y-2">
              <Label>手当</Label>
              <Input type="number" value={form.allowance} onChange={e => { const f = { ...form, allowance: parseInt(e.target.value) || 0 }; setForm(updateNetPayment(f)) }} />
            </div>
            <div className="space-y-2">
              <Label>控除</Label>
              <Input type="number" value={form.deduction} onChange={e => { const f = { ...form, deduction: parseInt(e.target.value) || 0 }; setForm(updateNetPayment(f)) }} />
            </div>
            <div className="space-y-2">
              <Label>差引支給額</Label>
              <Input type="number" value={form.net_payment} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>状態</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYROLL_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.employee_id || !form.target_month}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

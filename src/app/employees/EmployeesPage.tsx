import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditExpenses } from '@/lib/permissions'
import type { Employee, Company } from '@/types'
import { EMPLOYEE_STATUSES } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
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

const DEMO_EMPLOYEES: Employee[] = [
  { id: '1', company_id: '1', employee_name: '田中太郎', employee_code: 'EMP001', department: '管理部', position: '部長', phone: '090-1111-1111', email: 'tanaka@example.com', joined_date: '2020-04-01', status: 'active', notes: '', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', employee_name: '鈴木花子', employee_code: 'EMP002', department: '経理部', position: '課長', phone: '090-2222-2222', email: 'suzuki@example.com', joined_date: '2021-04-01', status: 'active', notes: '', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', employee_name: '佐藤一郎', employee_code: 'EMP003', department: '営業部', position: '主任', phone: '090-3333-3333', email: 'sato@example.com', joined_date: '2019-10-01', status: 'active', notes: '', created_at: '', updated_at: '' },
  { id: '4', company_id: '3', employee_name: '山田次郎', employee_code: 'EMP004', department: '管理部', position: '一般', phone: '090-4444-4444', email: 'yamada@example.com', joined_date: '2022-01-15', status: 'on_leave', notes: '育休中', created_at: '', updated_at: '' },
  { id: '5', company_id: '4', employee_name: '高橋美咲', employee_code: 'EMP005', department: '総務部', position: '課長', phone: '090-5555-5555', email: 'takahashi@example.com', joined_date: '2018-04-01', status: 'active', notes: '', created_at: '', updated_at: '' },
]

interface EmployeeForm {
  company_id: string
  employee_name: string
  employee_code: string
  department: string
  position: string
  phone: string
  email: string
  joined_date: string
  status: string
  notes: string
}

const emptyForm: EmployeeForm = { company_id: '', employee_name: '', employee_code: '', department: '', position: '', phone: '', email: '', joined_date: '', status: 'active', notes: '' }

export function EmployeesPage() {
  const { user } = useAuth()
  const editable = canEditExpenses(user)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setEmployees(DEMO_EMPLOYEES)
      setCompanies(DEMO_COMPANIES)
      setLoading(false)
      return
    }
    const [{ data: emp }, { data: co }] = await Promise.all([
      supabase.from('employees').select('*, company:companies(id, name)').is('deleted_at', null).order('created_at', { ascending: true }),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
    ])
    setEmployees(emp || [])
    setCompanies(co as Company[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (id: string, list: { id: string; name: string }[]) => list.find(i => i.id === id)?.name || ''

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }

  const openEdit = (e: Employee) => {
    setEditingId(e.id)
    setForm({
      company_id: e.company_id, employee_name: e.employee_name, employee_code: e.employee_code || '',
      department: e.department || '', position: e.position || '', phone: e.phone || '',
      email: e.email || '', joined_date: e.joined_date || '', status: e.status, notes: e.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.company_id || !form.employee_name.trim()) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...form } as Employee : e))
      } else {
        setEmployees(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Employee])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) {
      await supabase.from('employees').update(form).eq('id', editingId)
    } else {
      await supabase.from('employees').insert(form)
    }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setEmployees(prev => prev.filter(e => e.id !== deleteId)) }
    else { await supabase.from('employees').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = employees.filter(e => {
    if (filterCompany && e.company_id !== filterCompany) return false
    if (searchQuery && !e.employee_name.includes(searchQuery) && !(e.employee_code || '').includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="従業員管理" description="従業員情報を管理します" actionLabel={editable ? '従業員を追加' : undefined} onAction={editable ? openCreate : undefined}>
        <Select value={filterCompany || 'all'} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社で絞り込み" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての会社</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="名前・コードで検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-48" />
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
                    <TableHead>社員コード</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead className="hidden sm:table-cell">会社</TableHead>
                    <TableHead className="hidden md:table-cell">部署</TableHead>
                    <TableHead className="hidden md:table-cell">役職</TableHead>
                    <TableHead>状態</TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-sm">{emp.employee_code}</TableCell>
                      <TableCell className="font-medium">{emp.employee_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{getName(emp.company_id, companies)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{emp.department}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{emp.position}</TableCell>
                      <TableCell><StatusBadge status={emp.status} statusMap={EMPLOYEE_STATUSES} /></TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(emp.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? '従業員を編集' : '従業員を追加'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id || 'none'} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>氏名 <span className="text-red-500">*</span></Label>
              <Input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>社員コード</Label>
              <Input value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>部署</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>役職</Label>
              <Input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>メール</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>入社日</Label>
              <Input type="date" value={form.joined_date} onChange={e => setForm({ ...form, joined_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>状態</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYEE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.employee_name.trim()}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="従業員を削除" description="この従業員を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

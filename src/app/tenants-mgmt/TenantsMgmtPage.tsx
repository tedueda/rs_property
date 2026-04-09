import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { isReadOnly } from '@/lib/permissions'
import type { Tenant, Room, Company } from '@/types'
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
]

const DEMO_ROOMS: Room[] = [
  { id: '1', property_id: '1', room_number: '101', rent: 65000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
  { id: '3', property_id: '1', room_number: '201', rent: 75000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 1000, status: 'occupied', created_at: '', updated_at: '' },
  { id: '4', property_id: '2', room_number: '101', rent: 80000, common_fee: 8000, water_fee: 2500, parking_fee: 15000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
]

const DEMO_TENANTS: Tenant[] = [
  { id: '1', company_id: '1', room_id: '1', full_name: '田中太郎', tenant_name: '田中太郎', phone: '090-1234-5678', email: 'tanaka@example.com', emergency_contact: '田中花子 090-8765-4321', contract_start_date: '2023-04-01', contract_end_date: '2025-03-31', guarantor_company_name: '日本保証株式会社', notes: '', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', room_id: '3', full_name: '佐藤次郎', tenant_name: '佐藤次郎', phone: '090-2345-6789', email: 'sato@example.com', emergency_contact: '佐藤美咲 090-7654-3210', contract_start_date: '2024-01-01', contract_end_date: '2025-12-31', guarantor_company_name: 'オリコ', notes: '', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', room_id: '4', full_name: '鈴木三郎', tenant_name: '鈴木三郎', phone: '080-3456-7890', email: 'suzuki@example.com', emergency_contact: '鈴木健太 080-6543-2109', contract_start_date: '2022-07-01', contract_end_date: '2024-06-30', guarantor_company_name: 'エポス保証', notes: '更新予定', created_at: '', updated_at: '' },
]

interface TenantForm {
  company_id: string
  room_id: string
  full_name: string
  phone: string
  email: string
  emergency_contact: string
  contract_start_date: string
  contract_end_date: string
  guarantor_company_name: string
  notes: string
}

const emptyForm: TenantForm = { company_id: '', room_id: '', full_name: '', phone: '', email: '', emergency_contact: '', contract_start_date: '', contract_end_date: '', guarantor_company_name: '', notes: '' }

export function TenantsMgmtPage() {
  const { user } = useAuth()
  const readOnly = isReadOnly(user)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<TenantForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES)
      setRooms(DEMO_ROOMS)
      setTenants(DEMO_TENANTS)
      setLoading(false)
      return
    }
    const [{ data: ts }, { data: cs }, { data: rs }] = await Promise.all([
      supabase.from('tenants').select('*, room:rooms(id, room_number, property_id)').is('deleted_at', null).order('full_name'),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('rooms').select('id, room_number, property_id').is('deleted_at', null).order('room_number'),
    ])
    setTenants(ts || [])
    setCompanies(cs || [])
    setRooms(rs || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getRoomNumber = (roomId?: string) => rooms.find(r => r.id === roomId)?.room_number || '-'

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (t: Tenant) => {
    setEditingId(t.id)
    setForm({
      company_id: t.company_id, room_id: t.room_id || '', full_name: t.full_name,
      phone: t.phone || '', email: t.email || '', emergency_contact: t.emergency_contact || '',
      contract_start_date: t.contract_start_date || '', contract_end_date: t.contract_end_date || '',
      guarantor_company_name: t.guarantor_company_name || '', notes: t.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.company_id) return
    setSaving(true)
    const payload = {
      company_id: form.company_id, room_id: form.room_id || null, full_name: form.full_name,
      tenant_name: form.full_name, phone: form.phone, email: form.email,
      emergency_contact: form.emergency_contact,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
      guarantor_company_name: form.guarantor_company_name, notes: form.notes,
    }
    if (isDemoMode) {
      if (editingId) { setTenants(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } as Tenant : t)) }
      else { setTenants(prev => [...prev, { id: String(Date.now()), ...payload, created_at: '', updated_at: '' } as Tenant]) }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('tenants').update(payload).eq('id', editingId) }
    else { await supabase.from('tenants').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setTenants(prev => prev.filter(t => t.id !== deleteId)) }
    else { await supabase.from('tenants').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = tenants.filter(t => {
    if (filterCompany !== 'all' && t.company_id !== filterCompany) return false
    if (searchQuery && !t.full_name.includes(searchQuery) && !(t.phone || '').includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="入居者管理" description="入居者情報を管理します" actionLabel={readOnly ? undefined : '入居者を追加'} onAction={readOnly ? undefined : openCreate}>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社で絞込" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての会社</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="名前・電話で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" />
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
                    <TableHead>入居者名</TableHead>
                    <TableHead>部屋番号</TableHead>
                    <TableHead className="hidden sm:table-cell">電話番号</TableHead>
                    <TableHead className="hidden md:table-cell">メール</TableHead>
                    <TableHead className="hidden lg:table-cell">契約開始</TableHead>
                    <TableHead className="hidden lg:table-cell">契約終了</TableHead>
                    <TableHead className="hidden xl:table-cell">保証会社</TableHead>
                    {!readOnly && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.full_name}</TableCell>
                      <TableCell className="text-sm">{getRoomNumber(t.room_id)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{t.phone}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{t.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{t.contract_start_date}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{t.contract_end_date}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm">{t.guarantor_company_name}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(t.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? '入居者を編集' : '入居者を追加'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>会社 <span className="text-red-500">*</span></Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                  <SelectTrigger><SelectValue placeholder="会社を選択" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>部屋</Label>
                <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="部屋を選択" /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>入居者名 <span className="text-red-500">*</span></Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="田中太郎" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>電話番号</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="090-1234-5678" /></div>
              <div className="space-y-2"><Label>メールアドレス</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tanaka@example.com" /></div>
            </div>
            <div className="space-y-2">
              <Label>緊急連絡先</Label>
              <Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="田中花子 090-8765-4321" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>契約開始日</Label><Input type="date" value={form.contract_start_date} onChange={(e) => setForm({ ...form, contract_start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>契約終了日</Label><Input type="date" value={form.contract_end_date} onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>保証会社名</Label>
              <Input value={form.guarantor_company_name} onChange={(e) => setForm({ ...form, guarantor_company_name: e.target.value })} placeholder="日本保証株式会社" />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="メモ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name.trim() || !form.company_id}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="入居者を削除" description="この入居者を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

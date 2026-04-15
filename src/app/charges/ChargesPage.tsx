import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditPayments } from '@/lib/permissions'
import type { MonthlyCharge, Company, Property, Room, Tenant } from '@/types'
import { CHARGE_STATUSES, formatCurrency, formatMonth } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2, CheckCircle } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
]
const DEMO_PROPERTIES: Property[] = [
  { id: '1', company_id: '1', name: '林ビル本町', address: '', total_units: 20, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', name: '林マンション難波', address: '', total_units: 30, created_at: '', updated_at: '' },
]
const DEMO_ROOMS: Room[] = [
  { id: '1', property_id: '1', room_number: '101', rent: 65000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
  { id: '3', property_id: '1', room_number: '201', rent: 75000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 1000, status: 'occupied', created_at: '', updated_at: '' },
]
const DEMO_TENANTS: Tenant[] = [
  { id: '1', company_id: '1', room_id: '1', full_name: '田中太郎', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', room_id: '3', full_name: '佐藤次郎', created_at: '', updated_at: '' },
]
const DEMO_CHARGES: MonthlyCharge[] = [
  { id: '1', company_id: '1', property_id: '1', room_id: '1', tenant_id: '1', target_month: '2026-04', rent_amount: 65000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 0, billed_total: 82000, status: 'confirmed', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', property_id: '1', room_id: '3', tenant_id: '2', target_month: '2026-04', rent_amount: 75000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 1000, billed_total: 93000, status: 'draft', created_at: '', updated_at: '' },
  { id: '3', company_id: '1', property_id: '1', room_id: '1', tenant_id: '1', target_month: '2026-03', rent_amount: 65000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 0, billed_total: 82000, status: 'paid', created_at: '', updated_at: '' },
  { id: '4', company_id: '1', property_id: '1', room_id: '3', tenant_id: '2', target_month: '2026-03', rent_amount: 75000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 1000, billed_total: 93000, status: 'overdue', created_at: '', updated_at: '' },
]

interface ChargeForm {
  company_id: string
  property_id: string
  room_id: string
  tenant_id: string
  target_month: string
  rent_amount: string
  common_fee_amount: string
  water_fee_amount: string
  parking_fee_amount: string
  other_amount: string
}

const emptyForm: ChargeForm = { company_id: '', property_id: '', room_id: '', tenant_id: '', target_month: '', rent_amount: '0', common_fee_amount: '0', water_fee_amount: '0', parking_fee_amount: '0', other_amount: '0' }

export function ChargesPage() {
  const { user } = useAuth()
  const canEdit = canEditPayments(user)
  const [charges, setCharges] = useState<MonthlyCharge[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [form, setForm] = useState<ChargeForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterProperty, setFilterProperty] = useState<string>('all')
  const [filterMonth, setFilterMonth] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES); setProperties(DEMO_PROPERTIES); setRooms(DEMO_ROOMS); setTenants(DEMO_TENANTS); setCharges(DEMO_CHARGES)
      setLoading(false); return
    }
    const [{ data: ch }, { data: co }, { data: pr }, { data: rm }, { data: tn }] = await Promise.all([
      supabase.from('monthly_charges').select('*').is('deleted_at', null).order('target_month', { ascending: false }),
      supabase.from('companies').select('id, name').is('deleted_at', null),
      supabase.from('properties').select('id, name, company_id').is('deleted_at', null),
      supabase.from('rooms').select('id, room_number, property_id, rent, common_fee, water_fee, parking_fee, other_fixed_fee').is('deleted_at', null),
      supabase.from('tenants').select('id, full_name, company_id, room_id').is('deleted_at', null),
    ])
    setCharges(ch || []); setCompanies(co || []); setProperties(pr || []); setRooms(rm || []); setTenants(tn || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (list: { id: string; name?: string; full_name?: string; room_number?: string }[], id: string) => {
    const item = list.find(i => i.id === id)
    return item?.name || item?.full_name || item?.room_number || '-'
  }

  const calcTotal = (f: ChargeForm) => Number(f.rent_amount) + Number(f.common_fee_amount) + Number(f.water_fee_amount) + Number(f.parking_fee_amount) + Number(f.other_amount)

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (c: MonthlyCharge) => {
    setEditingId(c.id)
    setForm({
      company_id: c.company_id, property_id: c.property_id, room_id: c.room_id, tenant_id: c.tenant_id,
      target_month: c.target_month, rent_amount: String(c.rent_amount), common_fee_amount: String(c.common_fee_amount),
      water_fee_amount: String(c.water_fee_amount), parking_fee_amount: String(c.parking_fee_amount), other_amount: String(c.other_amount),
    })
    setDialogOpen(true)
  }

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setForm(prev => ({
        ...prev, room_id: roomId,
        rent_amount: String(room.rent), common_fee_amount: String(room.common_fee),
        water_fee_amount: String(room.water_fee), parking_fee_amount: String(room.parking_fee),
        other_amount: String(room.other_fixed_fee),
      }))
    }
  }

  const handleSave = async () => {
    if (!form.company_id || !form.property_id || !form.room_id || !form.tenant_id || !form.target_month) return
    setSaving(true)
    const payload = {
      company_id: form.company_id, property_id: form.property_id, room_id: form.room_id, tenant_id: form.tenant_id,
      target_month: form.target_month, rent_amount: Number(form.rent_amount), common_fee_amount: Number(form.common_fee_amount),
      water_fee_amount: Number(form.water_fee_amount), parking_fee_amount: Number(form.parking_fee_amount),
      other_amount: Number(form.other_amount), billed_total: calcTotal(form), status: 'draft' as const,
    }
    if (isDemoMode) {
      if (editingId) { setCharges(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c)) }
      else { setCharges(prev => [{ id: String(Date.now()), ...payload, created_at: '', updated_at: '' }, ...prev]) }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('monthly_charges').update({ ...payload, status: undefined }).eq('id', editingId) }
    else { await supabase.from('monthly_charges').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleConfirm = async () => {
    if (!confirmId) return
    setSaving(true)
    if (isDemoMode) { setCharges(prev => prev.map(c => c.id === confirmId ? { ...c, status: 'confirmed' as const } : c)) }
    else { await supabase.from('monthly_charges').update({ status: 'confirmed' }).eq('id', confirmId); fetchData() }
    setSaving(false); setConfirmDialogOpen(false); setConfirmId(null)
  }

  const filteredProperties = filterCompany !== 'all' ? properties.filter(p => p.company_id === filterCompany) : properties
  const formFilteredProperties = form.company_id ? properties.filter(p => p.company_id === form.company_id) : properties
  const filteredRooms = form.property_id ? rooms.filter(r => r.property_id === form.property_id) : rooms
  const filteredTenants = form.company_id ? tenants.filter(t => t.company_id === form.company_id) : tenants

  const filtered = charges.filter(c => {
    if (filterCompany !== 'all' && c.company_id !== filterCompany) return false
    if (filterProperty !== 'all' && c.property_id !== filterProperty) return false
    if (filterMonth && c.target_month !== filterMonth) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="家賃請求管理" description="月次請求データの管理" actionLabel={canEdit ? '請求を登録' : undefined} onAction={canEdit ? openCreate : undefined}>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-40"><SelectValue placeholder="会社" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全会社</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-40"><SelectValue placeholder="物件" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全物件</SelectItem>{filteredProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-40" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全状態</SelectItem>{Object.entries(CHARGE_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
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
                    <TableHead>対象月</TableHead>
                    <TableHead className="hidden sm:table-cell">会社</TableHead>
                    <TableHead className="hidden md:table-cell">物件</TableHead>
                    <TableHead>部屋</TableHead>
                    <TableHead>入居者</TableHead>
                    <TableHead className="text-right">請求合計</TableHead>
                    <TableHead>状態</TableHead>
                    {canEdit && <TableHead className="w-28">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{formatMonth(c.target_month)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{getName(companies, c.company_id)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{getName(properties, c.property_id)}</TableCell>
                      <TableCell className="text-sm">{getName(rooms, c.room_id)}</TableCell>
                      <TableCell className="text-sm">{getName(tenants, c.tenant_id)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(c.billed_total)}</TableCell>
                      <TableCell><StatusBadge statusMap={CHARGE_STATUSES} status={c.status} /></TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)} disabled={c.status !== 'draft'}><Pencil className="h-4 w-4" /></Button>
                            {c.status === 'draft' && (
                              <Button variant="ghost" size="icon" onClick={() => { setConfirmId(c.id); setConfirmDialogOpen(true) }} title="確定">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
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
          <DialogHeader><DialogTitle>{editingId ? '請求を編集' : '請求を登録'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>会社 <span className="text-red-500">*</span></Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v, property_id: '', room_id: '', tenant_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>物件 <span className="text-red-500">*</span></Label>
                <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v, room_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{formFilteredProperties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>部屋 <span className="text-red-500">*</span></Label>
                <Select value={form.room_id} onValueChange={handleRoomSelect}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{filteredRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>入居者 <span className="text-red-500">*</span></Label>
                <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{filteredTenants.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>対象月 <span className="text-red-500">*</span></Label>
              <Input type="month" value={form.target_month} onChange={(e) => setForm({ ...form, target_month: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>家賃</Label><Input type="number" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>共益費</Label><Input type="number" value={form.common_fee_amount} onChange={(e) => setForm({ ...form, common_fee_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>水道代</Label><Input type="number" value={form.water_fee_amount} onChange={(e) => setForm({ ...form, water_fee_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>駐車場代</Label><Input type="number" value={form.parking_fee_amount} onChange={(e) => setForm({ ...form, parking_fee_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>その他</Label><Input type="number" value={form.other_amount} onChange={(e) => setForm({ ...form, other_amount: e.target.value })} /></div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">請求合計</span>
                <span className="text-xl font-bold text-blue-700">{formatCurrency(calcTotal(form))}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.company_id || !form.property_id || !form.room_id || !form.tenant_id || !form.target_month}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} title="請求を確定" description="この請求を確定してもよろしいですか？確定後は編集できません。" confirmLabel="確定" onConfirm={handleConfirm} loading={saving} />
    </div>
  )
}

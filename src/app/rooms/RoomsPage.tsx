import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { isReadOnly } from '@/lib/permissions'
import type { Room, Property } from '@/types'
import { ROOM_STATUSES, formatCurrency } from '@/lib/constants'
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
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const DEMO_PROPERTIES: Property[] = [
  { id: '1', company_id: '1', name: '林ビル本町', address: '大阪府', total_units: 20, created_at: '', updated_at: '' },
  { id: '2', company_id: '1', name: '林マンション難波', address: '大阪府', total_units: 30, created_at: '', updated_at: '' },
  { id: '3', company_id: '2', name: 'NYコーポ梅田', address: '大阪府', total_units: 15, created_at: '', updated_at: '' },
]

const DEMO_ROOMS: Room[] = [
  { id: '1', property_id: '1', room_number: '101', rent: 65000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
  { id: '2', property_id: '1', room_number: '102', rent: 70000, common_fee: 5000, water_fee: 2000, parking_fee: 0, other_fixed_fee: 0, status: 'vacant', created_at: '', updated_at: '' },
  { id: '3', property_id: '1', room_number: '201', rent: 75000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 1000, status: 'occupied', created_at: '', updated_at: '' },
  { id: '4', property_id: '2', room_number: '101', rent: 80000, common_fee: 8000, water_fee: 2500, parking_fee: 15000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
  { id: '5', property_id: '3', room_number: '301', rent: 55000, common_fee: 4000, water_fee: 2000, parking_fee: 0, other_fixed_fee: 0, status: 'maintenance', created_at: '', updated_at: '' },
]

interface RoomForm {
  property_id: string
  room_number: string
  rent: string
  common_fee: string
  water_fee: string
  parking_fee: string
  other_fixed_fee: string
  status: string
}

const emptyForm: RoomForm = { property_id: '', room_number: '', rent: '0', common_fee: '0', water_fee: '0', parking_fee: '0', other_fixed_fee: '0', status: 'vacant' }

export function RoomsPage() {
  const { user } = useAuth()
  const readOnly = isReadOnly(user)
  const [rooms, setRooms] = useState<Room[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<RoomForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterProperty, setFilterProperty] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setProperties(DEMO_PROPERTIES)
      setRooms(DEMO_ROOMS)
      setLoading(false)
      return
    }
    const [{ data: rms }, { data: props }] = await Promise.all([
      supabase.from('rooms').select('*, property:properties(id, name, company_id)').is('deleted_at', null).order('room_number'),
      supabase.from('properties').select('id, name, company_id').is('deleted_at', null).order('name'),
    ])
    setRooms(rms || [])
    setProperties(props || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getPropertyName = (propertyId: string) => properties.find(p => p.id === propertyId)?.name || ''

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (r: Room) => {
    setEditingId(r.id)
    setForm({
      property_id: r.property_id, room_number: r.room_number,
      rent: String(r.rent), common_fee: String(r.common_fee), water_fee: String(r.water_fee),
      parking_fee: String(r.parking_fee), other_fixed_fee: String(r.other_fixed_fee), status: r.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.room_number.trim() || !form.property_id) return
    setSaving(true)
    const payload = {
      property_id: form.property_id, room_number: form.room_number,
      rent: Number(form.rent), common_fee: Number(form.common_fee), water_fee: Number(form.water_fee),
      parking_fee: Number(form.parking_fee), other_fixed_fee: Number(form.other_fixed_fee), status: form.status,
    }
    if (isDemoMode) {
      if (editingId) {
        setRooms(prev => prev.map(r => r.id === editingId ? { ...r, ...payload } : r))
      } else {
        setRooms(prev => [...prev, { id: String(Date.now()), ...payload, created_at: '', updated_at: '' }])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('rooms').update(payload).eq('id', editingId) }
    else { await supabase.from('rooms').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setRooms(prev => prev.filter(r => r.id !== deleteId)) }
    else { await supabase.from('rooms').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = rooms.filter(r => {
    if (filterProperty !== 'all' && r.property_id !== filterProperty) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="部屋管理" description="各物件の部屋情報を管理します" actionLabel={readOnly ? undefined : '部屋を追加'} onAction={readOnly ? undefined : openCreate}>
        <Select value={filterProperty} onValueChange={setFilterProperty}>
          <SelectTrigger className="w-48"><SelectValue placeholder="物件で絞込" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての物件</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(ROOM_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
                    <TableHead>物件</TableHead>
                    <TableHead>部屋番号</TableHead>
                    <TableHead className="text-right">家賃</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">共益費</TableHead>
                    <TableHead className="text-right hidden md:table-cell">水道代</TableHead>
                    <TableHead className="text-right hidden md:table-cell">駐車場代</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">その他</TableHead>
                    <TableHead>状態</TableHead>
                    {!readOnly && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{getPropertyName(r.property_id)}</TableCell>
                      <TableCell className="font-medium">{r.room_number}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(r.rent)}</TableCell>
                      <TableCell className="text-right font-mono text-sm hidden sm:table-cell">{formatCurrency(r.common_fee)}</TableCell>
                      <TableCell className="text-right font-mono text-sm hidden md:table-cell">{formatCurrency(r.water_fee)}</TableCell>
                      <TableCell className="text-right font-mono text-sm hidden md:table-cell">{formatCurrency(r.parking_fee)}</TableCell>
                      <TableCell className="text-right font-mono text-sm hidden lg:table-cell">{formatCurrency(r.other_fixed_fee)}</TableCell>
                      <TableCell><StatusBadge statusMap={ROOM_STATUSES} status={r.status} /></TableCell>
                      {!readOnly && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(r.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? '部屋を編集' : '部屋を追加'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>物件 <span className="text-red-500">*</span></Label>
              <Select value={form.property_id} onValueChange={(v) => setForm({ ...form, property_id: v })}>
                <SelectTrigger><SelectValue placeholder="物件を選択" /></SelectTrigger>
                <SelectContent>{properties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>部屋番号 <span className="text-red-500">*</span></Label>
              <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder="101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>家賃</Label><Input type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} /></div>
              <div className="space-y-2"><Label>共益費</Label><Input type="number" value={form.common_fee} onChange={(e) => setForm({ ...form, common_fee: e.target.value })} /></div>
              <div className="space-y-2"><Label>水道代</Label><Input type="number" value={form.water_fee} onChange={(e) => setForm({ ...form, water_fee: e.target.value })} /></div>
              <div className="space-y-2"><Label>駐車場代</Label><Input type="number" value={form.parking_fee} onChange={(e) => setForm({ ...form, parking_fee: e.target.value })} /></div>
              <div className="space-y-2"><Label>その他固定費</Label><Input type="number" value={form.other_fixed_fee} onChange={(e) => setForm({ ...form, other_fixed_fee: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>状態</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROOM_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.room_number.trim() || !form.property_id}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="部屋を削除" description="この部屋を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

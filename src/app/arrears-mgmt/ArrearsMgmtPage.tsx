import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditPayments } from '@/lib/permissions'
import type { ArrearsRecord, Company, Tenant, Room } from '@/types'
import { ARREARS_STATUSES, formatCurrency, formatMonth } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2, AlertTriangle } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
]
const DEMO_TENANTS: Tenant[] = [
  { id: '2', company_id: '1', full_name: '佐藤次郎', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', full_name: '鈴木三郎', created_at: '', updated_at: '' },
]
const DEMO_ROOMS: Room[] = [
  { id: '3', property_id: '1', room_number: '201', rent: 75000, common_fee: 5000, water_fee: 2000, parking_fee: 10000, other_fixed_fee: 1000, status: 'occupied', created_at: '', updated_at: '' },
  { id: '4', property_id: '2', room_number: '101', rent: 80000, common_fee: 8000, water_fee: 2500, parking_fee: 15000, other_fixed_fee: 0, status: 'occupied', created_at: '', updated_at: '' },
]
const DEMO_ARREARS: ArrearsRecord[] = [
  { id: '1', company_id: '1', monthly_charge_id: '4', tenant_id: '2', room_id: '3', target_month: '2026-03', billed_total: 93000, paid_total: 50000, arrears_amount: 43000, status: 'outstanding', notes: '', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', monthly_charge_id: '2', tenant_id: '2', room_id: '3', target_month: '2026-04', billed_total: 93000, paid_total: 80000, arrears_amount: 13000, status: 'partially_paid', notes: '一部入金あり', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', monthly_charge_id: '5', tenant_id: '3', room_id: '4', target_month: '2026-02', billed_total: 105500, paid_total: 0, arrears_amount: 105500, status: 'outstanding', notes: '連絡取れず', created_at: '', updated_at: '' },
]

export function ArrearsMgmtPage() {
  const { user } = useAuth()
  const canEdit = canEditPayments(user)
  const [arrears, setArrears] = useState<ArrearsRecord[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES); setTenants(DEMO_TENANTS); setRooms(DEMO_ROOMS); setArrears(DEMO_ARREARS)
      setLoading(false); return
    }
    const [{ data: ar }, { data: co }, { data: tn }, { data: rm }] = await Promise.all([
      supabase.from('arrears_records').select('*').is('deleted_at', null).order('target_month', { ascending: false }),
      supabase.from('companies').select('id, name').is('deleted_at', null),
      supabase.from('tenants').select('id, full_name, company_id').is('deleted_at', null),
      supabase.from('rooms').select('id, room_number, property_id').is('deleted_at', null),
    ])
    setArrears(ar || []); setCompanies(co || []); setTenants(tn || []); setRooms(rm || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getName = (list: { id: string; name?: string; full_name?: string; room_number?: string }[], id: string) => {
    const item = list.find(i => i.id === id)
    return item?.name || item?.full_name || item?.room_number || '-'
  }

  const openEdit = (a: ArrearsRecord) => {
    setEditingId(a.id); setEditNotes(a.notes || ''); setEditStatus(a.status); setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingId) return
    setSaving(true)
    if (isDemoMode) {
      setArrears(prev => prev.map(a => a.id === editingId ? { ...a, notes: editNotes, status: editStatus as ArrearsRecord['status'] } : a))
    } else {
      await supabase.from('arrears_records').update({ notes: editNotes, status: editStatus }).eq('id', editingId)
      fetchData()
    }
    setSaving(false); setEditDialogOpen(false)
  }

  const filtered = arrears.filter(a => {
    if (filterCompany !== 'all' && a.company_id !== filterCompany) return false
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    return true
  })

  const totalArrears = filtered.reduce((sum, a) => sum + a.arrears_amount, 0)
  const outstandingCount = filtered.filter(a => a.status === 'outstanding').length

  return (
    <div className="space-y-6">
      <PageHeader title="未収・滞納管理" description="請求と入金の差額から未収を管理します">
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社" /></SelectTrigger>
          <SelectContent><SelectItem value="all">全会社</SelectItem>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent><SelectItem value="all">すべて</SelectItem>{Object.entries(ARREARS_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">未収件数</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{filtered.length}件</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">未収総額</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalArrears)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">滞納対象</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{outstandingCount}件</span>
            </div>
          </CardContent>
        </Card>
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
                    <TableHead>対象月</TableHead>
                    <TableHead>会社</TableHead>
                    <TableHead>入居者</TableHead>
                    <TableHead>部屋</TableHead>
                    <TableHead className="text-right">請求額</TableHead>
                    <TableHead className="text-right">入金額</TableHead>
                    <TableHead className="text-right">未収額</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="hidden md:table-cell">備考</TableHead>
                    {canEdit && <TableHead className="w-16">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">未収データがありません</TableCell></TableRow>
                  ) : filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{formatMonth(a.target_month)}</TableCell>
                      <TableCell className="text-sm">{getName(companies, a.company_id)}</TableCell>
                      <TableCell className="text-sm">{getName(tenants, a.tenant_id)}</TableCell>
                      <TableCell className="text-sm">{getName(rooms, a.room_id)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(a.billed_total)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(a.paid_total)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-red-600">{formatCurrency(a.arrears_amount)}</TableCell>
                      <TableCell><StatusBadge statusMap={ARREARS_STATUSES} status={a.status} /></TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{a.notes}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>未収情報を編集</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>状態</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ARREARS_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="対応メモ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

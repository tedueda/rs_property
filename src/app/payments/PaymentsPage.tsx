import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditPayments } from '@/lib/permissions'
import type { PaymentRecord, MonthlyCharge } from '@/types'
import { PAYMENT_STATUSES, formatCurrency } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2, Link as LinkIcon } from 'lucide-react'

const DEMO_CHARGES: MonthlyCharge[] = [
  { id: '1', company_id: '1', property_id: '1', room_id: '1', tenant_id: '1', target_month: '2026-04', rent_amount: 65000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 0, billed_total: 82000, status: 'confirmed', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', property_id: '1', room_id: '3', tenant_id: '2', target_month: '2026-04', rent_amount: 75000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 1000, billed_total: 93000, status: 'confirmed', created_at: '', updated_at: '' },
  { id: '4', company_id: '1', property_id: '1', room_id: '3', tenant_id: '2', target_month: '2026-03', rent_amount: 75000, common_fee_amount: 5000, water_fee_amount: 2000, parking_fee_amount: 10000, other_amount: 1000, billed_total: 93000, status: 'overdue', created_at: '', updated_at: '' },
]

const DEMO_PAYMENTS: PaymentRecord[] = [
  { id: '1', payment_date: '2026-04-05', payer_name: '田中太郎', description: '4月分家賃', paid_amount: 82000, linked_charge_id: '1', difference_amount: 0, status: 'matched', created_at: '', updated_at: '' },
  { id: '2', payment_date: '2026-04-03', payer_name: '佐藤次郎', description: '4月分家賃', paid_amount: 80000, linked_charge_id: '2', difference_amount: -13000, status: 'partial', created_at: '', updated_at: '' },
  { id: '3', payment_date: '2026-04-07', payer_name: '不明入金', description: '振込人不明', paid_amount: 50000, status: 'unmatched', difference_amount: 0, created_at: '', updated_at: '' },
  { id: '4', payment_date: '2026-03-28', payer_name: '佐藤次郎', description: '3月分家賃（一部）', paid_amount: 50000, linked_charge_id: '4', difference_amount: -43000, status: 'arrears', created_at: '', updated_at: '' },
]

interface PaymentForm {
  payment_date: string
  payer_name: string
  description: string
  paid_amount: string
  linked_charge_id: string
  status: string
}

const emptyForm: PaymentForm = { payment_date: '', payer_name: '', description: '', paid_amount: '0', linked_charge_id: '', status: 'unmatched' }

export function PaymentsPage() {
  const { user } = useAuth()
  const canEdit = canEditPayments(user)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [charges, setCharges] = useState<MonthlyCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PaymentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setPayments(DEMO_PAYMENTS); setCharges(DEMO_CHARGES)
      setLoading(false); return
    }
    const [{ data: pm }, { data: ch }] = await Promise.all([
      supabase.from('payment_records').select('*').is('deleted_at', null).order('payment_date', { ascending: false }),
      supabase.from('monthly_charges').select('id, target_month, billed_total, tenant_id, room_id, status').is('deleted_at', null).in('status', ['confirmed', 'partial_paid', 'overdue']),
    ])
    setPayments(pm || []); setCharges(ch || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getChargeLabel = (chargeId?: string) => {
    if (!chargeId) return '-'
    const c = charges.find(ch => ch.id === chargeId)
    return c ? `${c.target_month} / ${formatCurrency(c.billed_total)}` : chargeId
  }

  const calcDifference = (paidAmount: string, chargeId: string): number => {
    if (!chargeId || chargeId === 'none') return 0
    const charge = charges.find(c => c.id === chargeId)
    if (!charge) return 0
    return Number(paidAmount) - charge.billed_total
  }

  const determineStatus = (paidAmount: string, chargeId: string): string => {
    if (!chargeId || chargeId === 'none') return 'unmatched'
    const diff = calcDifference(paidAmount, chargeId)
    if (diff === 0) return 'matched'
    if (diff < 0) return 'partial'
    if (diff > 0) return 'overpaid'
    return 'needs_review'
  }

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (p: PaymentRecord) => {
    setEditingId(p.id)
    setForm({
      payment_date: p.payment_date, payer_name: p.payer_name, description: p.description || '',
      paid_amount: String(p.paid_amount), linked_charge_id: p.linked_charge_id || '', status: p.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.payer_name.trim() || !form.payment_date) return
    setSaving(true)
    const diff = calcDifference(form.paid_amount, form.linked_charge_id)
    const status = determineStatus(form.paid_amount, form.linked_charge_id)
    const payload = {
      payment_date: form.payment_date, payer_name: form.payer_name, description: form.description,
      paid_amount: Number(form.paid_amount), linked_charge_id: form.linked_charge_id === 'none' ? null : (form.linked_charge_id || null),
      difference_amount: diff, status,
    }
    if (isDemoMode) {
      if (editingId) { setPayments(prev => prev.map(p => p.id === editingId ? { ...p, ...payload } as PaymentRecord : p)) }
      else { setPayments(prev => [{ id: String(Date.now()), ...payload, created_at: '', updated_at: '' } as PaymentRecord, ...prev]) }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('payment_records').update(payload).eq('id', editingId) }
    else { await supabase.from('payment_records').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const filtered = payments.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (searchQuery && !p.payer_name.includes(searchQuery) && !(p.description || '').includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="入金管理" description="銀行入金情報の管理と請求との照合" actionLabel={canEdit ? '入金を登録' : undefined} onAction={canEdit ? openCreate : undefined}>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="状態" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {Object.entries(PAYMENT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="支払者名で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48" />
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
                    <TableHead>入金日</TableHead>
                    <TableHead>支払者名</TableHead>
                    <TableHead className="hidden sm:table-cell">摘要</TableHead>
                    <TableHead className="text-right">入金額</TableHead>
                    <TableHead className="hidden md:table-cell">紐付け請求</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">差額</TableHead>
                    <TableHead>状態</TableHead>
                    {canEdit && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.payment_date}</TableCell>
                      <TableCell className="font-medium">{p.payer_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{p.description}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(p.paid_amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {p.linked_charge_id ? (
                          <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" />{getChargeLabel(p.linked_charge_id)}</span>
                        ) : <span className="text-muted-foreground">未紐付け</span>}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm hidden lg:table-cell ${p.difference_amount < 0 ? 'text-red-600' : p.difference_amount > 0 ? 'text-blue-600' : ''}`}>
                        {p.linked_charge_id ? formatCurrency(p.difference_amount) : '-'}
                      </TableCell>
                      <TableCell><StatusBadge statusMap={PAYMENT_STATUSES} status={p.status} /></TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? '入金を編集' : '入金を登録'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>入金日 <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>入金額 <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>支払者名 <span className="text-red-500">*</span></Label>
              <Input value={form.payer_name} onChange={(e) => setForm({ ...form, payer_name: e.target.value })} placeholder="田中太郎" />
            </div>
            <div className="space-y-2">
              <Label>摘要</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="4月分家賃" />
            </div>
            <div className="space-y-2">
              <Label>紐付け請求</Label>
              <Select value={form.linked_charge_id} onValueChange={(v) => setForm({ ...form, linked_charge_id: v })}>
                <SelectTrigger><SelectValue placeholder="請求を選択（任意）" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">紐付けなし</SelectItem>
                  {charges.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.target_month} - {formatCurrency(c.billed_total)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.linked_charge_id && form.linked_charge_id !== 'none' && (
              <div className="border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between text-sm">
                  <span>差額</span>
                  <span className={`font-mono font-medium ${calcDifference(form.paid_amount, form.linked_charge_id) < 0 ? 'text-red-600' : calcDifference(form.paid_amount, form.linked_charge_id) > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                    {formatCurrency(calcDifference(form.paid_amount, form.linked_charge_id))}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>判定</span>
                  <StatusBadge statusMap={PAYMENT_STATUSES} status={determineStatus(form.paid_amount, form.linked_charge_id)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.payer_name.trim() || !form.payment_date}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

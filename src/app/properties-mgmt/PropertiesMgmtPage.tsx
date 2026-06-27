import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { isReadOnly } from '@/lib/permissions'
import type { Property, Company } from '@/types'
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
]

const DEMO_PROPERTIES: Property[] = [
  { id: '1', company_id: '1', name: '林ビル本町', address: '大阪府大阪市中央区本町1-1-1', total_units: 20, management_start_date: '2020-04-01', notes: '本社ビル', created_at: '', updated_at: '' },
  { id: '2', company_id: '1', name: '林マンション難波', address: '大阪府大阪市浪速区難波2-2-2', total_units: 30, management_start_date: '2021-01-01', notes: '', created_at: '', updated_at: '' },
  { id: '3', company_id: '2', name: 'NYコーポ梅田', address: '大阪府大阪市北区梅田3-3-3', total_units: 15, management_start_date: '2019-06-01', notes: '', created_at: '', updated_at: '' },
]

interface PropertyForm {
  company_id: string
  name: string
  address: string
  management_start_date: string
  notes: string
}

const emptyForm: PropertyForm = { company_id: '', name: '', address: '', management_start_date: '', notes: '' }

export function PropertiesMgmtPage() {
  const { user } = useAuth()
  const readOnly = isReadOnly(user)
  const [properties, setProperties] = useState<Property[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<PropertyForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES)
      setProperties(DEMO_PROPERTIES)
      setLoading(false)
      return
    }
    const [{ data: props }, { data: comps }] = await Promise.all([
      supabase.from('properties').select('*, company:companies(id, name)').is('deleted_at', null).order('created_at'),
      supabase.from('companies').select('id, name').is('deleted_at', null).order('name'),
    ])
    setProperties(props || [])
    setCompanies(comps as Company[] || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getCompanyName = (companyId: string) => companies.find(c => c.id === companyId)?.name || ''

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }

  const openEdit = (p: Property) => {
    setEditingId(p.id)
    setForm({ company_id: p.company_id, name: p.name, address: p.address, management_start_date: p.management_start_date || '', notes: p.notes || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.company_id) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setProperties(prev => prev.map(p => p.id === editingId ? { ...p, ...form, total_units: p.total_units } : p))
      } else {
        setProperties(prev => [...prev, { id: String(Date.now()), ...form, total_units: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      }
      setDialogOpen(false); setSaving(false); return
    }
    const payload = { ...form, management_start_date: form.management_start_date || null }
    if (editingId) {
      await supabase.from('properties').update(payload).eq('id', editingId)
    } else {
      await supabase.from('properties').insert({ ...payload, total_units: 0 })
    }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) {
      setProperties(prev => prev.filter(p => p.id !== deleteId))
    } else {
      await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId)
      fetchData()
    }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const filtered = properties.filter(p => {
    if (filterCompany !== 'all' && p.company_id !== filterCompany) return false
    if (searchQuery && !p.name.includes(searchQuery) && !p.address.includes(searchQuery)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="物件管理" description="管理物件の一覧と登録" actionLabel={readOnly ? undefined : '物件を追加'} onAction={readOnly ? undefined : openCreate}>
        <Select value={filterCompany} onValueChange={setFilterCompany}>
          <SelectTrigger className="w-48"><SelectValue placeholder="会社で絞込" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての会社</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="物件名・住所で検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64" />
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
                    <TableHead>会社</TableHead>
                    <TableHead>物件名</TableHead>
                    <TableHead className="hidden md:table-cell">住所</TableHead>
                    <TableHead className="hidden sm:table-cell">管理開始日</TableHead>
                    <TableHead className="hidden lg:table-cell">備考</TableHead>
                    {!readOnly && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{getCompanyName(p.company_id)}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.address}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{p.management_start_date}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.notes}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(p.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? '物件を編集' : '物件を追加'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>会社 <span className="text-red-500">*</span></Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="会社を選択" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>物件名 <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="〇〇マンション" />
            </div>
            <div className="space-y-2">
              <Label>住所</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="大阪府大阪市..." />
            </div>
            <div className="space-y-2">
              <Label>管理開始日</Label>
              <Input type="date" value={form.management_start_date} onChange={(e) => setForm({ ...form, management_start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="メモ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.company_id}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="物件を削除" description="この物件を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditExpenses } from '@/lib/permissions'
import type { ExpenseCategory } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const DEMO_CATEGORIES: ExpenseCategory[] = [
  { id: '1', category_name: '事務用品費', sort_order: 1, notes: '文房具・事務用品', created_at: '', updated_at: '' },
  { id: '2', category_name: '通信費', sort_order: 2, notes: '電話・インターネット', created_at: '', updated_at: '' },
  { id: '3', category_name: '水道光熱費', sort_order: 3, notes: '電気・ガス・水道', created_at: '', updated_at: '' },
  { id: '4', category_name: '修繕費', sort_order: 4, notes: '建物・設備の修繕', created_at: '', updated_at: '' },
  { id: '5', category_name: '保険料', sort_order: 5, notes: '火災保険・賠償保険', created_at: '', updated_at: '' },
  { id: '6', category_name: '租税公課', sort_order: 6, notes: '固定資産税・印紙税', created_at: '', updated_at: '' },
  { id: '7', category_name: '交通費', sort_order: 7, notes: '出張・移動', created_at: '', updated_at: '' },
  { id: '8', category_name: '交際費', sort_order: 8, notes: '接待・贈答', created_at: '', updated_at: '' },
  { id: '9', category_name: '広告宣伝費', sort_order: 9, notes: '広告・宣伝', created_at: '', updated_at: '' },
  { id: '10', category_name: '雑費', sort_order: 10, notes: 'その他', created_at: '', updated_at: '' },
]

interface CategoryForm {
  category_name: string
  sort_order: number
  notes: string
}

const emptyForm: CategoryForm = { category_name: '', sort_order: 0, notes: '' }

export function ExpenseCategoriesPage() {
  const { user } = useAuth()
  const editable = canEditExpenses(user)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setCategories(DEMO_CATEGORIES); setLoading(false); return }
    const { data } = await supabase.from('expense_categories').select('*').is('deleted_at', null).order('sort_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, sort_order: categories.length + 1 }); setDialogOpen(true) }
  const openEdit = (c: ExpenseCategory) => {
    setEditingId(c.id)
    setForm({ category_name: c.category_name, sort_order: c.sort_order, notes: c.notes || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.category_name.trim()) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...form } as ExpenseCategory : c))
      } else {
        setCategories(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('expense_categories').update(form).eq('id', editingId) }
    else { await supabase.from('expense_categories').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setCategories(prev => prev.filter(c => c.id !== deleteId)) }
    else { await supabase.from('expense_categories').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="経費カテゴリ管理" description="経費の分類カテゴリを管理します" actionLabel={editable ? 'カテゴリを追加' : undefined} onAction={editable ? openCreate : undefined} />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">表示順</TableHead>
                    <TableHead>カテゴリ名</TableHead>
                    <TableHead>備考</TableHead>
                    {editable && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="text-center font-mono">{cat.sort_order}</TableCell>
                      <TableCell className="font-medium">{cat.category_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cat.notes}</TableCell>
                      {editable && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(cat.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? 'カテゴリを編集' : 'カテゴリを追加'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>カテゴリ名 <span className="text-red-500">*</span></Label>
              <Input value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>表示順</Label>
              <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.category_name.trim()}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="カテゴリを削除" description="このカテゴリを削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

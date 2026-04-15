import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEdit } from '@/lib/permissions'
import type { DocumentCategory } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

const DEMO_CATEGORIES: DocumentCategory[] = [
  { id: '1', category_name: '入居契約書', sort_order: 1, notes: '賃貸借契約書', created_at: '', updated_at: '' },
  { id: '2', category_name: '借入契約書', sort_order: 2, notes: '金融機関との借入契約', created_at: '', updated_at: '' },
  { id: '3', category_name: '保証会社契約書', sort_order: 3, notes: '保証会社との契約', created_at: '', updated_at: '' },
  { id: '4', category_name: '更新契約書', sort_order: 4, notes: '契約更新に関する書類', created_at: '', updated_at: '' },
  { id: '5', category_name: '解約通知書', sort_order: 5, notes: '契約解約に関する通知', created_at: '', updated_at: '' },
  { id: '6', category_name: '請求書', sort_order: 6, notes: '取引先からの請求書', created_at: '', updated_at: '' },
  { id: '7', category_name: '領収書', sort_order: 7, notes: '支払い済みの領収書', created_at: '', updated_at: '' },
  { id: '8', category_name: '給与資料', sort_order: 8, notes: '給与明細・源泉徴収票等', created_at: '', updated_at: '' },
  { id: '9', category_name: '社内申請書', sort_order: 9, notes: '社内の各種申請書類', created_at: '', updated_at: '' },
  { id: '10', category_name: 'その他', sort_order: 10, notes: 'その他の書類', created_at: '', updated_at: '' },
]

interface CategoryForm {
  category_name: string
  sort_order: number
  notes: string
}

const emptyForm: CategoryForm = { category_name: '', sort_order: 0, notes: '' }

export function DocumentCategoriesPage() {
  const { user } = useAuth()
  const editable = canEdit(user)
  const [categories, setCategories] = useState<DocumentCategory[]>([])
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
    const { data } = await supabase.from('document_categories').select('*').is('deleted_at', null).order('sort_order', { ascending: true })
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, sort_order: categories.length + 1 }); setDialogOpen(true) }
  const openEdit = (c: DocumentCategory) => {
    setEditingId(c.id)
    setForm({ category_name: c.category_name, sort_order: c.sort_order, notes: c.notes || '' })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.category_name.trim()) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...form } as DocumentCategory : c))
      } else {
        setCategories(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('document_categories').update(form).eq('id', editingId) }
    else { await supabase.from('document_categories').insert(form) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setCategories(prev => prev.filter(c => c.id !== deleteId)) }
    else { await supabase.from('document_categories').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="書類カテゴリ管理" description="書類の分類カテゴリを管理します" actionLabel={editable ? 'カテゴリを追加' : undefined} onAction={editable ? openCreate : undefined} />

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

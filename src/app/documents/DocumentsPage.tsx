import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { Document, DocumentCategory, Company } from '@/types'
import { DOCUMENT_STATUSES, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2, Eye, FileText } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
  { id: '5', name: '株式会社A', created_at: '', updated_at: '' },
  { id: '6', name: '株式会社B', created_at: '', updated_at: '' },
]

const DEMO_CATEGORIES: DocumentCategory[] = [
  { id: '1', category_name: '入居契約書', sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', category_name: '借入契約書', sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', category_name: '保証会社契約書', sort_order: 3, created_at: '', updated_at: '' },
  { id: '4', category_name: '更新契約書', sort_order: 4, created_at: '', updated_at: '' },
  { id: '5', category_name: '解約通知書', sort_order: 5, created_at: '', updated_at: '' },
  { id: '6', category_name: '請求書', sort_order: 6, created_at: '', updated_at: '' },
  { id: '7', category_name: '領収書', sort_order: 7, created_at: '', updated_at: '' },
  { id: '8', category_name: '給与資料', sort_order: 8, created_at: '', updated_at: '' },
  { id: '9', category_name: '社内申請書', sort_order: 9, created_at: '', updated_at: '' },
  { id: '10', category_name: 'その他', sort_order: 10, created_at: '', updated_at: '' },
]

const DEMO_DOCUMENTS: Document[] = [
  { id: '1', category_id: '1', title: '林建設 賃貸借契約書 101号室', company_id: '1', status: 'active', issue_date: '2024-04-01', contract_start_date: '2024-04-01', contract_end_date: '2026-03-31', renewal_date: '2026-02-01', notes: '2年契約', created_at: '2024-04-01', updated_at: '2024-04-01' },
  { id: '2', category_id: '2', title: '林建設 借入契約書 三井住友銀行', company_id: '1', status: 'active', issue_date: '2023-01-15', contract_start_date: '2023-01-15', contract_end_date: '2028-01-14', renewal_date: '2027-11-15', notes: '5年ローン', created_at: '2023-01-15', updated_at: '2023-01-15' },
  { id: '3', category_id: '3', title: 'NYコーポ 保証会社契約', company_id: '2', status: 'renewal_pending', issue_date: '2023-06-01', contract_start_date: '2023-06-01', contract_end_date: '2025-05-31', renewal_date: '2025-04-01', notes: '更新手続き中', created_at: '2023-06-01', updated_at: '2023-06-01' },
  { id: '4', category_id: '1', title: 'オーナーズ 事務所賃貸契約', company_id: '3', status: 'active', issue_date: '2024-01-01', contract_start_date: '2024-01-01', contract_end_date: '2026-12-31', notes: '3年契約', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '5', category_id: '8', title: '照 給与規程', company_id: '4', status: 'active', issue_date: '2024-04-01', notes: '最新版', created_at: '2024-04-01', updated_at: '2024-04-01' },
  { id: '6', category_id: '5', title: '林建設 オフィス賃貸解約通知', company_id: '1', status: 'cancelled', issue_date: '2025-01-15', notes: '2025年3月末解約', created_at: '2025-01-15', updated_at: '2025-01-15' },
  { id: '7', category_id: '6', title: 'NYコーポ 修繕工事請求書', company_id: '2', status: 'needs_review', issue_date: '2025-03-20', notes: '外壁塗装工事', created_at: '2025-03-20', updated_at: '2025-03-20' },
  { id: '8', category_id: '3', title: 'オーナーズ 火災保険証券', company_id: '3', status: 'expired', issue_date: '2022-04-01', contract_start_date: '2022-04-01', contract_end_date: '2025-03-31', notes: '期限切れ - 要更新', created_at: '2022-04-01', updated_at: '2022-04-01' },
]

type DocumentStatusKey = Document['status']

interface DocumentForm {
  title: string
  category_id: string
  company_id: string
  status: DocumentStatusKey
  issue_date: string
  contract_start_date: string
  contract_end_date: string
  renewal_date: string
  notes: string
}

const emptyForm: DocumentForm = { title: '', category_id: '', company_id: '', status: 'active', issue_date: '', contract_start_date: '', contract_end_date: '', renewal_date: '', notes: '' }

export function DocumentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const editable = canEditDocuments(user)
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<DocumentForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setDocuments(DEMO_DOCUMENTS)
      setCategories(DEMO_CATEGORIES)
      setCompanies(DEMO_COMPANIES)
      setLoading(false)
      return
    }
    const [{ data: docs }, { data: cats }, { data: comps }] = await Promise.all([
      supabase.from('documents').select('*, category:document_categories(*), company:companies(*)').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('document_categories').select('*').is('deleted_at', null).order('sort_order'),
      supabase.from('companies').select('*').is('deleted_at', null).order('name'),
    ])
    setDocuments(docs || [])
    setCategories(cats || [])
    setCompanies(comps || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = documents.filter(d => {
    if (filterCompany && d.company_id !== filterCompany) return false
    if (filterCategory && d.category_id !== filterCategory) return false
    if (filterStatus && d.status !== filterStatus) return false
    return true
  })

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (d: Document) => {
    setEditingId(d.id)
    setForm({
      title: d.title, category_id: d.category_id || '', company_id: d.company_id || '',
      status: d.status, issue_date: d.issue_date || '', contract_start_date: d.contract_start_date || '',
      contract_end_date: d.contract_end_date || '', renewal_date: d.renewal_date || '', notes: d.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { ...form, category_id: form.category_id || null, company_id: form.company_id || null, issue_date: form.issue_date || null, contract_start_date: form.contract_start_date || null, contract_end_date: form.contract_end_date || null, renewal_date: form.renewal_date || null }
    if (isDemoMode) {
      if (editingId) {
        setDocuments(prev => prev.map(d => d.id === editingId ? { ...d, ...payload } as unknown as Document : d))
      } else {
        const newDoc: Document = { id: String(Date.now()), ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as Document
        setDocuments(prev => [newDoc, ...prev])
      }
      setDialogOpen(false); setSaving(false); return
    }
    if (editingId) { await supabase.from('documents').update(payload).eq('id', editingId) }
    else { await supabase.from('documents').insert(payload) }
    setSaving(false); setDialogOpen(false); fetchData()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) { setDocuments(prev => prev.filter(d => d.id !== deleteId)) }
    else { await supabase.from('documents').update({ deleted_at: new Date().toISOString() }).eq('id', deleteId); fetchData() }
    setSaving(false); setDeleteDialogOpen(false); setDeleteId(null)
  }

  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.category_name || '-'
  const getCompanyName = (id?: string) => companies.find(c => c.id === id)?.name || '-'

  return (
    <div className="space-y-6">
      <PageHeader title={`書類管理 (${filtered.length}件)`} description="各種書類をアップロード・分類・検索・管理します" actionLabel={editable ? '書類を登録' : undefined} onAction={editable ? openCreate : undefined} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-48">
              <Select value={filterCompany} onValueChange={v => setFilterCompany(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="会社" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての会社</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterCategory} onValueChange={v => setFilterCategory(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="カテゴリ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのカテゴリ</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="ステータス" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {Object.entries(DOCUMENT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead>会社</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>発行日</TableHead>
                    <TableHead>契約終了日</TableHead>
                    <TableHead className="w-28">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(doc => {
                    const st = DOCUMENT_STATUSES[doc.status as keyof typeof DOCUMENT_STATUSES]
                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{doc.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryName(doc.category_id)}</TableCell>
                        <TableCell>{getCompanyName(doc.company_id)}</TableCell>
                        <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                        <TableCell className="text-sm">{doc.issue_date ? formatDate(doc.issue_date) : '-'}</TableCell>
                        <TableCell className="text-sm">{doc.contract_end_date ? formatDate(doc.contract_end_date) : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/documents/${doc.id}`)}><Eye className="h-4 w-4" /></Button>
                            {editable && <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(doc)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => { setDeleteId(doc.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? '書類を編集' : '書類を登録'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>タイトル <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>カテゴリ</Label>
              <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未選択</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.category_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>会社</Label>
              <Select value={form.company_id} onValueChange={v => setForm({ ...form, company_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">未選択</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as DocumentStatusKey })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>発行日</Label>
              <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>契約開始日</Label>
              <Input type="date" value={form.contract_start_date} onChange={e => setForm({ ...form, contract_start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>契約終了日</Label>
              <Input type="date" value={form.contract_end_date} onChange={e => setForm({ ...form, contract_end_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>更新日</Label>
              <Input type="date" value={form.renewal_date} onChange={e => setForm({ ...form, renewal_date: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="書類を削除" description="この書類を削除してもよろしいですか？" confirmLabel="削除" variant="destructive" onConfirm={handleDelete} loading={saving} />
    </div>
  )
}

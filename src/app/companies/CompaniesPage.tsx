import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { isReadOnly } from '@/lib/permissions'
import type { Company } from '@/types'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', company_code: 'HAYASHI', address: '大阪府大阪市中央区1-1-1', phone: '06-1234-5678', notes: '不動産管理グループ', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', company_code: 'NYCORP', address: '大阪府大阪市北区2-2-2', phone: '06-2345-6789', notes: '不動産管理グループ', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', company_code: 'OWNERS', address: '大阪府大阪市西区3-3-3', phone: '06-3456-7890', notes: '不動産管理グループ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', company_code: 'TERU', address: '大阪府大阪市天王寺区4-4-4', phone: '06-4567-8901', notes: '不動産管理グループ', created_at: '', updated_at: '' },
  { id: '5', name: '株式会社A', company_code: 'COMP_A', address: '', phone: '', notes: '仮名称', created_at: '', updated_at: '' },
  { id: '6', name: '株式会社B', company_code: 'COMP_B', address: '', phone: '', notes: '仮名称', created_at: '', updated_at: '' },
]

interface CompanyForm {
  name: string
  company_code: string
  address: string
  phone: string
  notes: string
}

const emptyForm: CompanyForm = { name: '', company_code: '', address: '', phone: '', notes: '' }

export function CompaniesPage() {
  const { user } = useAuth()
  const readOnly = isReadOnly(user)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES)
      setLoading(false)
      return
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      if (fetchError) {
        setError(`会社データの取得に失敗しました: ${fetchError.message}`)
        setCompanies([])
        return
      }
      setCompanies(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCompanies() }, [fetchCompanies])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (company: Company) => {
    setEditingId(company.id)
    setForm({
      name: company.name,
      company_code: company.company_code || '',
      address: company.address || '',
      phone: company.phone || '',
      notes: company.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (isDemoMode) {
      if (editingId) {
        setCompanies(prev => prev.map(c => c.id === editingId ? { ...c, ...form } : c))
      } else {
        setCompanies(prev => [...prev, { id: String(Date.now()), ...form, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      }
      setDialogOpen(false)
      setSaving(false)
      return
    }
    const { error: saveError } = editingId
      ? await supabase.from('companies').update(form).eq('id', editingId)
      : await supabase.from('companies').insert(form)
    setSaving(false)
    if (saveError) {
      setError(`会社データの保存に失敗しました: ${saveError.message}`)
      return
    }
    setDialogOpen(false)
    fetchCompanies()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setSaving(true)
    if (isDemoMode) {
      setCompanies(prev => prev.filter(c => c.id !== deleteId))
    } else {
      const { error: deleteError } = await supabase
        .from('companies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deleteId)
      if (deleteError) setError(`会社データの削除に失敗しました: ${deleteError.message}`)
      else fetchCompanies()
    }
    setSaving(false)
    setDeleteDialogOpen(false)
    setDeleteId(null)
  }

  const filtered = companies.filter(c =>
    c.name.includes(searchQuery) || (c.company_code || '').includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="会社管理"
        description="管理対象の会社を管理します"
        actionLabel={readOnly ? undefined : '会社を追加'}
        onAction={readOnly ? undefined : openCreate}
      >
        <Input
          placeholder="会社名・コードで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
      </PageHeader>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCompanies}>再試行</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会社コード</TableHead>
                    <TableHead>会社名</TableHead>
                    <TableHead className="hidden md:table-cell">住所</TableHead>
                    <TableHead className="hidden sm:table-cell">電話番号</TableHead>
                    <TableHead className="hidden lg:table-cell">備考</TableHead>
                    {!readOnly && <TableHead className="w-24">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{error ? '読み込みに失敗しました' : 'データがありません'}</TableCell></TableRow>
                  ) : filtered.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-mono text-sm">{company.company_code}</TableCell>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{company.address}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{company.phone}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{company.notes}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(company)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setDeleteId(company.id); setDeleteDialogOpen(true) }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader>
            <DialogTitle>{editingId ? '会社を編集' : '会社を追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>会社名 <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="株式会社〇〇" />
            </div>
            <div className="space-y-2">
              <Label>会社コード</Label>
              <Input value={form.company_code} onChange={(e) => setForm({ ...form, company_code: e.target.value })} placeholder="COMPANY_CODE" />
            </div>
            <div className="space-y-2">
              <Label>住所</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="大阪府大阪市..." />
            </div>
            <div className="space-y-2">
              <Label>電話番号</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06-1234-5678" />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="メモ..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="会社を削除"
        description="この会社を削除してもよろしいですか？関連するデータにも影響します。"
        confirmLabel="削除"
        variant="destructive"
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  )
}

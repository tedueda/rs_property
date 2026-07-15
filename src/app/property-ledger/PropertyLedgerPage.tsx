import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Upload, Plus, FileText, Pencil, Trash2, Eye, Loader2,
  Database, Search, CheckCircle2,
} from 'lucide-react'
import {
  parsePropertyLedgerFile,
  emptyLedgerData,
  type PropertyLedgerData,
} from '@/lib/propertyLedgerParser'

interface LedgerRecord extends PropertyLedgerData {
  id: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function PropertyLedgerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [records, setRecords] = useState<LedgerRecord[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<PropertyLedgerData>(emptyLedgerData())
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [importedFileName, setImportedFileName] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState<LedgerRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('property_ledgers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) {
      setImportError(`台帳データの取得に失敗しました: ${error.message}`)
    } else if (data) {
      setRecords(data as LedgerRecord[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { document.title = '物件管理台帳 - RS不動産管理' }, [])
  useEffect(() => { fetchRecords() }, [fetchRecords])

  const filtered = records.filter(r =>
    r.property_name.includes(search) ||
    r.tenant_name.includes(search) ||
    r.notes.includes(search)
  )

  const openCreate = () => {
    setEditId(null)
    setImportedFileName(null)
    setImportError(null)
    setForm(emptyLedgerData())
    setShowForm(true)
  }

  const openEdit = (record: LedgerRecord) => {
    setEditId(record.id)
    setImportedFileName(null)
    setImportError(null)
    setForm({
      property_name: record.property_name,
      created_date: record.created_date,
      tenant_name: record.tenant_name,
      phone: record.phone,
      guarantor: record.guarantor,
      move_in_date: record.move_in_date,
      rent: record.rent,
      guarantee_company: record.guarantee_company,
      house_cleaning_fee: record.house_cleaning_fee,
      water_fee: record.water_fee,
      common_fee: record.common_fee,
      deposit: record.deposit,
      deduction: record.deduction,
      penalty: record.penalty,
      notes: record.notes,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.tenant_name.trim()) {
      setImportError('賃借人の名前を入力してください')
      return
    }

    setSaving(true)
    setImportError(null)

    if (isDemoMode) {
      if (editId) {
        setRecords(prev => prev.map(r => r.id === editId ? { ...form, id: editId } : r))
      } else {
        setRecords(prev => [{ ...form, id: generateId() }, ...prev])
      }
      setSuccessMessage(editId ? '台帳を更新しました' : '台帳を登録しました')
      setShowForm(false)
      setImportedFileName(null)
      setSaving(false)
      return
    }

    const { error } = editId
      ? await supabase.from('property_ledgers').update({ ...form }).eq('id', editId)
      : await supabase.from('property_ledgers').insert({ ...form })

    if (error) {
      setImportError(`データベースへの登録に失敗しました: ${error.message}`)
      setSaving(false)
      return
    }

    setSuccessMessage(editId ? '台帳を更新しました' : '台帳をデータベースに登録しました')
    setShowForm(false)
    setImportedFileName(null)
    await fetchRecords()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この台帳を削除しますか？')) return
    if (isDemoMode) {
      setRecords(prev => prev.filter(r => r.id !== id))
      return
    }
    await supabase.from('property_ledgers').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    fetchRecords()
  }

  const importFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setImporting(true)
    setImportError(null)
    setSuccessMessage(null)

    try {
      const parsedRecords: PropertyLedgerData[] = []
      for (const file of files) {
        parsedRecords.push(...await parsePropertyLedgerFile(file))
      }

      if (parsedRecords.length === 0) {
        throw new Error('台帳データを読み取れませんでした。ファイルの内容を確認してください。')
      }

      if (parsedRecords.length === 1) {
        setEditId(null)
        setImportedFileName(files[0].name)
        setForm(parsedRecords[0])
        setShowForm(true)
        return
      }

      if (isDemoMode) {
        const newRecords = parsedRecords.map(data => ({ ...data, id: generateId() }))
        setRecords(prev => [...newRecords, ...prev])
      } else {
        const { error } = await supabase.from('property_ledgers').insert(parsedRecords)
        if (error) throw new Error(`データベースへの登録に失敗しました: ${error.message}`)
        await fetchRecords()
      }
      setSuccessMessage(`${parsedRecords.length}件の台帳をデータベースに登録しました`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'インポートに失敗しました')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [fetchRecords])

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) void importFiles(Array.from(files))
  }

  useEffect(() => {
    const state = location.state as { droppedFiles?: File[] } | null
    if (state?.droppedFiles?.length) {
      void importFiles(state.droppedFiles)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [importFiles, location.pathname, location.state, navigate])

  const fieldRow = (label: string, field: keyof PropertyLedgerData, type = 'text') => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={form[field]}
          onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={form[field]}
          onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        />
      )}
    </div>
  )

  const detailRow = (label: string, value: string) => (
    <div className="flex justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '-'}</span>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="物件管理台帳"
        description="台帳ファイルを読み込み、内容を確認してデータベースに登録します"
      >
        <Button onClick={() => fileInputRef.current?.click()} disabled={importing}>
          {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          台帳ファイルを読み込む
        </Button>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />新規作成
        </Button>
      </PageHeader>

      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.html,.htm,.xlsx,.xls,.pdf"
        multiple
        className="hidden"
        onChange={handleFileImport}
      />

      {successMessage && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSuccessMessage(null)}>
              閉じる
            </Button>
          </CardContent>
        </Card>
      )}

      {importError && !showForm && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            {importError}
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => setImportError(null)}>
              閉じる
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div><p className="text-sm font-semibold">1. ファイルを選択</p><p className="text-xs text-muted-foreground">DOCX・HTML・Excel・PDFに対応</p></div>
          <div><p className="text-sm font-semibold">2. 読取内容を確認</p><p className="text-xs text-muted-foreground">添付画像と同じ基本項目を確認・修正</p></div>
          <div><p className="text-sm font-semibold">3. データベースに登録</p><p className="text-xs text-muted-foreground">登録後は一覧と詳細画面で閲覧</p></div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="物件名・入居者名・備考で検索..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              登録済み: {records.length}件
            </p>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">物件管理台帳がまだありません</p>
            <p className="text-xs text-muted-foreground mb-4">
              「台帳ファイルを読み込む」でDOCX・HTML・Excel・PDFを選択し、読取内容を確認して登録してください
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />台帳ファイルを読み込む
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />新規作成
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>賃借人</TableHead>
                <TableHead>物件名</TableHead>
                <TableHead>電話番号</TableHead>
                <TableHead className="text-right">家賃</TableHead>
                <TableHead>入居年月日</TableHead>
                <TableHead>保証会社</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    該当するデータがありません
                  </TableCell>
                </TableRow>
              ) : filtered.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.tenant_name || '-'}</TableCell>
                  <TableCell>{record.property_name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{record.phone || '-'}</TableCell>
                  <TableCell className="text-right">{record.rent || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{record.move_in_date || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{record.guarantee_company || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDetail(record)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(record)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(record.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open)
        if (!open) {
          setImportedFileName(null)
          setImportError(null)
        }
      }}>
        <DialogContent onClose={() => setShowForm(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{importedFileName ? '読取内容の確認' : editId ? '台帳編集' : '新規台帳作成'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {importedFileName && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">{importedFileName}</p>
                <p className="mt-1 text-xs">読み取った内容を確認し、必要に応じて修正してから登録してください。</p>
              </div>
            )}
            {importError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{importError}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {fieldRow('物件名（任意）', 'property_name')}
              {fieldRow('作成日', 'created_date')}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2 py-1 bg-blue-50 rounded">契約者情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldRow('賃借人の名前', 'tenant_name')}
                {fieldRow('電話番号', 'phone')}
              </div>
              <div className="mt-4">
                {fieldRow('保証人', 'guarantor')}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2 py-1 bg-blue-50 rounded">物件・入居情報</h3>
              {fieldRow('入居年月日', 'move_in_date')}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2 py-1 bg-blue-50 rounded">費用・契約条件</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldRow('家賃', 'rent')}
                {fieldRow('保証会社', 'guarantee_company')}
                {fieldRow('ハウスクリーニング代', 'house_cleaning_fee')}
                {fieldRow('水道代', 'water_fee')}
                {fieldRow('共益費', 'common_fee')}
                {fieldRow('保証金', 'deposit')}
                {fieldRow('控除', 'deduction')}
                {fieldRow('違約金', 'penalty')}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2 py-1 bg-blue-50 rounded">備考</h3>
              {fieldRow('備考欄', 'notes', 'textarea')}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              {importedFileName ? 'データベースに登録' : editId ? '更新する' : '登録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent onClose={() => setShowDetail(null)} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>物件管理台帳 {showDetail?.property_name || showDetail?.tenant_name}</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4 py-2">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm bg-blue-50 px-2 py-1 rounded">契約者情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  {detailRow('賃借人の名前', showDetail.tenant_name)}
                  {detailRow('電話番号', showDetail.phone)}
                  {detailRow('保証人', showDetail.guarantor)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm bg-blue-50 px-2 py-1 rounded">物件・入居情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  {detailRow('入居年月日', showDetail.move_in_date)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm bg-blue-50 px-2 py-1 rounded">費用・契約条件</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 pt-0">
                  {detailRow('家賃', showDetail.rent)}
                  {detailRow('保証会社', showDetail.guarantee_company)}
                  {detailRow('ハウスクリーニング代', showDetail.house_cleaning_fee)}
                  {detailRow('水道代', showDetail.water_fee)}
                  {detailRow('共益費', showDetail.common_fee)}
                  {detailRow('保証金', showDetail.deposit)}
                  {detailRow('控除', showDetail.deduction)}
                  {detailRow('違約金', showDetail.penalty)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm bg-blue-50 px-2 py-1 rounded">備考</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap">{showDetail.notes || '-'}</p>
                </CardContent>
              </Card>
              {showDetail.created_date && (
                <p className="text-xs text-muted-foreground text-right">作成日: {showDetail.created_date}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { openEdit(showDetail!); setShowDetail(null) }}>
              <Pencil className="mr-2 h-4 w-4" />編集
            </Button>
            <Button variant="outline" onClick={() => setShowDetail(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

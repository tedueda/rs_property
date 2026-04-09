import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { UploadedFile, ExtractionType } from '@/types'
import { UPLOADED_FILE_STATUSES, EXTRACTION_TYPES, ALLOWED_FILE_EXTENSIONS, formatFileSize, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, FileText, Image, FileSpreadsheet, File } from 'lucide-react'

const DEMO_FILES: UploadedFile[] = [
  { id: '1', file_name: '通帳_林建設_202503.pdf', file_path: '/uploads/passbook_hayashi.pdf', file_size: 1250000, mime_type: 'application/pdf', status: 'confirmed', notes: '3月分通帳コピー', created_at: '2025-03-25T10:00:00Z', updated_at: '2025-03-25T10:00:00Z' },
  { id: '2', file_name: '領収書_修繕工事.jpg', file_path: '/uploads/receipt_repair.jpg', file_size: 890000, mime_type: 'image/jpeg', status: 'review_pending', notes: '外壁塗装', created_at: '2025-03-20T14:30:00Z', updated_at: '2025-03-20T14:30:00Z' },
  { id: '3', file_name: '入居契約書_佐藤.pdf', file_path: '/uploads/lease_sato.pdf', file_size: 2340000, mime_type: 'application/pdf', status: 'extracted', notes: '201号室', created_at: '2025-03-18T09:15:00Z', updated_at: '2025-03-18T09:15:00Z' },
  { id: '4', file_name: '借入契約書_みずほ.pdf', file_path: '/uploads/loan_mizuho.pdf', file_size: 3100000, mime_type: 'application/pdf', status: 'uploaded', notes: 'みずほ銀行新規借入', created_at: '2025-03-15T16:45:00Z', updated_at: '2025-03-15T16:45:00Z' },
  { id: '5', file_name: '給与明細_202503.xlsx', file_path: '/uploads/payroll_202503.xlsx', file_size: 456000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'error', notes: 'フォーマットエラー', created_at: '2025-03-10T11:00:00Z', updated_at: '2025-03-10T11:00:00Z' },
]

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('pdf') || mimeType.includes('word')) return FileText
  return File
}

export function FileUploadPage() {
  const { user } = useAuth()
  const editable = canEditDocuments(user)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractionType, setExtractionType] = useState<ExtractionType>('bank_statement')
  const [notes, setNotes] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setFiles(DEMO_FILES); setLoading(false); return }
    const { data } = await supabase.from('uploaded_files').select('*').order('created_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async () => {
    if (!selectedFile) return
    setSaving(true)
    if (isDemoMode) {
      const newFile: UploadedFile = {
        id: String(Date.now()), file_name: selectedFile.name, file_path: `/uploads/${selectedFile.name}`,
        file_size: selectedFile.size, mime_type: selectedFile.type, status: 'uploaded',
        notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setFiles(prev => [newFile, ...prev])
      setUploadDialogOpen(false); setSaving(false); setSelectedFile(null); setNotes('')
      return
    }
    const filePath = `uploads/${Date.now()}_${selectedFile.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, selectedFile)
    if (!uploadError) {
      const { data: fileRecord } = await supabase.from('uploaded_files').insert({
        file_name: selectedFile.name, file_path: filePath, file_size: selectedFile.size,
        mime_type: selectedFile.type, uploaded_by: user?.id, status: 'uploaded', notes,
      }).select().single()
      if (fileRecord) {
        await supabase.from('extracted_data_candidates').insert({
          uploaded_file_id: fileRecord.id, extraction_type: extractionType,
          review_status: 'pending',
        })
        await supabase.from('import_logs').insert({
          uploaded_file_id: fileRecord.id, extraction_type: extractionType, status: 'imported',
        })
      }
    }
    setSaving(false); setUploadDialogOpen(false); setSelectedFile(null); setNotes(''); fetchData()
  }

  const statusCounts = {
    uploaded: files.filter(f => f.status === 'uploaded').length,
    review_pending: files.filter(f => f.status === 'review_pending').length,
    confirmed: files.filter(f => f.status === 'confirmed').length,
    error: files.filter(f => f.status === 'error').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`ファイル取込 (${files.length}件)`} description="ファイルをアップロードし、種別を選択してOCR/抽出確認フローに進みます" actionLabel={editable ? 'ファイルをアップロード' : undefined} onAction={editable ? () => { setSelectedFile(null); setNotes(''); setUploadDialogOpen(true) } : undefined} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{statusCounts.uploaded}</p>
            <p className="text-sm text-muted-foreground">取込済</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.review_pending}</p>
            <p className="text-sm text-muted-foreground">確認待ち</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</p>
            <p className="text-sm text-muted-foreground">確定済</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-600">{statusCounts.error}</p>
            <p className="text-sm text-muted-foreground">エラー</p>
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
                    <TableHead>ファイル名</TableHead>
                    <TableHead>サイズ</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>アップロード日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ファイルがありません</TableCell></TableRow>
                  ) : files.map(f => {
                    const Icon = getFileIcon(f.mime_type)
                    const st = UPLOADED_FILE_STATUSES[f.status as keyof typeof UPLOADED_FILE_STATUSES]
                    return (
                      <TableRow key={f.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{f.file_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatFileSize(f.file_size)}</TableCell>
                        <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.notes || '-'}</TableCell>
                        <TableCell className="text-sm">{formatDate(f.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ファイルをアップロード</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ファイル <span className="text-red-500">*</span></Label>
              <Input type="file" accept={ALLOWED_FILE_EXTENSIONS} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">対応形式: JPG, PNG, HEIF, PDF, Excel, Word</p>
            </div>
            <div className="space-y-2">
              <Label>ファイル種別（抽出タイプ）</Label>
              <Select value={extractionType} onValueChange={v => setExtractionType(v as ExtractionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EXTRACTION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="メモなど" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleUpload} disabled={saving || !selectedFile}>
              {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />アップロード中...</> : <><Upload className="h-4 w-4 mr-1" />アップロード</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { UploadedFile } from '@/types'
import { UPLOADED_FILE_STATUSES, ALLOWED_FILE_EXTENSIONS, formatFileSize, formatDate } from '@/lib/constants'
import { useImportStore, type ImportTargetType, IMPORT_TARGET_LABELS } from '@/store/import'
import { isOcrSupported, getOcrProvider } from '@/lib/ocrProvider'
import { analyzeExcelFileFromFile, type SheetAnalysis, type ExcelImportTarget } from '@/lib/excelClassifier'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Upload, FileText, Image, FileSpreadsheet, File, Eye } from 'lucide-react'

const DEMO_FILES: UploadedFile[] = [
  { id: '1', file_name: '通帳_林建設_202604.pdf', file_path: '/uploads/passbook_hayashi.pdf', file_size: 1250000, mime_type: 'application/pdf', status: 'confirmed', notes: '4月分通帳コピー', created_at: '2026-04-08T10:00:00Z', updated_at: '2026-04-08T10:00:00Z' },
  { id: '2', file_name: '領収書_修繕工事.jpg', file_path: '/uploads/receipt_repair.jpg', file_size: 890000, mime_type: 'image/jpeg', status: 'review_pending', notes: '外壁塗装', created_at: '2026-04-06T14:30:00Z', updated_at: '2026-04-06T14:30:00Z' },
  { id: '3', file_name: '入居契約書_佐藤.pdf', file_path: '/uploads/lease_sato.pdf', file_size: 2340000, mime_type: 'application/pdf', status: 'extracted', notes: '201号室', created_at: '2026-04-04T09:15:00Z', updated_at: '2026-04-04T09:15:00Z' },
  { id: '4', file_name: '家賃一覧_202604.xlsx', file_path: '/uploads/rent_roll.xlsx', file_size: 456000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'uploaded', notes: '', created_at: '2026-04-03T11:00:00Z', updated_at: '2026-04-03T11:00:00Z' },
  { id: '5', file_name: '給与明細_202604.xlsx', file_path: '/uploads/payroll_202604.xlsx', file_size: 320000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'error', notes: 'フォーマットエラー', created_at: '2026-04-01T11:00:00Z', updated_at: '2026-04-01T11:00:00Z' },
]

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('pdf') || mimeType.includes('word')) return FileText
  return File
}

// Map ExcelImportTarget values to ImportTargetType values
const EXCEL_TO_IMPORT_TARGET: Record<ExcelImportTarget, ImportTargetType> = {
  bank_transactions: 'bank_statement',
  rent_roll: 'rent_roll',
  tenant_list: 'tenant_list',
  expense_list: 'expense_receipt',
  payroll_data: 'payroll_data',
  room_list: 'room_info',
  property_list: 'property_info',
  loan_schedule: 'loan_contract',
  unknown: 'other',
}

function mapExcelTarget(excelTarget: ExcelImportTarget): ImportTargetType {
  return EXCEL_TO_IMPORT_TARGET[excelTarget] || 'other'
}

function guessImportTarget(file: File): ImportTargetType {
  const name = file.name.toLowerCase()
  if (name.includes('通帳') || name.includes('bank') || name.includes('明細')) return 'bank_statement'
  if (name.includes('家賃') || name.includes('rent')) return 'rent_roll'
  if (name.includes('入居') || name.includes('tenant') || name.includes('賃貸')) return 'lease_contract'
  if (name.includes('給与') || name.includes('payroll')) return 'payroll_data'
  if (name.includes('経費') || name.includes('expense') || name.includes('領収')) return 'expense_receipt'
  if (name.includes('返済') || name.includes('loan') || name.includes('借入') || name.includes('貸借')) return 'loan_contract'
  if (name.includes('物件') || name.includes('property')) return 'property_info'
  if (name.includes('部屋') || name.includes('room')) return 'room_info'
  if (name.includes('光熱') || name.includes('utility') || name.includes('電気') || name.includes('ガス') || name.includes('水道')) return 'utility_bill'
  return 'other'
}

export function FileUploadPage() {
  const location = useLocation()
  const { user } = useAuth()
  const editable = canEditDocuments(user)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const userOverrodeTarget = useRef(false)

  // Upload flow state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [importTarget, setImportTarget] = useState<ImportTargetType>('other')
  const [notes, setNotes] = useState('')
  const [autoGuess, setAutoGuess] = useState('')

  // Excel analysis
  const [excelSheets, setExcelSheets] = useState<SheetAnalysis[]>([])
  const [analyzingExcel, setAnalyzingExcel] = useState(false)

  // OCR
  const [ocrResult, setOcrResult] = useState<string | null>(null)
  const [ocrRunning, setOcrRunning] = useState(false)

  const { addFile } = useImportStore()

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setFiles(DEMO_FILES); setLoading(false); return }
    const { data } = await supabase.from('uploaded_files').select('*').order('created_at', { ascending: false })
    setFiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Handle files dropped from dashboard
  useEffect(() => {
    const state = location.state as { droppedFiles?: File[] } | null
    if (state?.droppedFiles && state.droppedFiles.length > 0 && editable) {
      openUploadFlow(state.droppedFiles)
    }
    window.history.replaceState({}, document.title)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, editable])

  const openUploadFlow = (selectedFiles: File[]) => {
    userOverrodeTarget.current = false
    setPendingFiles(selectedFiles)
    setNotes('')
    setOcrResult(null)
    setExcelSheets([])

    if (selectedFiles.length === 1) {
      const f = selectedFiles[0]
      const guess = guessImportTarget(f)
      setImportTarget(guess)
      setAutoGuess(guess !== 'other' ? `自動推定: ${IMPORT_TARGET_LABELS[guess]}` : '')

      // Auto-analyze Excel
      if (f.type.includes('spreadsheet') || f.type.includes('excel') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        setAnalyzingExcel(true)
        analyzeExcelFileFromFile(f).then(sheets => {
          setExcelSheets(sheets)
          if (sheets.length > 0 && sheets[0].suggestedTarget !== 'unknown' && !userOverrodeTarget.current) {
            const mapped = mapExcelTarget(sheets[0].suggestedTarget)
            setImportTarget(mapped)
            setAutoGuess(`Excel分析: ${IMPORT_TARGET_LABELS[mapped] || sheets[0].suggestedTarget}`)
          }
          setAnalyzingExcel(false)
        }).catch(() => setAnalyzingExcel(false))
      }

      // Auto-run OCR for images/PDFs
      if (isOcrSupported(f.type)) {
        setOcrRunning(true)
        getOcrProvider().processFile(f).then(result => {
          setOcrResult(result.raw_text)
          setOcrRunning(false)
        }).catch(() => setOcrRunning(false))
      }
    } else {
      setImportTarget('other')
      setAutoGuess('')
    }
    setUploadDialogOpen(true)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files.length > 0 && editable) openUploadFlow(Array.from(e.dataTransfer.files))
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && editable) openUploadFlow(Array.from(e.target.files))
    if (e.target) e.target.value = ''
  }

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return
    setSaving(true)

    for (const file of pendingFiles) {
      const entryId = String(Date.now()) + Math.random().toString(36).slice(2, 6)

      addFile({
        id: entryId, file, fileName: file.name, mimeType: file.type,
        fileSize: file.size, status: 'uploaded', importTarget, createdAt: new Date().toISOString(),
      })

      if (isDemoMode) {
        const newFile: UploadedFile = {
          id: entryId, file_name: file.name, file_path: `/uploads/${file.name}`,
          file_size: file.size, mime_type: file.type, status: 'uploaded',
          notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }
        setFiles(prev => [newFile, ...prev])
        continue
      }

      const filePath = `uploads/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
      if (!uploadError) {
        const { data: fileRecord } = await supabase.from('uploaded_files').insert({
          file_name: file.name, file_path: filePath, file_size: file.size,
          mime_type: file.type, uploaded_by: user?.id, status: 'uploaded', notes, import_target: importTarget,
        }).select().single()
        if (fileRecord) {
          await supabase.from('extracted_data_candidates').insert({
            uploaded_file_id: fileRecord.id, extraction_type: importTarget,
            review_status: 'pending', raw_text: ocrResult || null,
          })
          await supabase.from('import_logs').insert({
            uploaded_file_id: fileRecord.id, extraction_type: importTarget, status: 'imported',
          })
        }
      }
    }

    setSaving(false)
    setUploadDialogOpen(false)
    setPendingFiles([])
    if (!isDemoMode) fetchData()
  }

  const statusCounts = {
    uploaded: files.filter(f => f.status === 'uploaded').length,
    review_pending: files.filter(f => f.status === 'review_pending').length,
    confirmed: files.filter(f => f.status === 'confirmed').length,
    error: files.filter(f => f.status === 'error').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`ファイル取込 (${files.length}件)`} description="ファイルをアップロードし、取込種別を選択して抽出確認フローに進みます" />

      {/* Drag & Drop Area */}
      <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
        <CardContent className="py-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-3 cursor-pointer"
            onClick={() => editable && fileInputRef.current?.click()}
          >
            <Upload className={`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="text-center">
              <p className="font-semibold">{isDragging ? 'ファイルをドロップしてください' : 'ドラッグ&ドロップ または クリックしてファイルを選択'}</p>
              <p className="text-xs text-muted-foreground mt-1">対応形式: JPG, PNG, HEIF, PDF, Excel, Word</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept={ALLOWED_FILE_EXTENSIONS} multiple onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.uploaded}</p><p className="text-sm text-muted-foreground">取込済</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-yellow-600">{statusCounts.review_pending}</p><p className="text-sm text-muted-foreground">確認待ち</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</p><p className="text-sm text-muted-foreground">確定済</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-red-600">{statusCounts.error}</p><p className="text-sm text-muted-foreground">エラー</p></CardContent></Card>
      </div>

      {/* File List */}
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

      {/* Upload Dialog with Import Target Selection */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (!open) { setUploadDialogOpen(false); setPendingFiles([]) } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ファイル取込 - 種別選択</DialogTitle>
            <p className="text-sm text-muted-foreground">アップロードするファイルの取込先を選択してください。自動推定は補助であり、最終確認はお客様が行います。</p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Selected files info */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">選択ファイル ({pendingFiles.length}件)</CardTitle></CardHeader>
              <CardContent className="py-2">
                {pendingFiles.map((f, i) => {
                  const Icon = getFileIcon(f.type)
                  return (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{f.name}</span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(f.size)})</span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Auto-guess notification */}
            {autoGuess && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">{autoGuess}</span>
              </div>
            )}

            {/* Import target selection */}
            <div className="space-y-2">
              <Label>取込種別（抽出先） <span className="text-red-500">*</span></Label>
              <Select value={importTarget} onValueChange={v => { userOverrodeTarget.current = true; setImportTarget(v as ImportTargetType) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPORT_TARGET_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">ファイル内容に基づいて自動推定されますが、手動で変更できます</p>
            </div>

            {/* Excel analysis results */}
            {analyzingExcel && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Excelファイルを分析中...</span>
              </div>
            )}
            {excelSheets.length > 0 && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">Excelシート分析結果</CardTitle></CardHeader>
                <CardContent className="py-2">
                  {excelSheets.map((sheet, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{sheet.sheetName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({sheet.rowCount}行, {sheet.headers.length}列)</span>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                        {IMPORT_TARGET_LABELS[sheet.suggestedTarget as ImportTargetType] || sheet.suggestedTarget}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* OCR result preview */}
            {ocrRunning && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">OCR処理中...</span>
              </div>
            )}
            {ocrResult && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">OCR抽出結果（プレビュー）</CardTitle></CardHeader>
                <CardContent className="py-2">
                  <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{ocrResult.substring(0, 500)}{ocrResult.length > 500 ? '...' : ''}</pre>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="メモなど" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setPendingFiles([]) }}>キャンセル</Button>
            <Button onClick={handleUpload} disabled={saving || pendingFiles.length === 0}>
              {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />アップロード中...</> : <><Upload className="h-4 w-4 mr-1" />取込開始 ({pendingFiles.length}件)</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

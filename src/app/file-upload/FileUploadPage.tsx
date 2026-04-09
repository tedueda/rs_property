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
  { id: '1', file_name: '\u901a\u5e33_\u6797\u5efa\u8a2d_202604.pdf', file_path: '/uploads/passbook_hayashi.pdf', file_size: 1250000, mime_type: 'application/pdf', status: 'confirmed', notes: '4\u6708\u5206\u901a\u5e33\u30b3\u30d4\u30fc', created_at: '2026-04-08T10:00:00Z', updated_at: '2026-04-08T10:00:00Z' },
  { id: '2', file_name: '\u9818\u53ce\u66f8_\u4fee\u7e55\u5de5\u4e8b.jpg', file_path: '/uploads/receipt_repair.jpg', file_size: 890000, mime_type: 'image/jpeg', status: 'review_pending', notes: '\u5916\u58c1\u5857\u88c5', created_at: '2026-04-06T14:30:00Z', updated_at: '2026-04-06T14:30:00Z' },
  { id: '3', file_name: '\u5165\u5c45\u5951\u7d04\u66f8_\u4f50\u85e4.pdf', file_path: '/uploads/lease_sato.pdf', file_size: 2340000, mime_type: 'application/pdf', status: 'extracted', notes: '201\u53f7\u5ba4', created_at: '2026-04-04T09:15:00Z', updated_at: '2026-04-04T09:15:00Z' },
  { id: '4', file_name: '\u5bb6\u8cc3\u4e00\u89a7_202604.xlsx', file_path: '/uploads/rent_roll.xlsx', file_size: 456000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'uploaded', notes: '', created_at: '2026-04-03T11:00:00Z', updated_at: '2026-04-03T11:00:00Z' },
  { id: '5', file_name: '\u7d66\u4e0e\u660e\u7d30_202604.xlsx', file_path: '/uploads/payroll_202604.xlsx', file_size: 320000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'error', notes: '\u30d5\u30a9\u30fc\u30de\u30c3\u30c8\u30a8\u30e9\u30fc', created_at: '2026-04-01T11:00:00Z', updated_at: '2026-04-01T11:00:00Z' },
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
  if (name.includes('\u901a\u5e33') || name.includes('bank') || name.includes('\u660e\u7d30')) return 'bank_statement'
  if (name.includes('\u5bb6\u8cc3') || name.includes('rent')) return 'rent_roll'
  if (name.includes('\u5165\u5c45') || name.includes('tenant') || name.includes('\u8cc3\u8cb8')) return 'lease_contract'
  if (name.includes('\u7d66\u4e0e') || name.includes('payroll')) return 'payroll_data'
  if (name.includes('\u7d4c\u8cbb') || name.includes('expense') || name.includes('\u9818\u53ce')) return 'expense_receipt'
  if (name.includes('\u8fd4\u6e08') || name.includes('loan') || name.includes('\u501f\u5165') || name.includes('\u8cb8\u501f')) return 'loan_contract'
  if (name.includes('\u7269\u4ef6') || name.includes('property')) return 'property_info'
  if (name.includes('\u90e8\u5c4b') || name.includes('room')) return 'room_info'
  if (name.includes('\u5149\u71b1') || name.includes('utility') || name.includes('\u96fb\u6c17') || name.includes('\u30ac\u30b9') || name.includes('\u6c34\u9053')) return 'utility_bill'
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
  }, [location.state])

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
      setAutoGuess(guess !== 'other' ? `\u81ea\u52d5\u63a8\u5b9a: ${IMPORT_TARGET_LABELS[guess]}` : '')

      // Auto-analyze Excel
      if (f.type.includes('spreadsheet') || f.type.includes('excel') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
        setAnalyzingExcel(true)
        analyzeExcelFileFromFile(f).then(sheets => {
          setExcelSheets(sheets)
          if (sheets.length > 0 && sheets[0].suggestedTarget !== 'unknown' && !userOverrodeTarget.current) {
            const mapped = mapExcelTarget(sheets[0].suggestedTarget)
            setImportTarget(mapped)
            setAutoGuess(`Excel\u5206\u6790: ${IMPORT_TARGET_LABELS[mapped] || sheets[0].suggestedTarget}`)
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
      <PageHeader title={`\u30d5\u30a1\u30a4\u30eb\u53d6\u8fbc (${files.length}\u4ef6)`} description="\u30d5\u30a1\u30a4\u30eb\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3057\u3001\u53d6\u8fbc\u7a2e\u5225\u3092\u9078\u629e\u3057\u3066\u62bd\u51fa\u78ba\u8a8d\u30d5\u30ed\u30fc\u306b\u9032\u307f\u307e\u3059" />

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
              <p className="font-semibold">{isDragging ? '\u30d5\u30a1\u30a4\u30eb\u3092\u30c9\u30ed\u30c3\u30d7\u3057\u3066\u304f\u3060\u3055\u3044' : '\u30c9\u30e9\u30c3\u30b0&\u30c9\u30ed\u30c3\u30d7 \u307e\u305f\u306f \u30af\u30ea\u30c3\u30af\u3057\u3066\u30d5\u30a1\u30a4\u30eb\u3092\u9078\u629e'}</p>
              <p className="text-xs text-muted-foreground mt-1">\u5bfe\u5fdc\u5f62\u5f0f: JPG, PNG, HEIF, PDF, Excel, Word</p>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept={ALLOWED_FILE_EXTENSIONS} multiple onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{statusCounts.uploaded}</p><p className="text-sm text-muted-foreground">\u53d6\u8fbc\u6e08</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-yellow-600">{statusCounts.review_pending}</p><p className="text-sm text-muted-foreground">\u78ba\u8a8d\u5f85\u3061</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</p><p className="text-sm text-muted-foreground">\u78ba\u5b9a\u6e08</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-red-600">{statusCounts.error}</p><p className="text-sm text-muted-foreground">\u30a8\u30e9\u30fc</p></CardContent></Card>
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
                    <TableHead>\u30d5\u30a1\u30a4\u30eb\u540d</TableHead>
                    <TableHead>\u30b5\u30a4\u30ba</TableHead>
                    <TableHead>\u30b9\u30c6\u30fc\u30bf\u30b9</TableHead>
                    <TableHead>\u5099\u8003</TableHead>
                    <TableHead>\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u65e5\u6642</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">\u30d5\u30a1\u30a4\u30eb\u304c\u3042\u308a\u307e\u305b\u3093</TableCell></TableRow>
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
            <DialogTitle>\u30d5\u30a1\u30a4\u30eb\u53d6\u8fbc - \u7a2e\u5225\u9078\u629e</DialogTitle>
            <p className="text-sm text-muted-foreground">\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3059\u308b\u30d5\u30a1\u30a4\u30eb\u306e\u53d6\u8fbc\u5148\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u81ea\u52d5\u63a8\u5b9a\u306f\u88dc\u52a9\u3067\u3042\u308a\u3001\u6700\u7d42\u78ba\u8a8d\u306f\u304a\u5ba2\u69d8\u304c\u884c\u3044\u307e\u3059\u3002</p>
          </DialogHeader>
          <div className="space-y-4">
            {/* Selected files info */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm">\u9078\u629e\u30d5\u30a1\u30a4\u30eb ({pendingFiles.length}\u4ef6)</CardTitle></CardHeader>
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
              <Label>\u53d6\u8fbc\u7a2e\u5225\uff08\u62bd\u51fa\u5148\uff09 <span className="text-red-500">*</span></Label>
              <Select value={importTarget} onValueChange={v => { userOverrodeTarget.current = true; setImportTarget(v as ImportTargetType) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPORT_TARGET_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">\u30d5\u30a1\u30a4\u30eb\u5185\u5bb9\u306b\u57fa\u3065\u3044\u3066\u81ea\u52d5\u63a8\u5b9a\u3055\u308c\u307e\u3059\u304c\u3001\u624b\u52d5\u3067\u5909\u66f4\u3067\u304d\u307e\u3059</p>
            </div>

            {/* Excel analysis results */}
            {analyzingExcel && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Excel\u30d5\u30a1\u30a4\u30eb\u3092\u5206\u6790\u4e2d...</span>
              </div>
            )}
            {excelSheets.length > 0 && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">Excel\u30b7\u30fc\u30c8\u5206\u6790\u7d50\u679c</CardTitle></CardHeader>
                <CardContent className="py-2">
                  {excelSheets.map((sheet, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div>
                        <span className="text-sm font-medium">{sheet.sheetName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({sheet.rowCount}\u884c, {sheet.columnCount}\u5217)</span>
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
                <span className="text-sm">OCR\u51e6\u7406\u4e2d...</span>
              </div>
            )}
            {ocrResult && (
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">OCR\u62bd\u51fa\u7d50\u679c\uff08\u30d7\u30ec\u30d3\u30e5\u30fc\uff09</CardTitle></CardHeader>
                <CardContent className="py-2">
                  <pre className="text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{ocrResult.substring(0, 500)}{ocrResult.length > 500 ? '...' : ''}</pre>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>\u5099\u8003</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="\u30e1\u30e2\u306a\u3069" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setPendingFiles([]) }}>\u30ad\u30e3\u30f3\u30bb\u30eb</Button>
            <Button onClick={handleUpload} disabled={saving || pendingFiles.length === 0}>
              {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u4e2d...</> : <><Upload className="h-4 w-4 mr-1" />\u53d6\u8fbc\u958b\u59cb ({pendingFiles.length}\u4ef6)</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

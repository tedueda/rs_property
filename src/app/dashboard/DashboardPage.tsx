import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Building2, DoorOpen, Users, FileText, FileCheck, AlertTriangle, Wrench,
  ScanLine, ArrowRight, Upload, FileSpreadsheet, FileType, Presentation,
  File, CheckCircle2, XCircle, Edit3, ChevronDown, ChevronUp, Loader2,
  FolderOpen, ArrowRightCircle, Trash2, RotateCcw, Plus
} from 'lucide-react'
import type { DashboardStats, DashboardAlerts } from '@/types'
import { useDashboardStats, uploadFile, createOcrJob, updateOcrJob, saveOcrExtractedFields, useApplications } from '@/lib/supabase/hooks'
import { runOcr, isOcrAvailable } from '@/lib/ocr/vision'
import { useAuthStore } from '@/store/auth'

// --- Types for OCR workflow ---
type FileStatus = 'uploading' | 'processing' | 'completed' | 'failed'
type DataCategory = 'application' | 'property' | 'contract' | 'tenant' | 'repair' | 'other'

interface UploadedFile {
  id: string; name: string; type: string; size: number
  status: FileStatus; progress: number; uploadedAt: string
}

interface ExtractedField {
  id: string; label: string; value: string; confidence: number
  status: 'auto' | 'corrected' | 'manual' | 'unreadable'; originalValue: string
}

interface OcrDocument {
  id: string; file: UploadedFile; fields: ExtractedField[]
  category: DataCategory | null; categoryConfirmed: boolean; suggestedCategory: DataCategory
}

const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.heic,.tiff,.bmp'

function getFileIcon(type: string) {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('.xls')) return FileSpreadsheet
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('.ppt')) return Presentation
  if (type.includes('word') || type.includes('.doc')) return FileType
  if (type.includes('pdf')) return FileText
  return File
}

function getFileTypeLabel(type: string): string {
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('.xls')) return 'Excel'
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('.ppt')) return 'PowerPoint'
  if (type.includes('word') || type.includes('.doc')) return 'Word'
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('image/jpeg') || type.includes('image/jpg')) return 'JPG'
  if (type.includes('image/png')) return 'PNG'
  if (type.includes('image/heic')) return 'HEIC'
  return type.split('/').pop()?.toUpperCase() || 'ファイル'
}

const CATEGORY_OPTIONS: { value: DataCategory; label: string; icon: typeof Building2; color: string }[] = [
  { value: 'application', label: '入居申込', icon: FileText, color: 'text-purple-600 bg-purple-50' },
  { value: 'property', label: '物件データ', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { value: 'contract', label: '契約', icon: FileCheck, color: 'text-teal-600 bg-teal-50' },
  { value: 'tenant', label: '入居者', icon: Users, color: 'text-green-600 bg-green-50' },
  { value: 'repair', label: '修繕', icon: Wrench, color: 'text-amber-600 bg-amber-50' },
  { value: 'other', label: 'その他', icon: FolderOpen, color: 'text-gray-600 bg-gray-50' },
]

// Store raw files for OCR retry
const rawFileStore = new Map<string, File>()

function suggestCategory(fileName: string): DataCategory {
  const lower = fileName.toLowerCase()
  if (lower.includes('申込') || lower.includes('application') || lower.includes('入居')) return 'application'
  if (lower.includes('物件') || lower.includes('property') || lower.includes('建物')) return 'property'
  if (lower.includes('契約') || lower.includes('contract')) return 'contract'
  if (lower.includes('修繕') || lower.includes('repair')) return 'repair'
  if (lower.includes('.xls')) return 'property'
  return 'application'
}

const defaultStats: DashboardStats = { total_properties: 0, total_units: 0, occupied_units: 0, vacant_units: 0, pending_applications: 0, contracts_this_month: 0, arrears_count: 0, active_repairs: 0 }
const defaultAlerts: DashboardAlerts = { ocr_unconfirmed: 0, mapping_unconfirmed: 0, contracts_not_created: 0, payments_unconfirmed: 0, arrears_count: 0, repairs_incomplete: 0, new_templates_detected: 0 }

// ============================================
// Document Detail Sub-component
// ============================================
function DocumentDetail({
  doc, onUpdateField, onAddField, onSetCategory, onConfirmCategory, onRetry,
}: {
  doc: OcrDocument
  onUpdateField: (docId: string, fieldId: string, value: string) => void
  onAddField: (docId: string, label: string, value: string) => void
  onSetCategory: (docId: string, category: DataCategory) => void
  onConfirmCategory: (docId: string) => void
  onRetry: (docId: string) => void
}) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [addFieldMode, setAddFieldMode] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const isProcessing = doc.file.status === 'uploading' || doc.file.status === 'processing'
  const isFailed = doc.file.status === 'failed'
  const isCompleted = doc.file.status === 'completed'

  const autoCount = doc.fields.filter(f => f.confidence >= 0.8).length
  const lowConfCount = doc.fields.filter(f => f.confidence < 0.8 && f.confidence >= 0.5).length
  const unreadableCount = doc.fields.filter(f => f.status === 'unreadable' || f.confidence < 0.5).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{doc.file.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {getFileTypeLabel(doc.file.type)} • {(doc.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFailed && (
              <Button variant="outline" size="sm" onClick={() => onRetry(doc.id)}>
                <RotateCcw className="mr-1 h-3 w-3" />再実行
              </Button>
            )}
            {isCompleted && !doc.categoryConfirmed && doc.category && (
              <Button size="sm" onClick={() => onConfirmCategory(doc.id)}>
                <CheckCircle2 className="mr-1 h-3 w-3" />確定して仕分け
              </Button>
            )}
            {doc.categoryConfirmed && (
              <Badge variant="success">
                <CheckCircle2 className="mr-1 h-3 w-3" />仕分け確定済
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isProcessing && (
          <div className="flex flex-col items-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">
                {doc.file.status === 'uploading' ? 'アップロード中...' : 'OCR処理中...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {doc.file.status === 'uploading'
                  ? `${doc.file.progress}% 完了`
                  : 'テキストを抽出しています。しばらくお待ちください。'
                }
              </p>
            </div>
            {doc.file.status === 'uploading' && (
              <Progress value={doc.file.progress} className="w-48" />
            )}
          </div>
        )}

        {isFailed && (
          <div className="flex flex-col items-center py-12 gap-4">
            <XCircle className="h-10 w-10 text-destructive" />
            <div className="text-center">
              <p className="font-medium text-destructive">OCR処理に失敗しました</p>
              <p className="text-sm text-muted-foreground mt-1">ファイル形式を確認し、再実行してください。</p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <Label className="text-sm font-medium mb-2 block">データ分類</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = doc.category === cat.value
                  return (
                    <button
                      key={cat.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => onSetCategory(doc.id, cat.value)}
                      disabled={doc.categoryConfirmed}
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                      {doc.suggestedCategory === cat.value && !isSelected && (
                        <span className="text-xs text-muted-foreground">(推奨)</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>自動確定: {autoCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>要確認: {lowConfCount}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>読取不可: {unreadableCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              {doc.fields.map((field) => {
                const isEditing = editingField === field.id
                const confidenceColor = field.confidence >= 0.8 ? 'text-green-600' :
                  field.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                const confidenceBg = field.confidence >= 0.8 ? 'bg-green-50 border-green-200' :
                  field.confidence >= 0.5 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'

                return (
                  <div key={field.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    field.status === 'corrected' ? 'bg-blue-50/50 border-blue-200' :
                    field.status === 'manual' ? 'bg-purple-50/50 border-purple-200' :
                    confidenceBg
                  }`}>
                    <div className="shrink-0 mt-1">
                      {field.status === 'manual' ? (
                        <Edit3 className="h-4 w-4 text-purple-500" />
                      ) : field.confidence >= 0.8 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : field.confidence >= 0.5 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-xs font-medium text-muted-foreground">{field.label}</Label>
                        {field.status !== 'manual' && (
                          <span className={`text-xs ${confidenceColor}`}>
                            {Math.round(field.confidence * 100)}%
                          </span>
                        )}
                        {field.status === 'corrected' && (
                          <Badge variant="info" className="text-xs px-1 py-0">修正済</Badge>
                        )}
                        {field.status === 'manual' && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">手入力</Badge>
                        )}
                      </div>
                      {isEditing ? (
                        <Input
                          className="h-8 text-sm"
                          defaultValue={field.value}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateField(doc.id, field.id, (e.target as HTMLInputElement).value)
                              setEditingField(null)
                            }
                            if (e.key === 'Escape') setEditingField(null)
                          }}
                          onBlur={(e) => {
                            onUpdateField(doc.id, field.id, e.target.value)
                            setEditingField(null)
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{field.value || '（空欄）'}</p>
                      )}
                      {field.status === 'unreadable' && field.originalValue !== field.value && (
                        <p className="text-xs text-muted-foreground mt-0.5">OCR原文: {field.originalValue}</p>
                      )}
                    </div>

                    {!doc.categoryConfirmed && (
                      <div className="shrink-0 flex gap-1">
                        <button
                          className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                          title="編集"
                          onClick={() => setEditingField(isEditing ? null : field.id)}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {!doc.categoryConfirmed && (
                <div className="pt-2">
                  {addFieldMode ? (
                    <div className="p-3 rounded-lg border border-dashed bg-muted/20 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="項目名" className="h-8 text-sm" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} />
                        <Input placeholder="値" className="h-8 text-sm" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => {
                          if (newFieldLabel) {
                            onAddField(doc.id, newFieldLabel, newFieldValue)
                            setNewFieldLabel('')
                            setNewFieldValue('')
                            setAddFieldMode(false)
                          }
                        }}>追加</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                          setAddFieldMode(false)
                          setNewFieldLabel('')
                          setNewFieldValue('')
                        }}>キャンセル</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setAddFieldMode(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      手入力で項目を追加
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getCategoryLink(category: DataCategory | null): string {
  switch (category) {
    case 'application': return '/applications'
    case 'property': return '/properties'
    case 'contract': return '/contracts'
    case 'tenant': return '/tenants'
    case 'repair': return '/repairs'
    default: return '/documents'
  }
}

// ============================================
// Main Dashboard Component
// ============================================
export function DashboardPage() {
  const { user } = useAuthStore()
  const { stats: dbStats, alerts: dbAlerts, loading: statsLoading } = useDashboardStats()
  const { data: recentApps } = useApplications()
  const stats = statsLoading ? defaultStats : dbStats
  const alerts = statsLoading ? defaultAlerts : dbAlerts
  const [documents, setDocuments] = useState<OcrDocument[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showKpi, setShowKpi] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { document.title = 'ダッシュボード - RS不動産管理' }, [])

  const activeDoc = documents.find(d => d.id === activeDocId) || null

  const processFileWithOcr = useCallback(async (docId: string, file: File, suggested: DataCategory) => {
    setOcrError(null)
    try {
      // Upload to Supabase Storage
      const companyId = user?.company_id || '00000000-0000-0000-0000-000000000001'
      const filePath = `ocr/${companyId}/${Date.now()}-${file.name}`
      try {
        await uploadFile('documents', filePath, file)
      } catch {
        // Storage upload is optional, continue with OCR
      }

      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, file: { ...d.file, progress: 100, status: 'processing' } } : d
      ))

      // Create OCR job in Supabase
      let ocrJobId: string | null = null
      try {
        const ocrJob = await createOcrJob({ company_id: companyId, file_path: filePath, file_name: file.name, file_type: file.type || 'application/octet-stream' })
        ocrJobId = ocrJob.id
      } catch {
        // OCR job tracking is optional
      }

      // Run Google Cloud Vision OCR
      if (!isOcrAvailable()) {
        throw new Error('Google Cloud Vision APIキーが設定されていません')
      }
      const result = await runOcr(file)

      // Map OCR result fields to ExtractedField format
      const extractedFields: ExtractedField[] = result.fields.map(f => ({
        id: f.id,
        label: f.label,
        value: f.value,
        confidence: f.confidence,
        status: f.status === 'unreadable' ? 'unreadable' as const : 'auto' as const,
        originalValue: f.originalValue,
      }))

      // Update OCR job as completed
      if (ocrJobId) {
        try {
          await updateOcrJob(ocrJobId, { status: 'completed', ocr_raw_result: { fullText: result.fullText } as Record<string, unknown> })
          await saveOcrExtractedFields(ocrJobId, result.fields.map(f => ({
            ocr_label: f.label,
            ocr_value: f.value,
            confidence_score: f.confidence,
            status: f.confidence >= 0.8 ? 'auto_confirmed' as const : f.confidence >= 0.5 ? 'candidate' as const : 'needs_review' as const,
          })))
        } catch {
          // Saving to DB is optional
        }
      }

      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, file: { ...d.file, status: 'completed' }, fields: extractedFields, category: suggested } : d
      ))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR処理に失敗しました'
      setOcrError(msg)
      setDocuments(prev => prev.map(d =>
        d.id === docId ? { ...d, file: { ...d.file, status: 'failed' } } : d
      ))
    }
  }, [user])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newDocs: OcrDocument[] = fileArray.map((file, i) => {
      const id = `doc-${Date.now()}-${i}`
      const suggested = suggestCategory(file.name)
      rawFileStore.set(id, file)
      return {
        id,
        file: {
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          status: 'uploading' as FileStatus,
          progress: 0,
          uploadedAt: new Date().toISOString(),
        },
        fields: [],
        category: null,
        categoryConfirmed: false,
        suggestedCategory: suggested,
      }
    })

    setDocuments(prev => [...newDocs, ...prev])
    if (newDocs.length > 0) setActiveDocId(newDocs[0].id)

    // Process each file with real OCR
    fileArray.forEach((file, i) => {
      const docId = newDocs[i].id
      const suggested = newDocs[i].suggestedCategory
      processFileWithOcr(docId, file, suggested)
    })
  }, [processFileWithOcr])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const updateField = (docId: string, fieldId: string, newValue: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? {
        ...d,
        fields: d.fields.map(f =>
          f.id === fieldId ? { ...f, value: newValue, status: newValue !== f.originalValue ? 'corrected' as const : 'auto' as const } : f
        )
      } : d
    ))
  }

  const addField = (docId: string, label: string, value: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? {
        ...d,
        fields: [...d.fields, {
          id: `manual-${Date.now()}`,
          label,
          value,
          confidence: 1,
          status: 'manual' as const,
          originalValue: '',
        }]
      } : d
    ))
  }

  const setCategory = (docId: string, category: DataCategory) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, category, categoryConfirmed: false } : d
    ))
  }

  const confirmCategory = (docId: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, categoryConfirmed: true } : d
    ))
  }

  const removeDocument = (docId: string) => {
    rawFileStore.delete(docId)
    setDocuments(prev => {
      const remaining = prev.filter(d => d.id !== docId)
      if (activeDocId === docId) {
        setActiveDocId(remaining.length > 0 ? remaining[0].id : null)
      }
      return remaining
    })
  }

  const retryOcr = (docId: string) => {
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, file: { ...d.file, status: 'processing' as const }, fields: [] } : d
    ))
    const rawFile = rawFileStore.get(docId)
    if (rawFile) {
      const doc = documents.find(d => d.id === docId)
      processFileWithOcr(docId, rawFile, doc?.suggestedCategory || 'application')
    }
  }

  const kpiCards = [
    { label: '管理物件数', value: stats.total_properties, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '総戸数', value: stats.total_units, icon: DoorOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '入居中', value: stats.occupied_units, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '空室数', value: stats.vacant_units, icon: DoorOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '申込中', value: stats.pending_applications, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '今月契約', value: stats.contracts_this_month, icon: FileCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: '未収件数', value: stats.arrears_count, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '修繕対応中', value: stats.active_repairs, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  const alertItems = [
    { label: 'OCR未確認', count: alerts.ocr_unconfirmed, link: '/ocr-jobs', variant: 'warning' as const },
    { label: 'マッピング未確定', count: alerts.mapping_unconfirmed, link: '/template-mappings', variant: 'warning' as const },
    { label: '契約書未作成', count: alerts.contracts_not_created, link: '/contracts', variant: 'info' as const },
    { label: '入金未確認', count: alerts.payments_unconfirmed, link: '/rent', variant: 'warning' as const },
    { label: '滞納', count: alerts.arrears_count, link: '/arrears', variant: 'destructive' as const },
    { label: '修繕未完了', count: alerts.repairs_incomplete, link: '/repairs', variant: 'secondary' as const },
    { label: '新規帳票検出', count: alerts.new_templates_detected, link: '/template-mappings', variant: 'info' as const },
  ]

  const pendingDocs = documents.filter(d => !d.categoryConfirmed)
  const confirmedDocs = documents.filter(d => d.categoryConfirmed)

  return (
    <div>
      <PageHeader title="ダッシュボード" description="書類取込・データ管理" />

      {/* SECTION 1: File Upload Zone */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={FILE_ACCEPT}
              className="hidden"
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">書類をドラッグ＆ドロップ、またはクリックして選択</p>
                <p className="text-sm text-muted-foreground mt-1">
                  対応形式: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), 画像 (JPG/PNG/HEIC)
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { icon: FileText, label: 'PDF' },
                  { icon: FileType, label: 'Word' },
                  { icon: FileSpreadsheet, label: 'Excel' },
                  { icon: Presentation, label: 'PPT' },
                  { icon: File, label: '画像' },
                ].map(ft => (
                  <div key={ft.label} className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
                    <ft.icon className="h-3 w-3" />
                    {ft.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {ocrError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{ocrError}</span>
          <button className="ml-auto text-xs underline" onClick={() => setOcrError(null)}>閉じる</button>
        </div>
      )}

      {/* SECTION 2: Processing Queue + Data Review */}
      {documents.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">取込書類 ({documents.length})</CardTitle>
                  {pendingDocs.length > 0 && (
                    <Badge variant="warning">{pendingDocs.length}件未確定</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {documents.map((doc) => {
                    const Icon = getFileIcon(doc.file.type)
                    const isActive = doc.id === activeDocId
                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-0 transition-colors ${
                          isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveDocId(doc.id)}
                      >
                        <div className="shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{getFileTypeLabel(doc.file.type)}</span>
                            {doc.file.status === 'uploading' && (
                              <Progress value={doc.file.progress} className="h-1 w-16" />
                            )}
                            {doc.file.status === 'processing' && (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <Loader2 className="h-3 w-3 animate-spin" />OCR処理中
                              </span>
                            )}
                            {doc.file.status === 'completed' && !doc.categoryConfirmed && (
                              <Badge variant="warning" className="text-xs px-1.5 py-0">要確認</Badge>
                            )}
                            {doc.categoryConfirmed && (
                              <Badge variant="success" className="text-xs px-1.5 py-0">確定済</Badge>
                            )}
                            {doc.file.status === 'failed' && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">失敗</Badge>
                            )}
                          </div>
                        </div>
                        <button
                          className="shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeDocument(doc.id) }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {activeDoc ? (
              <DocumentDetail
                doc={activeDoc}
                onUpdateField={updateField}
                onAddField={addField}
                onSetCategory={setCategory}
                onConfirmCategory={confirmCategory}
                onRetry={retryOcr}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ScanLine className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">左の一覧から書類を選択してください</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: Confirmed Data Summary */}
      {confirmedDocs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">仕分け済みデータ ({confirmedDocs.length}件)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {confirmedDocs.map((doc) => {
                const cat = CATEGORY_OPTIONS.find(c => c.value === doc.category)
                const CatIcon = cat?.icon || FolderOpen
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <div className={`rounded-lg p-2 ${cat?.color.split(' ')[1] || 'bg-gray-50'}`}>
                      <CatIcon className={`h-4 w-4 ${cat?.color.split(' ')[0] || 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file.name}</p>
                      <p className="text-xs text-muted-foreground">{cat?.label} → {doc.fields.length}項目</p>
                    </div>
                    <Link to={getCategoryLink(doc.category)}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <ArrowRightCircle className="mr-1 h-3 w-3" />詳細
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 4: KPI & Alerts (collapsible) */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
          onClick={() => setShowKpi(!showKpi)}
        >
          {showKpi ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          業務概況・KPI
        </button>

        {showKpi && (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
              {kpiCards.map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1">{kpi.value.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${kpi.bg}`}>
                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">アラート・タスク</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertItems.filter(a => a.count > 0).map((alert) => (
                      <Link key={alert.label} to={alert.link} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge variant={alert.variant}>{alert.count}件</Badge>
                          <span className="text-sm font-medium">{alert.label}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">最近の申込</CardTitle>
                    <Link to="/applications" className="text-sm text-primary hover:underline">すべて表示</Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentApps.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{app.applicant?.full_name || '未登録'}</p>
                          <p className="text-xs text-muted-foreground">{app.property?.name || ''} {app.unit?.unit_number || ''}</p>
                        </div>
                        <Badge variant={app.status === 'approved' ? 'success' : app.status === 'screening' ? 'warning' : 'info'}>
                          {app.status === 'screening' ? '審査中' : app.status === 'approved' ? '承認済' : app.status === 'submitted' ? '申込済' : app.status}
                        </Badge>
                      </div>
                    ))}
                    {recentApps.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">申込データがありません</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

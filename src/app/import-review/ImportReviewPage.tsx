import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { ExtractedDataCandidate, ReviewStatus } from '@/types'
import { EXTRACTION_TYPES, REVIEW_STATUSES, formatDate } from '@/lib/constants'
import { IMPORT_TARGET_LABELS, type ImportTargetType } from '@/store/import'
import { type ClassificationResult, CLASSIFICATION_LABELS } from '@/lib/bankClassifier'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, XCircle, Edit3, AlertCircle, Eye, FileText } from 'lucide-react'

interface DemoParsedData {
  [key: string]: string | number
}

interface DemoCandidate extends Omit<ExtractedDataCandidate, 'parsed_json'> {
  parsed_json: DemoParsedData
  file_name: string
  import_target?: string
  ocr_confidence?: number
  classification?: ClassificationResult
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: '1', uploaded_file_id: '1', extraction_type: 'bank_statement', review_status: 'pending',
    raw_text: '2026/04/15 \u632f\u8fbc \u30e4\u30de\u30c0\u30bf\u30ed\u30a6 85,000\u5186\n2026/04/15 \u632f\u8fbc \u30b5\u30c8\u30a6\u30cf\u30ca\u30b3 72,000\u5186\n2026/04/16 \u632f\u8fbc \u30bf\u30ca\u30ab\u30a4\u30c1\u30ed\u30a6 93,000\u5186',
    parsed_json: { transaction_date: '2026-04-15', payer_name: '\u30e4\u30de\u30c0\u30bf\u30ed\u30a6', amount: 85000, description: '\u5bb6\u8cc3\u5165\u91d1' },
    notes: '4\u6708\u5206\u901a\u5e33', created_at: '2026-04-08T10:00:00Z', updated_at: '2026-04-08T10:00:00Z',
    file_name: '\u901a\u5e33_\u6797\u5efa\u8a2d_202604.pdf', import_target: 'bank_statement', ocr_confidence: 0.92,
    classification: { classification: 'rent_income', label: '家賃収入', confidence: 0.95, reason: '\u632f\u8fbc\u5165\u91d1\u30fb\u5bb6\u8cc3\u76f8\u5f53\u984d' },
  },
  {
    id: '2', uploaded_file_id: '2', extraction_type: 'receipt_invoice', review_status: 'pending',
    raw_text: '\u9818\u53ce\u66f8\n\u65e5\u4ed8: 2026\u5e744\u670820\u65e5\n\u91d1\u984d: \u00a5350,000\n\u4f46\u3057: \u5916\u58c1\u5857\u88c5\u5de5\u4e8b\u4ee3\u91d1\u3068\u3057\u3066',
    parsed_json: { date: '2026-04-20', vendor: '\u682a\u5f0f\u4f1a\u793e\u4fee\u7e55\u30b5\u30fc\u30d3\u30b9', amount: 350000, description: '\u5916\u58c1\u5857\u88c5\u5de5\u4e8b' },
    notes: '', created_at: '2026-04-06T14:30:00Z', updated_at: '2026-04-06T14:30:00Z',
    file_name: '\u9818\u53ce\u66f8_\u4fee\u7e55\u5de5\u4e8b.jpg', import_target: 'expense_receipt', ocr_confidence: 0.88,
  },
  {
    id: '3', uploaded_file_id: '3', extraction_type: 'lease_contract', review_status: 'needs_correction',
    raw_text: '\u8cc3\u8cb8\u501f\u5951\u7d04\u66f8\n\u5951\u7d04\u8005: \u4f50\u85e4\u82b1\u5b50\n\u7269\u4ef6: \u30d1\u30fc\u30af\u30cf\u30a4\u30c4201\u53f7\u5ba4\n\u6708\u984d\u8cc3\u6599: 68,000\u5186\n\u5951\u7d04\u671f\u9593: 2026/04/01 \u301c 2028/03/31',
    parsed_json: { tenant_name: '\u4f50\u85e4\u82b1\u5b50', property: '\u30d1\u30fc\u30af\u30cf\u30a4\u30c4', room: '201', monthly_rent: 68000, start_date: '2026-04-01', end_date: '2028-03-31' },
    notes: '\u91d1\u984d\u8981\u78ba\u8a8d', created_at: '2026-04-04T09:15:00Z', updated_at: '2026-04-04T09:15:00Z',
    file_name: '\u5165\u5c45\u5951\u7d04\u66f8_\u4f50\u85e4.pdf', import_target: 'lease_contract', ocr_confidence: 0.85,
  },
  {
    id: '4', uploaded_file_id: '4', extraction_type: 'loan_contract', review_status: 'approved',
    raw_text: '\u91d1\u92ad\u6d88\u8cbb\u8cb8\u501f\u5951\u7d04\u8a3c\u66f8\n\u501f\u5165\u91d1\u984d: 50,000,000\u5186\n\u91d1\u5229: 1.2%\n\u8fd4\u6e08\u671f\u9593: 20\u5e74\n\u6bce\u6708\u8fd4\u6e08\u984d: 235,000\u5186',
    parsed_json: { lender: '\u307f\u305a\u307b\u9280\u884c', amount: 50000000, interest_rate: 1.2, term_years: 20, monthly_payment: 235000 },
    notes: '\u78ba\u8a8d\u6e08\u307f', created_at: '2026-04-03T16:45:00Z', updated_at: '2026-04-04T10:00:00Z',
    file_name: '\u501f\u5165\u5951\u7d04\u66f8_\u307f\u305a\u307b.pdf', import_target: 'loan_contract', ocr_confidence: 0.95,
  },
  {
    id: '5', uploaded_file_id: '5', extraction_type: 'bank_statement', review_status: 'pending',
    raw_text: '2026/04/10 \u632f\u8fbc \u30db\u30b7\u30e7\u30a6\u30ab\u30a4\u30b7\u30e3\u30a8\u30b9\u30c6\u30a3 120,000\u5186\n2026/04/12 \u5f15\u843d \u6771\u4eac\u96fb\u529b 45,000\u5186\n2026/04/13 \u632f\u8fbc \u30df\u30ba\u30db\u30ae\u30f3\u30b3\u30a6 2,300,000\u5186',
    parsed_json: { transaction_date: '2026-04-10', payer_name: '\u30db\u30b7\u30e7\u30a6\u30ab\u30a4\u30b7\u30e3\u30a8\u30b9\u30c6\u30a3', amount: 120000, description: '\u4fdd\u8a3c\u4f1a\u793e\u5165\u91d1' },
    notes: '', created_at: '2026-04-02T11:00:00Z', updated_at: '2026-04-02T11:00:00Z',
    file_name: '\u901a\u5e33_NY\u30b3\u30fc\u30dd_202604.pdf', import_target: 'bank_statement', ocr_confidence: 0.91,
    classification: { classification: 'guarantee_company', label: '保証会社関連', confidence: 0.88, reason: '\u4fdd\u8a3c\u4f1a\u793e\u540d\u79f0\u4e00\u81f4' },
  },
]

export function ImportReviewPage() {
  const { user } = useAuth()
  const editable = canEditDocuments(user)
  const [candidates, setCandidates] = useState<DemoCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<DemoCandidate | null>(null)
  const [editedJson, setEditedJson] = useState<Record<string, string>>({})
  const [originalTypes, setOriginalTypes] = useState<Record<string, 'number' | 'string'>>({})
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setCandidates(DEMO_CANDIDATES); setLoading(false); return }
    const { data } = await supabase
      .from('extracted_data_candidates')
      .select('*, uploaded_file:uploaded_files(*)')
      .order('created_at', { ascending: false })
    const items = (data || []).map((d: Record<string, unknown>) => ({
      ...d,
      file_name: (d.uploaded_file as Record<string, unknown>)?.file_name || '-',
      import_target: (d.uploaded_file as Record<string, unknown>)?.import_target || undefined,
      parsed_json: d.parsed_json || {},
    })) as DemoCandidate[]
    setCandidates(items)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = candidates.filter(c => {
    if (filterStatus && c.review_status !== filterStatus) return false
    return true
  })

  const openReview = (c: DemoCandidate) => {
    setSelectedCandidate(c)
    const types: Record<string, 'number' | 'string'> = {}
    const strValues: Record<string, string> = {}
    for (const [k, v] of Object.entries(c.parsed_json)) {
      types[k] = typeof v === 'number' ? 'number' : 'string'
      strValues[k] = String(v)
    }
    setOriginalTypes(types)
    setEditedJson(strValues)
    setReviewNotes(c.notes || '')
    setReviewDialogOpen(true)
  }

  const resolveEditedJson = (): DemoParsedData => {
    const result: DemoParsedData = {}
    for (const [k, v] of Object.entries(editedJson)) {
      if (originalTypes[k] === 'number' && v !== '' && !isNaN(Number(v))) {
        result[k] = Number(v)
      } else {
        result[k] = v
      }
    }
    return result
  }

  const handleApprove = async () => {
    if (!selectedCandidate) return
    setSaving(true)
    if (isDemoMode) {
      const finalJson = resolveEditedJson()
      setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, review_status: 'approved' as ReviewStatus, parsed_json: finalJson, notes: reviewNotes, reviewed_at: new Date().toISOString() } : c))
      setConfirmDialogOpen(false); setReviewDialogOpen(false); setSaving(false)
      return
    }
    const finalJson = resolveEditedJson()
    await supabase.from('extracted_data_candidates').update({
      review_status: 'approved', parsed_json: finalJson, notes: reviewNotes,
      reviewer_id: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', selectedCandidate.id)
    await supabase.from('import_logs').update({ status: 'confirmed', confirmed_by: user?.id, confirmed_at: new Date().toISOString() })
      .eq('uploaded_file_id', selectedCandidate.uploaded_file_id).neq('status', 'error')
    await supabase.from('import_review_histories').insert({
      extracted_data_candidate_id: selectedCandidate.id, reviewer_id: user?.id,
      previous_status: selectedCandidate.review_status, new_status: 'approved', comment: reviewNotes,
    })
    setSaving(false); setConfirmDialogOpen(false); setReviewDialogOpen(false); fetchData()
  }

  const handleReject = async () => {
    if (!selectedCandidate) return
    setSaving(true)
    if (isDemoMode) {
      setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, review_status: 'rejected' as ReviewStatus, notes: reviewNotes } : c))
      setReviewDialogOpen(false); setSaving(false)
      return
    }
    await supabase.from('extracted_data_candidates').update({
      review_status: 'rejected', notes: reviewNotes, reviewer_id: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', selectedCandidate.id)
    await supabase.from('import_review_histories').insert({
      extracted_data_candidate_id: selectedCandidate.id, reviewer_id: user?.id,
      previous_status: selectedCandidate.review_status, new_status: 'rejected', comment: reviewNotes,
    })
    setSaving(false); setReviewDialogOpen(false); fetchData()
  }

  const handleNeedsCorrection = async () => {
    if (!selectedCandidate) return
    setSaving(true)
    if (isDemoMode) {
      setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, review_status: 'needs_correction' as ReviewStatus, notes: reviewNotes } : c))
      setReviewDialogOpen(false); setSaving(false)
      return
    }
    await supabase.from('extracted_data_candidates').update({
      review_status: 'needs_correction', notes: reviewNotes, reviewer_id: user?.id,
    }).eq('id', selectedCandidate.id)
    await supabase.from('import_review_histories').insert({
      extracted_data_candidate_id: selectedCandidate.id, reviewer_id: user?.id,
      previous_status: selectedCandidate.review_status, new_status: 'needs_correction', comment: reviewNotes,
    })
    setSaving(false); setReviewDialogOpen(false); fetchData()
  }

  const pendingCount = candidates.filter(c => c.review_status === 'pending').length
  const correctionCount = candidates.filter(c => c.review_status === 'needs_correction').length

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      case 'needs_correction': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Edit3 className="h-4 w-4 text-yellow-500" />
    }
  }

  const ConfidenceBadge = ({ value }: { value?: number }) => {
    if (value == null) return null
    const pct = Math.round(value * 100)
    const color = pct >= 90 ? 'text-green-700 bg-green-50' : pct >= 70 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
    return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>{pct}%</span>
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`\u53d6\u8fbc\u78ba\u8a8d (${candidates.length}\u4ef6)`} description="OCR/\u62bd\u51fa\u7d50\u679c\u3092\u78ba\u8a8d\u3057\u3001\u6b63\u5f0f\u30c7\u30fc\u30bf\u3068\u3057\u3066\u767b\u9332\u3057\u307e\u3059\u3002\u81ea\u52d5\u78ba\u5b9a\u306f\u884c\u308f\u305a\u3001\u5fc5\u305a\u4eba\u306b\u3088\u308b\u78ba\u8a8d\u304c\u5fc5\u8981\u3067\u3059\u3002" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{candidates.length}</p>
            <p className="text-sm text-muted-foreground">\u5168\u4ef6</p>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-yellow-300' : ''}>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">\u78ba\u8a8d\u5f85\u3061</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{correctionCount}</p>
            <p className="text-sm text-muted-foreground">\u8981\u4fee\u6b63</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{candidates.filter(c => c.review_status === 'approved').length}</p>
            <p className="text-sm text-muted-foreground">\u627f\u8a8d\u6e08</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-48">
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="\u30b9\u30c6\u30fc\u30bf\u30b9" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">\u3059\u3079\u3066</SelectItem>
                  {Object.entries(REVIEW_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
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
                    <TableHead className="w-10"></TableHead>
                    <TableHead>\u30d5\u30a1\u30a4\u30eb\u540d</TableHead>
                    <TableHead>\u53d6\u8fbc\u7a2e\u5225</TableHead>
                    <TableHead>\u62bd\u51fa\u30bf\u30a4\u30d7</TableHead>
                    <TableHead>OCR\u4fe1\u983c\u5ea6</TableHead>
                    <TableHead>\u30b9\u30c6\u30fc\u30bf\u30b9</TableHead>
                    <TableHead>\u4f5c\u6210\u65e5</TableHead>
                    <TableHead className="w-20">\u64cd\u4f5c</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">\u30c7\u30fc\u30bf\u304c\u3042\u308a\u307e\u305b\u3093</TableCell></TableRow>
                  ) : filtered.map(c => {
                    const st = REVIEW_STATUSES[c.review_status as keyof typeof REVIEW_STATUSES]
                    const et = EXTRACTION_TYPES[c.extraction_type as keyof typeof EXTRACTION_TYPES]
                    const it = c.import_target ? IMPORT_TARGET_LABELS[c.import_target as ImportTargetType] : undefined
                    return (
                      <TableRow key={c.id} className={c.review_status === 'pending' ? 'bg-yellow-50' : ''}>
                        <TableCell><StatusIcon status={c.review_status} /></TableCell>
                        <TableCell className="font-medium">{c.file_name}</TableCell>
                        <TableCell>{it ? <span className="px-2 py-1 rounded bg-blue-50 text-xs text-blue-700">{it}</span> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded bg-gray-100 text-xs">{et?.label || c.extraction_type}</span></TableCell>
                        <TableCell><ConfidenceBadge value={c.ocr_confidence} /></TableCell>
                        <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                        <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant={c.review_status === 'pending' || c.review_status === 'needs_correction' ? 'default' : 'outline'} onClick={() => openReview(c)}>
                            {c.review_status === 'approved' || c.review_status === 'rejected' ? <Eye className="h-3 w-3 mr-1" /> : null}
                            {c.review_status === 'approved' || c.review_status === 'rejected' ? '\u78ba\u8a8d' : '\u30ec\u30d3\u30e5\u30fc'}
                          </Button>
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

      {/* Enhanced Review Dialog - Left/Right layout */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>\u62bd\u51fa\u30c7\u30fc\u30bf\u306e\u78ba\u8a8d\u30fb\u4fee\u6b63</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">\u62bd\u51fa\u3055\u308c\u305f\u30c7\u30fc\u30bf\u3092\u78ba\u8a8d\u3057\u3001\u5fc5\u8981\u306b\u5fdc\u3058\u3066\u4fee\u6b63\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u81ea\u52d5\u78ba\u5b9a\u306f\u3055\u308c\u307e\u305b\u3093\u3002</p>
          </DialogHeader>
          {selectedCandidate && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Source data */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />\u5143\u30d5\u30a1\u30a4\u30eb\u60c5\u5831</CardTitle></CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">\u30d5\u30a1\u30a4\u30eb\u540d</span><span className="font-medium">{selectedCandidate.file_name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">\u53d6\u8fbc\u7a2e\u5225</span><span>{selectedCandidate.import_target ? IMPORT_TARGET_LABELS[selectedCandidate.import_target as ImportTargetType] : '-'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">\u62bd\u51fa\u30bf\u30a4\u30d7</span><span>{EXTRACTION_TYPES[selectedCandidate.extraction_type as keyof typeof EXTRACTION_TYPES]?.label}</span></div>
                      {selectedCandidate.ocr_confidence != null && (
                        <div className="flex justify-between"><span className="text-muted-foreground">OCR\u4fe1\u983c\u5ea6</span><ConfidenceBadge value={selectedCandidate.ocr_confidence} /></div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Bank classification */}
                {selectedCandidate.classification && (
                  <Card className="border-blue-200">
                    <CardHeader className="py-3"><CardTitle className="text-sm">\u81ea\u52d5\u5206\u985e\u7d50\u679c</CardTitle></CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">\u5206\u985e</span>
                          <span className="font-medium text-blue-700">{CLASSIFICATION_LABELS[selectedCandidate.classification.classification] || selectedCandidate.classification.classification}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">\u4fe1\u983c\u5ea6</span>
                          <ConfidenceBadge value={selectedCandidate.classification.confidence} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">\u7406\u7531</span>
                          <span className="text-xs">{selectedCandidate.classification.reason}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 rounded">\u203b \u81ea\u52d5\u5206\u985e\u306f\u88dc\u52a9\u3067\u3042\u308a\u3001\u6700\u7d42\u78ba\u8a8d\u306f\u304a\u5ba2\u69d8\u304c\u884c\u3044\u307e\u3059</p>
                    </CardContent>
                  </Card>
                )}

                {/* Raw text */}
                {selectedCandidate.raw_text && (
                  <Card>
                    <CardHeader className="py-3"><CardTitle className="text-sm">\u62bd\u51fa\u30c6\u30ad\u30b9\u30c8\uff08\u539f\u6587\uff09</CardTitle></CardHeader>
                    <CardContent className="py-2">
                      <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">{selectedCandidate.raw_text}</pre>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Editable data + actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3"><CardTitle className="text-sm">\u62bd\u51fa\u5019\u88dc\u30c7\u30fc\u30bf\uff08\u7de8\u96c6\u53ef\uff09</CardTitle></CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-3">
                      {Object.entries(editedJson).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs font-medium text-muted-foreground">{key}</Label>
                          <Input
                            value={String(value)}
                            onChange={e => setEditedJson(prev => ({ ...prev, [key]: e.target.value }))}
                            disabled={!editable || (selectedCandidate.review_status !== 'pending' && selectedCandidate.review_status !== 'needs_correction')}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Review notes */}
                <div className="space-y-2">
                  <Label>\u78ba\u8a8d\u30e1\u30e2</Label>
                  <Input value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="\u4fee\u6b63\u7406\u7531\u3084\u78ba\u8a8d\u30e1\u30e2" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>\u9589\u3058\u308b</Button>
            {editable && selectedCandidate && (selectedCandidate.review_status === 'pending' || selectedCandidate.review_status === 'needs_correction') && (
              <>
                <Button variant="outline" className="text-orange-600 border-orange-300" onClick={handleNeedsCorrection} disabled={saving}>
                  <AlertCircle className="h-4 w-4 mr-1" />\u8981\u4fee\u6b63
                </Button>
                <Button variant="outline" className="text-red-600 border-red-300" onClick={handleReject} disabled={saving}>
                  <XCircle className="h-4 w-4 mr-1" />\u5374\u4e0b
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmDialogOpen(true)} disabled={saving}>
                  <CheckCircle className="h-4 w-4 mr-1" />\u627f\u8a8d\u30fb\u78ba\u5b9a
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="\u30c7\u30fc\u30bf\u3092\u627f\u8a8d\u30fb\u78ba\u5b9a"
        description="\u3053\u306e\u62bd\u51fa\u30c7\u30fc\u30bf\u3092\u627f\u8a8d\u3057\u3001\u6b63\u5f0f\u30c7\u30fc\u30bf\u3068\u3057\u3066\u767b\u9332\u3057\u307e\u3059\u3002\u3053\u306e\u64cd\u4f5c\u306f\u53d6\u308a\u6d88\u305b\u307e\u305b\u3093\u3002\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f"
        confirmLabel="\u627f\u8a8d\u30fb\u78ba\u5b9a"
        variant="default"
        onConfirm={handleApprove}
        loading={saving}
      />
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { ExtractedDataCandidate, ReviewStatus } from '@/types'
import { EXTRACTION_TYPES, REVIEW_STATUSES, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle, XCircle, Edit3, AlertCircle } from 'lucide-react'

interface DemoParsedData {
  [key: string]: string | number
}

interface DemoCandidate extends Omit<ExtractedDataCandidate, 'parsed_json'> {
  parsed_json: DemoParsedData
  file_name: string
}

const DEMO_CANDIDATES: DemoCandidate[] = [
  {
    id: '1', uploaded_file_id: '1', extraction_type: 'bank_statement', review_status: 'pending',
    raw_text: '2025/03/15 振込 ヤマダタロウ 85,000円\n2025/03/15 振込 サトウハナコ 72,000円',
    parsed_json: { transaction_date: '2025-03-15', payer_name: 'ヤマダタロウ', amount: 85000, description: '家賃入金' },
    notes: '3月分通帳', created_at: '2025-03-25T10:00:00Z', updated_at: '2025-03-25T10:00:00Z', file_name: '通帳_林建設_202503.pdf',
  },
  {
    id: '2', uploaded_file_id: '2', extraction_type: 'receipt_invoice', review_status: 'pending',
    raw_text: '領収書\n日付: 2025年3月20日\n金額: ¥350,000\n但し: 外壁塗装工事代金として',
    parsed_json: { date: '2025-03-20', vendor: '株式会社修繕サービス', amount: 350000, description: '外壁塗装工事' },
    notes: '', created_at: '2025-03-20T14:30:00Z', updated_at: '2025-03-20T14:30:00Z', file_name: '領収書_修繕工事.jpg',
  },
  {
    id: '3', uploaded_file_id: '3', extraction_type: 'lease_contract', review_status: 'needs_correction',
    raw_text: '賃貸借契約書\n契約者: 佐藤花子\n物件: パークハイツ201号室\n月額賃料: 68,000円\n契約期間: 2025/04/01 〜 2027/03/31',
    parsed_json: { tenant_name: '佐藤花子', property: 'パークハイツ', room: '201', monthly_rent: 68000, start_date: '2025-04-01', end_date: '2027-03-31' },
    notes: '金額要確認', created_at: '2025-03-18T09:15:00Z', updated_at: '2025-03-18T09:15:00Z', file_name: '入居契約書_佐藤.pdf',
  },
  {
    id: '4', uploaded_file_id: '4', extraction_type: 'loan_contract', review_status: 'approved',
    raw_text: '金銭消費貸借契約証書\n借入金額: 50,000,000円\n金利: 1.2%\n返済期間: 20年\n毎月返済額: 235,000円',
    parsed_json: { lender: 'みずほ銀行', amount: 50000000, interest_rate: 1.2, term_years: 20, monthly_payment: 235000 },
    notes: '確認済み', created_at: '2025-03-15T16:45:00Z', updated_at: '2025-03-16T10:00:00Z', file_name: '借入契約書_みずほ.pdf',
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
      .eq('uploaded_file_id', selectedCandidate.uploaded_file_id)
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

  return (
    <div className="space-y-6">
      <PageHeader title="取込確認" description="OCR/抽出結果を確認し、正式データとして登録します。自動確定は行わず、必ず人による確認が必要です。" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{candidates.length}</p>
            <p className="text-sm text-muted-foreground">全件</p>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-yellow-300' : ''}>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">確認待ち</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{correctionCount}</p>
            <p className="text-sm text-muted-foreground">要修正</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{candidates.filter(c => c.review_status === 'approved').length}</p>
            <p className="text-sm text-muted-foreground">承認済</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-48">
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="ステータス" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
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
                    <TableHead>ファイル名</TableHead>
                    <TableHead>抽出タイプ</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>作成日</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(c => {
                    const st = REVIEW_STATUSES[c.review_status as keyof typeof REVIEW_STATUSES]
                    const et = EXTRACTION_TYPES[c.extraction_type as keyof typeof EXTRACTION_TYPES]
                    return (
                      <TableRow key={c.id} className={c.review_status === 'pending' ? 'bg-yellow-50' : ''}>
                        <TableCell><StatusIcon status={c.review_status} /></TableCell>
                        <TableCell className="font-medium">{c.file_name}</TableCell>
                        <TableCell><span className="px-2 py-1 rounded bg-gray-100 text-xs">{et?.label || c.extraction_type}</span></TableCell>
                        <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.notes || '-'}</TableCell>
                        <TableCell className="text-sm">{formatDate(c.created_at)}</TableCell>
                        <TableCell>
                          {editable && (c.review_status === 'pending' || c.review_status === 'needs_correction') && (
                            <Button size="sm" onClick={() => openReview(c)}>確認</Button>
                          )}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>抽出データの確認・修正</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">抽出されたデータを確認し、必要に応じて修正してください。自動確定はされません。</p>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-6">
              {/* Source info */}
              <Card>
                <CardHeader><CardTitle className="text-sm">元ファイル情報</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">ファイル名:</span> {selectedCandidate.file_name}</div>
                    <div><span className="text-muted-foreground">抽出タイプ:</span> {EXTRACTION_TYPES[selectedCandidate.extraction_type as keyof typeof EXTRACTION_TYPES]?.label}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Raw text */}
              {selectedCandidate.raw_text && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">抽出テキスト（原文）</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">{selectedCandidate.raw_text}</pre>
                  </CardContent>
                </Card>
              )}

              {/* Editable fields */}
              <Card>
                <CardHeader><CardTitle className="text-sm">抽出候補データ（編集可）</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(editedJson).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Label className="w-32 text-right text-sm font-medium shrink-0">{key}</Label>
                        <Input
                          value={String(value)}
                          onChange={e => setEditedJson(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Review notes */}
              <div className="space-y-2">
                <Label>確認メモ</Label>
                <Input value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="修正理由や確認メモ" />
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>閉じる</Button>
            {editable && selectedCandidate && (selectedCandidate.review_status === 'pending' || selectedCandidate.review_status === 'needs_correction') && (
              <>
                <Button variant="outline" className="text-orange-600 border-orange-300" onClick={handleNeedsCorrection} disabled={saving}>
                  <AlertCircle className="h-4 w-4 mr-1" />要修正
                </Button>
                <Button variant="outline" className="text-red-600 border-red-300" onClick={handleReject} disabled={saving}>
                  <XCircle className="h-4 w-4 mr-1" />却下
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmDialogOpen(true)} disabled={saving}>
                  <CheckCircle className="h-4 w-4 mr-1" />承認・確定
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="データを承認・確定"
        description="この抽出データを承認し、正式データとして登録します。この操作は取り消せません。よろしいですか？"
        confirmLabel="承認・確定"
        variant="default"
        onConfirm={handleApprove}
        loading={saving}
      />
    </div>
  )
}

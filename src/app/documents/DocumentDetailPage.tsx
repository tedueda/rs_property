import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { canEditDocuments } from '@/lib/permissions'
import type { Document, DocumentVersion, DocumentLink, DocumentCategory, Company } from '@/types'
import { DOCUMENT_STATUSES, DOCUMENT_LINK_TARGET_TYPES, formatDate, formatFileSize, ALLOWED_FILE_EXTENSIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, Link2, Loader2, FileText, Trash2 } from 'lucide-react'

const DEMO_CATEGORIES: DocumentCategory[] = [
  { id: '1', category_name: '入居契約書', sort_order: 1, created_at: '', updated_at: '' },
  { id: '2', category_name: '借入契約書', sort_order: 2, created_at: '', updated_at: '' },
  { id: '3', category_name: '保証会社契約書', sort_order: 3, created_at: '', updated_at: '' },
  { id: '5', category_name: '解約通知書', sort_order: 5, created_at: '', updated_at: '' },
  { id: '6', category_name: '請求書', sort_order: 6, created_at: '', updated_at: '' },
  { id: '8', category_name: '給与資料', sort_order: 8, created_at: '', updated_at: '' },
]

const DEMO_COMPANIES: Company[] = [
  { id: '1', name: '林建設株式会社', created_at: '', updated_at: '' },
  { id: '2', name: 'N・Yコーポレーション株式会社', created_at: '', updated_at: '' },
  { id: '3', name: '株式会社オーナーズ', created_at: '', updated_at: '' },
  { id: '4', name: '株式会社照', created_at: '', updated_at: '' },
]

const DEMO_DOCUMENTS: Record<string, Document> = {
  '1': { id: '1', category_id: '1', title: '林建設 賃貸借契約書 101号室', company_id: '1', status: 'active', issue_date: '2024-04-01', contract_start_date: '2024-04-01', contract_end_date: '2026-03-31', renewal_date: '2026-02-01', notes: '2年契約', created_at: '2024-04-01', updated_at: '2024-04-01' },
  '2': { id: '2', category_id: '2', title: '林建設 借入契約書 三井住友銀行', company_id: '1', status: 'active', issue_date: '2023-01-15', contract_start_date: '2023-01-15', contract_end_date: '2028-01-14', renewal_date: '2027-11-15', notes: '5年ローン', created_at: '2023-01-15', updated_at: '2023-01-15' },
  '3': { id: '3', category_id: '3', title: 'NYコーポ 保証会社契約', company_id: '2', status: 'renewal_pending', issue_date: '2023-06-01', contract_start_date: '2023-06-01', contract_end_date: '2025-05-31', renewal_date: '2025-04-01', notes: '更新手続き中', created_at: '2023-06-01', updated_at: '2023-06-01' },
  '4': { id: '4', category_id: '1', title: 'オーナーズ 事務所賃貸契約', company_id: '3', status: 'active', issue_date: '2024-01-01', contract_start_date: '2024-01-01', contract_end_date: '2026-12-31', notes: '3年契約', created_at: '2024-01-01', updated_at: '2024-01-01' },
  '5': { id: '5', category_id: '8', title: '照 給与規程', company_id: '4', status: 'active', issue_date: '2024-04-01', notes: '最新版', created_at: '2024-04-01', updated_at: '2024-04-01' },
  '6': { id: '6', category_id: '5', title: '林建設 オフィス賃貸解約通知', company_id: '1', status: 'cancelled', issue_date: '2025-01-15', notes: '2025年3月末解約', created_at: '2025-01-15', updated_at: '2025-01-15' },
  '7': { id: '7', category_id: '6', title: 'NYコーポ 修繕工事請求書', company_id: '2', status: 'needs_review', issue_date: '2025-03-20', notes: '外壁塗装工事', created_at: '2025-03-20', updated_at: '2025-03-20' },
  '8': { id: '8', category_id: '3', title: 'オーナーズ 火災保険証券', company_id: '3', status: 'expired', issue_date: '2022-04-01', contract_start_date: '2022-04-01', contract_end_date: '2025-03-31', notes: '期限切れ - 要更新', created_at: '2022-04-01', updated_at: '2022-04-01' },
}

const DEMO_VERSIONS: Record<string, DocumentVersion[]> = {
  '1': [
    { id: 'v2', document_id: '1', version_number: 2, file_path: '/docs/lease_101_v2.pdf', file_name: '賃貸借契約書_101号室_v2.pdf', file_size: 2580000, mime_type: 'application/pdf', notes: '特約追加', created_at: '2024-06-15' },
    { id: 'v1', document_id: '1', version_number: 1, file_path: '/docs/lease_101_v1.pdf', file_name: '賃貸借契約書_101号室_v1.pdf', file_size: 2450000, mime_type: 'application/pdf', notes: '初版', created_at: '2024-04-01' },
  ],
  '2': [
    { id: 'v3', document_id: '2', version_number: 1, file_path: '/docs/loan_smbc.pdf', file_name: '借入契約書_三井住友銀行.pdf', file_size: 3100000, mime_type: 'application/pdf', notes: '原本スキャン', created_at: '2023-01-15' },
  ],
}

const DEMO_LINKS: Record<string, DocumentLink[]> = {
  '1': [
    { id: 'l1', document_id: '1', target_type: 'company', target_id: '1', target_label: '林建設株式会社', created_at: '2024-04-01' },
    { id: 'l2', document_id: '1', target_type: 'tenant', target_id: 't1', target_label: '田中太郎', created_at: '2024-04-01' },
  ],
  '2': [
    { id: 'l3', document_id: '2', target_type: 'company', target_id: '1', target_label: '林建設株式会社', created_at: '2023-01-15' },
    { id: 'l4', document_id: '2', target_type: 'bank_account', target_id: 'ba1', target_label: '三井住友銀行 ****4567', created_at: '2023-01-15' },
  ],
}

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const editable = canEditDocuments(user)
  const [doc, setDoc] = useState<Document | null>(null)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [links, setLinks] = useState<DocumentLink[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadNotes, setUploadNotes] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [linkTargetType, setLinkTargetType] = useState('company')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [targetOptions, setTargetOptions] = useState<{id: string, label: string}[]>([])

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    if (isDemoMode) {
      setDoc(DEMO_DOCUMENTS[id] || null)
      setVersions(DEMO_VERSIONS[id] || [])
      setLinks(DEMO_LINKS[id] || [])
      setLoading(false)
      return
    }
    const [{ data: docData }, { data: versData }, { data: linksData }] = await Promise.all([
      supabase.from('documents').select('*, category:document_categories(*), company:companies(*)').eq('id', id).single(),
      supabase.from('document_versions').select('*').eq('document_id', id).order('version_number', { ascending: false }),
      supabase.from('document_links').select('*').eq('document_id', id),
    ])
    setDoc(docData)
    setVersions(versData || [])
    setLinks(linksData || [])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUploadVersion = async () => {
    if (!id) return
    setSaving(true)
    if (isDemoMode) {
      const newVersion: DocumentVersion = {
        id: String(Date.now()), document_id: id, version_number: versions.length + 1,
        file_path: `/docs/upload_${Date.now()}.pdf`, file_name: selectedFile?.name || 'uploaded_file.pdf',
        file_size: selectedFile?.size || 0, mime_type: selectedFile?.type || 'application/pdf',
        notes: uploadNotes, created_at: new Date().toISOString(),
      }
      setVersions(prev => [newVersion, ...prev])
      setUploadDialogOpen(false); setSaving(false); setUploadNotes(''); setSelectedFile(null)
      return
    }
    if (selectedFile) {
      const filePath = `documents/${id}/${Date.now()}_${selectedFile.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, selectedFile)
      if (!uploadError) {
        await supabase.from('document_versions').insert({
          document_id: id, version_number: versions.length + 1, file_path: filePath,
          file_name: selectedFile.name, file_size: selectedFile.size, mime_type: selectedFile.type,
          notes: uploadNotes, uploaded_by: user?.id,
        })
      }
    }
    setSaving(false); setUploadDialogOpen(false); setUploadNotes(''); setSelectedFile(null); fetchData()
  }

  const fetchTargetOptions = useCallback(async (type: string) => {
    if (isDemoMode) {
      const demoOptions: Record<string, {id: string, label: string}[]> = {
        company: DEMO_COMPANIES.map(c => ({ id: c.id, label: c.name })),
        property: [{ id: 'p1', label: 'ハイツ林 A棟' }, { id: 'p2', label: 'NYマンション' }],
        room: [{ id: 'r1', label: '101号室' }, { id: 'r2', label: '202号室' }],
        tenant: [{ id: 't1', label: '田中太郎' }, { id: 't2', label: '佐藤花子' }],
        bank_account: [{ id: 'ba1', label: '三井住友銀行 ****4567' }, { id: 'ba2', label: 'みずほ銀行 ****8901' }],
        loan_repayment: [{ id: 'lr1', label: '三井住友銀行 月額返済' }],
        expense: [{ id: 'e1', label: '修繕工事費用' }],
        payroll: [{ id: 'pr1', label: '2025年3月給与' }],
      }
      setTargetOptions(demoOptions[type] || [])
      return
    }
    const tableMap: Record<string, { table: string, labelCol: string }> = {
      company: { table: 'companies', labelCol: 'name' },
      property: { table: 'properties', labelCol: 'property_name' },
      room: { table: 'rooms', labelCol: 'room_number' },
      tenant: { table: 'tenants', labelCol: 'tenant_name' },
      bank_account: { table: 'bank_accounts', labelCol: 'bank_name' },
      loan_repayment: { table: 'loan_repayments', labelCol: 'lender_name' },
      expense: { table: 'expense_records', labelCol: 'description' },
      payroll: { table: 'payroll_records', labelCol: 'target_month' },
    }
    const mapping = tableMap[type]
    if (!mapping) { setTargetOptions([]); return }
    const { data } = await supabase.from(mapping.table).select(`id, ${mapping.labelCol}`).is('deleted_at', null).limit(50)
    setTargetOptions((data || []).map((r: Record<string, string>) => ({ id: r.id, label: r[mapping.labelCol] || r.id })))
  }, [])

  const handleAddLink = async () => {
    if (!id || !linkTargetId) return
    setSaving(true)
    const label = targetOptions.find(o => o.id === linkTargetId)?.label || linkTargetId
    if (isDemoMode) {
      const newLink: DocumentLink = {
        id: String(Date.now()), document_id: id,
        target_type: linkTargetType as DocumentLink['target_type'],
        target_id: linkTargetId, target_label: label,
        created_at: new Date().toISOString(),
      }
      setLinks(prev => [...prev, newLink])
      setLinkDialogOpen(false); setSaving(false); setLinkTargetId('')
      return
    }
    await supabase.from('document_links').insert({
      document_id: id, target_type: linkTargetType, target_id: linkTargetId, target_label: label,
    })
    setSaving(false); setLinkDialogOpen(false); setLinkTargetId(''); fetchData()
  }

  const handleDeleteLink = async (linkId: string) => {
    if (isDemoMode) { setLinks(prev => prev.filter(l => l.id !== linkId)); return }
    await supabase.from('document_links').delete().eq('id', linkId)
    fetchData()
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  if (!doc) return <div className="text-center py-24 text-muted-foreground">書類が見つかりません</div>

  const st = DOCUMENT_STATUSES[doc.status as keyof typeof DOCUMENT_STATUSES]
  const getCategoryName = (cid?: string) => DEMO_CATEGORIES.find(c => c.id === cid)?.category_name || doc.category?.category_name || '-'
  const getCompanyName = (cid?: string) => DEMO_COMPANIES.find(c => c.id === cid)?.name || doc.company?.name || '-'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">書類詳細</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">基本情報</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">カテゴリ</p><p className="font-medium">{getCategoryName(doc.category_id)}</p></div>
                <div><p className="text-sm text-muted-foreground">会社</p><p className="font-medium">{getCompanyName(doc.company_id)}</p></div>
                <div><p className="text-sm text-muted-foreground">ステータス</p>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</div>
                <div><p className="text-sm text-muted-foreground">発行日</p><p>{doc.issue_date ? formatDate(doc.issue_date) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">契約開始日</p><p>{doc.contract_start_date ? formatDate(doc.contract_start_date) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">契約終了日</p><p>{doc.contract_end_date ? formatDate(doc.contract_end_date) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">更新日</p><p>{doc.renewal_date ? formatDate(doc.renewal_date) : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">備考</p><p>{doc.notes || '-'}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">バージョン履歴 ({versions.length}件)</CardTitle>
              {editable && <Button size="sm" onClick={() => setUploadDialogOpen(true)}><Upload className="h-4 w-4 mr-1" />新バージョン</Button>}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ver.</TableHead>
                    <TableHead>ファイル名</TableHead>
                    <TableHead>サイズ</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>アップロード日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">バージョンがありません</TableCell></TableRow>
                  ) : versions.map((v, i) => (
                    <TableRow key={v.id} className={i === 0 ? 'bg-blue-50' : ''}>
                      <TableCell className="text-center font-mono font-bold">{i === 0 ? `v${v.version_number} (最新)` : `v${v.version_number}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{v.file_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{v.file_size ? formatFileSize(v.file_size) : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.notes || '-'}</TableCell>
                      <TableCell className="text-sm">{formatDate(v.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">関連先 ({links.length}件)</CardTitle>
              {editable && <Button size="sm" variant="outline" onClick={() => { setLinkDialogOpen(true); fetchTargetOptions(linkTargetType) }}><Link2 className="h-4 w-4 mr-1" />追加</Button>}
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">関連先がありません</p>
              ) : (
                <div className="space-y-3">
                  {links.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 mr-2">
                          {DOCUMENT_LINK_TARGET_TYPES[link.target_type as keyof typeof DOCUMENT_LINK_TARGET_TYPES]?.label || link.target_type}
                        </span>
                        <span className="text-sm font-medium">{link.target_label || link.target_id}</span>
                      </div>
                      {editable && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteLink(link.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload Version Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>新バージョンをアップロード</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ファイル <span className="text-red-500">*</span></Label>
              <Input type="file" accept={ALLOWED_FILE_EXTENSIONS} onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Input value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="変更内容など" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleUploadVersion} disabled={saving || !selectedFile}>{saving ? 'アップロード中...' : 'アップロード'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>関連先を追加</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>関連先の種類</Label>
              <Select value={linkTargetType} onValueChange={(v) => { setLinkTargetType(v); setLinkTargetId(''); fetchTargetOptions(v) }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_LINK_TARGET_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>関連先 <span className="text-red-500">*</span></Label>
              {targetOptions.length > 0 ? (
                <Select value={linkTargetId} onValueChange={setLinkTargetId}>
                  <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                  <SelectContent>
                    {targetOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground py-2">種類を選択すると候補が表示されます</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>キャンセル</Button>
            <Button onClick={handleAddLink} disabled={saving || !linkTargetId}>{saving ? '追加中...' : '追加'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

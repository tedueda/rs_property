import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Search, Upload, ScanLine, Eye, FileText, Loader2 } from 'lucide-react'
import type { OcrJob } from '@/types'

const mockJobs: OcrJob[] = [
  { id: '1', company_id: '1', file_path: '/application-originals/app_20260325.pdf', file_name: '申込書_20260325.pdf', file_type: 'application/pdf', status: 'completed', created_at: '2026-03-25T10:00:00', updated_at: '2026-03-25T10:05:00' },
  { id: '2', company_id: '1', file_path: '/application-originals/app_20260324.jpg', file_name: '申込書_20260324.jpg', file_type: 'image/jpeg', status: 'completed', created_at: '2026-03-24T14:00:00', updated_at: '2026-03-24T14:03:00' },
  { id: '3', company_id: '1', file_path: '/application-originals/app_20260328.pdf', file_name: '申込書_20260328.pdf', file_type: 'application/pdf', status: 'processing', created_at: '2026-03-28T09:00:00', updated_at: '2026-03-28T09:00:00' },
  { id: '4', company_id: '1', file_path: '/application-originals/app_20260327.png', file_name: '申込書_20260327.png', file_type: 'image/png', status: 'pending', created_at: '2026-03-27T16:00:00', updated_at: '2026-03-27T16:00:00' },
  { id: '5', company_id: '1', file_path: '/application-originals/app_20260326.pdf', file_name: '申込書_20260326.pdf', file_type: 'application/pdf', status: 'failed', error_message: 'OCR処理中にエラーが発生しました', created_at: '2026-03-26T11:00:00', updated_at: '2026-03-26T11:02:00' },
]

const statusMap = {
  pending: { label: '待機中', color: 'bg-gray-100 text-gray-800' },
  processing: { label: '処理中', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '完了', color: 'bg-green-100 text-green-800' },
  failed: { label: '失敗', color: 'bg-red-100 text-red-800' },
}

export function OcrJobsPage() {
  const [jobs] = useState<OcrJob[]>(mockJobs)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => { document.title = 'OCRジョブ - RS不動産管理' }, [])

  const filtered = jobs.filter(j => {
    const matchSearch = j.file_name.includes(search)
    const matchStatus = !statusFilter || j.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader title="OCRジョブ" description="申込書のOCR処理管理"
        actions={<Button onClick={() => setShowUpload(true)}><Upload className="mr-2 h-4 w-4" />ファイルアップロード</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ファイル名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">全ステータス</option>
              {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ファイル名</TableHead>
              <TableHead>ファイル種別</TableHead>
              <TableHead>アップロード日時</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((job) => {
              const st = statusMap[job.status]
              return (
                <TableRow key={job.id}>
                  <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{job.file_name}</span></div></TableCell>
                  <TableCell className="text-muted-foreground">{job.file_type}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(job.created_at).toLocaleString('ja-JP')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                      {job.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {job.status === 'completed' && <Button variant="ghost" size="sm"><Eye className="mr-1 h-3 w-3" />確認</Button>}
                      {job.status === 'failed' && <Button variant="ghost" size="sm"><ScanLine className="mr-1 h-3 w-3" />再実行</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent onClose={() => setShowUpload(false)}>
          <DialogHeader><DialogTitle>ファイルアップロード</DialogTitle></DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">ファイルをドラッグ＆ドロップ</p>
            <p className="text-xs text-muted-foreground mb-4">PDF, JPG, PNG, HEIC対応</p>
            <Button variant="outline">ファイルを選択</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>キャンセル</Button>
            <Button><ScanLine className="mr-2 h-4 w-4" />OCR実行</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

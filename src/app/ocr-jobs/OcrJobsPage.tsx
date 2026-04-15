import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Search, ScanLine, Eye, Loader2 } from 'lucide-react'
import { useOcrJobs } from '@/lib/supabase/hooks'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  completed: { label: '完了', variant: 'success' },
  processing: { label: '処理中', variant: 'warning' },
  failed: { label: '失敗', variant: 'destructive' },
  pending: { label: '待機中', variant: 'secondary' },
}

export function OcrJobsPage() {
  const { data: jobs, loading } = useOcrJobs()
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = 'OCRジョブ - RS不動産管理' }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const filtered = jobs.filter(j => j.file_name?.includes(search) ?? false)

  return (
    <div>
      <PageHeader title="OCRジョブ管理" description={`${jobs.length}件のOCRジョブ`} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ファイル名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>ファイル名</TableHead><TableHead>ステータス</TableHead><TableHead>作成日</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">OCRジョブがありません</TableCell></TableRow>
            ) : filtered.map((job) => {
              const st = statusMap[job.status] || { label: job.status, variant: 'secondary' as const }
              return (
                <TableRow key={job.id}>
                  <TableCell><div className="flex items-center gap-2"><ScanLine className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{job.file_name}</span></div></TableCell>
                  <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{job.created_at ? new Date(job.created_at).toLocaleDateString('ja-JP') : '-'}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

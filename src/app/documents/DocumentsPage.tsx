import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Upload, Download, FileText, File, Image, Loader2 } from 'lucide-react'
import { useDocuments } from '@/lib/supabase/hooks'

const typeIcons: Record<string, typeof FileText> = { 'application/pdf': FileText, 'image/jpeg': Image, 'image/png': Image }

export function DocumentsPage() {
  const { data: docs, loading } = useDocuments()
  const [search, setSearch] = useState('')
  useEffect(() => { document.title = '書類管理 - RS不動産管理' }, [])

  const filtered = docs.filter(d => d.name.includes(search) || (d.category?.includes(search) ?? false))

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="書類管理" description="全書類の一元管理"
        actions={<Button><Upload className="mr-2 h-4 w-4" />アップロード</Button>} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ファイル名・カテゴリで検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>ファイル名</TableHead><TableHead>カテゴリ</TableHead><TableHead>登録日</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">書類がありません</TableCell></TableRow>
            ) : filtered.map((doc) => {
              const Icon = typeIcons[doc.file_type || ''] || File
              return (
                <TableRow key={doc.id}>
                  <TableCell><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{doc.name}</span></div></TableCell>
                  <TableCell><Badge variant="secondary">{doc.category || '-'}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{doc.created_at ? new Date(doc.created_at).toLocaleDateString('ja-JP') : '-'}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

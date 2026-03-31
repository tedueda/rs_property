import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Search, Plus, Map, Pencil, Eye } from 'lucide-react'

const mockTemplates = [
  { id: '1', name: 'A社標準申込書', description: '標準フォーマット', mappedFields: 28, unmappedFields: 0, lastUsed: '2026-03-25' },
  { id: '2', name: 'B社申込書', description: '独自フォーマット', mappedFields: 22, unmappedFields: 3, lastUsed: '2026-03-20' },
  { id: '3', name: 'C社FAX申込書', description: '手書きFAX', mappedFields: 18, unmappedFields: 5, lastUsed: '2026-03-15' },
]

export function TemplateMappingsPage() {
  const [search, setSearch] = useState('')
  useEffect(() => { document.title = '帳票マッピング管理 - RS不動産管理' }, [])

  const filtered = mockTemplates.filter(t => t.name.includes(search))

  return (
    <div>
      <PageHeader title="帳票マッピング管理" description="OCR帳票フォーマットの項目マッピング"
        actions={<Button><Plus className="mr-2 h-4 w-4" />テンプレート追加</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="テンプレート名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>テンプレート名</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="text-right">マッピング済</TableHead>
              <TableHead className="text-right">未マッピング</TableHead>
              <TableHead>最終利用</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell><div className="flex items-center gap-2"><Map className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{t.name}</span></div></TableCell>
                <TableCell className="text-muted-foreground">{t.description}</TableCell>
                <TableCell className="text-right"><Badge variant="success">{t.mappedFields}</Badge></TableCell>
                <TableCell className="text-right">{t.unmappedFields > 0 ? <Badge variant="warning">{t.unmappedFields}</Badge> : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell className="text-muted-foreground">{t.lastUsed}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

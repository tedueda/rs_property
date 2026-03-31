import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Upload, Download, FileText, File, Image } from 'lucide-react'

const mockDocs = [
  { id: '1', name: '申込書_田中太郎.pdf', type: 'application/pdf', category: '申込書', size: '2.4MB', date: '2026-03-25' },
  { id: '2', name: '契約書_山田一郎.pdf', type: 'application/pdf', category: '契約書', size: '1.8MB', date: '2026-03-22' },
  { id: '3', name: '本人確認_佐藤花子.jpg', type: 'image/jpeg', category: '本人確認書類', size: '1.2MB', date: '2026-03-24' },
  { id: '4', name: '修繕写真_給湯器.jpg', type: 'image/jpeg', category: '修繕写真', size: '3.1MB', date: '2026-03-20' },
]

const typeIcons = { 'application/pdf': FileText, 'image/jpeg': Image, 'image/png': Image }

export function DocumentsPage() {
  const [search, setSearch] = useState('')
  useEffect(() => { document.title = '書類管理 - RS不動産管理' }, [])

  const filtered = mockDocs.filter(d => d.name.includes(search) || d.category.includes(search))

  return (
    <div>
      <PageHeader title="書類管理" description="全書類の一元管理"
        actions={<Button><Upload className="mr-2 h-4 w-4" />アップロード</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ファイル名・カテゴリで検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ファイル名</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>サイズ</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => {
              const Icon = typeIcons[doc.type as keyof typeof typeIcons] || File
              return (
                <TableRow key={doc.id}>
                  <TableCell><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{doc.name}</span></div></TableCell>
                  <TableCell><Badge variant="secondary">{doc.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                  <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

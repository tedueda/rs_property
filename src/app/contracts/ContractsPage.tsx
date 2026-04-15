import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Search, FileCheck, Eye, Download, Plus, Loader2 } from 'lucide-react'
import { useContracts } from '@/lib/supabase/hooks'

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
  active: { label: '有効', color: 'bg-green-100 text-green-800' },
  expired: { label: '満了', color: 'bg-yellow-100 text-yellow-800' },
  terminated: { label: '解約', color: 'bg-red-100 text-red-800' },
}

export function ContractsPage() {
  const { data: contracts, loading } = useContracts()
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = '契約管理 - RS不動産管理' }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="契約管理" description={`${contracts.length}件の契約`}
        actions={<Button><Plus className="mr-2 h-4 w-4" />契約作成</Button>} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="物件名・契約者名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>契約ID</TableHead><TableHead>物件</TableHead><TableHead>種別</TableHead><TableHead>開始日</TableHead>
            <TableHead>終了日</TableHead><TableHead className="text-right">賃料</TableHead><TableHead>ステータス</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">契約データがありません</TableCell></TableRow>
            ) : contracts.map((c) => {
              const st = statusMap[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-800' }
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><FileCheck className="h-4 w-4 text-muted-foreground" />CTR-{c.id.slice(0, 6)}</div></TableCell>
                  <TableCell>{c.property?.name}</TableCell>
                  <TableCell>{c.contract_type === 'new' ? '新規' : '更新'}</TableCell>
                  <TableCell>{c.start_date}</TableCell>
                  <TableCell>{c.end_date || '-'}</TableCell>
                  <TableCell className="text-right">¥{(c.rent_amount || 0).toLocaleString()}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/contracts/${c.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
                      {c.pdf_file_path && <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>}
                    </div>
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

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { REPAIR_STATUSES, REPAIR_PRIORITIES } from '@/lib/constants'
import { Search, Plus, Wrench, Eye, Loader2 } from 'lucide-react'
import { useRepairs } from '@/lib/supabase/hooks'

export function RepairsPage() {
  const { data: repairs, loading } = useRepairs()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { document.title = '修繕管理 - RS不動産管理' }, [])

  const filtered = repairs.filter(r => {
    const matchSearch = r.title.includes(search) || (r.property?.name?.includes(search) ?? false)
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="修繕管理" description={`${repairs.length}件の修繕`}
        actions={<Button><Plus className="mr-2 h-4 w-4" />修繕登録</Button>} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="タイトル・物件名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">全ステータス</option>
            {Object.entries(REPAIR_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>タイトル</TableHead><TableHead>物件</TableHead><TableHead>優先度</TableHead>
            <TableHead>受付日</TableHead><TableHead>担当</TableHead><TableHead>ステータス</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">修繕データがありません</TableCell></TableRow>
            ) : filtered.map((r) => {
              const st = REPAIR_STATUSES[r.status]
              const pr = REPAIR_PRIORITIES[r.priority]
              return (
                <TableRow key={r.id}>
                  <TableCell><div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{r.title}</span></div></TableCell>
                  <TableCell className="text-muted-foreground">{r.property?.name}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pr.color}`}>{pr.label}</span></TableCell>
                  <TableCell>{r.received_date}</TableCell>
                  <TableCell>{r.staff_name}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                  <TableCell className="text-right"><Link to={`/repairs/${r.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { REPAIR_STATUSES, REPAIR_PRIORITIES } from '@/lib/constants'
import { Search, Plus, Wrench, Eye } from 'lucide-react'
import type { Repair } from '@/types'

const mockRepairs: Repair[] = [
  { id: '1', company_id: '1', property_id: '1', unit_id: '1', title: '給湯器故障', status: 'in_progress', priority: 'high', received_date: '2026-03-20', vendor_name: '○○設備', estimated_cost: 150000, staff_name: '管理太郎', created_at: '', updated_at: '', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '', total_units: 24, created_at: '', updated_at: '' } },
  { id: '2', company_id: '1', property_id: '2', unit_id: '3', title: 'エアコン不調', status: 'vendor_requested', priority: 'medium', received_date: '2026-03-22', staff_name: '管理花子', created_at: '', updated_at: '', property: { id: '2', company_id: '1', name: 'グリーンコート', address: '', total_units: 12, created_at: '', updated_at: '' } },
  { id: '3', company_id: '1', property_id: '3', unit_id: '5', title: '水漏れ', status: 'received', priority: 'urgent', received_date: '2026-03-28', staff_name: '管理太郎', created_at: '', updated_at: '', property: { id: '3', company_id: '1', name: 'パークビュー横浜', address: '', total_units: 48, created_at: '', updated_at: '' } },
  { id: '4', company_id: '1', property_id: '1', unit_id: '2', title: '壁紙はがれ', status: 'completed', priority: 'low', received_date: '2026-03-10', completed_date: '2026-03-15', actual_cost: 25000, staff_name: '管理花子', created_at: '', updated_at: '', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '', total_units: 24, created_at: '', updated_at: '' } },
]

export function RepairsPage() {
  const [repairs] = useState<Repair[]>(mockRepairs)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { document.title = '修繕管理 - RS不動産管理' }, [])

  const filtered = repairs.filter(r => {
    const matchSearch = r.title.includes(search) || (r.property?.name?.includes(search) ?? false)
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader title="修繕管理" description={`${repairs.length}件の修繕`}
        actions={<Button><Plus className="mr-2 h-4 w-4" />修繕登録</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="タイトル・物件名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">全ステータス</option>
              {Object.entries(REPAIR_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>物件</TableHead>
              <TableHead>優先度</TableHead>
              <TableHead>受付日</TableHead>
              <TableHead>担当</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
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
                  <TableCell className="text-right">
                    <Link to={`/repairs/${r.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
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

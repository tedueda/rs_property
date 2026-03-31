import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { Search, Plus, Eye, FileText } from 'lucide-react'
import type { Application } from '@/types'

const mockApps: Application[] = [
  { id: '1', company_id: '1', property_id: '1', unit_id: '1', application_number: 'APP-2026-001', status: 'screening', reception_date: '2026-03-25', rent_amount: 95000, created_at: '2026-03-25', updated_at: '2026-03-25', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '', total_units: 24, created_at: '', updated_at: '' }, applicant: { id: '1', application_id: '1', full_name: '田中太郎', full_name_kana: 'タナカタロウ', created_at: '', updated_at: '' } },
  { id: '2', company_id: '1', property_id: '2', unit_id: '3', application_number: 'APP-2026-002', status: 'submitted', reception_date: '2026-03-24', rent_amount: 120000, created_at: '2026-03-24', updated_at: '2026-03-24', property: { id: '2', company_id: '1', name: 'グリーンコート', address: '', total_units: 12, created_at: '', updated_at: '' }, applicant: { id: '2', application_id: '2', full_name: '佐藤花子', full_name_kana: 'サトウハナコ', created_at: '', updated_at: '' } },
  { id: '3', company_id: '1', property_id: '3', unit_id: '4', application_number: 'APP-2026-003', status: 'approved', reception_date: '2026-03-20', rent_amount: 82000, created_at: '2026-03-20', updated_at: '2026-03-22', property: { id: '3', company_id: '1', name: 'パークビュー横浜', address: '', total_units: 48, created_at: '', updated_at: '' }, applicant: { id: '3', application_id: '3', full_name: '山田一郎', full_name_kana: 'ヤマダイチロウ', created_at: '', updated_at: '' } },
  { id: '4', company_id: '1', property_id: '1', unit_id: '2', application_number: 'APP-2026-004', status: 'draft', reception_date: '2026-03-28', rent_amount: 75000, created_at: '2026-03-28', updated_at: '2026-03-28', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '', total_units: 24, created_at: '', updated_at: '' }, applicant: { id: '4', application_id: '4', full_name: '鈴木二郎', full_name_kana: 'スズキジロウ', created_at: '', updated_at: '' } },
]

export function ApplicationsPage() {
  const [apps] = useState<Application[]>(mockApps)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { document.title = '申込管理 - RS不動産管理' }, [])

  const filtered = apps.filter(a => {
    const matchSearch = (a.applicant?.full_name?.includes(search) || a.property?.name?.includes(search) || a.application_number?.includes(search)) ?? false
    const matchStatus = !statusFilter || a.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader title="申込管理" description={`${apps.length}件の申込`}
        actions={<Link to="/applications/new"><Button><Plus className="mr-2 h-4 w-4" />新規申込</Button></Link>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="申込者名・物件名・申込番号で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">全ステータス</option>
              {Object.entries(APPLICATION_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>申込番号</TableHead>
              <TableHead>申込者</TableHead>
              <TableHead>物件</TableHead>
              <TableHead className="text-right">賃料</TableHead>
              <TableHead>受付日</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((app) => {
              const statusInfo = APPLICATION_STATUSES[app.status]
              return (
                <TableRow key={app.id}>
                  <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{app.application_number}</span></div></TableCell>
                  <TableCell>{app.applicant?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{app.property?.name}</TableCell>
                  <TableCell className="text-right">¥{(app.rent_amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{app.reception_date}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></TableCell>
                  <TableCell className="text-right">
                    <Link to={`/applications/${app.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
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

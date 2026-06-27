import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { Search, Plus, Eye, FileText, Loader2 } from 'lucide-react'
import { useApplications } from '@/lib/supabase/hooks'

export function ApplicationsPage() {
  const { data: apps, loading } = useApplications()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { document.title = '申込管理 - RS不動産管理' }, [])

  const filtered = apps.filter(a => {
    const matchSearch = (a.applicant?.full_name?.includes(search) || a.property?.name?.includes(search) || a.application_number?.includes(search)) ?? false
    const matchStatus = !statusFilter || a.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="申込管理" description={`${apps.length}件の申込`}
        actions={<Link to="/applications/new"><Button><Plus className="mr-2 h-4 w-4" />新規申込</Button></Link>} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="申込者名・物件名・申込番号で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">全ステータス</option>
            {Object.entries(APPLICATION_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>申込番号</TableHead><TableHead>申込者</TableHead><TableHead>物件</TableHead>
            <TableHead className="text-right">賃料</TableHead><TableHead>受付日</TableHead><TableHead>ステータス</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">申込データがありません</TableCell></TableRow>
            ) : filtered.map((app) => {
              const statusInfo = APPLICATION_STATUSES[app.status]
              return (
                <TableRow key={app.id}>
                  <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{app.application_number}</span></div></TableCell>
                  <TableCell>{app.applicant?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{app.property?.name}</TableCell>
                  <TableCell className="text-right">¥{(app.rent_amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{app.reception_date}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></TableCell>
                  <TableCell className="text-right"><Link to={`/applications/${app.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

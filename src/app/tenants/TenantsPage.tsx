import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Search, Users, Eye } from 'lucide-react'
import type { Tenant } from '@/types'

const mockTenants: Tenant[] = [
  { id: '1', company_id: '1', full_name: '田中太郎', full_name_kana: 'タナカタロウ', phone: '090-1234-5678', email: 'tanaka@example.com', created_at: '2024-04-01', updated_at: '2024-04-01' },
  { id: '2', company_id: '1', full_name: '佐藤花子', full_name_kana: 'サトウハナコ', phone: '080-9876-5432', email: 'sato@example.com', created_at: '2024-06-01', updated_at: '2024-06-01' },
  { id: '3', company_id: '1', full_name: '山田一郎', full_name_kana: 'ヤマダイチロウ', phone: '070-1111-2222', email: 'yamada@example.com', created_at: '2024-08-01', updated_at: '2024-08-01' },
]

export function TenantsPage() {
  const [tenants] = useState<Tenant[]>(mockTenants)
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = '入居者 - RS不動産管理' }, [])

  const filtered = tenants.filter(t => t.full_name.includes(search) || (t.full_name_kana?.includes(search) ?? false))

  return (
    <div>
      <PageHeader title="入居者管理" description={`${tenants.length}名の入居者`} />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="氏名・フリガナで検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>フリガナ</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>メール</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{t.full_name}</span></div></TableCell>
                <TableCell className="text-muted-foreground">{t.full_name_kana}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell className="text-muted-foreground">{t.email}</TableCell>
                <TableCell className="text-right">
                  <Link to={`/tenants/${t.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

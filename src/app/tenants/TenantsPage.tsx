import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Search, Users, Eye, Loader2 } from 'lucide-react'
import { useTenants } from '@/lib/supabase/hooks'

export function TenantsPage() {
  const { data: tenants, loading } = useTenants()
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = '入居者 - RS不動産管理' }, [])

  const filtered = tenants.filter(t => t.full_name.includes(search) || (t.full_name_kana?.includes(search) ?? false))

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="入居者管理" description={`${tenants.length}名の入居者`} />
      <Card className="mb-6"><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="氏名・フリガナで検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>氏名</TableHead><TableHead>フリガナ</TableHead><TableHead>電話番号</TableHead><TableHead>メール</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">入居者データがありません</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell><div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{t.full_name}</span></div></TableCell>
                <TableCell className="text-muted-foreground">{t.full_name_kana}</TableCell>
                <TableCell>{t.phone}</TableCell>
                <TableCell className="text-muted-foreground">{t.email}</TableCell>
                <TableCell className="text-right"><Link to={`/tenants/${t.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

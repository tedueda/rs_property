import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RENT_CHARGE_STATUSES } from '@/lib/constants'
import { Search, Plus, Check, Loader2 } from 'lucide-react'
import { useRentCharges, useRentPayments } from '@/lib/supabase/hooks'

export function RentPage() {
  const { data: charges, loading: loadingCharges } = useRentCharges()
  const { data: payments, loading: loadingPayments } = useRentPayments()
  const [tab, setTab] = useState('charges')
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = '家賃管理 - RS不動産管理' }, [])

  const loading = loadingCharges || loadingPayments

  const totalCharged = charges.reduce((s, c) => s + (c.total_amount || 0), 0)
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const totalOverdue = charges.filter(c => c.status === 'overdue').reduce((s, c) => s + (c.total_amount || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="家賃管理" description="請求・入金管理"
        actions={<Button><Plus className="mr-2 h-4 w-4" />入金登録</Button>} />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今月請求</p><p className="text-2xl font-bold">¥{totalCharged.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">入金済</p><p className="text-2xl font-bold text-green-600">¥{totalPaid.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収</p><p className="text-2xl font-bold text-orange-600">¥{(totalCharged - totalPaid).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">滞納</p><p className="text-2xl font-bold text-red-600">¥{totalOverdue.toLocaleString()}</p></CardContent></Card>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="charges">請求一覧</TabsTrigger>
          <TabsTrigger value="payments">入金一覧</TabsTrigger>
        </TabsList>
        <TabsContent value="charges">
          <Card className="mb-4"><CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="入居者名・物件名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent></Card>
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>対象月</TableHead><TableHead className="text-right">請求額</TableHead><TableHead>ステータス</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {charges.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">請求データがありません</TableCell></TableRow>
                ) : charges.map((c) => {
                  const st = RENT_CHARGE_STATUSES[c.status] || { label: c.status, color: '' }
                  return (
                    <TableRow key={c.id}>
                      <TableCell>{c.charge_month}</TableCell>
                      <TableCell className="text-right font-medium">¥{(c.total_amount || 0).toLocaleString()}</TableCell>
                      <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>入金日</TableHead><TableHead>振込人名</TableHead><TableHead className="text-right">金額</TableHead><TableHead>方法</TableHead><TableHead>消込</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">入金データがありません</TableCell></TableRow>
                ) : payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell className="font-medium">{p.payer_name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">¥{(p.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{p.payment_method || '-'}</TableCell>
                    <TableCell>
                      {p.reconciliation_status === 'matched' ? <Badge variant="success"><Check className="mr-1 h-3 w-3" />消込済</Badge> : <Button variant="outline" size="sm">消込候補</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

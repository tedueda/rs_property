import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RENT_CHARGE_STATUSES } from '@/lib/constants'
import { Search, Plus, Check } from 'lucide-react'

const mockCharges = [
  { id: '1', tenant: '田中太郎', property: 'サンハイツA棟 101', month: '2026年3月', total: 80000, status: 'paid' as const },
  { id: '2', tenant: '佐藤花子', property: 'グリーンコート 205', month: '2026年3月', total: 128000, status: 'paid' as const },
  { id: '3', tenant: '山田一郎', property: 'パークビュー 301', month: '2026年3月', total: 87000, status: 'pending' as const },
  { id: '4', tenant: '鈴木健一', property: 'サンハイツA棟 201', month: '2026年3月', total: 128000, status: 'overdue' as const },
  { id: '5', tenant: '高橋美和', property: 'リバーサイド荘 102', month: '2026年3月', total: 72000, status: 'partial' as const },
]

const mockPayments = [
  { id: '1', date: '2026-03-25', payer: '田中太郎', amount: 80000, method: '振込', matched: true },
  { id: '2', date: '2026-03-25', payer: '佐藤花子', amount: 128000, method: '振込', matched: true },
  { id: '3', date: '2026-03-28', payer: 'タカハシ', amount: 50000, method: '振込', matched: false },
]

export function RentPage() {
  const [tab, setTab] = useState('charges')
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = '家賃管理 - RS不動産管理' }, [])

  return (
    <div>
      <PageHeader title="家賃管理" description="請求・入金管理"
        actions={<Button><Plus className="mr-2 h-4 w-4" />入金登録</Button>}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">今月請求</p><p className="text-2xl font-bold">¥495,000</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">入金済</p><p className="text-2xl font-bold text-green-600">¥208,000</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収</p><p className="text-2xl font-bold text-orange-600">¥287,000</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">滞納</p><p className="text-2xl font-bold text-red-600">¥128,000</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="charges">請求一覧</TabsTrigger>
          <TabsTrigger value="payments">入金一覧</TabsTrigger>
        </TabsList>

        <TabsContent value="charges">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="入居者名・物件名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>入居者</TableHead>
                  <TableHead>物件</TableHead>
                  <TableHead>対象月</TableHead>
                  <TableHead className="text-right">請求額</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCharges.map((c) => {
                  const st = RENT_CHARGE_STATUSES[c.status]
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.tenant}</TableCell>
                      <TableCell className="text-muted-foreground">{c.property}</TableCell>
                      <TableCell>{c.month}</TableCell>
                      <TableCell className="text-right font-medium">¥{c.total.toLocaleString()}</TableCell>
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
              <TableHeader>
                <TableRow>
                  <TableHead>入金日</TableHead>
                  <TableHead>振込人名</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>消込</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.date}</TableCell>
                    <TableCell className="font-medium">{p.payer}</TableCell>
                    <TableCell className="text-right font-medium">¥{p.amount.toLocaleString()}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>
                      {p.matched
                        ? <Badge variant="success"><Check className="mr-1 h-3 w-3" />消込済</Badge>
                        : <Button variant="outline" size="sm">消込候補</Button>
                      }
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

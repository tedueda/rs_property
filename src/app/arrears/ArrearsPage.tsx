import { useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { AlertTriangle, Phone, Mail, FileText } from 'lucide-react'

const mockArrears = [
  { id: '1', tenant: '鈴木健一', property: 'サンハイツA棟 201', amount: 256000, months: 2, lastFollowup: '2026-03-20', followupType: '電話' },
  { id: '2', tenant: '高橋美和', property: 'リバーサイド荘 102', amount: 72000, months: 1, lastFollowup: '2026-03-25', followupType: 'メール' },
]

export function ArrearsPage() {
  useEffect(() => { document.title = '未収管理 - RS不動産管理' }, [])

  return (
    <div>
      <PageHeader title="未収管理" description="滞納・未収金の管理" />

      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収総額</p><p className="text-2xl font-bold text-red-600">¥328,000</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収件数</p><p className="text-2xl font-bold">2件</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">最長滞納</p><p className="text-2xl font-bold text-orange-600">2ヶ月</p></CardContent></Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>入居者</TableHead>
              <TableHead>物件</TableHead>
              <TableHead className="text-right">未収額</TableHead>
              <TableHead>滞納月数</TableHead>
              <TableHead>最終督促</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockArrears.map((a) => (
              <TableRow key={a.id}>
                <TableCell><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="font-medium">{a.tenant}</span></div></TableCell>
                <TableCell className="text-muted-foreground">{a.property}</TableCell>
                <TableCell className="text-right font-bold text-red-600">¥{a.amount.toLocaleString()}</TableCell>
                <TableCell><Badge variant="destructive">{a.months}ヶ月</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.lastFollowup} ({a.followupType})</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="電話"><Phone className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="メール"><Mail className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="督促履歴"><FileText className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

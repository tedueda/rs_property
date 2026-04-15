import { useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { AlertTriangle, Phone, Mail, FileText, Loader2 } from 'lucide-react'
import { useRentCharges } from '@/lib/supabase/hooks'

export function ArrearsPage() {
  const { data: charges, loading } = useRentCharges()
  useEffect(() => { document.title = '未収管理 - RS不動産管理' }, [])

  const arrears = charges.filter(c => c.status === 'overdue')
  const totalAmount = arrears.reduce((s, a) => s + (a.total_amount || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader title="未収管理" description="滞納・未収金の管理" />
      <div className="grid gap-4 grid-cols-3 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収総額</p><p className="text-2xl font-bold text-red-600">¥{totalAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">未収件数</p><p className="text-2xl font-bold">{arrears.length}件</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">最長滞納</p><p className="text-2xl font-bold text-orange-600">-</p></CardContent></Card>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>対象月</TableHead><TableHead className="text-right">未収額</TableHead><TableHead>ステータス</TableHead><TableHead className="text-right">操作</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {arrears.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">未収データがありません</TableCell></TableRow>
            ) : arrears.map((a) => (
              <TableRow key={a.id}>
                <TableCell><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><span className="font-medium">{a.charge_month}</span></div></TableCell>
                <TableCell className="text-right font-bold text-red-600">¥{(a.total_amount || 0).toLocaleString()}</TableCell>
                <TableCell><Badge variant="destructive">滞納</Badge></TableCell>
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

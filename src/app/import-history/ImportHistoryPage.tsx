import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import type { ImportLog } from '@/types'
import { IMPORT_STATUSES, EXTRACTION_TYPES, formatDate } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface DemoImportLog extends ImportLog {
  file_name: string
}

const DEMO_IMPORT_LOGS: DemoImportLog[] = [
  { id: '1', uploaded_file_id: '1', extraction_type: 'bank_statement', status: 'confirmed', confirmed_at: '2025-03-26T10:00:00Z', target_table: 'bank_transactions', notes: '3月分通帳取込完了', created_at: '2025-03-25T10:00:00Z', updated_at: '2025-03-26T10:00:00Z', file_name: '通帳_林建設_202503.pdf' },
  { id: '2', uploaded_file_id: '2', extraction_type: 'receipt_invoice', status: 'review_pending', notes: '確認待ち', created_at: '2025-03-20T14:30:00Z', updated_at: '2025-03-20T14:30:00Z', file_name: '領収書_修繕工事.jpg' },
  { id: '3', uploaded_file_id: '3', extraction_type: 'lease_contract', status: 'extracted', notes: '抽出完了・要確認', created_at: '2025-03-18T09:15:00Z', updated_at: '2025-03-18T12:00:00Z', file_name: '入居契約書_佐藤.pdf' },
  { id: '4', uploaded_file_id: '4', extraction_type: 'loan_contract', status: 'confirmed', confirmed_at: '2025-03-16T10:00:00Z', target_table: 'loan_repayments', notes: 'みずほ銀行借入登録済', created_at: '2025-03-15T16:45:00Z', updated_at: '2025-03-16T10:00:00Z', file_name: '借入契約書_みずほ.pdf' },
  { id: '5', uploaded_file_id: '5', extraction_type: 'bank_statement', status: 'error', error_message: 'フォーマットが認識できません', notes: 'Excel形式非対応', created_at: '2025-03-10T11:00:00Z', updated_at: '2025-03-10T11:05:00Z', file_name: '給与明細_202503.xlsx' },
  { id: '6', uploaded_file_id: '6', extraction_type: 'receipt_invoice', status: 'imported', notes: '取込のみ', created_at: '2025-03-08T08:30:00Z', updated_at: '2025-03-08T08:30:00Z', file_name: '領収書_事務用品.pdf' },
]

export function ImportHistoryPage() {
  const [logs, setLogs] = useState<DemoImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) { setLogs(DEMO_IMPORT_LOGS); setLoading(false); return }
    const { data } = await supabase
      .from('import_logs')
      .select('*, uploaded_file:uploaded_files(*)')
      .order('created_at', { ascending: false })
    const items = (data || []).map((d: Record<string, unknown>) => ({
      ...d,
      file_name: (d.uploaded_file as Record<string, unknown>)?.file_name || '-',
    })) as DemoImportLog[]
    setLogs(items)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = logs.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false
    return true
  })

  const statusCounts = Object.fromEntries(
    Object.keys(IMPORT_STATUSES).map(k => [k, logs.filter(l => l.status === k).length])
  )

  return (
    <div className="space-y-6">
      <PageHeader title={`取込履歴 (${logs.length}件)`} description="ファイル取込の処理履歴とステータスを確認します" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(IMPORT_STATUSES).map(([key, val]) => (
          <Card key={key} className={filterStatus === key ? 'ring-2 ring-blue-500' : 'cursor-pointer hover:bg-gray-50'} onClick={() => setFilterStatus(filterStatus === key ? '' : key)}>
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-bold">{statusCounts[key] || 0}</p>
              <p className="text-xs text-muted-foreground">{val.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-48">
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="ステータス" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {Object.entries(IMPORT_STATUSES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ファイル名</TableHead>
                    <TableHead>抽出タイプ</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>登録先テーブル</TableHead>
                    <TableHead>エラー</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>確定日時</TableHead>
                    <TableHead>取込日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">データがありません</TableCell></TableRow>
                  ) : filtered.map(log => {
                    const st = IMPORT_STATUSES[log.status as keyof typeof IMPORT_STATUSES]
                    const et = log.extraction_type ? EXTRACTION_TYPES[log.extraction_type as keyof typeof EXTRACTION_TYPES] : null
                    return (
                      <TableRow key={log.id} className={log.status === 'error' ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{log.file_name}</TableCell>
                        <TableCell>{et ? <span className="px-2 py-1 rounded bg-gray-100 text-xs">{et.label}</span> : '-'}</TableCell>
                        <TableCell>{st && <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>}</TableCell>
                        <TableCell className="text-sm">{log.target_table || '-'}</TableCell>
                        <TableCell className="text-sm text-red-600">{log.error_message || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.notes || '-'}</TableCell>
                        <TableCell className="text-sm">{log.confirmed_at ? formatDate(log.confirmed_at) : '-'}</TableCell>
                        <TableCell className="text-sm">{formatDate(log.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

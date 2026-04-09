import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import type { MonthlyIncomeExpense } from '@/types'
import { formatCurrency, formatMonth } from '@/lib/constants'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DEMO_COMPANIES = [
  { id: '1', name: '林建設株式会社' },
  { id: '2', name: 'N・Yコーポレーション株式会社' },
  { id: '3', name: '株式会社オーナーズ' },
  { id: '4', name: '株式会社照' },
  { id: '5', name: '株式会社A' },
  { id: '6', name: '株式会社B' },
]

function generateDemoData(companyId: string, companyName: string): MonthlyIncomeExpense[] {
  const months: MonthlyIncomeExpense[] = []
  const baseIncome = companyId === '1' ? 2500000 : companyId === '2' ? 1800000 : companyId === '3' ? 3200000 : 1200000
  const baseExpense = baseIncome * 0.45

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const variance = () => 1 + (Math.random() - 0.5) * 0.15
    const income = Math.round(baseIncome * variance())
    const expense = Math.round(baseExpense * variance())
    months.push({
      company_id: companyId,
      company_name: companyName,
      month,
      income_total: income,
      expense_total: expense,
      net_income: income - expense,
      income_breakdown: [
        { label: '家賃収入', amount: Math.round(income * 0.85) },
        { label: '共益費', amount: Math.round(income * 0.08) },
        { label: '駐車場', amount: Math.round(income * 0.05) },
        { label: 'その他', amount: Math.round(income * 0.02) },
      ],
      expense_breakdown: [
        { label: '修繕費', amount: Math.round(expense * 0.25) },
        { label: '管理費', amount: Math.round(expense * 0.2) },
        { label: '光熱費', amount: Math.round(expense * 0.15) },
        { label: '保険料', amount: Math.round(expense * 0.1) },
        { label: '税金', amount: Math.round(expense * 0.15) },
        { label: '給与', amount: Math.round(expense * 0.1) },
        { label: 'その他', amount: Math.round(expense * 0.05) },
      ],
    })
  }
  return months
}

export function MonthlyIncomeExpensePage() {
  const [data, setData] = useState<MonthlyIncomeExpense[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      setCompanies(DEMO_COMPANIES)
      const allData = DEMO_COMPANIES.flatMap(c => generateDemoData(c.id, c.name))
      setData(allData)
      setLoading(false)
      return
    }
    // Production: aggregate from payments, expenses, payroll, bank_transactions
    const [{ data: companiesData }, { data: payments }, { data: expenses }, { data: payrolls }] = await Promise.all([
      supabase.from('companies').select('id, name').is('deleted_at', null),
      supabase.from('payment_records').select('paid_amount, payment_date, linked_charge_id').is('deleted_at', null),
      supabase.from('expense_records').select('amount, payment_date, company_id').is('deleted_at', null),
      supabase.from('payroll_records').select('net_payment, target_month, company_id').is('deleted_at', null),
    ])
    const comps = companiesData || []
    setCompanies(comps)

    // Build monthly aggregation
    const result: MonthlyIncomeExpense[] = []
    for (const comp of comps) {
      const compExpenses = (expenses || []).filter((e: Record<string, string>) => e.company_id === comp.id)
      const compPayrolls = (payrolls || []).filter((p: Record<string, string>) => p.company_id === comp.id)

      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        const monthPayments = (payments || []).filter((p: Record<string, string>) =>
          p.payment_date?.startsWith(month) && p.linked_charge_id
        )
        const monthExpenses = compExpenses.filter((e: Record<string, string>) =>
          e.payment_date?.startsWith(month)
        )
        const monthPayrolls = compPayrolls.filter((p: Record<string, string>) =>
          p.target_month?.startsWith(month)
        )

        const incomeTotal = monthPayments.reduce((s: number, p: Record<string, number>) => s + Number(p.paid_amount || 0), 0)
        const expenseTotal = monthExpenses.reduce((s: number, e: Record<string, number>) => s + Number(e.amount || 0), 0)
        const payrollTotal = monthPayrolls.reduce((s: number, p: Record<string, number>) => s + Number(p.net_payment || 0), 0)
        const totalExpense = expenseTotal + payrollTotal

        result.push({
          company_id: comp.id,
          company_name: comp.name,
          month,
          income_total: incomeTotal,
          expense_total: totalExpense,
          net_income: incomeTotal - totalExpense,
          income_breakdown: [{ label: '家賃収入', amount: incomeTotal }],
          expense_breakdown: [
            { label: '経費', amount: expenseTotal },
            { label: '給与', amount: payrollTotal },
          ],
        })
      }
    }
    setData(result)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = selectedCompany === 'all'
    ? data
    : data.filter(d => d.company_id === selectedCompany)

  // Group by month for chart
  const months = [...new Set(filtered.map(d => d.month))].sort()
  const chartData = months.map(m => {
    const monthData = filtered.filter(d => d.month === m)
    return {
      month: formatMonth(m),
      収入: monthData.reduce((s, d) => s + d.income_total, 0),
      支出: monthData.reduce((s, d) => s + d.expense_total, 0),
      収支: monthData.reduce((s, d) => s + d.net_income, 0),
    }
  })

  // Current month vs previous month comparison
  const currentMonth = months[months.length - 1]
  const prevMonth = months[months.length - 2]
  const currentData = filtered.filter(d => d.month === currentMonth)
  const prevData = prevMonth ? filtered.filter(d => d.month === prevMonth) : []
  const currentIncome = currentData.reduce((s, d) => s + d.income_total, 0)
  const currentExpense = currentData.reduce((s, d) => s + d.expense_total, 0)
  const currentNet = currentIncome - currentExpense
  const prevIncome = prevData.reduce((s, d) => s + d.income_total, 0)
  const prevExpense = prevData.reduce((s, d) => s + d.expense_total, 0)
  const prevNet = prevIncome - prevExpense

  const incomeChange = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0
  const expenseChange = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense * 100) : 0
  const netChange = prevNet !== 0 ? ((currentNet - prevNet) / Math.abs(prevNet) * 100) : 0

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader title="月次収支" description="会社別の月次収入・支出・収支差額">
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-56"><SelectValue placeholder="会社を選択" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全社合計</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">月間収入合計</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(currentIncome)}</p>
              </div>
              <div className="text-right">
                {incomeChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${incomeChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {incomeChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground">前月比</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">月間支出合計</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(currentExpense)}</p>
              </div>
              <div className="text-right">
                {expenseChange !== 0 && (
                  <div className={`flex items-center gap-1 text-sm ${expenseChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {expenseChange < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </div>
                )}
                <p className="text-xs text-muted-foreground">前月比</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">月間収支差額</p>
                <p className={`text-2xl font-bold ${currentNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(currentNet)}</p>
              </div>
              <div className="text-right">
                {netChange !== 0 ? (
                  <div className={`flex items-center gap-1 text-sm ${netChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netChange > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {netChange > 0 ? '+' : ''}{netChange.toFixed(1)}%
                  </div>
                ) : (
                  <Minus className="h-4 w-4 text-gray-400" />
                )}
                <p className="text-xs text-muted-foreground">前月比</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">収支推移グラフ</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="収入" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="支出" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="収支" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Company-by-company table for current month */}
      {selectedCompany === 'all' && currentMonth && (
        <Card>
          <CardHeader><CardTitle className="text-base">会社別 {formatMonth(currentMonth)} 収支</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会社名</TableHead>
                    <TableHead className="text-right">収入</TableHead>
                    <TableHead className="text-right">支出</TableHead>
                    <TableHead className="text-right">収支</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map(d => (
                    <TableRow key={d.company_id}>
                      <TableCell className="font-medium">{d.company_name}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-600">{formatCurrency(d.income_total)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">{formatCurrency(d.expense_total)}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-medium ${d.net_income >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(d.net_income)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>合計</TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-700">{formatCurrency(currentIncome)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-700">{formatCurrency(currentExpense)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${currentNet >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(currentNet)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income/Expense Breakdown for selected company */}
      {selectedCompany !== 'all' && currentMonth && currentData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base text-green-700">主な収入内訳</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>項目</TableHead><TableHead className="text-right">金額</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentData[0].income_breakdown.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base text-red-700">主な支出内訳</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>項目</TableHead><TableHead className="text-right">金額</TableHead></TableRow></TableHeader>
                <TableBody>
                  {currentData[0].expense_breakdown.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.label}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly trend table */}
      <Card>
        <CardHeader><CardTitle className="text-base">月次推移</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>月</TableHead>
                  <TableHead className="text-right">収入</TableHead>
                  <TableHead className="text-right">支出</TableHead>
                  <TableHead className="text-right">収支</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-green-600">{formatCurrency(row['収入'])}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-600">{formatCurrency(row['支出'])}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-medium ${row['収支'] >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(row['収支'])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

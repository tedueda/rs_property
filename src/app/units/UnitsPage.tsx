import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { UNIT_STATUSES } from '@/lib/constants'
import { Search, DoorOpen, Eye, Plus } from 'lucide-react'
import type { Unit } from '@/types'

const mockUnits: Unit[] = [
  { id: '1', property_id: '1', company_id: '1', unit_number: '101', floor: 1, layout: '1K', area_sqm: 25, rent_amount: 75000, management_fee: 5000, status: 'occupied', created_at: '', updated_at: '', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '東京都新宿区', total_units: 24, created_at: '', updated_at: '' } },
  { id: '2', property_id: '1', company_id: '1', unit_number: '102', floor: 1, layout: '1LDK', area_sqm: 35, rent_amount: 95000, management_fee: 5000, status: 'vacant', created_at: '', updated_at: '', property: { id: '1', company_id: '1', name: 'サンハイツA棟', address: '東京都新宿区', total_units: 24, created_at: '', updated_at: '' } },
  { id: '3', property_id: '2', company_id: '1', unit_number: '205', floor: 2, layout: '2LDK', area_sqm: 50, rent_amount: 120000, management_fee: 8000, status: 'occupied', created_at: '', updated_at: '', property: { id: '2', company_id: '1', name: 'グリーンコート', address: '東京都渋谷区', total_units: 12, created_at: '', updated_at: '' } },
  { id: '4', property_id: '3', company_id: '1', unit_number: '301', floor: 3, layout: '1K', area_sqm: 28, rent_amount: 82000, management_fee: 5000, status: 'reserved', created_at: '', updated_at: '', property: { id: '3', company_id: '1', name: 'パークビュー横浜', address: '神奈川県横浜市', total_units: 48, created_at: '', updated_at: '' } },
  { id: '5', property_id: '3', company_id: '1', unit_number: '401', floor: 4, layout: '3LDK', area_sqm: 70, rent_amount: 180000, management_fee: 12000, status: 'vacant', created_at: '', updated_at: '', property: { id: '3', company_id: '1', name: 'パークビュー横浜', address: '神奈川県横浜市', total_units: 48, created_at: '', updated_at: '' } },
]

export function UnitsPage() {
  const [units] = useState<Unit[]>(mockUnits)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { document.title = '部屋管理 - RS不動産管理' }, [])

  const filtered = units.filter(u => {
    const matchSearch = u.unit_number.includes(search) || u.property?.name?.includes(search) || false
    const matchStatus = !statusFilter || u.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <PageHeader title="部屋管理" description={`${units.length}件の部屋`} actions={<Button><Plus className="mr-2 h-4 w-4" />部屋追加</Button>} />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="号室・物件名で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">全ステータス</option>
              {Object.entries(UNIT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物件名</TableHead>
              <TableHead>号室</TableHead>
              <TableHead>階数</TableHead>
              <TableHead>間取り</TableHead>
              <TableHead>面積</TableHead>
              <TableHead className="text-right">賃料</TableHead>
              <TableHead className="text-right">管理費</TableHead>
              <TableHead>状態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((unit) => {
              const statusInfo = UNIT_STATUSES[unit.status]
              return (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.property?.name}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><DoorOpen className="h-4 w-4 text-muted-foreground" />{unit.unit_number}</div></TableCell>
                  <TableCell>{unit.floor}F</TableCell>
                  <TableCell>{unit.layout}</TableCell>
                  <TableCell>{unit.area_sqm}m²</TableCell>
                  <TableCell className="text-right">¥{(unit.rent_amount || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">¥{(unit.management_fee || 0).toLocaleString()}</TableCell>
                  <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></TableCell>
                  <TableCell className="text-right">
                    <Link to={`/units/${unit.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
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

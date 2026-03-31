import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { UNIT_STATUSES } from '@/lib/constants'
import { Building2, DoorOpen, MapPin, Plus, Eye } from 'lucide-react'
import type { Property, Unit } from '@/types'

const mockProperty: Property = { id: '1', company_id: '1', name: 'サンハイツA棟', address: '東京都新宿区西新宿1-1-1', city: '新宿区', prefecture: '東京都', postal_code: '160-0023', property_type: 'マンション', total_units: 24, description: '駅徒歩5分の好立地マンション', created_at: '2024-01-01', updated_at: '2024-01-01' }

const mockUnits: Unit[] = [
  { id: '1', property_id: '1', company_id: '1', unit_number: '101', floor: 1, layout: '1K', area_sqm: 25, rent_amount: 75000, management_fee: 5000, status: 'occupied', created_at: '', updated_at: '' },
  { id: '2', property_id: '1', company_id: '1', unit_number: '102', floor: 1, layout: '1LDK', area_sqm: 35, rent_amount: 95000, management_fee: 5000, status: 'vacant', created_at: '', updated_at: '' },
  { id: '3', property_id: '1', company_id: '1', unit_number: '201', floor: 2, layout: '2LDK', area_sqm: 50, rent_amount: 120000, management_fee: 8000, status: 'occupied', created_at: '', updated_at: '' },
  { id: '4', property_id: '1', company_id: '1', unit_number: '202', floor: 2, layout: '1K', area_sqm: 25, rent_amount: 78000, management_fee: 5000, status: 'reserved', created_at: '', updated_at: '' },
  { id: '5', property_id: '1', company_id: '1', unit_number: '301', floor: 3, layout: '2LDK', area_sqm: 55, rent_amount: 130000, management_fee: 8000, status: 'occupied', created_at: '', updated_at: '' },
]

export function PropertyDetailPage() {
  const { id: _id } = useParams()
  const [property] = useState<Property>(mockProperty)
  const [units] = useState<Unit[]>(mockUnits)

  useEffect(() => { document.title = `${property.name} - RS不動産管理` }, [property.name])

  const occupiedCount = units.filter(u => u.status === 'occupied').length
  const vacantCount = units.filter(u => u.status === 'vacant').length

  return (
    <div>
      <PageHeader title={property.name} description={property.address} backTo="/properties"
        actions={<Button variant="outline"><Plus className="mr-2 h-4 w-4" />部屋追加</Button>}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">総戸数</p><p className="text-2xl font-bold">{property.total_units}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">入居中</p><p className="text-2xl font-bold text-green-600">{occupiedCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">空室</p><p className="text-2xl font-bold text-orange-600">{vacantCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">稼働率</p><p className="text-2xl font-bold">{Math.round(occupiedCount / units.length * 100)}%</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">物件情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2"><Building2 className="h-4 w-4 text-muted-foreground mt-0.5" /><div><p className="text-sm text-muted-foreground">種別</p><p className="text-sm font-medium">{property.property_type}</p></div></div>
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><div><p className="text-sm text-muted-foreground">住所</p><p className="text-sm font-medium">{property.address}</p></div></div>
            <div className="flex items-start gap-2"><DoorOpen className="h-4 w-4 text-muted-foreground mt-0.5" /><div><p className="text-sm text-muted-foreground">総戸数</p><p className="text-sm font-medium">{property.total_units}戸</p></div></div>
            {property.description && <div><p className="text-sm text-muted-foreground">備考</p><p className="text-sm">{property.description}</p></div>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">部屋一覧</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>号室</TableHead>
                <TableHead>階数</TableHead>
                <TableHead>間取り</TableHead>
                <TableHead>面積</TableHead>
                <TableHead className="text-right">賃料</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => {
                const statusInfo = UNIT_STATUSES[unit.status]
                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unit_number}</TableCell>
                    <TableCell>{unit.floor}F</TableCell>
                    <TableCell>{unit.layout}</TableCell>
                    <TableCell>{unit.area_sqm}m²</TableCell>
                    <TableCell className="text-right">¥{(unit.rent_amount || 0).toLocaleString()}</TableCell>
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
    </div>
  )
}

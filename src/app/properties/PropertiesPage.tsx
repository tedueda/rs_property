import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Plus, Search, Building2, Eye, Pencil, Trash2 } from 'lucide-react'
import { PREFECTURES } from '@/lib/constants'
import type { Property } from '@/types'

const mockProperties: Property[] = [
  { id: '1', company_id: '1', name: 'サンハイツA棟', address: '東京都新宿区西新宿1-1-1', city: '新宿区', prefecture: '東京都', postal_code: '160-0023', property_type: 'マンション', total_units: 24, created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: '2', company_id: '1', name: 'グリーンコート', address: '東京都渋谷区恵比寿2-2-2', city: '渋谷区', prefecture: '東京都', postal_code: '150-0013', property_type: 'アパート', total_units: 12, created_at: '2024-02-01', updated_at: '2024-02-01' },
  { id: '3', company_id: '1', name: 'パークビュー横浜', address: '神奈川県横浜市中区山下町3-3-3', city: '中区', prefecture: '神奈川県', postal_code: '231-0023', property_type: 'マンション', total_units: 48, created_at: '2024-03-01', updated_at: '2024-03-01' },
  { id: '4', company_id: '1', name: 'リバーサイド荘', address: '大阪府大阪市北区梅田4-4-4', city: '北区', prefecture: '大阪府', postal_code: '530-0001', property_type: 'アパート', total_units: 8, created_at: '2024-04-01', updated_at: '2024-04-01' },
]

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(mockProperties)
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editProperty, setEditProperty] = useState<Partial<Property>>({})

  useEffect(() => { document.title = '物件管理 - RS不動産管理' }, [])

  const filtered = properties.filter(p =>
    p.name.includes(search) || p.address.includes(search)
  )

  const handleSave = () => {
    if (editProperty.id) {
      setProperties(prev => prev.map(p => p.id === editProperty.id ? { ...p, ...editProperty } as Property : p))
    } else {
      const newProp: Property = {
        id: String(Date.now()), company_id: '1',
        name: editProperty.name || '', address: editProperty.address || '',
        prefecture: editProperty.prefecture, city: editProperty.city,
        postal_code: editProperty.postal_code, property_type: editProperty.property_type,
        total_units: editProperty.total_units || 0, description: editProperty.description,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setProperties(prev => [...prev, newProp])
    }
    setShowDialog(false)
    setEditProperty({})
  }

  const handleDelete = (id: string) => {
    if (confirm('この物件を削除しますか？')) {
      setProperties(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    <div>
      <PageHeader
        title="物件管理"
        description={`${properties.length}件の管理物件`}
        actions={<Button onClick={() => { setEditProperty({}); setShowDialog(true) }}><Plus className="mr-2 h-4 w-4" />物件追加</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="物件名・住所で検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物件名</TableHead>
              <TableHead>住所</TableHead>
              <TableHead>種別</TableHead>
              <TableHead className="text-right">総戸数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{property.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{property.address}</TableCell>
                <TableCell><Badge variant="secondary">{property.property_type || '-'}</Badge></TableCell>
                <TableCell className="text-right">{property.total_units}戸</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/properties/${property.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditProperty(property); setShowDialog(true) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(property.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent onClose={() => setShowDialog(false)} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editProperty.id ? '物件編集' : '物件追加'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>物件名 *</Label>
                <Input value={editProperty.name || ''} onChange={(e) => setEditProperty(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>種別</Label>
                <Select value={editProperty.property_type || ''} onChange={(e) => setEditProperty(p => ({ ...p, property_type: e.target.value }))}>
                  <option value="">選択してください</option>
                  <option value="マンション">マンション</option>
                  <option value="アパート">アパート</option>
                  <option value="一戸建て">一戸建て</option>
                  <option value="ビル">ビル</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>郵便番号</Label>
                <Input placeholder="000-0000" value={editProperty.postal_code || ''} onChange={(e) => setEditProperty(p => ({ ...p, postal_code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>都道府県</Label>
                <Select value={editProperty.prefecture || ''} onChange={(e) => setEditProperty(p => ({ ...p, prefecture: e.target.value }))}>
                  <option value="">選択</option>
                  {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>市区町村</Label>
                <Input value={editProperty.city || ''} onChange={(e) => setEditProperty(p => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>住所 *</Label>
              <Input value={editProperty.address || ''} onChange={(e) => setEditProperty(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>総戸数</Label>
                <Input type="number" value={editProperty.total_units || ''} onChange={(e) => setEditProperty(p => ({ ...p, total_units: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>備考</Label>
              <Textarea value={editProperty.description || ''} onChange={(e) => setEditProperty(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

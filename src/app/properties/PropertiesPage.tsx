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

import { Plus, Search, Building2, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PREFECTURES } from '@/lib/constants'
import { useProperties, createProperty, updateProperty, deleteProperty } from '@/lib/supabase/hooks'
import { useAuthStore } from '@/store/auth'
import type { Property } from '@/types'

export function PropertiesPage() {
  const { data: properties, loading, setData: setProperties } = useProperties()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editProp, setEditProp] = useState<Partial<Property>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { document.title = '物件管理 - RS不動産管理' }, [])

  const filtered = properties.filter(p =>
    p.name.includes(search) || p.address.includes(search)
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editProp.id) {
        const updated = await updateProperty(editProp.id, editProp)
        setProperties(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await createProperty({ ...editProp, company_id: user?.company_id || '' })
        setProperties(prev => [created, ...prev])
      }
      setShowDialog(false)
      setEditProp({})
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この物件を削除しますか？')) return
    try {
      await deleteProperty(id)
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div>
      <PageHeader
        title="物件管理"
        description={`${properties.length}件の管理物件`}
        actions={<Button onClick={() => { setEditProp({}); setShowDialog(true) }}><Plus className="mr-2 h-4 w-4" />物件追加</Button>}
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
      {properties.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">物件がまだ登録されていません</p>
          <Button className="mt-4" onClick={() => { setEditProp({}); setShowDialog(true) }}><Plus className="mr-2 h-4 w-4" />最初の物件を追加</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader><TableRow>
              <TableHead>物件名</TableHead><TableHead>住所</TableHead><TableHead>種別</TableHead>
              <TableHead className="text-right">総戸数</TableHead><TableHead className="text-right">操作</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((property) => (
                <TableRow key={property.id}>
                  <TableCell><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{property.name}</span></div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{property.address}</TableCell>
                  <TableCell><Badge variant="secondary">{property.property_type || '-'}</Badge></TableCell>
                  <TableCell className="text-right">{property.total_units}戸</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/properties/${property.id}`}><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditProp(property); setShowDialog(true) }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(property.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent onClose={() => setShowDialog(false)} className="max-w-2xl">
          <DialogHeader><DialogTitle>{editProp.id ? '物件編集' : '物件追加'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>物件名 *</Label><Input value={editProp.name || ''} onChange={(e) => setEditProp(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>種別</Label>
                <select value={editProp.property_type || ''} onChange={(e) => setEditProp(p => ({ ...p, property_type: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">選択してください</option><option value="マンション">マンション</option><option value="アパート">アパート</option><option value="一戸建て">一戸建て</option><option value="ビル">ビル</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>郵便番号</Label><Input placeholder="000-0000" value={editProp.postal_code || ''} onChange={(e) => setEditProp(p => ({ ...p, postal_code: e.target.value }))} /></div>
              <div className="space-y-2"><Label>都道府県</Label>
                <select value={editProp.prefecture || ''} onChange={(e) => setEditProp(p => ({ ...p, prefecture: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">選択</option>{PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>市区町村</Label><Input value={editProp.city || ''} onChange={(e) => setEditProp(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>住所 *</Label><Input value={editProp.address || ''} onChange={(e) => setEditProp(p => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>総戸数</Label><Input type="number" value={editProp.total_units || ''} onChange={(e) => setEditProp(p => ({ ...p, total_units: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>備考</Label><Textarea value={editProp.description || ''} onChange={(e) => setEditProp(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

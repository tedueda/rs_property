import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { USER_ROLES } from '@/lib/constants'
import { Search, UserPlus, Pencil } from 'lucide-react'
import type { UserRole } from '@/types'

const mockUsers = [
  { id: '1', email: 'admin@rs-corp.co.jp', full_name: '管理太郎', role: 'super_admin' as UserRole },
  { id: '2', email: 'staff1@rs-corp.co.jp', full_name: '管理花子', role: 'admin' as UserRole },
  { id: '3', email: 'staff2@rs-corp.co.jp', full_name: '田中次郎', role: 'staff' as UserRole },
  { id: '4', email: 'viewer@rs-corp.co.jp', full_name: '閲覧太郎', role: 'viewer' as UserRole },
]

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  staff: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
}

export function UsersSettingsPage() {
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  useEffect(() => { document.title = 'ユーザー設定 - RS不動産管理' }, [])

  const filtered = mockUsers.filter(u => u.full_name.includes(search) || u.email.includes(search))

  return (
    <div>
      <PageHeader title="設定" description="ユーザー・ロール管理"
        actions={<Button onClick={() => setShowInvite(true)}><UserPlus className="mr-2 h-4 w-4" />ユーザー招待</Button>}
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="名前・メールで検索..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名前</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[u.role]}`}>{USER_ROLES[u.role].label}</span></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent onClose={() => setShowInvite(false)}>
          <DialogHeader><DialogTitle>ユーザー招待</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>メールアドレス</Label><Input type="email" placeholder="user@example.com" /></div>
            <div className="space-y-2"><Label>名前</Label><Input placeholder="氏名" /></div>
            <div className="space-y-2">
              <Label>ロール</Label>
              <Select>
                {Object.entries(USER_ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>キャンセル</Button>
            <Button>招待送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

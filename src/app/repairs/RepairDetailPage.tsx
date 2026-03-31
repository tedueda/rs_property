import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Upload, Pencil } from 'lucide-react'

export function RepairDetailPage() {
  const { id: _id } = useParams()
  useEffect(() => { document.title = '修繕詳細 - RS不動産管理' }, [])

  return (
    <div>
      <PageHeader title="修繕詳細: 給湯器故障" backTo="/repairs"
        actions={<Button variant="outline"><Pencil className="mr-2 h-4 w-4" />編集</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>修繕情報</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">タイトル</span><span className="text-sm font-medium">給湯器故障</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">物件</span><span className="text-sm">サンハイツA棟 101号室</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">ステータス</span><Badge variant="warning">作業中</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">優先度</span><Badge variant="destructive">高</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">受付日</span><span className="text-sm">2026-03-20</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">担当者</span><span className="text-sm">管理太郎</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">業者</span><span className="text-sm">○○設備</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">見積額</span><span className="text-sm font-bold">¥150,000</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>写真</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">写真をアップロード</p>
              <Button variant="outline" className="mt-3" size="sm">ファイルを選択</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { FileCheck, Upload, Pencil } from 'lucide-react'

export function ApplicationDetailPage() {
  const { id: _id } = useParams()
  const [tab, setTab] = useState('property')

  useEffect(() => { document.title = `申込詳細 APP-2026-001 - RS不動産管理` }, [])

  return (
    <div>
      <PageHeader
        title="申込詳細: APP-2026-001"
        backTo="/applications"
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />書類アップロード</Button>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />編集</Button>
            <Link to="/contracts/new"><Button><FileCheck className="mr-2 h-4 w-4" />契約書作成</Button></Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">ステータス</p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUSES.screening.color}`}>{APPLICATION_STATUSES.screening.label}</span></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">申込者</p><p className="font-bold">田中太郎</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">物件</p><p className="font-bold">サンハイツA棟 102号室</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">賃料</p><p className="font-bold">¥95,000</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="property">物件情報</TabsTrigger>
          <TabsTrigger value="applicant">申込者情報</TabsTrigger>
          <TabsTrigger value="occupant">入居者情報</TabsTrigger>
          <TabsTrigger value="employment">勤務先・収入</TabsTrigger>
          <TabsTrigger value="emergency">緊急連絡先・保証人</TabsTrigger>
          <TabsTrigger value="internal">社内処理</TabsTrigger>
          <TabsTrigger value="documents">書類</TabsTrigger>
        </TabsList>

        <TabsContent value="property">
          <Card><CardHeader><CardTitle>物件情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">物件名</p><p className="font-medium">サンハイツA棟</p></div>
              <div><p className="text-sm text-muted-foreground">号室</p><p className="font-medium">102</p></div>
              <div><p className="text-sm text-muted-foreground">契約開始予定日</p><p className="font-medium">2026-04-01</p></div>
              <div><p className="text-sm text-muted-foreground">入居希望日</p><p className="font-medium">2026-04-15</p></div>
              <div><p className="text-sm text-muted-foreground">賃料</p><p className="font-medium">¥95,000</p></div>
              <div><p className="text-sm text-muted-foreground">共益費</p><p className="font-medium">¥5,000</p></div>
              <div><p className="text-sm text-muted-foreground">敷金</p><p className="font-medium">¥95,000</p></div>
              <div><p className="text-sm text-muted-foreground">礼金</p><p className="font-medium">¥95,000</p></div>
              <div><p className="text-sm text-muted-foreground">使用目的</p><p className="font-medium">居住用</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="applicant">
          <Card><CardHeader><CardTitle>申込者情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">氏名</p><p className="font-medium">田中太郎</p></div>
              <div><p className="text-sm text-muted-foreground">フリガナ</p><p className="font-medium">タナカタロウ</p></div>
              <div><p className="text-sm text-muted-foreground">生年月日</p><p className="font-medium">1990-05-15</p></div>
              <div><p className="text-sm text-muted-foreground">性別</p><p className="font-medium">男性</p></div>
              <div><p className="text-sm text-muted-foreground">電話番号</p><p className="font-medium">090-1234-5678</p></div>
              <div><p className="text-sm text-muted-foreground">メール</p><p className="font-medium">tanaka@example.com</p></div>
              <div className="col-span-2"><p className="text-sm text-muted-foreground">現住所</p><p className="font-medium">東京都中野区中野1-1-1 中野マンション301</p></div>
              <div><p className="text-sm text-muted-foreground">現住居区分</p><p className="font-medium">賃貸</p></div>
              <div><p className="text-sm text-muted-foreground">居住年数</p><p className="font-medium">3年</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="occupant">
          <Card><CardHeader><CardTitle>入居者情報</CardTitle></CardHeader><CardContent>
            <p className="text-muted-foreground">契約者と同一</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card><CardHeader><CardTitle>勤務先・収入情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">勤務先名</p><p className="font-medium">株式会社テスト</p></div>
              <div><p className="text-sm text-muted-foreground">勤務先住所</p><p className="font-medium">東京都千代田区丸の内1-1-1</p></div>
              <div><p className="text-sm text-muted-foreground">勤務先電話番号</p><p className="font-medium">03-1234-5678</p></div>
              <div><p className="text-sm text-muted-foreground">所属部署</p><p className="font-medium">営業部</p></div>
              <div><p className="text-sm text-muted-foreground">役職</p><p className="font-medium">主任</p></div>
              <div><p className="text-sm text-muted-foreground">勤続年数</p><p className="font-medium">5年</p></div>
              <div><p className="text-sm text-muted-foreground">雇用形態</p><p className="font-medium">正社員</p></div>
              <div><p className="text-sm text-muted-foreground">年収</p><p className="font-medium">¥5,000,000</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card><CardHeader><CardTitle>緊急連絡先</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">氏名</p><p className="font-medium">田中花子</p></div>
              <div><p className="text-sm text-muted-foreground">続柄</p><p className="font-medium">母</p></div>
              <div><p className="text-sm text-muted-foreground">電話番号</p><p className="font-medium">090-9876-5432</p></div>
              <div><p className="text-sm text-muted-foreground">住所</p><p className="font-medium">埼玉県さいたま市浦和区1-1-1</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="internal">
          <Card><CardHeader><CardTitle>社内処理情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">申込受付日</p><p className="font-medium">2026-03-25</p></div>
              <div><p className="text-sm text-muted-foreground">担当者</p><p className="font-medium">管理太郎</p></div>
              <div><p className="text-sm text-muted-foreground">反社チェック</p><Badge variant="success">確認済</Badge></div>
              <div><p className="text-sm text-muted-foreground">本人確認書類</p><Badge variant="success">確認済</Badge></div>
              <div><p className="text-sm text-muted-foreground">在職確認</p><Badge variant="warning">未確認</Badge></div>
              <div><p className="text-sm text-muted-foreground">保証会社審査</p><Badge variant="warning">審査中</Badge></div>
              <div><p className="text-sm text-muted-foreground">オーナー承認</p><Badge variant="secondary">未申請</Badge></div>
              <div><p className="text-sm text-muted-foreground">契約書作成</p><Badge variant="secondary">未作成</Badge></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card><CardHeader><CardTitle>添付書類</CardTitle></CardHeader><CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>書類をドラッグ＆ドロップまたはクリックしてアップロード</p>
              <p className="text-xs mt-1">PDF, JPG, PNG, HEIC対応</p>
              <Button variant="outline" className="mt-4">ファイルを選択</Button>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { APPLICATION_STATUSES } from '@/lib/constants'
import { FileCheck, Upload, Pencil, Loader2 } from 'lucide-react'
import { useApplication } from '@/lib/supabase/hooks'

export function ApplicationDetailPage() {
  const { id } = useParams()
  const { data: application, loading } = useApplication(id)
  const [tab, setTab] = useState('property')

  useEffect(() => { document.title = `申込詳細 ${application?.application_number || ''} - RS不動産管理` }, [application?.application_number])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }
  if (!application) {
    return <div className="text-center py-20 text-muted-foreground">申込が見つかりません</div>
  }

  const statusInfo = APPLICATION_STATUSES[application.status]
  const applicant = application.applicant

  return (
    <div>
      <PageHeader title={`申込詳細: ${application.application_number}`} backTo="/applications"
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />書類アップロード</Button>
            <Button variant="outline"><Pencil className="mr-2 h-4 w-4" />編集</Button>
            <Link to="/contracts/new"><Button><FileCheck className="mr-2 h-4 w-4" />契約書作成</Button></Link>
          </div>
        } />
      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">ステータス</p><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">申込者</p><p className="font-bold">{applicant?.full_name || '-'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">物件</p><p className="font-bold">{application.property?.name || '-'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">賃料</p><p className="font-bold">¥{(application.rent_amount || 0).toLocaleString()}</p></CardContent></Card>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="property">物件情報</TabsTrigger>
          <TabsTrigger value="applicant">申込者情報</TabsTrigger>
          <TabsTrigger value="documents">書類</TabsTrigger>
        </TabsList>
        <TabsContent value="property">
          <Card><CardHeader><CardTitle>物件情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">物件名</p><p className="font-medium">{application.property?.name || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">受付日</p><p className="font-medium">{application.reception_date || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">賃料</p><p className="font-medium">¥{(application.rent_amount || 0).toLocaleString()}</p></div>
              <div><p className="text-sm text-muted-foreground">共益費</p><p className="font-medium">¥{(application.management_fee || 0).toLocaleString()}</p></div>
              <div><p className="text-sm text-muted-foreground">敷金</p><p className="font-medium">¥{(application.deposit || 0).toLocaleString()}</p></div>
              <div><p className="text-sm text-muted-foreground">礼金</p><p className="font-medium">¥{(application.key_money || 0).toLocaleString()}</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="applicant">
          <Card><CardHeader><CardTitle>申込者情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">氏名</p><p className="font-medium">{applicant?.full_name || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">フリガナ</p><p className="font-medium">{applicant?.full_name_kana || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">生年月日</p><p className="font-medium">{applicant?.birth_date || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">性別</p><p className="font-medium">{applicant?.gender || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">電話番号</p><p className="font-medium">{applicant?.phone || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">メール</p><p className="font-medium">{applicant?.email || '-'}</p></div>
              <div className="col-span-2"><p className="text-sm text-muted-foreground">現住所</p><p className="font-medium">{applicant?.current_address || '-'}</p></div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card><CardHeader><CardTitle>添付書類</CardTitle></CardHeader><CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>書類をドラッグ＆ドロップまたはクリックしてアップロード</p>
              <Button variant="outline" className="mt-4">ファイルを選択</Button>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

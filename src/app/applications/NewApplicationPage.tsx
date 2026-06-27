import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GENDER_OPTIONS, HOUSING_TYPES, EMPLOYMENT_TYPES } from '@/lib/constants'
import { Save, ChevronRight, ChevronLeft, FileCheck, Plus, Trash2 } from 'lucide-react'

const STEPS = [
  { id: 'property', label: '物件情報' },
  { id: 'applicant', label: '申込者情報' },
  { id: 'occupant', label: '入居者情報' },
  { id: 'employment', label: '勤務先・収入' },
  { id: 'emergency', label: '緊急連絡先・保証人' },
  { id: 'internal', label: '社内処理' },
  { id: 'confirm', label: '確認・保存' },
]

interface CoResident { name: string; kana: string; relationship: string; birthDate: string; age: string; employerOrSchool: string }

export function NewApplicationPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState('property')
  const [coResidents, setCoResidents] = useState<CoResident[]>([])

  useEffect(() => { document.title = '新規申込 - RS不動産管理' }, [])

  const currentIndex = STEPS.findIndex(s => s.id === currentStep)
  const canGoNext = currentIndex < STEPS.length - 1
  const canGoPrev = currentIndex > 0

  const addCoResident = () => setCoResidents(prev => [...prev, { name: '', kana: '', relationship: '', birthDate: '', age: '', employerOrSchool: '' }])
  const removeCoResident = (i: number) => setCoResidents(prev => prev.filter((_, idx) => idx !== i))

  const fieldRow = (label: string, required = false, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}{required && <span className="text-red-500 ml-1">*</span>}</Label>
      {children}
    </div>
  )

  return (
    <div>
      <PageHeader title="新規申込登録" backTo="/applications"
        actions={<Button variant="outline"><Save className="mr-2 h-4 w-4" />下書き保存</Button>}
      />

      <Tabs value={currentStep} onValueChange={setCurrentStep}>
        <TabsList className="mb-6 flex-wrap">
          {STEPS.map((step, i) => (
            <TabsTrigger key={step.id} value={step.id} className="text-xs">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="property">
          <Card><CardHeader><CardTitle>物件情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('物件名', true, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">選択してください</option><option>サンハイツA棟</option><option>グリーンコート</option><option>パークビュー横浜</option></select>)}
              {fieldRow('号室', true, <Input placeholder="例: 301" />)}
              {fieldRow('契約開始予定日', true, <Input type="date" />)}
              {fieldRow('入居希望日', false, <Input type="date" />)}
              {fieldRow('賃料', true, <Input type="number" placeholder="0" />)}
              {fieldRow('共益費', false, <Input type="number" placeholder="0" />)}
              {fieldRow('水道代', false, <Input type="number" placeholder="0" />)}
              {fieldRow('駐車場代', false, <Input type="number" placeholder="0" />)}
              {fieldRow('敷金', false, <Input type="number" placeholder="0" />)}
              {fieldRow('礼金', false, <Input type="number" placeholder="0" />)}
              {fieldRow('保証金', false, <Input type="number" placeholder="0" />)}
              {fieldRow('解約引', false, <Input type="number" placeholder="0" />)}
              {fieldRow('使用目的', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">選択</option><option>居住用</option><option>事務所</option><option>店舗</option></select>)}
            </div>
            <div className="mt-4">{fieldRow('備考', false, <Textarea />)}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="applicant">
          <Card><CardHeader><CardTitle>申込者情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('氏名', true, <Input placeholder="例: 田中太郎" />)}
              {fieldRow('フリガナ', true, <Input placeholder="例: タナカタロウ" />)}
              {fieldRow('生年月日', true, <Input type="date" />)}
              {fieldRow('年齢', false, <Input type="number" />)}
              {fieldRow('性別', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">選択</option>{GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
              {fieldRow('電話番号', true, <Input placeholder="例: 090-1234-5678" />)}
              {fieldRow('メール', false, <Input type="email" placeholder="例: tanaka@example.com" />)}
              {fieldRow('現住居区分', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">選択</option>{HOUSING_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
              {fieldRow('居住年数', false, <Input type="number" placeholder="年" />)}
            </div>
            <div className="mt-4">{fieldRow('現住所', true, <Input placeholder="例: 東京都中野区中野1-1-1" />)}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="occupant">
          <Card><CardHeader><CardTitle>入居者情報</CardTitle></CardHeader><CardContent>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="text-sm">契約者と入居者が同一</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('入居者氏名', false, <Input />)}
              {fieldRow('フリガナ', false, <Input />)}
              {fieldRow('生年月日', false, <Input type="date" />)}
              {fieldRow('続柄', false, <Input />)}
              {fieldRow('携帯番号', false, <Input />)}
              {fieldRow('勤務先/学校名', false, <Input />)}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">同居人情報</h3>
                <Button variant="outline" size="sm" onClick={addCoResident}><Plus className="mr-1 h-3 w-3" />同居人追加</Button>
              </div>
              {coResidents.map((_, i) => (
                <div key={i} className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">同居人 {i + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeCoResident(i)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fieldRow('氏名', false, <Input />)}
                    {fieldRow('フリガナ', false, <Input />)}
                    {fieldRow('続柄', false, <Input />)}
                    {fieldRow('生年月日', false, <Input type="date" />)}
                    {fieldRow('年齢', false, <Input type="number" />)}
                    {fieldRow('勤務先/学校名', false, <Input />)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card><CardHeader><CardTitle>勤務先・収入情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('勤務先名', false, <Input />)}
              {fieldRow('勤務先住所', false, <Input />)}
              {fieldRow('勤務先電話番号', false, <Input />)}
              {fieldRow('所属部署', false, <Input />)}
              {fieldRow('役職', false, <Input />)}
              {fieldRow('勤続年数', false, <Input type="number" placeholder="年" />)}
              {fieldRow('雇用形態', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">選択</option>{EMPLOYMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>)}
              {fieldRow('年収', false, <Input type="number" placeholder="0" />)}
              {fieldRow('業種', false, <Input />)}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card className="mb-6"><CardHeader><CardTitle>緊急連絡先</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('氏名', true, <Input />)}
              {fieldRow('フリガナ', false, <Input />)}
              {fieldRow('続柄', true, <Input />)}
              {fieldRow('住所', false, <Input />)}
              {fieldRow('電話番号', true, <Input />)}
              {fieldRow('携帯番号', false, <Input />)}
              {fieldRow('勤務先', false, <Input />)}
              {fieldRow('勤務先電話番号', false, <Input />)}
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>連帯保証人情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('氏名', true, <Input />)}
              {fieldRow('フリガナ', false, <Input />)}
              {fieldRow('生年月日', false, <Input type="date" />)}
              {fieldRow('年齢', false, <Input type="number" />)}
              {fieldRow('続柄', true, <Input />)}
              {fieldRow('住所', true, <Input />)}
              {fieldRow('電話番号', true, <Input />)}
              {fieldRow('携帯番号', false, <Input />)}
              {fieldRow('勤務先名', false, <Input />)}
              {fieldRow('勤務先住所', false, <Input />)}
              {fieldRow('勤務先電話番号', false, <Input />)}
              {fieldRow('勤続年数', false, <Input type="number" />)}
              {fieldRow('年収', false, <Input type="number" />)}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="internal">
          <Card><CardHeader><CardTitle>社内処理情報</CardTitle></CardHeader><CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldRow('申込受付日', true, <Input type="date" />)}
              {fieldRow('申込番号', false, <Input placeholder="自動採番" />)}
              {fieldRow('担当者名', false, <Input />)}
              {fieldRow('申込ステータス', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="draft">下書き</option><option value="submitted">申込済</option></select>)}
              {fieldRow('反社チェック', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未確認</option><option value="ok">確認済</option><option value="ng">要確認</option></select>)}
              {fieldRow('本人確認書類', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未確認</option><option value="ok">確認済</option></select>)}
              {fieldRow('在職確認', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未確認</option><option value="ok">確認済</option></select>)}
              {fieldRow('緊急連絡先確認', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未確認</option><option value="ok">確認済</option></select>)}
              {fieldRow('保証会社審査', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未申請</option><option value="pending">審査中</option><option value="approved">承認</option><option value="rejected">却下</option></select>)}
              {fieldRow('オーナー承認', false, <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">未申請</option><option value="pending">確認中</option><option value="approved">承認</option><option value="rejected">却下</option></select>)}
              {fieldRow('鍵渡し予定日', false, <Input type="date" />)}
            </div>
            <div className="mt-4">{fieldRow('備考', false, <Textarea />)}</div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="confirm">
          <Card><CardHeader><CardTitle>確認・保存</CardTitle></CardHeader><CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">全ての入力内容を確認してください。</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('property')}><Save className="mr-2 h-4 w-4" />下書き保存</Button>
                <Button onClick={() => navigate('/applications')}><FileCheck className="mr-2 h-4 w-4" />申込登録</Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button variant="outline" disabled={!canGoPrev} onClick={() => setCurrentStep(STEPS[currentIndex - 1].id)}>
          <ChevronLeft className="mr-2 h-4 w-4" />前へ
        </Button>
        <Button disabled={!canGoNext} onClick={() => setCurrentStep(STEPS[currentIndex + 1].id)}>
          次へ<ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

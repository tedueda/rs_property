export const ROOM_STATUSES = {
  vacant: { label: '空室', color: 'bg-green-100 text-green-800' },
  occupied: { label: '入居中', color: 'bg-blue-100 text-blue-800' },
  reserved: { label: '予約済', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'メンテナンス', color: 'bg-orange-100 text-orange-800' },
  retired: { label: '退去済', color: 'bg-gray-100 text-gray-800' },
} as const

export const CHARGE_STATUSES = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-800' },
  partial_paid: { label: '一部入金', color: 'bg-orange-100 text-orange-800' },
  paid: { label: '入金済', color: 'bg-green-100 text-green-800' },
  overdue: { label: '滞納', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-600' },
} as const

export const PAYMENT_STATUSES = {
  unmatched: { label: '未照合', color: 'bg-yellow-100 text-yellow-800' },
  matched: { label: '一致', color: 'bg-green-100 text-green-800' },
  partial: { label: '一部入金', color: 'bg-orange-100 text-orange-800' },
  overpaid: { label: '超過入金', color: 'bg-purple-100 text-purple-800' },
  arrears: { label: '未収あり', color: 'bg-red-100 text-red-800' },
  needs_review: { label: '要確認', color: 'bg-pink-100 text-pink-800' },
} as const

export const ARREARS_STATUSES = {
  outstanding: { label: '未収', color: 'bg-red-100 text-red-800' },
  partially_paid: { label: '一部回収', color: 'bg-orange-100 text-orange-800' },
  resolved: { label: '回収済', color: 'bg-green-100 text-green-800' },
  written_off: { label: '貸倒', color: 'bg-gray-100 text-gray-800' },
} as const

export const USER_ROLES = {
  president: { label: '社長', description: 'グループ全体の閲覧権限' },
  accounting_manager: { label: '経理責任者', description: '全機能の編集権限' },
  payment_staff: { label: '入金担当', description: '請求・入金・未収管理の編集権限' },
  expense_staff: { label: '経費・給与担当', description: '経費・給与関連の権限' },
  viewer: { label: '閲覧専用', description: '全機能の閲覧のみ' },
} as const

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

export function formatMonth(month: string): string {
  if (!month || month.length < 7) return month
  const [y, m] = month.split('-')
  return `${y}年${parseInt(m)}月`
}

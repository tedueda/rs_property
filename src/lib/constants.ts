export const APPLICATION_STATUSES = {
  draft: { label: '下書き', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: '申込済', color: 'bg-blue-100 text-blue-800' },
  screening: { label: '審査中', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '承認済', color: 'bg-green-100 text-green-800' },
  rejected: { label: '却下', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' },
  contracted: { label: '契約済', color: 'bg-purple-100 text-purple-800' },
} as const

export const UNIT_STATUSES = {
  vacant: { label: '空室', color: 'bg-green-100 text-green-800' },
  occupied: { label: '入居中', color: 'bg-blue-100 text-blue-800' },
  reserved: { label: '予約済', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'メンテナンス', color: 'bg-orange-100 text-orange-800' },
} as const

export const REPAIR_STATUSES = {
  received: { label: '受付', color: 'bg-gray-100 text-gray-800' },
  investigating: { label: '確認中', color: 'bg-blue-100 text-blue-800' },
  vendor_requested: { label: '業者依頼済', color: 'bg-yellow-100 text-yellow-800' },
  quote_pending: { label: '見積待ち', color: 'bg-orange-100 text-orange-800' },
  in_progress: { label: '作業中', color: 'bg-purple-100 text-purple-800' },
  completed: { label: '完了', color: 'bg-green-100 text-green-800' },
} as const

export const REPAIR_PRIORITIES = {
  low: { label: '低', color: 'bg-gray-100 text-gray-800' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: '緊急', color: 'bg-red-100 text-red-800' },
} as const

export const RENT_CHARGE_STATUSES = {
  pending: { label: '未収', color: 'bg-yellow-100 text-yellow-800' },
  partial: { label: '一部入金', color: 'bg-orange-100 text-orange-800' },
  paid: { label: '入金済', color: 'bg-green-100 text-green-800' },
  overdue: { label: '滞納', color: 'bg-red-100 text-red-800' },
} as const

export const OCR_FIELD_STATUSES = {
  auto_confirmed: { label: '自動確定', color: 'bg-green-100 text-green-800' },
  candidate: { label: '候補あり', color: 'bg-yellow-100 text-yellow-800' },
  needs_review: { label: '要確認', color: 'bg-orange-100 text-orange-800' },
  unmapped: { label: '未分類', color: 'bg-red-100 text-red-800' },
} as const

export const USER_ROLES = {
  super_admin: { label: 'スーパー管理者' },
  admin: { label: '管理者' },
  staff: { label: 'スタッフ' },
  viewer: { label: '閲覧者' },
} as const

export const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
]

export const HOUSING_TYPES = [
  { value: 'owned', label: '持ち家' },
  { value: 'rented', label: '賃貸' },
  { value: 'company', label: '社宅' },
  { value: 'family', label: '実家' },
  { value: 'other', label: 'その他' },
]

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: '正社員' },
  { value: 'contract', label: '契約社員' },
  { value: 'part_time', label: 'パート・アルバイト' },
  { value: 'self_employed', label: '自営業' },
  { value: 'executive', label: '役員' },
  { value: 'other', label: 'その他' },
]

export const CONTRACT_TYPES = {
  new: { label: '新規契約' },
  renewal: { label: '更新契約' },
} as const

export const FOLLOWUP_TYPES = [
  { value: 'phone', label: '電話' },
  { value: 'email', label: 'メール' },
  { value: 'letter', label: '書面' },
  { value: 'visit', label: '訪問' },
  { value: 'other', label: 'その他' },
]

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

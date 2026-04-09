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

export const EMPLOYEE_STATUSES = {
  active: { label: '在籍', color: 'bg-green-100 text-green-800' },
  on_leave: { label: '休職中', color: 'bg-yellow-100 text-yellow-800' },
  retired: { label: '退職', color: 'bg-gray-100 text-gray-800' },
} as const

export const EXPENSE_STATUSES = {
  pending: { label: '未処理', color: 'bg-gray-100 text-gray-800' },
  scheduled: { label: '支払予定', color: 'bg-blue-100 text-blue-800' },
  paid: { label: '支払済', color: 'bg-green-100 text-green-800' },
  needs_review: { label: '要確認', color: 'bg-pink-100 text-pink-800' },
} as const

export const PAYMENT_METHODS = {
  bank_transfer: { label: '銀行振込' },
  cash: { label: '現金' },
  credit_card: { label: 'クレジットカード' },
  direct_debit: { label: '口座引落' },
  other: { label: 'その他' },
} as const

export const PAYROLL_STATUSES = {
  draft: { label: '未確定', color: 'bg-gray-100 text-gray-800' },
  confirmed: { label: '確定', color: 'bg-blue-100 text-blue-800' },
  paid: { label: '支払済', color: 'bg-green-100 text-green-800' },
  needs_review: { label: '要確認', color: 'bg-pink-100 text-pink-800' },
} as const

export const ACCOUNT_TYPES = {
  ordinary: { label: '普通' },
  checking: { label: '当座' },
  savings: { label: '貯蓄' },
  time_deposit: { label: '定期' },
} as const

export const TRANSACTION_TYPES = {
  deposit: { label: '入金', color: 'bg-green-100 text-green-800' },
  withdrawal: { label: '出金', color: 'bg-red-100 text-red-800' },
} as const

export const LOAN_REPAYMENT_STATUSES = {
  scheduled: { label: '予定', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '実行済', color: 'bg-green-100 text-green-800' },
  needs_review: { label: '要確認', color: 'bg-pink-100 text-pink-800' },
} as const

export const DOCUMENT_STATUSES = {
  active: { label: '有効', color: 'bg-green-100 text-green-800' },
  expired: { label: '期限切れ', color: 'bg-red-100 text-red-800' },
  renewal_pending: { label: '更新予定', color: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: '解約済', color: 'bg-gray-100 text-gray-800' },
  needs_review: { label: '要確認', color: 'bg-pink-100 text-pink-800' },
} as const

export const UPLOADED_FILE_STATUSES = {
  uploaded: { label: '取込済', color: 'bg-gray-100 text-gray-800' },
  processing: { label: '処理中', color: 'bg-blue-100 text-blue-800' },
  extracted: { label: '抽出済', color: 'bg-cyan-100 text-cyan-800' },
  review_pending: { label: '確認待ち', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '確定済', color: 'bg-green-100 text-green-800' },
  error: { label: 'エラー', color: 'bg-red-100 text-red-800' },
} as const

export const EXTRACTION_TYPES = {
  bank_statement: { label: '通帳/銀行明細' },
  receipt_invoice: { label: '領収書/請求書' },
  lease_contract: { label: '入居契約書' },
  loan_contract: { label: '借入契約書' },
} as const

export const REVIEW_STATUSES = {
  pending: { label: '確認待ち', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '承認', color: 'bg-green-100 text-green-800' },
  rejected: { label: '却下', color: 'bg-red-100 text-red-800' },
  needs_correction: { label: '要修正', color: 'bg-orange-100 text-orange-800' },
} as const

export const IMPORT_STATUSES = {
  imported: { label: '取込済', color: 'bg-gray-100 text-gray-800' },
  extracted: { label: '抽出済', color: 'bg-cyan-100 text-cyan-800' },
  review_pending: { label: '確認待ち', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '確定済', color: 'bg-green-100 text-green-800' },
  error: { label: 'エラー', color: 'bg-red-100 text-red-800' },
} as const

export const DOCUMENT_LINK_TARGET_TYPES = {
  company: { label: '会社' },
  property: { label: '物件' },
  room: { label: '部屋' },
  tenant: { label: '入居者' },
  bank_account: { label: '銀行口座' },
  loan_repayment: { label: '返済' },
  expense: { label: '経費' },
  payroll: { label: '給与' },
} as const

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heif',
  'image/heic',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

export const ALLOWED_FILE_EXTENSIONS = '.jpg,.jpeg,.png,.heif,.heic,.pdf,.xlsx,.xls,.docx,.doc'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function maskAccountNumber(num: string): string {
  if (!num || num.length <= 4) return num
  return '****' + num.slice(-4)
}

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

export function formatDate(date: string): string {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ja-JP')
}

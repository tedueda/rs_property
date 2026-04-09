/**
 * Bank transaction auto-classification logic.
 * Classifies bank statement entries by description/amount patterns.
 */

export type BankClassification =
  | 'rent_income'        // 家賃収入
  | 'expense'            // 経費支出
  | 'tax_payment'        // 税金支払い
  | 'utility_payment'    // 光熱費支払い
  | 'loan_repayment'     // 銀行返済
  | 'fund_transfer'      // 資金移動
  | 'salary_payment'     // 給与支払い
  | 'guarantee_company'  // 保証会社関連
  | 'other'              // その他
  | 'needs_review'       // 要確認

export interface ClassificationResult {
  classification: BankClassification
  label: string
  confidence: number
  reason: string
}

export const CLASSIFICATION_LABELS: Record<BankClassification, string> = {
  rent_income: '家賃収入',
  expense: '経費支出',
  tax_payment: '税金支払い',
  utility_payment: '光熱費支払い',
  loan_repayment: '銀行返済',
  fund_transfer: '資金移動',
  salary_payment: '給与支払い',
  guarantee_company: '保証会社関連',
  other: 'その他',
  needs_review: '要確認',
}

const RENT_KEYWORDS = ['家賃', 'ﾔﾁﾝ', '賃料', 'ﾁﾝﾘﾖｳ']
const UTILITY_KEYWORDS = ['電力', '東京電力', 'TEPCO', '東京ガス', '水道', '東電', '関電', '中電', '中部電力', '大阪ガス', '東北電力', '東邦ガス', 'NTT', 'KDDI', 'ｶﾞｽ', 'ﾃﾞﾝﾘｮｸ', 'ｽｲﾄﾞｳ']
const TAX_KEYWORDS = ['税', '固定資産', '都税', '市税', '県税', '所得税', '法人税', '住民税', '消費税', '印紙税', '源泉', 'ｾﾞｲ']
const SALARY_KEYWORDS = ['給与', '給料', '賞与', 'ｷｭｳﾖ', 'ｷﾞﾖｳﾑ', '報酬']
const LOAN_KEYWORDS = ['返済', '融資', '借入', '元金', '利息', '銀行', 'ﾍﾝｻｲ', 'ﾕｳｼ']
const GUARANTEE_KEYWORDS = ['保証', '全保連', 'ｾﾞﾝﾎｹﾝ', 'ﾎｹﾝ', 'ほけん', 'オリコ', 'ジャックス', 'エポス', 'ﾎｼﾖｳ']
const TRANSFER_KEYWORDS = ['振替', '移動', '送金', '自振', 'ﾌﾘｶｴ']
const EXPENSE_KEYWORDS = ['修繕', '工事', '清掃', '管理費', '手数料', '保険', '消耗品', '通信費', '交通費']

function matchesAny(text: string, keywords: string[]): boolean {
  const upper = text.toUpperCase()
  return keywords.some(kw => upper.includes(kw.toUpperCase()))
}

/**
 * Classify a single bank transaction entry.
 * Uses description keywords and deposit/withdrawal direction.
 */
export function classifyTransaction(
  description: string,
  amount: number,
  isDeposit: boolean,
): ClassificationResult {
  const text = description || ''

  // Deposits are typically income
  if (isDeposit) {
    if (matchesAny(text, RENT_KEYWORDS)) {
      return { classification: 'rent_income', label: '家賃収入', confidence: 0.9, reason: '摘要に家賃関連キーワード' }
    }
    if (matchesAny(text, GUARANTEE_KEYWORDS)) {
      return { classification: 'guarantee_company', label: '保証会社関連', confidence: 0.85, reason: '摘要に保証会社関連キーワード' }
    }
    if (matchesAny(text, TRANSFER_KEYWORDS)) {
      return { classification: 'fund_transfer', label: '資金移動', confidence: 0.8, reason: '摘要に振替/送金キーワード' }
    }
    // Default deposit: likely rent if amount is in typical range (30,000-200,000)
    if (amount >= 30000 && amount <= 200000) {
      return { classification: 'rent_income', label: '家賃収入', confidence: 0.6, reason: '入金・金額帯が家賃相当' }
    }
    return { classification: 'needs_review', label: '要確認', confidence: 0.3, reason: '入金・分類不明' }
  }

  // Withdrawals
  if (matchesAny(text, UTILITY_KEYWORDS)) {
    return { classification: 'utility_payment', label: '光熱費支払い', confidence: 0.9, reason: '摘要に光熱費関連キーワード' }
  }
  if (matchesAny(text, TAX_KEYWORDS)) {
    return { classification: 'tax_payment', label: '税金支払い', confidence: 0.9, reason: '摘要に税金関連キーワード' }
  }
  if (matchesAny(text, SALARY_KEYWORDS)) {
    return { classification: 'salary_payment', label: '給与支払い', confidence: 0.9, reason: '摘要に給与関連キーワード' }
  }
  if (matchesAny(text, LOAN_KEYWORDS)) {
    return { classification: 'loan_repayment', label: '銀行返済', confidence: 0.85, reason: '摘要に返済/融資関連キーワード' }
  }
  if (matchesAny(text, GUARANTEE_KEYWORDS)) {
    return { classification: 'guarantee_company', label: '保証会社関連', confidence: 0.85, reason: '摘要に保証会社関連キーワード' }
  }
  if (matchesAny(text, TRANSFER_KEYWORDS)) {
    return { classification: 'fund_transfer', label: '資金移動', confidence: 0.8, reason: '摘要に振替/送金キーワード' }
  }
  if (matchesAny(text, EXPENSE_KEYWORDS)) {
    return { classification: 'expense', label: '経費支出', confidence: 0.8, reason: '摘要に経費関連キーワード' }
  }

  return { classification: 'needs_review', label: '要確認', confidence: 0.3, reason: '出金・分類不明' }
}

export interface ParsedBankRow {
  date: string
  description: string
  deposit: number
  withdrawal: number
  balance?: number
  classification: ClassificationResult
}

/**
 * Parse raw bank statement text (OCR output) into structured rows.
 */
export function parseBankStatementText(rawText: string): ParsedBankRow[] {
  const lines = rawText.split('\n').filter(l => l.trim())
  const rows: ParsedBankRow[] = []

  for (const line of lines) {
    // Try to match common patterns: DATE DESCRIPTION AMOUNT
    const dateMatch = line.match(/(\d{4}[/-]\d{1,2}[/-]\d{1,2})/)
    if (!dateMatch) continue

    const date = dateMatch[1]
    const afterDate = line.substring(dateMatch.index! + dateMatch[0].length).trim()

    // Extract amounts (comma-separated numbers)
    const amounts = afterDate.match(/[\d,]+/g)?.map(a => parseInt(a.replace(/,/g, ''), 10)).filter(n => !isNaN(n) && n > 0) || []

    // Extract description (text between date and first number)
    const descMatch = afterDate.match(/^(.+?)[\d,]/)
    const description = descMatch ? descMatch[1].trim() : afterDate.replace(/[\d,]+/g, '').trim()

    const amount = amounts[0] || 0
    // Heuristic: if description contains withdrawal keywords, it's a withdrawal
    const isWithdrawal = matchesAny(description, [...UTILITY_KEYWORDS, ...TAX_KEYWORDS, ...SALARY_KEYWORDS, ...LOAN_KEYWORDS, ...EXPENSE_KEYWORDS, '引落', '振込手数料'])
    const isDeposit = !isWithdrawal

    const classification = classifyTransaction(description, amount, isDeposit)

    rows.push({
      date,
      description,
      deposit: isDeposit ? amount : 0,
      withdrawal: isWithdrawal ? amount : 0,
      balance: amounts.length > 1 ? amounts[amounts.length - 1] : undefined,
      classification,
    })
  }

  return rows
}

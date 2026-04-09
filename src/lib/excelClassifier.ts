/**
 * Excel data auto-classification logic.
 * Analyzes sheet names and column headers to suggest import targets.
 */
import * as XLSX from 'xlsx'

export type ExcelImportTarget =
  | 'bank_transactions'   // 銀行取引
  | 'rent_roll'          // 家賃一覧
  | 'tenant_list'        // 入居者一覧
  | 'expense_list'       // 経費一覧
  | 'payroll_data'       // 給与データ
  | 'room_list'          // 部屋一覧
  | 'property_list'      // 物件一覧
  | 'loan_schedule'      // 返済予定
  | 'unknown'            // 不明

export interface SheetAnalysis {
  sheetName: string
  headers: string[]
  rowCount: number
  suggestedTarget: ExcelImportTarget
  targetLabel: string
  confidence: number
  reason: string
  previewData: Record<string, string | number>[]
}

export const EXCEL_TARGET_LABELS: Record<ExcelImportTarget, string> = {
  bank_transactions: '銀行取引データ',
  rent_roll: '家賃一覧',
  tenant_list: '入居者一覧',
  expense_list: '経費一覧',
  payroll_data: '給与データ',
  room_list: '部屋一覧',
  property_list: '物件一覧',
  loan_schedule: '返済予定',
  unknown: '不明',
}

const HEADER_PATTERNS: Array<{ target: ExcelImportTarget; keywords: string[]; weight: number }> = [
  { target: 'bank_transactions', keywords: ['日付', '摘要', '入金', '出金', '残高', '取引', 'お引出し', 'お預入れ', 'おひきだし'], weight: 2 },
  { target: 'rent_roll', keywords: ['家賃', '賃料', '部屋', '号室', '入居者', '請求', '共益費', '管理費'], weight: 2 },
  { target: 'tenant_list', keywords: ['入居者', 'テナント', '契約者', '氏名', '名前', '連絡先', '入居日', '退去日', 'カナ'], weight: 2 },
  { target: 'expense_list', keywords: ['経費', '費用', '支出', '勘定科目', 'カテゴリ', '領収書'], weight: 2 },
  { target: 'payroll_data', keywords: ['給与', '給料', '社員', '従業員', '基本給', '手当', '控除', '所得税', '社会保険'], weight: 2 },
  { target: 'room_list', keywords: ['部屋', '号室', '間取り', '面積', '賃料', '状態', '空室', '入居中'], weight: 1.5 },
  { target: 'property_list', keywords: ['物件', '建物', '所在地', '住所', '構造', '築年', '階数'], weight: 1.5 },
  { target: 'loan_schedule', keywords: ['返済', '借入', '融資', '元金', '利息', '残債', '月額'], weight: 2 },
]

const SHEET_NAME_PATTERNS: Array<{ target: ExcelImportTarget; keywords: string[] }> = [
  { target: 'bank_transactions', keywords: ['通帳', '銀行', '口座', '取引', '入出金'] },
  { target: 'rent_roll', keywords: ['家賃', '賃料', '請求', '入金', 'レントロール'] },
  { target: 'tenant_list', keywords: ['入居者', 'テナント', '契約者'] },
  { target: 'expense_list', keywords: ['経費', '費用', '支出'] },
  { target: 'payroll_data', keywords: ['給与', '給料', '賃金'] },
  { target: 'room_list', keywords: ['部屋', '号室', '居室'] },
  { target: 'property_list', keywords: ['物件', '建物'] },
  { target: 'loan_schedule', keywords: ['返済', '借入', '融資', 'ローン'] },
]

function analyzeHeaders(headers: string[]): { target: ExcelImportTarget; confidence: number; reason: string } {
  const scores: Record<string, { score: number; matches: string[] }> = {}

  for (const pattern of HEADER_PATTERNS) {
    const matches: string[] = []
    for (const header of headers) {
      const h = header.toLowerCase()
      for (const kw of pattern.keywords) {
        if (h.includes(kw.toLowerCase())) {
          matches.push(kw)
        }
      }
    }
    if (matches.length > 0) {
      scores[pattern.target] = {
        score: matches.length * pattern.weight,
        matches,
      }
    }
  }

  const best = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score)[0]
  if (best && best[1].score >= 2) {
    return {
      target: best[0] as ExcelImportTarget,
      confidence: Math.min(0.95, 0.5 + best[1].score * 0.1),
      reason: `列見出しに「${best[1].matches.join('」「')}」を検出`,
    }
  }

  return { target: 'unknown', confidence: 0.2, reason: '列見出しから種別を推定できませんでした' }
}

function analyzeSheetName(name: string): { target: ExcelImportTarget; confidence: number } | null {
  for (const pattern of SHEET_NAME_PATTERNS) {
    for (const kw of pattern.keywords) {
      if (name.includes(kw)) {
        return { target: pattern.target, confidence: 0.7 }
      }
    }
  }
  return null
}

/**
 * Parse and analyze an Excel file, returning analysis for each sheet.
 */
export function analyzeExcelFile(file: ArrayBuffer): SheetAnalysis[] {
  const workbook = XLSX.read(file, { type: 'array' })
  const results: SheetAnalysis[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' })

    if (jsonData.length === 0) continue

    const headers = Object.keys(jsonData[0])
    const headerAnalysis = analyzeHeaders(headers)
    const sheetNameAnalysis = analyzeSheetName(sheetName)

    // Combine sheet name and header analysis
    let suggestedTarget = headerAnalysis.target
    let confidence = headerAnalysis.confidence
    let reason = headerAnalysis.reason

    if (sheetNameAnalysis && (sheetNameAnalysis.confidence > confidence || headerAnalysis.target === 'unknown')) {
      if (headerAnalysis.target === 'unknown') {
        suggestedTarget = sheetNameAnalysis.target
        confidence = sheetNameAnalysis.confidence
        reason = `シート名「${sheetName}」から推定`
      } else if (sheetNameAnalysis.target === headerAnalysis.target) {
        confidence = Math.min(0.98, confidence + 0.15)
        reason += ` + シート名一致`
      }
    }

    results.push({
      sheetName,
      headers,
      rowCount: jsonData.length,
      suggestedTarget,
      targetLabel: EXCEL_TARGET_LABELS[suggestedTarget],
      confidence,
      reason,
      previewData: jsonData.slice(0, 5),
    })
  }

  return results
}

/**
 * Analyze an Excel file from a File object.
 */
export async function analyzeExcelFileFromFile(file: File): Promise<SheetAnalysis[]> {
  const buffer = await file.arrayBuffer()
  return analyzeExcelFile(buffer)
}

/**
 * Property Ledger (物件管理台帳) file parser.
 * Extracts structured data from DOCX, HTML, Excel, and PDF files.
 */
import * as XLSX from 'xlsx'

export interface PropertyLedgerData {
  // Header
  property_name: string
  created_date: string
  // 契約者情報
  tenant_name: string
  phone: string
  guarantor: string
  // 物件・入居情報
  move_in_date: string
  // 費用・契約条件
  rent: string
  guarantee_company: string
  house_cleaning_fee: string
  water_fee: string
  common_fee: string
  deposit: string
  deduction: string
  penalty: string
  // 備考
  notes: string
}

const EMPTY_LEDGER: PropertyLedgerData = {
  property_name: '',
  created_date: '',
  tenant_name: '',
  phone: '',
  guarantor: '',
  move_in_date: '',
  rent: '',
  guarantee_company: '',
  house_cleaning_fee: '',
  water_fee: '',
  common_fee: '',
  deposit: '',
  deduction: '',
  penalty: '',
  notes: '',
}

const FIELD_MAP: Record<string, keyof PropertyLedgerData> = {
  '賃借人の名前': 'tenant_name',
  '賃借人': 'tenant_name',
  '居住者': 'tenant_name',
  '電話番号': 'phone',
  '保証人': 'guarantor',
  '入居年月日': 'move_in_date',
  '入居日': 'move_in_date',
  '家賃': 'rent',
  '保証会社': 'guarantee_company',
  'ハウスクリーニング代': 'house_cleaning_fee',
  'クリーニング代': 'house_cleaning_fee',
  '水道代': 'water_fee',
  '共益費': 'common_fee',
  '管理費': 'common_fee',
  '保証金': 'deposit',
  '敷金': 'deposit',
  '控除': 'deduction',
  '違約金': 'penalty',
  '備考欄': 'notes',
  '備考': 'notes',
}

// Sorted longest-first so "家賃" doesn't match "家賃他合計"
const FIELD_KEYS_SORTED = Object.keys(FIELD_MAP).sort((a, b) => b.length - a.length)

// Labels that should NOT match any field (e.g. "家賃他合計" contains "家賃" but is a different concept)
const FIELD_EXCLUDE = ['家賃他合計']

// Column header aliases used in tabular Excel sheets
const EXCEL_HEADER_MAP: Record<string, keyof PropertyLedgerData> = {
  '賃借人': 'tenant_name',
  '賃借人の名前': 'tenant_name',
  '居住者': 'tenant_name',
  '電話番号': 'phone',
  '保証人': 'guarantor',
  '保証会社': 'guarantee_company',
  '入居年月日': 'move_in_date',
  '入居日': 'move_in_date',
  '家賃': 'rent',
  '共益費': 'common_fee',
  '管理費': 'common_fee',
  '水道代': 'water_fee',
  '引落手数料': 'deduction',
  '保証金': 'deposit',
  '敷金': 'deposit',
  '控除': 'deduction',
  '礼金': 'deposit',
  'ハウスクリーニング代': 'house_cleaning_fee',
  'クリーニング代': 'house_cleaning_fee',
  '違約金': 'penalty',
  '備考': 'notes',
  '物件名': 'property_name',
  '部屋番号': 'property_name',
}

const SECTION_HEADERS = ['契約者情報', '物件・入居情報', '費用・契約条件', '備考']

function matchField(label: string): keyof PropertyLedgerData | null {
  const cleaned = label.replace(/[\s\u3000]+/g, '').trim()
  // Reject labels in the exclusion list
  if (FIELD_EXCLUDE.some(ex => cleaned === ex)) return null
  // Try exact match first
  if (FIELD_MAP[cleaned]) return FIELD_MAP[cleaned]
  // Longest-key-first substring match to avoid "家賃" matching "家賃他合計"
  for (const key of FIELD_KEYS_SORTED) {
    if (cleaned === key) return FIELD_MAP[key]
  }
  // Fallback: substring match only for short labels that are a known key
  for (const key of FIELD_KEYS_SORTED) {
    if (cleaned.includes(key) && !FIELD_EXCLUDE.some(ex => cleaned.includes(ex))) return FIELD_MAP[key]
  }
  return null
}

function isSection(text: string): boolean {
  const cleaned = text.replace(/[\s\u3000]+/g, '').trim()
  // Only match exact section headers, not labels that contain them (e.g. "備考欄" should NOT match "備考")
  return SECTION_HEADERS.some(h => cleaned === h)
}

function isRecordEmpty(data: PropertyLedgerData): boolean {
  return !data.tenant_name && !data.phone && !data.rent && !data.move_in_date && !data.guarantor && !data.notes
}

const MONETARY_FIELDS: Set<keyof PropertyLedgerData> = new Set([
  'rent', 'common_fee', 'water_fee', 'deposit', 'house_cleaning_fee', 'penalty',
])

function formatValue(field: keyof PropertyLedgerData, value: string): string {
  if (MONETARY_FIELDS.has(field) && /^\d+$/.test(value)) {
    return Number(value).toLocaleString() + '円'
  }
  return value
}

function extractPropertyName(text: string): string {
  const match = text.match(/\u7269\u4ef6\u7ba1\u7406\u53f0\u5e33[\s\u3000]*(.+)/u)
  return match ? match[1].trim() : ''
}

function extractCreatedDate(text: string): string {
  const match = text.match(/作成日[：:]?\s*(.+)/u)
  return match ? match[1].trim() : ''
}

/**
 * Parse key-value rows from a 2-column table structure.
 */
function parseRows(rows: [string, string][]): PropertyLedgerData {
  const data = { ...EMPTY_LEDGER }

  for (const [label, value] of rows) {
    if (isSection(label)) continue
    const field = matchField(label)
    if (field && value.trim()) {
      data[field] = formatValue(field, value.trim())
    }
  }

  return data
}

// ==================== HTML Parser ====================

export function parseHtml(html: string): PropertyLedgerData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const data = { ...EMPTY_LEDGER }

  // Extract property name from h1
  const h1 = doc.querySelector('h1')
  if (h1?.textContent) {
    data.property_name = extractPropertyName(h1.textContent) || h1.textContent.trim()
  }

  // Extract created date from footer
  const footer = doc.querySelector('.footer')
  if (footer?.textContent) {
    data.created_date = extractCreatedDate(footer.textContent)
  }

  // Extract table rows
  const rows: [string, string][] = []
  const tableRows = doc.querySelectorAll('table tr')
  for (const tr of tableRows) {
    const cells = tr.querySelectorAll('th, td')
    if (cells.length >= 2) {
      const label = cells[0].textContent?.trim() || ''
      const value = cells[1].textContent?.trim() || ''
      if (!label || isSection(label)) continue
      rows.push([label, value])
    }
  }

  const parsed = parseRows(rows)
  return { ...parsed, property_name: data.property_name || parsed.property_name, created_date: data.created_date || parsed.created_date }
}

// ==================== DOCX Parser (via mammoth → HTML) ====================

export async function parseDocx(file: File): Promise<PropertyLedgerData> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const html = result.value

  // mammoth produces HTML; parse it
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const data = { ...EMPTY_LEDGER }

  // Get all text content for header extraction
  const allText = doc.body.textContent || ''
  // Match property name after 物件管理台帳, stopping at section headers or field labels
  const propNameMatch = allText.match(/\u7269\u4ef6\u7ba1\u7406\u53f0\u5e33[\s\u3000]*([^\n]{0,50}?)(?:\u5951\u7d04\u8005\u60c5\u5831|\u8cc3\u501f\u4eba|\u4f5c\u6210\u65e5|$)/u)
  if (propNameMatch && propNameMatch[1].trim()) {
    data.property_name = propNameMatch[1].trim()
  }

  const dateMatch = allText.match(/作成日[：:]?\s*([^\n]+)/u)
  if (dateMatch) data.created_date = dateMatch[1].trim()

  // Extract from table
  const rows: [string, string][] = []
  const tableRows = doc.querySelectorAll('table tr')
  if (tableRows.length > 0) {
    for (const tr of tableRows) {
      const cells = tr.querySelectorAll('td, th')
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim() || ''
        const value = cells[1].textContent?.trim() || ''
        if (!label || isSection(label)) continue
        rows.push([label, value])
      }
    }
  } else {
    // Fallback: parse from p tags (mammoth sometimes flattens tables)
    const paragraphs = doc.querySelectorAll('p')
    const lines: string[] = []
    paragraphs.forEach(p => {
      const text = p.textContent?.trim()
      if (text) lines.push(text)
    })
    // Try to pair lines as key-value
    for (const line of lines) {
      for (const [key] of Object.entries(FIELD_MAP)) {
        if (line.includes(key)) {
          const parts = line.split(/[：:]\s*/)
          if (parts.length >= 2) {
            rows.push([parts[0].trim(), parts.slice(1).join(':').trim()])
          }
        }
      }
    }
  }

  const parsed = parseRows(rows)
  return { ...parsed, property_name: data.property_name || parsed.property_name, created_date: data.created_date || parsed.created_date }
}

// ==================== Excel Parser ====================

/**
 * Detect if an Excel sheet uses a tabular layout (header row + data rows)
 * by checking if any row contains multiple known field headers.
 */
function detectTabularHeaders(rows: string[][]): { headerRowIdx: number; colMap: Record<number, keyof PropertyLedgerData> } | null {
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i]
    const colMap: Record<number, keyof PropertyLedgerData> = {}
    let matchCount = 0
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').replace(/[\s\u3000]+/g, '').trim()
      if (EXCEL_HEADER_MAP[cell]) {
        colMap[c] = EXCEL_HEADER_MAP[cell]
        matchCount++
      }
    }
    if (matchCount >= 3) return { headerRowIdx: i, colMap }
  }
  return null
}

/**
 * Parse a tabular Excel sheet where each row is a separate property record.
 */
function parseTabularSheet(rows: string[][], headerRowIdx: number, colMap: Record<number, keyof PropertyLedgerData>): PropertyLedgerData[] {
  const results: PropertyLedgerData[] = []
  const headerRow = rows[headerRowIdx]

  // Find property_name column index and room number column
  let propNameCol = -1
  let roomCol = -1
  for (let c = 0; c < headerRow.length; c++) {
    const cell = String(headerRow[c] || '').replace(/[\s\u3000]+/g, '').trim()
    if (cell === '物件名') propNameCol = c
    if (cell === '部屋番号') roomCol = c
  }

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const data = { ...EMPTY_LEDGER }

    for (const [colStr, field] of Object.entries(colMap)) {
      const col = Number(colStr)
      const val = String(row[col] ?? '').trim()
      if (val && field !== 'property_name') {
        data[field] = formatValue(field, val)
      }
    }

    // Build property name from 物件名 + 部屋番号
    if (propNameCol >= 0) {
      const propName = String(row[propNameCol] ?? '').trim()
      const room = roomCol >= 0 ? String(row[roomCol] ?? '').trim() : ''
      data.property_name = room ? `${propName} ${room}号室` : propName
    }

    if (!isRecordEmpty(data)) results.push(data)
  }

  return results
}

export function parseExcel(file: ArrayBuffer): PropertyLedgerData[] {
  const workbook = XLSX.read(file, { type: 'array' })
  const results: PropertyLedgerData[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const allRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })

    if (allRows.length === 0) continue

    // Try tabular format first
    const tabular = detectTabularHeaders(allRows.map(r => r.map(c => String(c))))
    if (tabular) {
      const parsed = parseTabularSheet(
        allRows.map(r => r.map(c => String(c))),
        tabular.headerRowIdx,
        tabular.colMap,
      )
      results.push(...parsed)
      continue
    }

    // Fallback: 2-column key-value format
    const data = { ...EMPTY_LEDGER }
    const rows: [string, string][] = []

    for (const row of allRows) {
      const colA = String(row[0] ?? '').trim()
      const colB = String(row[1] ?? '').trim()

      if (colA.includes('物件管理台帳')) {
        data.property_name = extractPropertyName(colA) || colA.replace('物件管理台帳', '').trim()
      }
      if (colA.includes('作成日')) {
        data.created_date = extractCreatedDate(colA) || colB
      }

      if (colA && colB && !isSection(colA)) {
        rows.push([colA, colB])
      }
    }

    const parsed = parseRows(rows)
    const record = {
      ...parsed,
      property_name: data.property_name || parsed.property_name,
      created_date: data.created_date || parsed.created_date,
    }
    if (!isRecordEmpty(record)) results.push(record)
  }

  return results
}

// ==================== PDF Parser ====================

export async function parsePdf(file: File): Promise<PropertyLedgerData> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const data = { ...EMPTY_LEDGER }
  const allLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const items = textContent.items as Array<{ str: string; transform: number[] }>

    // Group text items by Y position to form lines
    const lineMap = new Map<number, { x: number; text: string }[]>()
    for (const item of items) {
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, text: item.str })
    }

    // Sort by Y descending (top to bottom), then X ascending (left to right)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x)
      const lineText = items.map(i => i.text).join(' ').trim()
      if (lineText) allLines.push(lineText)
    }
  }

  // Extract header info
  for (const line of allLines) {
    if (line.includes('物件管理台帳')) {
      data.property_name = extractPropertyName(line) || line.replace('物件管理台帳', '').trim()
    }
    if (line.includes('作成日')) {
      data.created_date = extractCreatedDate(line)
    }
  }

  // Try to pair adjacent lines or split on delimiters
  const rows: [string, string][] = []
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i]
    for (const [key] of Object.entries(FIELD_MAP)) {
      if (line.includes(key)) {
        // Check if value is on same line after key
        const afterKey = line.substring(line.indexOf(key) + key.length).replace(/^[\s：:]+/, '').trim()
        if (afterKey) {
          rows.push([key, afterKey])
        } else if (i + 1 < allLines.length) {
          // Value on next line
          const nextLine = allLines[i + 1]
          if (!Object.keys(FIELD_MAP).some(k => nextLine.includes(k)) && !isSection(nextLine)) {
            rows.push([key, nextLine])
          }
        }
        break
      }
    }
  }

  const parsed = parseRows(rows)
  return {
    ...parsed,
    property_name: data.property_name || parsed.property_name,
    created_date: data.created_date || parsed.created_date,
  }
}

/**
 * Auto-detect file type and parse.
 */
export async function parsePropertyLedgerFile(file: File): Promise<PropertyLedgerData[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''

  switch (ext) {
    case 'html':
    case 'htm': {
      const text = await file.text()
      return [parseHtml(text)]
    }
    case 'docx':
      return [await parseDocx(file)]
    case 'xlsx':
    case 'xls': {
      const buffer = await file.arrayBuffer()
      return parseExcel(buffer)
    }
    case 'pdf':
      return [await parsePdf(file)]
    default:
      throw new Error(`未対応のファイル形式です: .${ext}\n対応形式: .docx, .html, .xlsx, .xls, .pdf`)
  }
}

export function emptyLedgerData(): PropertyLedgerData {
  return { ...EMPTY_LEDGER }
}

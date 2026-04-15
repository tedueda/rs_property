const VISION_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || ''
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`

export interface VisionTextField {
  text: string
  confidence: number
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export interface OcrResult {
  fullText: string
  fields: Array<{
    id: string
    label: string
    value: string
    confidence: number
    status: 'auto' | 'unreadable'
    originalValue: string
  }>
}

export function isOcrAvailable(): boolean {
  return !!VISION_API_KEY
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function runOcr(file: File): Promise<OcrResult> {
  if (!VISION_API_KEY) {
    throw new Error('Google Cloud Vision API key is not configured')
  }

  const base64Content = await fileToBase64(file)

  const requestBody = {
    requests: [
      {
        image: { content: base64Content },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
        ],
      },
    ],
  }

  const response = await fetch(VISION_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData?.error?.message || `Vision API error: ${response.status}`)
  }

  const data = await response.json()
  const annotation = data.responses?.[0]

  if (annotation?.error) {
    throw new Error(annotation.error.message || 'OCR processing failed')
  }

  const fullTextAnnotation = annotation?.fullTextAnnotation
  const fullText = fullTextAnnotation?.text || ''

  if (!fullText) {
    return { fullText: '', fields: [] }
  }

  const fields = extractFieldsFromText(fullText)
  return { fullText, fields }
}

function extractFieldsFromText(text: string): OcrResult['fields'] {
  const fields: OcrResult['fields'] = []
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  let fieldId = 0

  const knownPatterns: Array<{ label: string; patterns: RegExp[] }> = [
    { label: '氏名', patterns: [/(?:氏\s*名|名\s*前|契約者名?|申込者名?|入居者名?)\s*[:：]?\s*(.+)/] },
    { label: 'フリガナ', patterns: [/(?:フリガナ|ふりがな|カナ)\s*[:：]?\s*(.+)/] },
    { label: '生年月日', patterns: [/(?:生年月日|生\s*年\s*月\s*日)\s*[:：]?\s*(.+)/] },
    { label: '電話番号', patterns: [/(?:電話|TEL|携帯|連絡先)\s*[:：]?\s*([\d\-（）()]+)/i] },
    { label: 'メール', patterns: [/(?:メール|E-?mail|Mail)\s*[:：]?\s*(\S+@\S+)/i] },
    { label: '現住所', patterns: [/(?:現住所|住\s*所|所在地)\s*[:：]?\s*(.+)/] },
    { label: '勤務先', patterns: [/(?:勤務先|会社名|職場)\s*[:：]?\s*(.+)/] },
    { label: '年収', patterns: [/(?:年\s*収|収入)\s*[:：]?\s*([\d,，万]+)/] },
    { label: '物件名', patterns: [/(?:物件名|建物名|マンション名)\s*[:：]?\s*(.+)/] },
    { label: '号室', patterns: [/(?:号\s*室|部屋番号|室番号)\s*[:：]?\s*(.+)/] },
    { label: '賃料', patterns: [/(?:賃\s*料|家\s*賃|月額賃料)\s*[:：]?\s*([\d,，円¥]+)/] },
    { label: '共益費', patterns: [/(?:共益費|管理費)\s*[:：]?\s*([\d,，円¥]+)/] },
    { label: '敷金', patterns: [/(?:敷\s*金)\s*[:：]?\s*([\d,，円¥]+)/] },
    { label: '礼金', patterns: [/(?:礼\s*金)\s*[:：]?\s*([\d,，円¥]+)/] },
    { label: '契約開始日', patterns: [/(?:契約開始日?|入居日|開始日)\s*[:：]?\s*(.+)/] },
    { label: '契約期間', patterns: [/(?:契約期間)\s*[:：]?\s*(.+)/] },
    { label: '使用目的', patterns: [/(?:使用目的|用途)\s*[:：]?\s*(.+)/] },
    { label: '緊急連絡先', patterns: [/(?:緊急連絡先)\s*[:：]?\s*(.+)/] },
    { label: '保証人', patterns: [/(?:保証人|連帯保証人)\s*[:：]?\s*(.+)/] },
    { label: '職業', patterns: [/(?:職\s*業|業種)\s*[:：]?\s*(.+)/] },
    { label: '雇用形態', patterns: [/(?:雇用形態)\s*[:：]?\s*(.+)/] },
  ]

  const matchedLabels = new Set<string>()

  for (const line of lines) {
    for (const { label, patterns } of knownPatterns) {
      if (matchedLabels.has(label)) continue
      for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match && match[1]) {
          const value = match[1].trim()
          if (value.length > 0 && value.length < 200) {
            fieldId++
            const confidence = value.includes('?') || value.includes('？') ? 0.4 : 0.85
            fields.push({
              id: `ocr-${fieldId}`,
              label,
              value,
              confidence,
              status: confidence >= 0.5 ? 'auto' : 'unreadable',
              originalValue: value,
            })
            matchedLabels.add(label)
            break
          }
        }
      }
    }
  }

  // If structured extraction found too few fields, fall back to line-by-line
  if (fields.length < 3) {
    const phoneRegex = /(\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4})/g
    const dateRegex = /(\d{4}[年/-]\d{1,2}[月/-]\d{1,2}日?)/g
    const moneyRegex = /([\d,]+\s*円)/g

    const phones = text.match(phoneRegex)
    if (phones && !matchedLabels.has('電話番号')) {
      fieldId++
      fields.push({ id: `ocr-${fieldId}`, label: '電話番号', value: phones[0], confidence: 0.7, status: 'auto', originalValue: phones[0] })
    }

    const dates = text.match(dateRegex)
    if (dates) {
      for (const d of dates.slice(0, 3)) {
        fieldId++
        fields.push({ id: `ocr-${fieldId}`, label: '日付', value: d, confidence: 0.6, status: 'auto', originalValue: d })
      }
    }

    const money = text.match(moneyRegex)
    if (money) {
      for (const m of money.slice(0, 3)) {
        fieldId++
        fields.push({ id: `ocr-${fieldId}`, label: '金額', value: m, confidence: 0.7, status: 'auto', originalValue: m })
      }
    }

    // Add raw text lines as unstructured fields
    for (const line of lines.slice(0, 20)) {
      if (line.length > 2 && line.length < 100 && !fields.some(f => f.value === line)) {
        fieldId++
        fields.push({
          id: `ocr-${fieldId}`,
          label: 'テキスト',
          value: line,
          confidence: 0.5,
          status: 'auto',
          originalValue: line,
        })
      }
    }
  }

  return fields
}

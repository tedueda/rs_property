/**
 * OCR Provider Abstraction Layer
 * Pluggable OCR engine architecture (差し替え可能な構造)
 */

export interface OcrResult {
  raw_text: string
  confidence: number
  language?: string
  pages?: number
  error?: string
}

export interface OcrProvider {
  name: string
  supportedMimeTypes: string[]
  processFile(file: File): Promise<OcrResult>
}

/**
 * Demo OCR Provider - Returns simulated OCR results for demo mode.
 */
export class DemoOcrProvider implements OcrProvider {
  name = 'demo'
  supportedMimeTypes = ['image/jpeg', 'image/png', 'image/heif', 'image/heic', 'application/pdf']

  async processFile(file: File): Promise<OcrResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const fileName = file.name.toLowerCase()

    if (fileName.includes('通帳') || fileName.includes('passbook') || fileName.includes('bank')) {
      return {
        raw_text: '2025/04/01 振込 ヤマダ タロウ 85,000\n2025/04/01 振込 サトウ ハナコ 72,000\n2025/04/02 振込 タナカ ジロウ 93,000\n2025/04/03 引落 東京電力 15,200\n2025/04/05 引落 東京ガス 8,500',
        confidence: 0.92,
        language: 'ja',
        pages: 1,
      }
    }

    if (fileName.includes('領収') || fileName.includes('receipt')) {
      return {
        raw_text: '領収書\n日付: 2025年4月15日\n金額: ¥350,000\n但し: 外壁塗装工事代金として\n発行者: 株式会社修繕サービス',
        confidence: 0.88,
        language: 'ja',
        pages: 1,
      }
    }

    if (fileName.includes('契約') || fileName.includes('contract') || fileName.includes('lease')) {
      return {
        raw_text: '賃貸借契約書\n契約者: 佐藤花子\n物件名: パークハイツ\n部屋番号: 201号室\n月額賃料: 68,000円\n共益費: 5,000円\n契約期間: 2025/04/01 〜 2027/03/31',
        confidence: 0.85,
        language: 'ja',
        pages: 2,
      }
    }

    // Generic fallback
    return {
      raw_text: `ファイル名: ${file.name}\nサイズ: ${file.size} bytes\n\n[OCRデモ結果]\nこのファイルの内容はデモ用のサンプルテキストです。\n実際のOCR処理では、画像/PDFから文字列を抽出します。`,
      confidence: 0.75,
      language: 'ja',
      pages: 1,
    }
  }
}

/**
 * Google Cloud Vision OCR Provider
 * Uses DOCUMENT_TEXT_DETECTION for high-quality Japanese text extraction.
 */
export class GoogleVisionOcrProvider implements OcrProvider {
  name = 'google_vision'
  supportedMimeTypes = ['image/jpeg', 'image/png', 'image/heif', 'image/heic', 'application/pdf']

  private apiKey: string
  private apiUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`
  }

  async processFile(file: File): Promise<OcrResult> {
    const base64Content = await this.fileToBase64(file)

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

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message = errorData?.error?.message || `Vision API error: ${response.status}`
      return { raw_text: '', confidence: 0, error: message }
    }

    const data = await response.json()
    const annotation = data.responses?.[0]

    if (annotation?.error) {
      return { raw_text: '', confidence: 0, error: annotation.error.message || 'OCR processing failed' }
    }

    const fullText = annotation?.fullTextAnnotation?.text || ''
    if (!fullText) {
      return { raw_text: '', confidence: 0, language: 'ja', pages: 1 }
    }

    // Calculate average confidence from page-level confidence if available
    const pages = annotation?.fullTextAnnotation?.pages || []
    let avgConfidence = 0.85
    if (pages.length > 0) {
      const confidences = pages
        .flatMap((p: { blocks?: Array<{ confidence?: number }> }) => p.blocks || [])
        .map((b: { confidence?: number }) => b.confidence ?? 0.85)
      if (confidences.length > 0) {
        avgConfidence = confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
      }
    }

    return {
      raw_text: fullText,
      confidence: avgConfidence,
      language: 'ja',
      pages: pages.length || 1,
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

// Factory — auto-select provider based on environment
const visionApiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || ''
let currentProvider: OcrProvider = visionApiKey
  ? new GoogleVisionOcrProvider(visionApiKey)
  : new DemoOcrProvider()

export function setOcrProvider(provider: OcrProvider): void {
  currentProvider = provider
}

export function getOcrProvider(): OcrProvider {
  return currentProvider
}

export function isOcrSupported(mimeType: string): boolean {
  return currentProvider.supportedMimeTypes.includes(mimeType)
}

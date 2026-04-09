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
 * Placeholder for real OCR providers (Google Vision, AWS Textract, etc.)
 * Implement this interface to add a new OCR engine.
 *
 * Example:
 * export class GoogleVisionOcrProvider implements OcrProvider {
 *   name = 'google_vision'
 *   supportedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']
 *   async processFile(file: File): Promise<OcrResult> {
 *     // Call Google Vision API
 *   }
 * }
 */

// Factory
let currentProvider: OcrProvider = new DemoOcrProvider()

export function setOcrProvider(provider: OcrProvider): void {
  currentProvider = provider
}

export function getOcrProvider(): OcrProvider {
  return currentProvider
}

export function isOcrSupported(mimeType: string): boolean {
  return currentProvider.supportedMimeTypes.includes(mimeType)
}

import { create } from 'zustand'

/**
 * Import workflow state management.
 * States: uploaded → ocr_done → candidates_generated → classification_pending → user_confirmed → registered → error
 */
export type ImportStatus =
  | 'uploaded'
  | 'ocr_done'
  | 'candidates_generated'
  | 'classification_pending'
  | 'user_confirmed'
  | 'registered'
  | 'error'

export type ImportTargetType =
  | 'bank_statement'
  | 'rent_roll'
  | 'tenant_list'
  | 'expense_receipt'
  | 'payroll_data'
  | 'lease_contract'
  | 'loan_contract'
  | 'property_info'
  | 'room_info'
  | 'utility_bill'
  | 'other'

export const IMPORT_TARGET_LABELS: Record<ImportTargetType, string> = {
  bank_statement: '通帳・銀行明細',
  rent_roll: '家賃一覧・請求データ',
  tenant_list: '入居者一覧',
  expense_receipt: '経費・領収書',
  payroll_data: '給与データ',
  lease_contract: '賃貸契約書',
  loan_contract: '借入契約書',
  property_info: '物件情報',
  room_info: '部屋情報',
  utility_bill: '光熱費明細',
  other: 'その他',
}

export interface ImportFileEntry {
  id: string
  file: File
  fileName: string
  mimeType: string
  fileSize: number
  status: ImportStatus
  importTarget?: ImportTargetType
  ocrText?: string
  ocrConfidence?: number
  error?: string
  createdAt: string
}

interface ImportState {
  files: ImportFileEntry[]
  currentFileId: string | null
  addFile: (entry: ImportFileEntry) => void
  updateFile: (id: string, updates: Partial<ImportFileEntry>) => void
  removeFile: (id: string) => void
  setCurrentFile: (id: string | null) => void
  clearFiles: () => void
}

export const useImportStore = create<ImportState>((set) => ({
  files: [],
  currentFileId: null,
  addFile: (entry) => set((s) => ({ files: [...s.files, entry] })),
  updateFile: (id, updates) => set((s) => ({
    files: s.files.map(f => f.id === id ? { ...f, ...updates } : f),
  })),
  removeFile: (id) => set((s) => ({
    files: s.files.filter(f => f.id !== id),
    currentFileId: s.currentFileId === id ? null : s.currentFileId,
  })),
  setCurrentFile: (id) => set({ currentFileId: id }),
  clearFiles: () => set({ files: [], currentFileId: null }),
}))

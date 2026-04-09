/**
 * Name normalization utility for tenant name matching.
 * Handles full-width/half-width conversion, kana normalization,
 * space removal, and similarity scoring.
 */

// Half-width katakana to full-width katakana mapping
const HW_KANA_MAP: Record<string, string> = {
  'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
  'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
  'ｰ': 'ー', '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・',
}

// Dakuten / Handakuten combinations
const DAKUTEN_MAP: Record<string, string> = {
  'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
  'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
  'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
  'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
  'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
  'ｳﾞ': 'ヴ',
}

/** Convert half-width katakana to full-width katakana */
function halfToFullKana(str: string): string {
  // First handle dakuten/handakuten combinations (2-char sequences)
  let result = str
  for (const [hw, fw] of Object.entries(DAKUTEN_MAP)) {
    result = result.replaceAll(hw, fw)
  }
  // Then handle single characters
  for (const [hw, fw] of Object.entries(HW_KANA_MAP)) {
    result = result.replaceAll(hw, fw)
  }
  return result
}

/** Convert full-width alphanumeric to half-width */
function fullToHalfAlphaNum(str: string): string {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )
}

/** Convert hiragana to katakana */
function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  )
}

/** Remove all whitespace (half-width, full-width, tabs) */
function removeSpaces(str: string): string {
  return str.replace(/[\s\u3000]+/g, '')
}

/** Remove common symbols/punctuation */
function removeSymbols(str: string): string {
  return str.replace(/[（）()「」【】・、。，．\-_]/g, '')
}

/**
 * Normalize a name string for comparison purposes.
 * Steps:
 * 1. Trim leading/trailing whitespace
 * 2. Convert half-width kana → full-width kana
 * 3. Convert full-width alphanumeric → half-width
 * 4. Convert hiragana → katakana
 * 5. Remove all spaces
 * 6. Remove symbols
 * 7. Convert to uppercase (for ASCII)
 */
export function normalizeName(name: string): string {
  if (!name) return ''
  let n = name.trim()
  n = halfToFullKana(n)
  n = fullToHalfAlphaNum(n)
  n = hiraganaToKatakana(n)
  n = removeSpaces(n)
  n = removeSymbols(n)
  n = n.toUpperCase()
  return n
}

/** Normalize but keep spaces (for display/kana matching) */
export function normalizeNameKeepSpaces(name: string): string {
  if (!name) return ''
  let n = name.trim()
  n = halfToFullKana(n)
  n = fullToHalfAlphaNum(n)
  n = hiraganaToKatakana(n)
  n = removeSymbols(n)
  n = n.replace(/[\s\u3000]+/g, ' ').trim()
  n = n.toUpperCase()
  return n
}

/**
 * Calculate similarity score between two strings using Levenshtein distance.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function similarityScore(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const dist = levenshteinDistance(a, b)
  return 1 - dist / maxLen
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[])
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export type MatchReason = 'exact' | 'normalized_exact' | 'kana_match' | 'space_removed_match' | 'similar' | 'alias_match' | 'needs_review'

export interface MatchCandidate {
  tenantId: string
  tenantName: string
  tenantNameKana?: string
  score: number
  reason: MatchReason
  reasonLabel: string
}

export const MATCH_REASON_LABELS: Record<MatchReason, string> = {
  exact: '完全一致',
  normalized_exact: '正規化一致',
  kana_match: 'カナ一致',
  space_removed_match: 'スペース除去一致',
  similar: '類似',
  alias_match: '別名義一致',
  needs_review: '要確認',
}

/**
 * Find matching tenant candidates for a given payer name.
 * Returns candidates sorted by score (highest first).
 */
export function findMatchCandidates(
  payerName: string,
  tenants: Array<{
    id: string
    full_name: string
    full_name_kana?: string
    tenant_name_normalized?: string
    aliases?: string[]
  }>,
): MatchCandidate[] {
  if (!payerName) return []

  const normalizedPayer = normalizeName(payerName)
  const payerNoSpaces = removeSpaces(payerName.trim())
  const candidates: MatchCandidate[] = []

  for (const tenant of tenants) {
    let bestScore = 0
    let bestReason: MatchReason = 'needs_review'
    let bestLabel = '要確認'

    // 1. Exact match
    if (payerName.trim() === tenant.full_name.trim()) {
      bestScore = 1.0
      bestReason = 'exact'
      bestLabel = '完全一致'
    }

    // 2. Normalized exact match
    if (bestScore < 1) {
      const normalizedTenant = tenant.tenant_name_normalized || normalizeName(tenant.full_name)
      if (normalizedPayer === normalizedTenant) {
        bestScore = 0.95
        bestReason = 'normalized_exact'
        bestLabel = '正規化一致'
      }
    }

    // 3. Kana match
    if (bestScore < 0.95 && tenant.full_name_kana) {
      const normalizedKana = normalizeName(tenant.full_name_kana)
      if (normalizedPayer === normalizedKana) {
        bestScore = 0.9
        bestReason = 'kana_match'
        bestLabel = 'カナ一致'
      }
    }

    // 4. Space-removed match
    if (bestScore < 0.9) {
      const tenantNoSpaces = removeSpaces(tenant.full_name.trim())
      if (payerNoSpaces === tenantNoSpaces) {
        bestScore = 0.88
        bestReason = 'space_removed_match'
        bestLabel = 'スペース除去一致'
      }
    }

    // 5. Alias match
    if (bestScore < 0.88 && tenant.aliases && tenant.aliases.length > 0) {
      for (const alias of tenant.aliases) {
        const normalizedAlias = normalizeName(alias)
        if (normalizedPayer === normalizedAlias) {
          bestScore = 0.92
          bestReason = 'alias_match'
          bestLabel = '別名義一致'
          break
        }
      }
    }

    // 6. Similarity score
    if (bestScore < 0.88) {
      const normalizedTenant = tenant.tenant_name_normalized || normalizeName(tenant.full_name)
      const sim = similarityScore(normalizedPayer, normalizedTenant)
      if (sim > bestScore && sim >= 0.5) {
        bestScore = sim
        bestReason = 'similar'
        bestLabel = `類似度 ${Math.round(sim * 100)}%`
      }
    }

    if (bestScore >= 0.5) {
      candidates.push({
        tenantId: tenant.id,
        tenantName: tenant.full_name,
        tenantNameKana: tenant.full_name_kana,
        score: bestScore,
        reason: bestReason,
        reasonLabel: bestLabel,
      })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

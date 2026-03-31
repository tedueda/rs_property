import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { ocr_job_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: fields } = await supabase
      .from('ocr_extracted_fields')
      .select('*')
      .eq('ocr_job_id', ocr_job_id)

    // System field definitions for matching
    const systemFields = [
      { field: 'applicant.full_name', label: '氏名', type: 'text' },
      { field: 'applicant.full_name_kana', label: 'フリガナ', type: 'text' },
      { field: 'applicant.birth_date', label: '生年月日', type: 'date' },
      { field: 'applicant.phone', label: '電話番号', type: 'phone' },
      { field: 'applicant.email', label: 'メール', type: 'email' },
      { field: 'applicant.current_address', label: '現住所', type: 'address' },
      { field: 'applicant.employer_name', label: '勤務先', type: 'text' },
      { field: 'applicant.annual_income', label: '年収', type: 'number' },
      // ... more fields
    ]

    // TODO: Implement sophisticated matching with string similarity, synonyms, etc.
    // For now, basic label matching
    const suggestions = (fields || []).map((f: Record<string, unknown>) => {
      const candidates = systemFields
        .map(sf => ({
          field_name: sf.field,
          score: sf.label === f.ocr_label ? 1.0 : sf.label.includes(String(f.ocr_label)) ? 0.7 : 0.1,
          description: sf.label,
        }))
        .filter(c => c.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

      return { ...f, candidates, status: candidates.length > 0 && candidates[0].score > 0.8 ? 'auto_confirmed' : candidates.length > 0 ? 'candidate' : 'needs_review' }
    })

    return new Response(JSON.stringify({ success: true, suggestions }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

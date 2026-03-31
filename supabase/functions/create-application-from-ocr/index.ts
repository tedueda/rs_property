import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { ocr_job_id, company_id, property_id, unit_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get confirmed fields
    const { data: fields } = await supabase
      .from('ocr_extracted_fields')
      .select('*')
      .eq('ocr_job_id', ocr_job_id)
      .eq('status', 'auto_confirmed')

    if (!fields || fields.length === 0) throw new Error('No confirmed fields found')

    // Build application data from confirmed fields
    const fieldMap: Record<string, string> = {}
    for (const f of fields) {
      if (f.mapped_field) fieldMap[f.mapped_field] = f.ocr_value
    }

    // Create application
    const { data: app } = await supabase.from('applications').insert({
      company_id, property_id, unit_id,
      status: 'draft',
      rent_amount: fieldMap['rent_amount'] ? Number(fieldMap['rent_amount']) : null,
      reception_date: new Date().toISOString().split('T')[0],
    }).select().single()

    if (!app) throw new Error('Failed to create application')

    // Create applicant
    await supabase.from('applicants').insert({
      application_id: app.id,
      full_name: fieldMap['applicant.full_name'] || 'OCR取込',
      full_name_kana: fieldMap['applicant.full_name_kana'],
      phone: fieldMap['applicant.phone'],
      email: fieldMap['applicant.email'],
      current_address: fieldMap['applicant.current_address'],
      employer_name: fieldMap['applicant.employer_name'],
      annual_income: fieldMap['applicant.annual_income'] ? Number(fieldMap['applicant.annual_income']) : null,
    })

    // Link OCR job to application
    await supabase.from('ocr_jobs').update({ application_id: app.id }).eq('id', ocr_job_id)

    return new Response(JSON.stringify({ success: true, application_id: app.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

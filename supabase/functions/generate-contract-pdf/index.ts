import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { contract_id, template_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get contract data
    const { data: contract } = await supabase
      .from('contracts')
      .select('*, properties(*), units(*), tenants(*)')
      .eq('id', contract_id)
      .single()

    if (!contract) throw new Error('Contract not found')

    // Get template
    const { data: template } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (!template) throw new Error('Template not found')

    // TODO: Generate PDF from HTML template with data substitution
    // For now, store a placeholder
    const pdfPath = `contracts/${contract_id}/contract_${Date.now()}.pdf`

    await supabase.from('contracts').update({
      pdf_file_path: pdfPath,
      template_id,
    }).eq('id', contract_id)

    return new Response(JSON.stringify({ success: true, pdf_path: pdfPath }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { mappings, form_template_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    for (const mapping of mappings) {
      // Update extracted field
      await supabase.from('ocr_extracted_fields').update({
        mapped_field: mapping.system_field,
        status: 'auto_confirmed',
      }).eq('id', mapping.field_id)

      // Update learning table if template provided
      if (form_template_id && mapping.save_for_future) {
        await supabase.from('form_field_aliases').upsert({
          form_template_id,
          ocr_label: mapping.ocr_label,
          system_field: mapping.system_field,
          priority: 100,
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

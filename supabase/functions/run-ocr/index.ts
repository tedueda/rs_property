import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { ocr_job_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Update job status
    await supabase.from('ocr_jobs').update({ status: 'processing' }).eq('id', ocr_job_id)

    // Get job details
    const { data: job } = await supabase.from('ocr_jobs').select('*').eq('id', ocr_job_id).single()
    if (!job) throw new Error('Job not found')

    // Get file from storage
    const { data: fileData } = await supabase.storage.from('application-originals').download(job.file_path)
    if (!fileData) throw new Error('File not found')

    // TODO: Call OCR API (Google Cloud Vision or Azure Document Intelligence)
    // For now, store a placeholder result
    const ocrResult = { text: 'OCR result placeholder', fields: [] }

    await supabase.from('ocr_jobs').update({
      status: 'completed',
      ocr_raw_result: ocrResult,
    }).eq('id', ocr_job_id)

    return new Response(JSON.stringify({ success: true, ocr_job_id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

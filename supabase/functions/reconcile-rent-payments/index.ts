import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { payment_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: payment } = await supabase.from('rent_payments').select('*').eq('id', payment_id).single()
    if (!payment) throw new Error('Payment not found')

    // Find matching charges by amount and payer name
    const { data: charges } = await supabase
      .from('rent_charges')
      .select('*, tenants(full_name)')
      .eq('company_id', payment.company_id)
      .in('status', ['pending', 'partial'])
      .order('due_date', { ascending: true })

    const candidates = (charges || []).map((c: Record<string, unknown>) => ({
      charge_id: c.id,
      tenant_name: (c as { tenants?: { full_name?: string } }).tenants?.full_name,
      total_amount: c.total_amount,
      score: Number(c.total_amount) === payment.amount ? 1.0 : 0.5,
    })).sort((a: { score: number }, b: { score: number }) => b.score - a.score)

    return new Response(JSON.stringify({ success: true, candidates }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

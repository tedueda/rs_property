import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  try {
    const { to, subject, body, followup_id } = await req.json()

    // TODO: Integrate with Resend/SendGrid/Postmark
    const mailApiKey = Deno.env.get('MAIL_API_KEY')

    // Placeholder: log the email
    console.log(`Sending email to ${to}: ${subject}`)

    return new Response(JSON.stringify({ success: true, message: 'Email queued' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

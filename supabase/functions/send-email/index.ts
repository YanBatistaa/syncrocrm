
// @ts-nocheck
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
    const { to, subject, html } = await req.json()

    const { data, error } = await resend.emails.send({
        from: 'Yan Batista <[email protected]>',
        to,
        subject,
        html,
    })

    if (error) return new Response(JSON.stringify({ error }), { status: 400 })
    return new Response(JSON.stringify({ data }), { status: 200 })
})

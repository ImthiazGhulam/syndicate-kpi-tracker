import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Lazy-init Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate a magic link using the admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      console.error('Supabase generateLink error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // The generated link contains a token_hash and type as query params
    // We need to construct the proper confirmation URL
    const {
      properties: { action_link },
    } = data

    if (!action_link) {
      console.error('No action_link in response:', data)
      return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 })
    }

    // Configure nodemailer with Brevo SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Send the email with a professional dark-themed template
    await transporter.sendMail({
      from: `"The Syndicate" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Your Sign In Link — The Motherboard',
      html: buildEmailHtml(action_link, email),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send magic link error:', err)
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
  }
}

function buildEmailHtml(magicLink, email) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;">

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#71717a;">
                The Syndicate
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:8px;padding:36px 32px;">

              <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#ffffff;">
                Sign In to The Motherboard
              </h1>

              <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Click the button below to sign in as <span style="color:#ffffff;font-weight:500;">${email}</span>. This link expires in 1 hour.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="${magicLink}"
                       target="_blank"
                       style="display:inline-block;padding:14px 32px;background-color:#d4a843;color:#09090b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:3px;text-decoration:none;border-radius:6px;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top:1px solid #27272a;padding-top:20px;">
                <p style="margin:0 0 12px;font-size:12px;color:#71717a;line-height:1.5;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;color:#d4a843;word-break:break-all;line-height:1.5;">
                  ${magicLink}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#3f3f46;">
                &copy; 2025 The Syndicate. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function POST(req) {
  try {
    const { rosterId } = await req.json()
    if (!rosterId) return NextResponse.json({ error: 'Missing rosterId' }, { status: 400 })

    const supabase = getSupabase()

    const [clientRes, winsRes] = await Promise.all([
      supabase.from('roster_clients').select('name, start_date, term_end_date').eq('id', rosterId).single(),
      supabase.from('wins').select('text, win_date, source').eq('client_id', rosterId).order('win_date', { ascending: true }),
    ])

    const client = clientRes.data
    const wins = winsRes.data || []

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const startDate = client.start_date || 'Unknown'
    const termEnd = client.term_end_date || 'Rolling'
    const startD = new Date(client.start_date)
    const endD = client.term_end_date ? new Date(client.term_end_date) : new Date()
    const months = Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24 * 30)))

    const winsHtml = wins.length > 0
      ? wins.map((w, i) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #27272a;color:#a1a1aa;font-family:'JetBrains Mono',monospace;font-size:11px;white-space:nowrap;">${w.win_date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #27272a;color:#e4e4e7;font-size:13px;">${escapeHtml(w.text)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #27272a;color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">${w.source}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" style="padding:24px;color:#71717a;text-align:center;">No wins logged yet.</td></tr>'

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Win Stack — ${escapeHtml(client.name)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
  <style>
    @media print {
      @page { size: A4 landscape; margin: 16mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      nav, .sidebar, .drawer-overlay, .tab-bar, button, [data-no-print] { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #09090b; color: #e4e4e7; font-family: 'Inter', system-ui, sans-serif; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid #27272a; padding-bottom: 20px; }
    .title { font-family: 'Orbitron', sans-serif; font-size: 20px; color: #C9A84C; letter-spacing: 0.1em; text-transform: uppercase; }
    .client-name { font-size: 28px; font-weight: 600; margin-top: 4px; }
    .meta { text-align: right; font-size: 12px; color: #a1a1aa; line-height: 1.8; }
    .meta strong { color: #C9A84C; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #C9A84C; border-bottom: 2px solid #C9A84C; font-family: 'JetBrains Mono', monospace; }
    .before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; border-top: 1px solid #27272a; padding-top: 20px; }
    .ba-block label { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #C9A84C; display: block; margin-bottom: 8px; }
    .ba-block .field { background: #18181b; border: 1px solid #27272a; border-radius: 4px; min-height: 60px; padding: 12px; color: #a1a1aa; font-size: 13px; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #3f3f46; letter-spacing: 0.1em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">Win Stack</div>
      <div class="client-name">${escapeHtml(client.name)}</div>
    </div>
    <div class="meta">
      <div>Start date: <strong>${startDate}</strong></div>
      <div>Term end: <strong>${termEnd}</strong></div>
      <div>Duration: <strong>${months} month${months !== 1 ? 's' : ''}</strong></div>
      <div>Total wins: <strong>${wins.length}</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:100px;">Date</th>
        <th>Win</th>
        <th style="width:80px;">Source</th>
      </tr>
    </thead>
    <tbody>
      ${winsHtml}
    </tbody>
  </table>

  <div class="before-after">
    <div class="ba-block">
      <label>Where they started</label>
      <div class="field" contenteditable="true" data-placeholder="Fill in before the call..."></div>
    </div>
    <div class="ba-block">
      <label>Where they are now</label>
      <div class="field" contenteditable="true" data-placeholder="Fill in before the call..."></div>
    </div>
  </div>

  <div class="footer">The Roster\u2122 — Win Stack</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    console.error('Win stack error:', err)
    return NextResponse.json({ error: 'Failed to generate win stack', detail: err.message }, { status: 500 })
  }
}

function escapeHtml(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { RESIGN_SCRIPT_STAGES } from '../../../../lib/roster-constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

async function callClaude(system, user) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (res.status === 529 && attempt < 2) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
      continue
    }
    const data = await res.json()
    if (!res.ok) throw { status: res.status, message: data?.error?.message }
    return data
  }
}

export async function POST(req) {
  try {
    const { rosterId, coachClientId } = await req.json()
    if (!rosterId || !coachClientId) {
      return NextResponse.json({ error: 'Missing rosterId or coachClientId' }, { status: 400 })
    }

    const supabase = getSupabase()

    const [clientRes, notesRes, winsRes, voiceRes] = await Promise.all([
      supabase.from('roster_clients').select('name, start_date, term_end_date').eq('id', rosterId).single(),
      supabase.from('life_notes').select('note, created_at').eq('client_id', rosterId).order('created_at', { ascending: false }).limit(10),
      supabase.from('wins').select('text, win_date').eq('client_id', rosterId).order('win_date', { ascending: true }),
      supabase.from('cc_profiles').select('voice_corrections').eq('client_id', coachClientId).maybeSingle(),
    ])

    const client = clientRes.data
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const notes = (notesRes.data || []).map(n => n.note)
    const wins = (winsRes.data || []).map(w => `${w.win_date}: ${w.text}`)
    const voice = voiceRes.data?.voice_corrections

    const stages = RESIGN_SCRIPT_STAGES.map(s => `${s.step}. ${s.label}: ${s.instruction}`).join('\n')

    const system = `You are writing a resign conversation script for a business coach. The coach is about to have a retention call with their client.

Follow these stages exactly:
${stages}

Rules:
- Use the client's own words from their wins wherever possible — quote them.
- Reference specific Life Notes to open the conversation personally.
- Be specific and concrete, never generic.
- The script is for the coach to read and follow, not to read aloud verbatim — write it as coaching notes with suggested phrases.
${voice ? `- Match the coach's natural voice: ${JSON.stringify(voice)}` : '- Use a warm, direct, conversational tone.'}

Return a JSON array of objects: [{ "step": 1, "label": "...", "content": "..." }, ...]`

    const user = `Client: ${client.name}
Start date: ${client.start_date}
Term end: ${client.term_end_date || 'Rolling'}

Life Notes:
${notes.length > 0 ? notes.map(n => `- ${n}`).join('\n') : '(No life notes)'}

Wins:
${wins.length > 0 ? wins.map(w => `- ${w}`).join('\n') : '(No wins logged — the coach should ask the client to reflect on what they have achieved)'}

Generate the resign conversation script.`

    const result = await callClaude(system, user)
    const text = result.content?.[0]?.text || ''

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({ stages: parsed })
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return NextResponse.json({ stages: JSON.parse(jsonMatch[0]) })
      }
      // Fallback: return raw text with default stages
      return NextResponse.json({
        stages: RESIGN_SCRIPT_STAGES.map(s => ({
          step: s.step,
          label: s.label,
          content: s.instruction,
        })),
        raw: text,
      })
    }
  } catch (err) {
    console.error('Resign script error:', err)
    return NextResponse.json({ error: 'Failed to generate script', detail: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DRAFT_SYSTEM_BRIEF } from '../../../../lib/roster-constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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
        max_tokens: 300,
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

// Fetch the coach's voice profile (same pattern as dm-coach)
async function getVoiceProfile(supabase, coachClientId) {
  const [ppRes, ccRes] = await Promise.all([
    supabase.from('premium_position').select('brand_star, hero, remarkable').eq('client_id', coachClientId).maybeSingle(),
    supabase.from('cc_profiles').select('voice_corrections, voice_samples').eq('client_id', coachClientId).maybeSingle(),
  ])

  const data = ppRes.data
  const ccData = ccRes.data
  if (!data && !ccData) return null

  const star = data?.brand_star || {}
  const hero = data?.hero || {}

  const profile = {
    name: star.name || '',
    personality: star.personality || [],
    values: star.values || [],
    sector: star.sector || '',
    not_for: star.not_for || '',
    identity_label: hero.identity_label || '',
    traits: hero.traits || '',
  }

  if (ccData?.voice_corrections && Object.keys(ccData.voice_corrections).length > 0) {
    profile.calibrated_voice = ccData.voice_corrections
  }
  if (ccData?.voice_samples && ccData.voice_samples.length > 0) {
    profile.voice_samples = ccData.voice_samples
  }

  return profile
}

export async function POST(req) {
  try {
    const { rosterId, coachClientId, excludeNoteId } = await req.json()
    if (!rosterId || !coachClientId) {
      return NextResponse.json({ error: 'Missing rosterId or coachClientId' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch in parallel: life notes, last 3 personal touches, voice profile, client name
    const [notesRes, touchesRes, voiceProfile, clientRes] = await Promise.all([
      supabase
        .from('life_notes')
        .select('id, note, source, created_at')
        .eq('client_id', rosterId)
        .order('created_at', { ascending: false }),
      supabase
        .from('touches')
        .select('message_text, sent_at, life_note_id')
        .eq('client_id', rosterId)
        .eq('type', 'personal')
        .order('sent_at', { ascending: false })
        .limit(3),
      getVoiceProfile(supabase, coachClientId),
      supabase
        .from('roster_clients')
        .select('name')
        .eq('id', rosterId)
        .single(),
    ])

    const lifeNotes = notesRes.data || []
    const recentTouches = touchesRes.data || []
    const clientName = clientRes.data?.name || 'Client'

    if (lifeNotes.length === 0) {
      return NextResponse.json({ error: 'No Life Notes found. Add at least one before drafting.' }, { status: 400 })
    }

    // Build the user prompt
    const today = new Date().toISOString().slice(0, 10)
    const notesBlock = lifeNotes
      .filter(n => n.id !== excludeNoteId)
      .map(n => `- "${n.note}" (added ${n.created_at.slice(0, 10)}, source: ${n.source})`)
      .join('\n')

    const touchesBlock = recentTouches.length > 0
      ? recentTouches.map(t => `- "${t.message_text || '(no text logged)'}" (sent ${t.sent_at.slice(0, 10)})`).join('\n')
      : 'No previous personal touches logged.'

    const voiceBlock = voiceProfile
      ? JSON.stringify(voiceProfile, null, 2)
      : 'No voice profile available. Use a warm, casual, British English tone as default.'

    const userPrompt = `Client name: ${clientName}
Today's date: ${today}

Life Notes (most recent first):
${notesBlock}

Last 3 personal touches (to avoid repeating topics):
${touchesBlock}

Coach voice profile:
${voiceBlock}`

    const result = await callClaude(DRAFT_SYSTEM_BRIEF, userPrompt)
    const text = result.content?.[0]?.text || ''

    // Parse the JSON response
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch {
      // If the model didn't return clean JSON, try to extract it
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return NextResponse.json(JSON.parse(jsonMatch[0]))
      }
      return NextResponse.json({ message: text, life_note_id: null })
    }
  } catch (err) {
    console.error('Roster draft error:', err)
    return NextResponse.json({ error: 'Failed to generate draft', detail: err.message }, { status: 500 })
  }
}

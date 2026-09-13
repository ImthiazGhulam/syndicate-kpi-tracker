import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

async function callHaiku(system, user) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
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

// Extract only the useful signal from card notes — strip filler, keep gap words and quotes
function extractSignals(name, stage, notes) {
  if (!notes) return null
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean)
  // Keep lines that contain quotes, objections, pain words, or deal info
  const signals = lines.filter(l =>
    l.includes("'") || l.includes('"') || l.includes('—') ||
    /objection|pain|desire|gap|afford|can't|won't|don't|need|want|struggle|stuck|scared|busy|expensive|mentor|coach|time|money|referral|content|client|income/i.test(l) ||
    /DEAL CLOSED|ghosted|no reply|silence|opened|clicked|booked/i.test(l) ||
    l.length < 120 // short notes are usually punchy and useful
  )
  // Cap at 3 most recent signal lines per card
  const kept = signals.slice(-3)
  if (kept.length === 0) return null
  return `${name} (${stage}): ${kept.join(' | ')}`
}

export async function POST(req) {
  try {
    const { clientId, cards, forceRefresh } = await req.json()
    if (!clientId || !cards) {
      return NextResponse.json({ error: 'Missing clientId or cards' }, { status: 400 })
    }

    const supabase = getSupabase()

    // ── Check cache ───────────────────────────────────────────────────────
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('pipeline_insights_cache')
        .select('insights, cards_hash, created_at')
        .eq('client_id', clientId)
        .maybeSingle()

      if (cached) {
        // Hash current cards to see if anything changed
        const currentHash = simpleHash(cards.map(c => `${c.id}:${c.notes}`).join('|'))
        const cacheAge = Date.now() - new Date(cached.created_at).getTime()
        const oneWeek = 7 * 24 * 60 * 60 * 1000

        if (cached.cards_hash === currentHash && cacheAge < oneWeek) {
          return NextResponse.json({ insights: cached.insights, cached: true })
        }
      }
    }

    // ── Filter to active pipeline cards only (skip won/ghosted) ──────────
    const activeCards = cards
      .filter(c => c.notes && c.notes.trim() && !['client_won', 'ghosted'].includes(c.status))
      .slice(0, 30) // Cap at 30 most relevant

    if (activeCards.length === 0) {
      return NextResponse.json({ error: 'No active cards with notes' }, { status: 400 })
    }

    // ── Pre-summarise: extract signals only ──────────────────────────────
    const summaries = activeCards
      .map(c => extractSignals(c.name, c.stage, c.notes))
      .filter(Boolean)

    const system = `You extract sales patterns from coaching pipeline data. Return ONLY valid JSON, no markdown, no code fences. Be concise — one sentence per pattern with names and short quotes as evidence.`

    const user = `${summaries.length} active leads. Extract patterns.

${summaries.join('\n')}

Return JSON:
{
  "summary": "2-3 sentences on what this pipeline says about the audience",
  "top_objections": ["Pattern (Name: 'quote', Name: 'quote')"],
  "top_pain_points": ["Pattern (Name: 'quote', Name: 'quote')"],
  "top_desires": ["Pattern (Name: 'quote', Name: 'quote')"],
  "gap_patterns": ["Pattern (Name, Name)"],
  "content_angles": ["Title: description. Type: reel/carousel/caption/email"]
}
3-5 items per category. 5 content angles.`

    const result = await callHaiku(system, user)
    const raw = result.content?.[0]?.text || ''

    // ── Parse JSON robustly ──────────────────────────────────────────────
    let parsed = null
    try {
      parsed = JSON.parse(raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[0]) } catch { /* fall through */ }
      }
    }
    if (!parsed) {
      try {
        let partial = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const opens = (partial.match(/\[/g) || []).length - (partial.match(/\]/g) || []).length
        const braces = (partial.match(/\{/g) || []).length - (partial.match(/\}/g) || []).length
        partial = partial.replace(/,\s*"[^"]*$/, '')
        for (let i = 0; i < opens; i++) partial += ']'
        for (let i = 0; i < braces; i++) partial += '}'
        parsed = JSON.parse(partial)
      } catch { /* give up */ }
    }

    if (!parsed) {
      return NextResponse.json({ error: 'Could not parse insights. Try again.' }, { status: 500 })
    }

    // ── Cache the result ─────────────────────────────────────────────────
    const currentHash = simpleHash(cards.map(c => `${c.id}:${c.notes}`).join('|'))
    await supabase.from('pipeline_insights_cache').upsert({
      client_id: clientId,
      insights: parsed,
      cards_hash: currentHash,
      created_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })

    return NextResponse.json({ insights: parsed, cached: false })
  } catch (err) {
    console.error('Pipeline insights error:', err)
    return NextResponse.json({ error: 'Failed to analyse pipeline', detail: err.message }, { status: 500 })
  }
}

function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return String(hash)
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side Supabase with service role for cross-table reads
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

// ── Tool definitions for Anthropic ──────────────────────────────────────────

const TOOLS = [
  {
    name: 'get_voice_profile',
    description: 'Returns the client\'s brand voice and tone profile, derived from their Premium Position playbook: tone descriptors, formality, humour level, emoji habits, signature phrases, banned words, audience description, and example messages in their voice.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_lead',
    description: 'Fetch one lead\'s Hot List card by name or Instagram handle. Returns name, instagram, stage, notes, lead_magnet_sent, last_moved date. If multiple leads match, returns all matches so the coach can ask which one.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Lead name or Instagram handle, partial matches allowed' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_leads',
    description: 'List the client\'s leads, optionally filtered by pipeline stage. Returns for each: name, instagram, stage, last_moved date, and a truncated note preview. Used for "who do I message today", ambiguous references, and stale-card checks.',
    input_schema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          enum: ['new_follower', 'dm_sent', 'lead_magnet_sent', 'follow_up', 'call_booked', 'client_won', 'ghosted'],
          description: 'Optional stage filter (use the stage ID)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_offer',
    description: 'Returns the client\'s full offer details from their Sold Out playbook: main offer (Bang Bang) name, price, promise, guarantee, scarcity, who it\'s for, who it\'s not for, phases, delivery model, bonuses, CTA. Also returns the micro offer (The Dip) details and the ICP data: ideal client description, pains, real objections, cost of inaction, dream outcome, trigger moment. Call this at the start of any sales conversation so you know exactly what the client sells, at what price, and what objections to expect.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_lead',
    description: 'Update a lead\'s Hot List card — append a note and/or move to a new stage. Call this EVERY TIME you give coaching advice about a specific lead. The note should be a short dated action log (e.g. "06/08 — sent gap question, awaiting reply"). Notes are APPENDED to existing notes, never replaced. Stage is only changed if the conversation warrants a move.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Lead name or Instagram handle to identify the card' },
        note: { type: 'string', description: 'Note to append to the card (date-prefixed, e.g. "06/08 — sent connect DM, referenced their poll answer about pricing")' },
        new_stage: {
          type: 'string',
          enum: ['new_follower', 'dm_sent', 'lead_magnet_sent', 'follow_up', 'call_booked', 'client_won', 'ghosted'],
          description: 'New stage to move the card to. Only include if the card should move.',
        },
      },
      required: ['query'],
    },
  },
]

const STAGE_LABELS = {
  new_follower: 'New Follower',
  dm_sent: 'Initial DM Sent',
  lead_magnet_sent: 'Lead Magnet Sent',
  follow_up: 'Follow-up Friday DM',
  call_booked: 'Call Booked',
  client_won: 'Client Won',
  ghosted: 'Client Ghosted',
}

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(toolName, toolInput, clientId) {
  const supabase = getSupabase()

  if (toolName === 'get_voice_profile') {
    const { data } = await supabase
      .from('premium_position')
      .select('brand_star, hero, remarkable')
      .eq('client_id', clientId)
      .maybeSingle()

    if (!data) return { voice_profile: null, note: 'No Premium Position data found. Using warm-neutral default voice.' }

    const star = data.brand_star || {}
    const hero = data.hero || {}
    const remarkable = data.remarkable || {}

    return {
      voice_profile: {
        name: star.name || '',
        what_they_do: star.what_you_do || '',
        personality: star.personality || [],
        values: star.values || [],
        sector: star.sector || '',
        contrarian_belief: star.contrarian_belief || '',
        not_for: star.not_for || '',
        refuse: star.refuse || '',
        identity_label: hero.identity_label || '',
        traits: hero.traits || '',
        why: hero.why || '',
        gift: hero.gift || '',
        origin: hero.origin || '',
        turning_point: hero.turning_point || '',
        mechanism: remarkable.mechanism || '',
        differentiator: remarkable.differentiator || '',
        provocation: remarkable.provocation || '',
        category: remarkable.category || '',
      },
    }
  }

  if (toolName === 'get_lead') {
    const query = (toolInput.query || '').trim().toLowerCase()
    if (!query) return { error: 'No search query provided' }

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })

    if (!leads || leads.length === 0) return { leads: [], note: 'No leads found on the Hot List.' }

    const matches = leads.filter(l => {
      const name = (l.name || '').toLowerCase()
      const ig = (l.instagram || '').replace('@', '').toLowerCase()
      return name.includes(query) || ig.includes(query) || query.includes(name) || query.includes(ig)
    })

    if (matches.length === 0) return { leads: [], note: `No lead matching "${toolInput.query}" found.` }

    return {
      leads: matches.map(l => ({
        name: l.name,
        instagram: l.instagram || null,
        stage: STAGE_LABELS[l.status] || l.status,
        stage_id: l.status,
        notes: l.notes || null,
        lead_magnet_sent: l.lead_magnet_sent || false,
        last_moved: l.updated_at || l.created_at,
        days_since_moved: Math.floor((Date.now() - new Date(l.updated_at || l.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      })),
    }
  }

  if (toolName === 'list_leads') {
    let q = supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })

    if (toolInput.stage) {
      q = q.eq('status', toolInput.stage)
    }

    const { data: leads } = await q

    if (!leads || leads.length === 0) {
      return { leads: [], note: toolInput.stage ? `No leads in "${STAGE_LABELS[toolInput.stage] || toolInput.stage}".` : 'Hot List is empty.' }
    }

    return {
      leads: leads.map(l => ({
        name: l.name,
        instagram: l.instagram || null,
        stage: STAGE_LABELS[l.status] || l.status,
        stage_id: l.status,
        notes_preview: l.notes ? l.notes.slice(0, 120) + (l.notes.length > 120 ? '...' : '') : null,
        lead_magnet_sent: l.lead_magnet_sent || false,
        last_moved: l.updated_at || l.created_at,
        days_since_moved: Math.floor((Date.now() - new Date(l.updated_at || l.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      })),
      total: leads.length,
    }
  }

  if (toolName === 'get_offer') {
    const [offerRes, deRes] = await Promise.all([
      supabase.from('offer_playbooks').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('distinction_engine').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (!offerRes.data && !deRes.data) return { offer: null, note: 'No Sold Out playbook data found. Ask the client about their offer directly.' }

    const result = {}

    if (offerRes.data) {
      const bb = offerRes.data.bang_bang || {}
      const dip = offerRes.data.dip || {}
      const icp = offerRes.data.icp || {}
      const path = offerRes.data.path_planner || {}

      result.main_offer = {
        name: bb.name || null,
        promise: bb.promise || null,
        price: bb.price || null,
        who_for: bb.who_for || null,
        who_not_for: bb.who_not_for || null,
        guarantee_type: bb.guarantee_type || null,
        guarantee_detail: bb.guarantee_detail || null,
        scarcity: bb.scarcity || null,
        urgency: bb.urgency || null,
        delivery_model: bb.delivery_model || [],
        touch_points: bb.touch_points || [],
        bonuses: (bb.bonuses || []).filter(b => b.name),
        phases: (bb.phases || []).filter(p => p.name),
        continuity: bb.continuity_offer || null,
        cta: bb.cta_action || null,
        results_numbers: bb.results_numbers || null,
        big_names: bb.big_names || null,
        social_proof: bb.social_proof || [],
      }

      if (dip.name) {
        result.micro_offer = {
          name: dip.name,
          promise: dip.promise || null,
          price: dip.price || null,
          problem: dip.problem || null,
          outcome: dip.outcome || null,
          format: dip.format || null,
          duration: dip.duration || null,
          bridge_to_main: dip.bridge_to_main || null,
          belief_to_create: dip.belief_to_create || null,
        }
      }

      result.icp = {
        specific_description: icp.specific_description || null,
        promise: icp.promise || null,
        dream_outcome: icp.dream_outcome || null,
        pains: Array.isArray(icp.pains) ? icp.pains.filter(Boolean) : [],
        real_objections: icp.real_objections || [],
        cost_of_inaction: icp.cost_of_inaction || null,
        trigger_moment: icp.trigger_moment || null,
        who_not_for: icp.who_not_for || null,
        pyramid_level: icp.pyramid_level || null,
        emotional_state: icp.emotional_state || [],
      }

      if (path.total_duration) result.programme_duration = path.total_duration
    }

    if (deRes.data) {
      const de = deRes.data.engine_data || deRes.data
      result.method = {
        engine_name: de.engine_name || null,
        promise: de.promise || null,
        problems: [de.problem_1, de.problem_2, de.problem_3].filter(Boolean),
        pillars: [de.pillar_1, de.pillar_2, de.pillar_3].filter(Boolean),
      }
    }

    return result
  }

  if (toolName === 'update_lead') {
    const query = (toolInput.query || '').trim().toLowerCase()
    if (!query) return { error: 'No lead query provided' }

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })

    if (!leads || leads.length === 0) return { error: 'No leads found on the Hot List.' }

    const match = leads.find(l => {
      const name = (l.name || '').toLowerCase()
      const ig = (l.instagram || '').replace('@', '').toLowerCase()
      return name.includes(query) || ig.includes(query) || query.includes(name) || query.includes(ig)
    })

    if (!match) return { error: `No lead matching "${toolInput.query}" found. Card not updated.` }

    // Store proposed update — NOT applied yet. Client must confirm.
    return {
      proposed: true,
      lead_id: match.id,
      lead_name: match.name,
      current_notes: match.notes || '',
      current_stage: match.status,
      proposed_note: toolInput.note || null,
      proposed_stage: toolInput.new_stage || null,
      proposed_stage_label: toolInput.new_stage ? STAGE_LABELS[toolInput.new_stage] : null,
    }
  }

  return { error: `Unknown tool: ${toolName}` }
}

// ── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the DM Sales Coach inside The Motherboard, coaching clients of the GYC Sales programme (Phase 8) through live DM conversations. You have tools that let you read the client's Hot List, their voice profile, and their FULL offer details (from Sold Out playbook). Your job: work out where a conversation sits in the framework, and give the client the exact next message to send in THEIR voice, plus the Hot List action to take.

CRITICAL FIRST ACTION: On your VERY FIRST response in any conversation, you MUST call BOTH get_voice_profile AND get_offer before doing anything else. You cannot coach a sales conversation without knowing the offer name, price, guarantee, and what objections to expect. Do not skip this.

## YOUR TOOLS AND WHEN TO USE THEM

- **get_voice_profile** — returns the client's tone and brand voice, built from their Premium Position playbook. Call this ONCE at the start of every session, before drafting anything. Every message you draft is written in this voice.
- **get_offer** — returns the client's FULL offer details from their Sold Out playbook: main offer (name, price, promise, guarantee, scarcity, phases, delivery, bonuses, CTA), micro offer / The Dip (name, price, bridge), ICP (pains, objections, dream outcome, cost of inaction), and their method from Distinction Engine (name, pillars, problems). Call this ONCE at the start of every session alongside get_voice_profile. You MUST know the offer before coaching any sales conversation — you need to know the price, the guarantee, the scarcity, and the real objections to handle them properly.
- **get_lead** — returns one lead's card: name, Instagram handle, stage, notes, lead magnet toggle, last moved date. Call this whenever the client names a lead ("what do I send Priya?", "the guy from the webinar, @marcusfit"). The card is the source of truth: if the client's memory of the stage or the gap words conflicts with the card, trust the card and gently flag the mismatch.
- **list_leads** — returns leads, optionally filtered by stage. Use it when the reference is ambiguous ("that nutrition coach" and two cards match), or when the client asks pipeline questions ("who needs a Friday message?", "who's gone stale?"). For "who do I message today", pull the board and prioritise: overdue next actions first, then cards unmoved for 7+ days, then Friday follow-ups if it's Thursday or Friday.
- **update_lead** — proposes a card update: a note to append and/or a stage to move to. CRITICAL: you MUST call this tool EVERY TIME you give coaching advice about a specific lead. After drafting the next message and giving the Hot List action, call update_lead so the client can confirm the card update with one tap. Notes should be short, dated action logs (e.g. "06/08 — sent connect DM, referenced poll answer about pricing"). Only propose a stage change when the conversation genuinely warrants a move.

Never invent card data. If a tool fails or a lead isn't found, say so and coach from what the client pastes. Ask at most ONE clarifying question before giving a provisional read.

## VOICE ADAPTATION (this overrides the sound of every script below)

The framework's mechanics are fixed. The delivery is the client's. Before drafting, match the voice profile on: warmth vs directness, formality, humour, emoji habits, pace, and any signature phrases or banned words it lists.

The scripts in this prompt are written in a direct, cheeky register. Treat them as MECHANICS, not wording. Re-skin every one to the client's voice while keeping: the move it executes, the question it ends on, and its honesty.

Universal floor, whatever the profile: messages are short, specific, human, honest, and end in a question or a clear next step. No corporate words (leverage, streamline, unlock, journey, transform) unless the voice profile explicitly uses them. If no voice profile is available, default to warm-neutral, note that you're doing so, and carry on.

## THE FRAMEWORK (your only playbook)

**The one rule:** never sell the programme in the chat. Sell the next step. Two next steps only: a booked sales call (the Bang Bang Offer) or a requested sales doc (The Dip).

**Conversation triggers — how the lead came in shapes the Connect move:**

Different triggers warrant different openers. The client will tell you HOW they found this person. Adapt the Connect move accordingly:

- **New follower** — they chose to follow, so they're already curious. Reference something specific from their bio or recent post. "Hey [name], just saw you followed — loved your [specific thing from their profile]. [Question about them]."
- **Poll / sticker interaction** — they actively engaged with a piece of content. Reference the EXACT poll answer or sticker response. "Hey [name], saw you picked [their answer] on my [topic] poll — that tells me [insight about what that answer means]. [Question that digs deeper into their answer]." The poll answer IS the diagnosis starter — it tells you what they care about. Skip small talk, go straight to exploring their answer.
- **Regular story viewer** — they keep showing up, which signals silent interest. Acknowledge the consistency without being creepy. "Hey [name], I keep seeing you pop up on my stories — clearly something's landing. What's caught your eye?" Keep it light and curious, not "I've been watching you watch me."
- **Post engagement (like/comment/share/save)** — they reacted to specific content. Reference the EXACT post and their comment if they left one. "Hey [name], saw your comment on my [topic] post — [reference what they said or what the post was about]. [Question connecting the post topic to their situation]." If they just liked (no comment), reference the post topic: "Hey, noticed you vibed with my [topic] post — is that something you're working on right now?"

In ALL cases: the opener ends in a question about THEM, never the offer. The trigger just gives you a warmer, more specific way in. After Connect, the framework continues exactly the same — Diagnose, Permission, Qualify, Route, Lock It.

**The six-move arc:**
1. **Connect** — a genuine, specific opener ending in a question about them, never the offer. Use the conversation trigger above to tailor HOW you connect.
2. **Diagnose** — the three-question spine: current state ("Where are you at with [topic] right now?"), desired state ("What would you want that to look like in 3 to 6 months?"), the gap ("What's the main thing stopping that already?"). The gap answer is gold; it gets saved to the card word for word.
3. **Permission** — ask before pitching. Use the ACTUAL offer name from get_offer (e.g. "That's exactly the kind of thing we sort inside [their actual offer name]. Want me to show you how it works?"). Never say "my programme" generically when you know the name. A no stays on the board for a light Friday check-in. Never push past a no.
4. **Qualify** — the 1-to-10 frame, ALWAYS before any booking link: urgency out of 10, importance out of 10. The flip: 9-10 gets challenged downward so they justify it and sell themselves; 5-8 gets "why isn't it higher?" to surface the real objection, handled using the REAL objections from the ICP data (get_offer returns these), in one message; 1-4 gets NO link — lead magnet and Friday rhythm instead, score and reason on the card.
5. **Route** — the client decides. Call when: needs diagnosing, ticket justifies 30 minutes, they're hot and talking fast, objections will be personal. Doc when: they asked "how much / how does it work", async buyer, or busy. If the client has a micro offer / Dip (from get_offer), that's the doc option — use its actual name. The doc is a different door to the same room, never a consolation prize.
6. **Lock It** — every conversation ends with a date. The prospect books THEMSELVES via a link; the link never goes out naked, always framed with a timeframe, followed by asking when they'll grab a slot. The card only moves to Call Booked on an actual booking. Docs go out with a named Friday check-in. Calls are 30 minutes. Never draft a message offering to book someone in manually.

**Follow-Up Fridays:** follow-ups go out on Fridays. Friday 1 reminder, Friday 2 value or client story referencing their exact gap words, Friday 3 the honest door-close ("I'll stop nudging after this one... the door's open this week. Which is it?" — reskinned to the client's voice). Banned in any follow-up voice: "just checking in", "bumping this", "any thoughts?". If a follow-up could be sent to anyone, it shouldn't be sent to anyone.

**Call resistance mechanics (reskin the wording, keep the shape):**
- "Can't we just do this over chat?" — real-time back-and-forth beats a week of typing what 30 minutes covers; end by asking which they'd prefer.
- "Is this a sales pitch?" — honest map of their situation; if it fits you'll say how, if it doesn't you'll say that too; no pressure; end on "sound fair?".
- "No time for a call" — reframe: is this really something they want to resolve, and is 30 minutes a fair trade to be rid of [their problem]?

**Objection principles:** agree with the feeling first, never argue, ask one question back, never a wall of text.

**The Hot List stages:** New Follower → Initial DM Sent → Lead Magnet Sent → Follow-up Friday DM → Call Booked → Client Won / Client Ghosted.

Card rules:
- **New Follower** — the moment someone follows, engages with a poll, views stories regularly, or interacts with a post, they get a card in New Follower. This is the holding pen before any outreach. Note the trigger source (e.g. "followed 01/08", "poll — chose 'pricing'", "commented on carousel about leads"). ALWAYS recommend adding them here when the client mentions a new follower or interaction.
- **Initial DM Sent** — moves here when the first DM goes out. Not when they reply — when YOU send.
- **Lead Magnet Sent** — when the freebie goes out, toggle ticked.
- **Follow-up Friday DM** — on the first Friday message.
- **Call Booked** — only on an actual booking, never a sent link.
- **Client Won / Ghosted** — Ghosted is parked not lost — one reactivation per quarter that reopens the diagnosis and never mentions the offer.

Card notes hold the trigger source, the gap words verbatim, the urgency score and justification, and anything sent with its date.

## HOW TO COACH

Every time the client brings a conversation (pasted, or "what do I send [lead]?"):

1. Fetch what you need: voice profile AND offer details (if not already loaded this session — call get_voice_profile and get_offer), then the lead's card.
2. **Locate the move.** Say plainly which of the six moves it's on and whether it's on track or where it slipped (pitched early, skipped diagnosis, naked link, mid-week chasing, skipped the 1-to-10).
3. **Draft the next message** in the client's voice. ONE ready-to-send message, adapted to the prospect's exact words from the chat and the card notes. Fill brackets from available context; leave and flag any you can't.
4. **Give the Hot List action.** One line: correct stage now, what to add to the notes (ALWAYS prefix notes with today's date in DD/MM format, e.g. "29/07 — sent gap question, replied interested"), next action date.

**Hard rules you enforce, even when the client pushes back:**
- No booking link before the 1-to-10 frame has been run.
- No pitch language before the gap question is answered.
- No follow-up without the prospect's own words in it.
- A 1-4 urgency score never gets a link, whatever the client's month looks like.
- Nothing dishonest: no fake scarcity, invented results, income promises, or "last slot" claims unless truly last.
- A clear no gets a graceful exit and a board move, not another angle.

**Tone with the client:** match their energy, stay warm and quick. Praise in half a sentence, fix what's broken, hand them the message. If they're panicking over silence: silence isn't rejection, Ghosted is parked not lost, the Friday rhythm exists so no single reply carries the whole pipeline.

**Reply format:**

**Where you are:** [move + one-line read]
**Send this:** [the message, in their voice, ready to copy]
**Hot List:** [stage / notes to add / next action date]

Add **Watch for:** only when there's a genuine trap ahead.

TODAY'S DATE: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} (use DD/MM format in notes, e.g. "${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace(/\//g, '/')}")`

// ── Main handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const { messages, clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'Missing client ID' }, { status: 400 })
    }

    // Build messages array for Anthropic — support vision (image_url blocks)
    let anthropicMessages = messages.map(m => {
      // If content is already an array (has images), pass through
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content }
      }
      // If it has images attached, build multimodal content
      if (m.images && m.images.length > 0) {
        const blocks = m.images.map(url => ({
          type: 'image',
          source: { type: 'url', url },
        }))
        blocks.push({ type: 'text', text: m.content || 'What do you see in this image?' })
        return { role: m.role, content: blocks }
      }
      return { role: m.role, content: m.content }
    })

    // Track proposed card updates from the coach
    const proposedUpdates = []

    // Agentic tool-use loop — keep going until the model stops calling tools
    let maxLoops = 8
    while (maxLoops > 0) {
      maxLoops--

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages: anthropicMessages,
        }),
      })

      if (res.status === 529) {
        await new Promise(r => setTimeout(r, 2000))
        continue
      }

      const data = await res.json()
      if (!res.ok) {
        console.error('DM Coach API error:', data?.error)
        return NextResponse.json({ error: data?.error?.message || 'AI error' }, { status: 500 })
      }

      // If the model wants to use tools, execute them and continue the loop
      if (data.stop_reason === 'tool_use') {
        // Add assistant's response (which includes tool_use blocks)
        anthropicMessages.push({ role: 'assistant', content: data.content })

        // Execute each tool call and build tool_result blocks
        const toolResults = []
        for (const block of data.content) {
          if (block.type === 'tool_use') {
            const result = await executeTool(block.name, block.input, clientId)
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            })
            // Capture proposed card updates
            if (block.name === 'update_lead' && result.proposed) {
              proposedUpdates.push(result)
            }
          }
        }

        // Add tool results as a user message
        anthropicMessages.push({ role: 'user', content: toolResults })
        continue
      }

      // Model is done (stop_reason === 'end_turn') — extract text
      const text = data.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')

      const response = { reply: text }
      if (proposedUpdates.length > 0) {
        response.proposed_updates = proposedUpdates
      }
      return NextResponse.json(response)
    }

    return NextResponse.json({ error: 'Coach took too many steps. Please try again.' }, { status: 500 })

  } catch (err) {
    console.error('DM Coach error:', err)
    return NextResponse.json({ error: err.message || 'Failed to get coaching response' }, { status: 500 })
  }
}

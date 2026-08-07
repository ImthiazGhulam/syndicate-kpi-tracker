import { NextResponse } from 'next/server'

const CONTENT_MODEL = process.env.CONTENT_MODEL || 'claude-sonnet-4-6'
const CONTENT_MODEL_REWRITE = process.env.CONTENT_MODEL_REWRITE || 'claude-opus-4-6'

async function callAnthropicAPI(system, user, maxTokens = 1500, model = CONTENT_MODEL) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })
    if (res.status === 529 && attempt < 2) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
      continue
    }
    const data = await res.json()
    if (!res.ok) throw { status: res.status, message: data?.error?.message, error: data?.error }
    return data
  }
}

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const { prompt, voiceContext, maxTokens, isRewrite, previousDraft } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    let systemPrompt = `You ghostwrite social content. One piece per request. Plain text only — no preamble, no markdown, no asterisks, no commentary.

You sound like the person, not like a writer. Not like AI. Not like "content." Like them, on a good day, saying the thing they actually mean.

BANNED (using any of these = failure):
"Here's the thing" | "Here's what nobody tells you" | "Let me be honest" | "The truth is" | "The reality is" | "Let's be real" | "It's not X. It's Y." | "Game-changer" | "Unlock" | "Journey" | "Navigate" | "Leverage" | "However" | "Moreover" | "Furthermore" | "Additionally" | "In fact"

BANNED PATTERNS:
- Colons before lists
- Rhetorical questions that answer themselves in the next line
- Em-dashes
- Three-part parallel lists (X, Y, and Z)
- Starting 2+ sentences the same way
- Neat summary endings. Real posts end mid-thought or with a gut punch.
- Any sentence that reads like LinkedIn 2019

Instead: short sentences that punch. Occasional long one that builds. "but" and "so" connect thoughts, not "however" and "additionally". Specifics over adjectives. Numbers over claims. End confronting the reader, not impressing them.`

    // Inject voice profile and samples into the system prompt so they shape everything
    if (voiceContext) {
      if (voiceContext.profile) {
        const p = voiceContext.profile
        const vl = []
        if (p.summary) vl.push(`Voice summary: ${p.summary}`)
        if (p.directness) vl.push(`Directness: ${p.directness}`)
        if (p.formality) vl.push(`Formality: ${p.formality}`)
        if (p.sentence_style) vl.push(`Sentence style: ${p.sentence_style}`)
        if (p.phrases_use) vl.push(`Words/phrases they USE: ${p.phrases_use}`)
        if (p.phrases_avoid) vl.push(`Words/phrases they would NEVER say: ${p.phrases_avoid}`)
        if (p.swearing) vl.push(`Swearing: ${p.swearing}`)
        if (p.emoji_use) vl.push(`Emoji use: ${p.emoji_use}`)
        if (p.region) vl.push(`Region/dialect: ${p.region}`)
        if (p.energy) vl.push(`Energy: ${p.energy}`)
        if (vl.length > 0) systemPrompt += `\n\nTHIS PERSON'S VOICE (from a calibration conversation — this overrides all other voice cues):\n${vl.join('\n')}`
      } else if (voiceContext.voice) {
        const vl = []
        if (voiceContext.voice.directness) vl.push(`How direct: ${voiceContext.voice.directness}`)
        if (voiceContext.voice.formality) vl.push(`Formality: ${voiceContext.voice.formality}`)
        if (voiceContext.voice.phrasesUse) vl.push(`They say things like: ${voiceContext.voice.phrasesUse}`)
        if (voiceContext.voice.phrasesAvoid) vl.push(`They would NEVER say: ${voiceContext.voice.phrasesAvoid}`)
        if (vl.length > 0) systemPrompt += `\n\nTHIS PERSON'S VOICE:\n${vl.join('\n')}`
      }
      if (voiceContext.samples && voiceContext.samples.length > 0) {
        systemPrompt += `\n\nTHEIR ACTUAL WRITING (match this voice — the rhythm, the word choices, the attitude, the sentence length. Your output must be indistinguishable from these):\n${voiceContext.samples.map((s, i) => `---\n${s}\n---`).join('\n')}`
      }
    }

    // Rewrite escalation: use the rewrite model and include the failed draft
    let useModel = CONTENT_MODEL
    let finalPrompt = prompt
    if (isRewrite && previousDraft) {
      useModel = CONTENT_MODEL_REWRITE
      finalPrompt = `${prompt}\n\nHere's the draft that missed:\n---\n${previousDraft}\n---\n\nWrite a genuinely better version, not a variation. Different angle, different opening, sharper throughout.`
    }

    const tokens = maxTokens || 1500
    let data
    let modelUsed = useModel
    try {
      data = await callAnthropicAPI(systemPrompt, finalPrompt, tokens, useModel)
    } catch (err) {
      // Silent fallback to default model if rewrite model errors
      if (useModel !== CONTENT_MODEL) {
        modelUsed = CONTENT_MODEL
        data = await callAnthropicAPI(systemPrompt, finalPrompt, tokens, CONTENT_MODEL)
      } else {
        throw err
      }
    }

    const content = data.content?.[0]?.text || ''

    return NextResponse.json({ content, model: modelUsed })
  } catch (err) {
    console.error('Content generation error:', err)
    const status = err.status || 500
    return NextResponse.json(
      { error: err.message || 'Content generation failed' },
      { status }
    )
  }
}

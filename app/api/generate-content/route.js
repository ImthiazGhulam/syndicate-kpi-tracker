import { NextResponse } from 'next/server'

async function callAnthropicAPI(system, user, maxTokens = 1500) {
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
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const systemPrompt = `You are a ghostwriter. You disappear completely into the voice of the person you're writing for. Your output must be indistinguishable from something they wrote themselves — not polished, not "content-y", not AI-sounding. Write ONE piece and nothing else — no preamble, no commentary, no markdown, no asterisks. Plain text only.

CRITICAL — these patterns EXPOSE you as AI. Never use them:
- Colons to introduce lists ("Here's what I learned:" or "Three things:")
- "Here's the thing" / "Here's what nobody tells you" / "Let me be honest"
- "The truth is" / "The reality is" / "Let's be real"
- Rhetorical questions that immediately answer themselves
- Em-dashes — like this — anywhere
- "It's not X. It's Y." constructions
- Starting consecutive sentences with the same word
- Three-part parallel lists (X, Y, and Z)
- "However" / "Moreover" / "Furthermore" / "Additionally" / "In fact"
- "Game-changer" / "Unlock" / "Journey" / "Navigate" / "Leverage"
- Wrapping up with a neat bow — real posts end mid-thought or with a gut punch, not a summary
- Any sentence that sounds like it belongs in a LinkedIn post from 2019

Write like a real person texting a mate who happens to be going through the same thing. Messy is better than polished. Blunt is better than clever. Short is better than comprehensive.`

    const data = await callAnthropicAPI(systemPrompt, prompt)
    const content = data.content?.[0]?.text || ''

    return NextResponse.json({ content })
  } catch (err) {
    console.error('Content generation error:', err)
    const status = err.status || 500
    return NextResponse.json(
      { error: err.message || 'Content generation failed' },
      { status }
    )
  }
}

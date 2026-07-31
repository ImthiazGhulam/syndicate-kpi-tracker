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

    const systemPrompt = 'You are a ghostwriter inside a content tool for coaches, consultants and educators. Write ONE piece of social content and nothing else — no preamble, no commentary, no markdown headers or asterisks. Output the piece only, in plain text.'

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

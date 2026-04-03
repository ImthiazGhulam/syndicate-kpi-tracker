import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req) {
  try {
    const { type, data } = await req.json()

    let systemPrompt = ''
    let userPrompt = ''

    if (type === 'wealth-wired') {
      systemPrompt = 'You are a no-nonsense business and wealth coach. You write direct, raw, actionable plans. No fluff, no motivational filler. Every sentence must be a specific action or a hard truth. Tone: like a mentor who genuinely cares but refuses to sugarcoat anything.'
      userPrompt = `Based on this client's Wealth Wired™ Workbook answers, write a personalised 30-day action plan.

Their answers across 8 financial rewiring frameworks:

THE TRINITY TRAP™
Reflection: ${data.module_1?.reflection || 'Not answered'}
Audit: ${data.module_1?.audit || 'Not answered'}
Go Deeper: ${data.module_1?.go_deeper || 'Not answered'}

THE ASCENSION LADDER™
Reflection: ${data.module_2?.reflection || 'Not answered'}
Audit: ${data.module_2?.audit || 'Not answered'}
Go Deeper: ${data.module_2?.go_deeper || 'Not answered'}

THE BROKIE VENN™
Reflection: ${data.module_3?.reflection || 'Not answered'}
Audit: ${data.module_3?.audit || 'Not answered'}
Go Deeper: ${data.module_3?.go_deeper || 'Not answered'}

THE REWIRE TRIANGLE™
Reflection: ${data.module_4?.reflection || 'Not answered'}
Audit: ${data.module_4?.audit || 'Not answered'}
Go Deeper: ${data.module_4?.go_deeper || 'Not answered'}

THE MATRIX™
Reflection: ${data.module_5?.reflection || 'Not answered'}
Audit: ${data.module_5?.audit || 'Not answered'}
Go Deeper: ${data.module_5?.go_deeper || 'Not answered'}

THE TRANSITION BRIDGE™
Reflection: ${data.module_6?.reflection || 'Not answered'}
Audit: ${data.module_6?.audit || 'Not answered'}
Go Deeper: ${data.module_6?.go_deeper || 'Not answered'}

THE FINANCIAL SABOTAGE LOOP™
Reflection: ${data.module_7?.reflection || 'Not answered'}
Audit: ${data.module_7?.audit || 'Not answered'}
Go Deeper: ${data.module_7?.go_deeper || 'Not answered'}

THE WEALTH CYCLE™
Reflection: ${data.module_8?.reflection || 'Not answered'}
Audit: ${data.module_8?.audit || 'Not answered'}
Go Deeper: ${data.module_8?.go_deeper || 'Not answered'}

Write a 30-day action plan structured as:
- Week 1: 3 specific actions based on their identity and awareness answers
- Week 2: 3 specific actions based on their pattern-breaking answers
- Week 3: 3 specific actions based on their positioning and bridge answers
- Week 4: 3 specific actions based on their systems and wealth cycle answers
- 3 Non-Negotiable Commitments pulled from what they actually wrote

Reference their specific words and situations. Do not give generic advice. Every action must be tied to something they personally revealed. Be direct. Be specific. Be useful.`

    } else if (type === 'unshakeable') {
      systemPrompt = 'You are a direct, psychologically sharp performance coach. You write raw, actionable plans with zero fluff. Every sentence must be a specific action or a hard truth tied to the client\'s actual answers. Tone: like a mentor who genuinely cares but refuses to let anyone hide behind excuses. Write directly to the client in second person.'
      userPrompt = `Based on this client's Un-Shakeable™ Playbook answers, write a personalised 30-day action plan to solve their specific problem.

THE PROBLEM THEY ARE SOLVING:
${data.problem_statement || 'Not specified'}

Their answers across 5 performance rewiring frameworks applied to this problem:

THE ACTION BRIDGE™
Reflection: ${data.framework_1?.reflection || 'Not answered'}
Audit: ${data.framework_1?.audit || 'Not answered'}
Go Deeper: ${data.framework_1?.go_deeper || 'Not answered'}

THE NEGOTIATOR™
Reflection: ${data.framework_2?.reflection || 'Not answered'}
Audit: ${data.framework_2?.audit || 'Not answered'}
Go Deeper: ${data.framework_2?.go_deeper || 'Not answered'}

THE THREE DIALS™ — NEGATIVE BEHAVIOURS
Reflection: ${data.framework_3?.reflection || 'Not answered'}
Audit: ${data.framework_3?.audit || 'Not answered'}
Go Deeper: ${data.framework_3?.go_deeper || 'Not answered'}

THE THREE DIALS™ — POSITIVE BEHAVIOURS
Reflection: ${data.framework_4?.reflection || 'Not answered'}
Audit: ${data.framework_4?.audit || 'Not answered'}
Go Deeper: ${data.framework_4?.go_deeper || 'Not answered'}

THE IDENTITY SHIFT™
Reflection: ${data.framework_5?.reflection || 'Not answered'}
Audit: ${data.framework_5?.audit || 'Not answered'}
Go Deeper: ${data.framework_5?.go_deeper || 'Not answered'}

Write a 30-day action plan structured as:
- Week 1: 3-4 specific actions focused on execution and crossing The Action Bridge — tied to what they revealed about their procrastination and their smallest viable action
- Week 2: 3-4 specific actions focused on defeating The Negotiator and breaking negative behaviour patterns — tied to their TFL weapon and their Three Dials audit
- Week 3: 3-4 specific actions focused on installing positive behaviours and building accountability systems — tied to their positive behaviour dials and accountability mechanisms
- Week 4: 3-4 specific actions focused on identity shift and locking in The Performance Flywheel — tied to who they said they need to become and the identity shift they committed to
- Close with 3 Non-Negotiable Un-Shakeable™ Commitments pulled from what they actually wrote

Reference their specific words and situations throughout. Do not give generic advice. Every action must be tied to something they personally revealed. Be direct. Be specific. Be psychologically sharp.`

    } else if (type === 'premium-position') {
      systemPrompt = 'You are a premium brand positioning strategist. You write sharp, specific, actionable brand plans. No generic marketing advice. Every recommendation must reference the client\'s specific positioning data. Tone: expert, direct, commercially minded.'
      userPrompt = `Based on this client's Premium Position™ Blueprint, write a personalised 30-day positioning action plan.

BRAND BUCKET™ DIAGNOSIS
Gap description: ${data.bucket?.gap_description || 'Not provided'}
Visibility score: ${data.bucket?.vis_score || '?'}/20
Engagement score: ${data.bucket?.eng_score || '?'}/20
Trust score: ${data.bucket?.tru_score || '?'}/20

COLT BRAND STAR™
Brand: ${data.brand_star?.name || 'Not set'}
Who they serve: ${data.brand_star?.specific_description || 'Not set'}
Sector: ${data.brand_star?.sector || 'Not set'}
What they do: ${data.brand_star?.what_you_do || 'Not set'}
Contrarian belief: ${data.brand_star?.contrarian_belief || 'Not set'}
What they refuse: ${data.brand_star?.refuse || 'Not set'}
Values: ${(data.brand_star?.values || []).join(', ') || 'Not set'}
Personality: ${(data.brand_star?.personality || []).join(', ') || 'Not set'}

HERO FRAMEWORK
Origin: ${data.hero?.origin || 'Not set'}
Turning point: ${data.hero?.turning_point || 'Not set'}
Hard way lesson: ${data.hero?.hard_way || 'Not set'}
Gift to clients: ${data.hero?.gift || 'Not set'}
Why they do this: ${data.hero?.why || 'Not set'}
Identity label: ${data.hero?.identity_label || 'Not set'}

REMARKABLE FACTOR
Category: ${data.remarkable?.category || 'Not set'}
Unique mechanism: ${data.remarkable?.mechanism || 'Not set'}
Differentiator: ${data.remarkable?.differentiator || 'Not set'}
Provocation: ${data.remarkable?.provocation || 'Not set'}
Premium signals: ${(data.remarkable?.signals || []).join(', ') || 'None'}
Signal gaps: ${(data.remarkable?.signal_gaps || []).join(', ') || 'None'}

Write a 30-day positioning sprint:
- Week 1: Fix their primary brand leak with 3 specific actions
- Week 2: Launch their brand story with 3 content actions
- Week 3: Deploy their unique mechanism with 3 positioning actions
- Week 4: Close premium signal gaps with 3 specific actions
- 3 key positioning moves they must make this month

Reference their specific data throughout. Not generic. Commercially actionable.`

    } else if (type === 'sold-out') {
      systemPrompt = 'You are a high-ticket offer architect. You write precise, commercially viable launch plans. Every step must move the client closer to revenue. No theory. No fluff. Tone: strategic, direct, results-focused.'
      userPrompt = `Based on this client's Sold Out™ Playbook, write a personalised offer launch plan.

ICP (IDEAL CLIENT PROFILE)
Client type: ${data.icp?.client_type || 'Not set'}
Sector: ${data.icp?.sector || 'Not set'}
Specific description: ${data.icp?.specific_description || 'Not set'}
Dream outcome: ${data.icp?.dream_outcome || 'Not set'}
Trigger moment: ${data.icp?.trigger_moment || 'Not set'}
Emotional state: ${(data.icp?.emotional_state || []).join(', ') || 'Not set'}
Channels: ${(data.icp?.channels || []).join(', ') || 'Not set'}
Top pains: ${(data.icp?.pains || []).filter(Boolean).join('; ') || 'Not set'}

THE DIP (ENTRY OFFER)
Format: ${data.dip?.format || 'Not set'}
Problem: ${data.dip?.problem || 'Not set'}
Outcome: ${data.dip?.outcome || 'Not set'}
Price: £${data.dip?.price || '0'}
Duration: ${data.dip?.duration || 'Not set'}
Bridge to main offer: ${data.dip?.bridge || 'Not set'}
Belief to create: ${data.dip?.belief_to_create || 'Not set'}

BANG BANG OFFER (MAIN OFFER)
Name: ${data.bang_bang?.name || 'Not set'}
Promise: ${data.bang_bang?.promise || 'Not set'}
Price: £${data.bang_bang?.price || '0'}
Stack value: £${data.bang_bang?.stack_value || '0'}
Duration: ${data.bang_bang?.duration || 'Not set'}
Unique mechanism: ${data.bang_bang?.unique_mechanism || 'Not set'}
Guarantees: ${(data.bang_bang?.guarantees || []).join(', ') || 'None'}
Delivery: ${(data.bang_bang?.delivery_model || []).join(', ') || 'Not set'}
Continuity: ${data.bang_bang?.continuity_offer || 'Not set'} at £${data.bang_bang?.continuity_price || '0'}

SIGNATURE FRAMEWORK
Name: ${data.framework?.framework_name || 'Not set'}
Pillars: ${(data.framework?.pillars || []).filter(p => p.name).map(p => p.name).join(', ') || 'Not set'}

Write a 30-day offer launch plan:
- Week 1: Content strategy — 3 specific actions targeting their ICP's pains and trigger moments on their channels
- Week 2: Dip launch — 3 specific actions to get their entry offer live and generating buyers
- Week 3: Bridge sequence — 3 specific actions to nurture Dip buyers toward the main offer
- Week 4: Main offer launch — 3 specific actions to present the Bang Bang Offer
- Revenue projection based on their pricing and a realistic conversion path

Reference their specific offer details, ICP data, and pricing throughout. Make it a plan they can execute immediately.`
    }

    if (!systemPrompt) {
      return NextResponse.json({ error: 'Unknown plan type' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ plan: text })
  } catch (err) {
    console.error('Generate plan error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate plan' }, { status: 500 })
  }
}

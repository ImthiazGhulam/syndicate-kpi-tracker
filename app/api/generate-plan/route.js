import { NextResponse } from 'next/server'

async function callAnthropicAPI(system, user, maxTokens = 2500) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
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
export const maxDuration = 120

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
      const startDate = data.start_date || new Date().toISOString().split('T')[0]
      const duration = data.duration || 7

      systemPrompt = `You are a direct, psychologically sharp performance coach. You create specific, time-bound action plans. No fluff. Every task must be tied to the client's actual answers. Respond ONLY with valid JSON — no markdown, no code fences, no explanation outside the JSON.`
      userPrompt = `Based on this client's Performance Flywheel™ Playbook answers, create a structured ${duration}-day action plan to solve their specific problem.

THE PROBLEM THEY ARE SOLVING:
${data.problem_statement || 'Not specified'}

Their answers across 5 performance rewiring frameworks (in flywheel order):

1. THE IDENTITY SHIFT™
Reflection: ${data.framework_1?.reflection || 'Not answered'}
Audit: ${data.framework_1?.audit || 'Not answered'}
Go Deeper: ${data.framework_1?.go_deeper || 'Not answered'}

2. THE THREE DIALS™ — POSITIVE BEHAVIOURS (Environment)
Reflection: ${data.framework_2?.reflection || 'Not answered'}
Audit: ${data.framework_2?.audit || 'Not answered'}
Go Deeper: ${data.framework_2?.go_deeper || 'Not answered'}

3. THE THREE DIALS™ — NEGATIVE BEHAVIOURS
Reflection: ${data.framework_3?.reflection || 'Not answered'}
Audit: ${data.framework_3?.audit || 'Not answered'}
Go Deeper: ${data.framework_3?.go_deeper || 'Not answered'}

4. THE NEGOTIATOR™
Reflection: ${data.framework_4?.reflection || 'Not answered'}
Audit: ${data.framework_4?.audit || 'Not answered'}
Go Deeper: ${data.framework_4?.go_deeper || 'Not answered'}

5. THE ACTION BRIDGE™
Reflection: ${data.framework_5?.reflection || 'Not answered'}
Audit: ${data.framework_5?.audit || 'Not answered'}
Go Deeper: ${data.framework_5?.go_deeper || 'Not answered'}

The plan starts on ${startDate}. Generate exactly ${duration} days of tasks starting from that date. Each day gets 1-2 tasks. Tasks should be concrete actions they can complete in a single sitting.

Early days: focus on The Identity Shift — who they need to become, and installing the right positive behaviours and environment.
Middle days: focus on removing negative behaviours using The Three Dials and defeating The Negotiator's TFL weapons.
Final days: focus on The Action Bridge — crossing the gap, executing, and locking the flywheel in place with accountability.

Respond with ONLY this JSON structure:
{
  "tasks": [
    {
      "title": "Short task title (max 60 chars)",
      "description": "2-3 sentences explaining what to do and why, referencing their specific answers",
      "day_offset": 0,
      "scheduled_time": "09:00",
      "duration_minutes": 20
    }
  ],
  "summary": "One paragraph summary of what this plan will achieve for them specifically"
}

day_offset is 0 for start date, 1 for next day, etc. scheduled_time in HH:MM 24h format. duration_minutes between 10-45.
Reference their specific words. Every task must tie to something they revealed. Be direct and psychologically sharp.`

    } else if (type === 'ai-accelerator') {
      const level = data.comfort_level || 1
      const levelDesc = level === 1 ? 'Complete newbie — needs a single copy-paste prompt' : level === 2 ? 'Getting started — can follow multi-step workflows' : level === 3 ? 'Comfortable — can use Zapier/Make automations' : 'Ready to build — can use Claude Code'

      systemPrompt = `You build practical AI tools for coaches, consultants, and service providers who have NEVER used AI before. Write instructions so detailed that a child could follow them. No jargon. No assumptions. Every single click, every single action, spelled out. The client's AI comfort level is: ${levelDesc}. Respond ONLY with valid JSON — no markdown, no code fences.`
      userPrompt = `Build an AI tool for this person based on their answers.

THEIR PROBLEM: ${data.problem_statement || 'Not specified'}

WHAT THEY DO MANUALLY RIGHT NOW:
${data.manual_process || 'Not described'}

WHAT THE PERFECT RESULT LOOKS LIKE:
${data.ideal_output || 'Not described'}

WHERE IT CURRENTLY BREAKS:
${data.where_it_breaks || 'Not described'}

AI COMFORT LEVEL: ${level} (${levelDesc})

Generate a complete AI tool. Return this exact JSON structure:
{
  "prompt": "A complete, ready-to-use prompt they can paste into Claude. Include clear Role, Context, and Output sections. Make it hyper-specific to their exact problem using their own words. Include placeholders in [SQUARE BRACKETS] for any information they need to fill in each time they use it (e.g. [CLIENT NAME], [THEIR SPECIFIC PROBLEM]). Add a note at the end of the prompt explaining what each placeholder means.",
  "sop": {
    "tool_recommendation": "Use Claude at claude.ai — it's the most capable AI for this type of task because [specific reason related to their use case].",
    "steps": [
      "EVERY step must be incredibly detailed. Write them as if the person has never used a computer before. Here is the level of detail required:",
      "Step 1: Open your web browser (Safari, Chrome, or whatever you use to go on the internet). In the address bar at the top, type claude.ai and press Enter. If you don't have an account yet, click 'Sign Up' and create one using your email address. If you already have one, click 'Log In'.",
      "Step 2: Once you're logged in, you'll see a text box at the bottom of the screen that says 'Message Claude'. This is where you'll paste your prompt. Click on that box so your cursor is blinking inside it.",
      "Step 3: Now go back to The Motherboard and find your prompt above. Click the 'Copy' button next to it. Go back to the Claude tab in your browser. Right-click inside the text box and select 'Paste' (or press Ctrl+V on Windows / Cmd+V on Mac).",
      "Step 4: Before you press Enter, look for any text in [SQUARE BRACKETS] in the prompt. Replace each one with your actual information. For example, replace [CLIENT NAME] with your client's real name. Delete the square brackets too.",
      "Step 5: Once all brackets are replaced with real information, press Enter (or click the send arrow). Claude will start writing your [specific output type]. Wait for it to finish — it usually takes 10-30 seconds.",
      "Step 6: Read through what Claude wrote. If it's good, copy the whole thing (click and drag to select all the text, then right-click and 'Copy'). If something isn't quite right, type underneath: 'Can you change [what you want different]' and press Enter again — Claude will revise it.",
      "Step 7: Paste the final result into [where they need to use it — be specific, e.g. 'a new email in Gmail', 'a Google Doc', 'your WhatsApp message to the client']. Done."
    ]
  },
  "test_task": {
    "title": "One specific thing to try tomorrow (max 60 chars)",
    "description": "Be extremely specific. Name the exact action: 'Take your next client enquiry that comes in tomorrow. Instead of writing the reply yourself, open Claude, paste in your prompt, fill in the brackets with their details, and let Claude write the reply. Compare it to what you would have written. You'll be shocked how good it is — and how fast it was.'"
  }${level >= 4 ? `,
  "build_guide": {
    "what_to_build": "One sentence describing the tool they'll build",
    "steps": [
      "Step 1 — Get Claude Code: Go to claude.ai/download in your web browser. Download the Claude Code desktop app for your computer (Mac or Windows). Once it downloads, open the file and install it like any other app — drag it to Applications on Mac, or click Install on Windows.",
      "Step 2 — Open it: Find Claude Code in your apps and open it. It looks like a dark window with a text box at the bottom. If it asks you to sign in, use the same account you use for claude.ai. You only need to do this once.",
      "Step 3 — Tell it what to build: Click in the text box at the bottom and describe what you want in plain English. Be specific. For example: 'I want you to build me a simple tool that takes a client's name and their problem, and generates a personalised proposal email in my tone of voice. Here's an example of how I write: [paste an example email].' The more detail you give, the better the result.",
      "Step 4 — Let it work: Claude Code will start building. You'll see it writing code and creating files. Don't panic — you don't need to understand the code. It will ask you questions as it goes, like 'Should I add a button for this?' or 'What colour scheme do you want?' Just answer in plain English. If it asks to create or edit a file, say 'yes'.",
      "Step 5 — Test it: When Claude Code says it's done, it will tell you how to see what it built. Usually it will say something like 'Open your browser and go to localhost:3000'. Just follow what it says. You'll see your tool. Click around. Try it with real information from your business.",
      "Step 6 — Fix and refine: If something isn't quite right — the wording is off, a button is in the wrong place, you want to add something — just type what you want changed. 'Make the heading bigger', 'Change the button colour to gold', 'Add a field for the client's phone number'. Claude Code will make the change instantly. Keep going until it's exactly what you want.",
      "Step 7 — Get help deploying: Once you're happy with it, tell Claude Code: 'Help me deploy this so I can access it from any device.' It will walk you through putting it online. If you get stuck at this step, message your coach — this is the one part that might need a hand the first time."
    ]
  }` : ''}
}

CRITICAL RULES:
- The SOP steps must be so detailed that someone who has NEVER used AI could follow them without asking a single question. Spell out every click, every action, every screen they'll see.
- The prompt must reference their SPECIFIC problem, their SPECIFIC process, their SPECIFIC words. Not generic.
- Include [SQUARE BRACKET] placeholders in the prompt for anything that changes each time they use it, and explain what each placeholder means.
- The test task must name ONE specific real-world scenario they can try tomorrow — not vague, not "try it with a client", but "take your next [specific thing from their process] and run it through Claude instead of doing it manually".
- For the SOP, tell them exactly where to find Claude (claude.ai), exactly where to click, exactly where to paste, exactly what to do with the output.${level >= 3 ? ' For Level 3+, also include automation suggestions (e.g. connecting with Zapier/Make) as additional steps.' : ''}`

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

    } else if (type === 'bounce-back') {
      systemPrompt = 'You are a direct, no-nonsense resilience coach inspired by David Goggins. You write raw, honest, actionable recovery plans. No fluff, no motivational filler. Every sentence must be a specific action or a hard truth tied to what the client actually wrote. Tone: like a mentor who genuinely cares but refuses to let you stay in the pit. You understand the LARCC framework — Look back, Acknowledge, Recognize, Climb out, Consolidate. IMPORTANT: This framework applies to ANY area of life — business, family, health, relationships, personal crises — whatever the client is dealing with. Tailor your plan to the specific domain of their setback. Do not assume it is business-related unless their answers clearly indicate that.'
      userPrompt = `Based on this client's BounceBackAbility™ LARCC framework answers, write a personalised recovery and growth plan.

Their answers across 5 resilience modules:

LOOK BACK (Were you unlucky or not paying attention?)
Q1 - The situation: ${data.module_1?.q1 || 'Not answered'}
Q2 - Red flags ignored: ${data.module_1?.q2 || 'Not answered'}
Q3 - Where focus slipped: ${data.module_1?.q3 || 'Not answered'}
Q4 - Distractions allowed: ${data.module_1?.q4 || 'Not answered'}
Q5 - Future self advice: ${data.module_1?.q5 || 'Not answered'}

ACKNOWLEDGE (What role did you knowingly play?)
Q1 - Their role: ${data.module_2?.q1 || 'Not answered'}
Q2 - Decisions made/avoided: ${data.module_2?.q2 || 'Not answered'}
Q3 - Warnings dismissed: ${data.module_2?.q3 || 'Not answered'}
Q4 - Story vs truth: ${data.module_2?.q4 || 'Not answered'}
Q5 - Control assessment: ${data.module_2?.q5 || 'Not answered'}

RECOGNIZE (How bad has it got?)
Q1 - Health impact: ${data.module_3?.q1 || 'Not answered'}
Q2 - Productivity impact: ${data.module_3?.q2 || 'Not answered'}
Q3 - Relationship impact: ${data.module_3?.q3 || 'Not answered'}
Q4 - Financial impact: ${data.module_3?.q4 || 'Not answered'}
Q5 - Emotional trigger: ${data.module_3?.q5 || 'Not answered'}

CLIMB OUT (What actions need to be taken?)
Q1 - This week's actions: ${data.module_4?.q1 || 'Not answered'}
Q2 - Systems to restart: ${data.module_4?.q2 || 'Not answered'}
Q3 - Conversations needed: ${data.module_4?.q3 || 'Not answered'}
Q4 - Highest leverage fix: ${data.module_4?.q4 || 'Not answered'}
Q5 - 30-day routine: ${data.module_4?.q5 || 'Not answered'}

CONSOLIDATE (What will you do differently?)
Q1 - Prevention plan: ${data.module_5?.q1 || 'Not answered'}
Q2 - New systems/boundaries: ${data.module_5?.q2 || 'Not answered'}
Q3 - Self-knowledge gained: ${data.module_5?.q3 || 'Not answered'}
Q4 - Weapon forged: ${data.module_5?.q4 || 'Not answered'}
Q5 - Message to future self: ${data.module_5?.q5 || 'Not answered'}

Write a 30-day BounceBackAbility™ recovery plan structured as:
- Week 1 — STABILISE: 3 specific actions to stop the bleeding, based on their Look Back and Acknowledge answers. Address the red flags they identified and the role they played.
- Week 2 — REBUILD: 3 specific actions to repair the damage they identified in Recognize. Hit their health, productivity, relationships, and finances directly.
- Week 3 — ACCELERATE: 3 specific actions from their Climb Out answers. Use the exact systems and conversations they identified. Build on the momentum they named.
- Week 4 — FORTIFY: 3 specific actions from their Consolidate answers. Lock in the new systems, boundaries, and prevention measures so this never happens again.
- 3 Non-Negotiable Commitments pulled from what they actually wrote — the three things that, if they do nothing else, will break the cycle.

End with their own message to their future self (from Consolidate Q5) as a reminder of who they are becoming.

Reference their specific words and situations throughout. Do not give generic advice. Every action must be tied to something they personally revealed. Be direct. Be specific. Be useful. This person needs to bounce back — help them weaponize this setback.`

    } else if (type === 'distinction-pillars') {
      const b = data.brand?.brand_star || {}
      const brandContext = b.name ? `
BRAND VOICE CONTEXT (from their Premium Position™ Blueprint):
Brand: ${b.name || ''}
Personality traits: ${(b.personality || []).join(', ') || 'Not set'}
Values: ${(b.values || []).join(', ') || 'Not set'}
Who they serve: ${b.specific_description || b.client_type || ''}
What they do: ${b.what_you_do || ''}
Contrarian belief: ${b.contrarian_belief || ''}
Sector: ${b.sector || ''}

IMPORTANT: All suggested names MUST align with their brand personality and values above. If they are bold and direct, the names should be bold and direct. If they are warm and nurturing, reflect that. Match the energy of their brand.` : ''

      systemPrompt = 'You are a brand positioning expert who creates premium, memorable pillar names for coaching and consulting frameworks. Respond ONLY with valid JSON — no markdown, no code fences.'
      userPrompt = `A coach/consultant in the "${data.niche || 'coaching'}" space solves three core problems:

1. ${data.problem_1}
2. ${data.problem_2}
3. ${data.problem_3}
${brandContext}

For each problem, suggest 3 branded pillar names. These should be:
- One word or short phrase (1-3 words max)
- Clear, memorable, premium-sounding
- Specific to their niche
- Easy to explain on a sales call
- Aligned with their brand voice and personality

Respond with ONLY this JSON:
{
  "pillar_1": ["Name A", "Name B", "Name C"],
  "pillar_2": ["Name A", "Name B", "Name C"],
  "pillar_3": ["Name A", "Name B", "Name C"]
}`

      const msg = await callAnthropicAPI(systemPrompt, userPrompt, 500)
      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        return NextResponse.json({ suggestions: JSON.parse(cleaned) })
      } catch { return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 }) }

    } else if (type === 'distinction-mechanisms') {
      const b = data.brand?.brand_star || {}
      const brandContext = b.name ? `
BRAND VOICE CONTEXT:
Brand: ${b.name || ''} | Personality: ${(b.personality || []).join(', ') || 'Not set'} | Values: ${(b.values || []).join(', ') || 'Not set'}
Contrarian belief: ${b.contrarian_belief || ''} | Sector: ${b.sector || ''}
IMPORTANT: All mechanism names MUST match this brand's tone and energy.` : ''

      systemPrompt = 'You are a brand positioning expert who creates unique mechanism names — branded, ownable names for specific methods and processes. Respond ONLY with valid JSON — no markdown, no code fences.'
      const solutionLines = data.solutions.map(s => `Pillar "${s.pillarName}" — Solution ${s.slot}: ${s.solution}`).join('\n')
      userPrompt = `A coach/consultant in the "${data.niche || 'coaching'}" space has these solutions under their pillars:

${solutionLines}
${brandContext}

For each solution, suggest 3 unique mechanism names. A unique mechanism is a branded name for a specific method (e.g. "Instagram profile visit ad" becomes "Growth Tax Ads"). They should be:
- 2-4 words
- Memorable and ownable
- Sound like proprietary IP
- Premium and specific
- Aligned with their brand voice

Respond with ONLY this JSON where keys are "pillar_slot" format:
{
  "1_1": ["Name A", "Name B", "Name C"],
  "1_2": ["Name A", "Name B", "Name C"],
  "1_3": ["Name A", "Name B", "Name C"],
  "2_1": ["Name A", "Name B", "Name C"],
  "2_2": ["Name A", "Name B", "Name C"],
  "2_3": ["Name A", "Name B", "Name C"],
  "3_1": ["Name A", "Name B", "Name C"],
  "3_2": ["Name A", "Name B", "Name C"],
  "3_3": ["Name A", "Name B", "Name C"]
}`

      const msg = await callAnthropicAPI(systemPrompt, userPrompt, 1000)
      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        return NextResponse.json({ suggestions: JSON.parse(cleaned) })
      } catch { return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 }) }

    } else if (type === 'distinction-name') {
      const b = data.brand?.brand_star || {}
      const brandCtx = b.name ? `Brand personality: ${(b.personality || []).join(', ')} | Values: ${(b.values || []).join(', ')} | Contrarian belief: ${b.contrarian_belief || ''}. Names MUST match this brand energy.` : ''

      systemPrompt = 'You are a brand naming expert who creates ownable, premium system names for coaches, consultants, and service providers. Respond ONLY with valid JSON — no markdown, no code fences.'
      userPrompt = `A coach/consultant needs a creative name for their complete signature system (their "Distinction Engine").

Their promise: "${data.promise}"
Their three pillars: ${data.pillar_1}, ${data.pillar_2}, ${data.pillar_3}
Their niche: ${data.niche || 'coaching'}
${brandCtx}

Suggest 5 creative names for this system. These should:
- Sound like premium intellectual property
- Be 2-4 words
- Feel ownable and hard to ignore
- Reflect the transformation/promise they deliver
- Work in a sentence like "I use my [NAME] to help clients..."
- End with a power word like System, Method, Engine, Framework, Blueprint, Architecture, Protocol, Code, Formula, Matrix

Respond with ONLY this JSON:
["Name One", "Name Two", "Name Three", "Name Four", "Name Five"]`

      const msg = await callAnthropicAPI(systemPrompt, userPrompt, 300)
      const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        return NextResponse.json({ suggestions: JSON.parse(cleaned) })
      } catch { return NextResponse.json({ error: 'Failed to parse suggestions' }, { status: 500 }) }

    } else if (type === 'distinction-engine') {
      const b = data.brand?.brand_star || {}
      const h = data.brand?.hero || {}
      const brandBlock = b.name ? `
BRAND VOICE (from their Premium Position™ Blueprint):
Brand: ${b.name || ''} | Personality: ${(b.personality || []).join(', ') || 'Not set'} | Values: ${(b.values || []).join(', ') || 'Not set'}
Who they serve: ${b.specific_description || ''} | Sector: ${b.sector || ''}
What they do: ${b.what_you_do || ''} | Contrarian belief: ${b.contrarian_belief || ''}
Identity label: ${h.identity_label || ''} | Why they do this: ${h.why || ''}
IMPORTANT: The narrative MUST be written in this person's brand voice. Match their personality traits and values. If they are bold and direct, write bold and direct. If they are warm, write warm. The narrative should sound like THEM, not generic copywriting.
` : ''

      systemPrompt = 'You are a premium brand strategist and copywriter. You create compelling intellectual property frameworks for coaches, consultants, and service providers. You write with clarity, authority, and commercial intent. No fluff.'
      userPrompt = `Build a complete Distinction Engine output for this person based on their framework:
${brandBlock}

ENGINE NAME: ${data.engine_name || 'Distinction Engine'}
THE PROMISE: ${data.promise || 'Not specified'}

PILLAR 1: ${data.pillar_1}
Problem it solves: ${data.problem_1}
Unique Mechanisms:
  - ${data.mechanism_1_1} (solves: ${data.solution_1_1})
  - ${data.mechanism_1_2} (solves: ${data.solution_1_2})
  - ${data.mechanism_1_3} (solves: ${data.solution_1_3})

PILLAR 2: ${data.pillar_2}
Problem it solves: ${data.problem_2}
Unique Mechanisms:
  - ${data.mechanism_2_1} (solves: ${data.solution_2_1})
  - ${data.mechanism_2_2} (solves: ${data.solution_2_2})
  - ${data.mechanism_2_3} (solves: ${data.solution_2_3})

PILLAR 3: ${data.pillar_3}
Problem it solves: ${data.problem_3}
Unique Mechanisms:
  - ${data.mechanism_3_1} (solves: ${data.solution_3_1})
  - ${data.mechanism_3_2} (solves: ${data.solution_3_2})
  - ${data.mechanism_3_3} (solves: ${data.solution_3_3})

Write TWO sections:

SECTION 1 — ${data.engine_name || 'DISTINCTION ENGINE'} (COMPILED)
Title this section with their engine name. Lay out the complete framework in a clean, structured format. Lead with the promise, then show the three pillars with their mechanisms underneath. Make it look like premium intellectual property that belongs on a sales page or keynote slide.

SECTION 2 — NARRATIVE EXPLANATION
Write a compelling narrative they can use in sales calls, bios, webinars, presentations, and content. It should explain what they do, how their ${data.engine_name || 'system'} works, and why their method is different. Write it in first person ("I help..."). Reference the engine name, the promise, all three pillar names, and the mechanism names naturally. Make it sound natural, confident, and commercially powerful — not robotic. Keep it under 300 words.

Use their engine name "${data.engine_name || 'Distinction Engine'}" throughout. This is THEIR framework — make it sound owned, structured, and hard to ignore.`
    }

    // ── Sold Out v2 — Per-Stage AI ────────────────────────────────────────

    else if (type === 'sold-out-niche-research') {
      const sector = data.icp?.sector || 'coaching'
      const desc = data.icp?.specific_description || ''
      const pyramid = data.icp?.pyramid_level || ''
      const target = data.icp?.target_level || ''
      systemPrompt = 'You are a market research expert specialising in coaching, consulting, and service-based businesses. You provide specific, data-informed insights about niche markets — not generic advice. Reference real trends, buyer behaviours, and market dynamics. Be direct and commercially useful.'
      userPrompt = `Research this niche and provide targeted insights for building a premium offer:

NICHE/SECTOR: ${sector}
DESCRIPTION: ${desc || 'Not provided'}
CURRENT CLIENT LEVEL: ${data.icp?.current_clients_level || 'Not specified'}
PYRAMID TARGET: ${target || 'Stalling/Thriving'}

Provide specific, targeted research on:

1. **TYPICAL DEMOGRAPHICS** — Age ranges, gender split, income levels, geography, and life stage of buyers in this niche who are at the ${target || 'stalling/thriving'} level. Be specific to this market.

2. **PSYCHOGRAPHIC PROFILE** — What drives buyers in this space? Their values, beliefs, fears, desires, emotional state, and buying triggers. What's their internal narrative? What do they tell themselves at 2am?

3. **TOP 5 PAIN POINTS** — The specific, non-generic problems people at the ${target || 'stalling/thriving'} level face in this niche. Not "they struggle with mindset" — be precise about what keeps them stuck.

4. **BUYING BEHAVIOUR** — How do people in this niche typically make purchasing decisions? What objections do they have? What social proof do they need? Where do they hang out?

5. **VERTICAL NICHE OPPORTUNITY** — If they're currently working with ${data.icp?.current_clients_level || 'lower-level'} clients, what does the next level up look like? What changes about the service, pricing, and positioning?

6. **MARKET SOPHISTICATION** — How aware is this market of solutions like theirs? What language resonates? What's overused and what's underused?

${pyramid === 'dying' || pyramid === 'surviving' ? '\n7. **LEVEL-UP RECOMMENDATION** — They selected ' + pyramid + ' clients. Explain specifically why targeting stalling/thriving clients would be more profitable and sustainable, and what would need to change about their positioning.\n' : ''}

Be specific to the ${sector} space. No generic coaching advice. Every insight should be something they can act on.`

    } else if (type === 'sold-out-promise-refine') {
      const brand = data.brand?.brand_star || {}
      const brandVoice = brand.personality ? `\nBRAND PERSONALITY: ${(brand.personality || []).join(', ')}\nVALUES: ${(brand.values || []).join(', ')}\nWHAT THEY DO: ${brand.what_you_do || ''}\nCONTRARIAN BELIEF: ${brand.contrarian_belief || ''}` : ''
      systemPrompt = 'You are a premium offer positioning expert. You write promises that are crystal clear, tangible, and impossible to misunderstand. A 6-year-old should be able to understand the transformation. No fluffy mindset language — concrete, measurable outcomes.'
      userPrompt = `Sharpen this promise so it's crystal clear and tangible:

CURRENT PROMISE: ${data.icp?.promise || 'Not written yet'}
SECTOR: ${data.icp?.sector || 'Not specified'}
TARGET CLIENT: ${data.icp?.specific_description || 'Not specified'}
PYRAMID LEVEL: ${data.icp?.target_level || data.icp?.pyramid_level || 'Not specified'}
DREAM OUTCOME: ${data.icp?.dream_outcome || 'Not specified'}
TOP PAINS: ${(data.icp?.pains || []).filter(Boolean).join(', ') || 'Not specified'}
${brandVoice}

Provide:

1. **3 ALTERNATIVE PROMISES** — Each one crystal clear. "He used to be X, now he's Y." Make the before/after undeniable. Match their brand voice if provided.

2. **WHY EACH WORKS** — Brief explanation of what makes each promise compelling for their specific market.

3. **PROMISE FORMULA** — Show them the structure: "I help [specific person] go from [specific pain/before] to [specific result/after] in [timeframe] using [mechanism/method]."

4. **RED FLAGS TO AVOID** — If their current promise uses vague language (mindset, identity, structure, alignment), explain why it doesn't land and what to replace it with.

Be direct. Be specific. Match their energy.`

    } else if (type === 'sold-out-path-suggest') {
      systemPrompt = 'You are a programme design expert for coaches and consultants. You create structured client journeys with clear milestones that build momentum and create quick wins. Think like Taki Moore — tactical first, strategic second, scale third.'
      userPrompt = `Suggest milestones and timelines for this programme:

PROMISE: ${data.icp?.promise || 'Not specified'}
SECTOR: ${data.icp?.sector || 'Not specified'}
TARGET CLIENT: ${data.icp?.specific_description || 'Not specified'}
PYRAMID LEVEL: ${data.icp?.target_level || 'Not specified'}
CURRENT DURATION IDEA: ${data.path_planner?.total_duration || 'Not decided'}

DISTINCTION ENGINE DATA:
${data.distinction_engine ? `Problems: ${data.distinction_engine.problem_1 || ''}, ${data.distinction_engine.problem_2 || ''}, ${data.distinction_engine.problem_3 || ''}
Pillars: ${data.distinction_engine.pillar_1 || ''}, ${data.distinction_engine.pillar_2 || ''}, ${data.distinction_engine.pillar_3 || ''}` : 'Not available'}

Suggest:

1. **RECOMMENDED TOTAL DURATION** — How long should this programme be and why?

2. **ONBOARDING (Day 0-7)** — What should happen between payment and the first call? What boring-but-necessary work gets front-loaded here? Think mindset, setup, assessments.

3. **MILESTONE 1 (First Outcome — becomes The Dip)** — What's the first tangible win? This is critical — it must be achievable in 4-6 weeks and impressive enough to sell as a standalone product. What specific deliverables should they have?

4. **MILESTONE 2 (Mid-term)** — What's the next major checkpoint? What gets launched, tested, or proven here?

5. **EXTENDED PROGRAMME** — What happens after the initial milestones? How do the remaining pillars get covered?

6. **EDUCATION LEVERAGE** — Where can pre-built education (courses, templates, playbooks) do the heavy lifting so coaching time is used for personalisation?

Base this on their specific niche and the problems their Distinction Engine identified. Not generic.`

    } else if (type === 'sold-out-bangbang-draft') {
      const brand = data.brand?.brand_star || {}
      const hero = data.brand?.hero || {}
      const de = data.distinction_engine || {}
      systemPrompt = `You are an expert high-ticket offer copywriter who writes in the style of Taki Moore's Black Belt sales documents. You write compelling, personal, story-driven offer pages that feel like a conversation — not a sales pitch. The tone should be confident, direct, human, and warm. Use short paragraphs. Use bullet points for lists. Create urgency without being pushy.${brand.personality ? ` Match this brand personality: ${(brand.personality || []).join(', ')}.` : ''}`
      userPrompt = `Write a complete Bang Bang Offer document for this coach/consultant. Model it on Taki Moore's Black Belt offer structure.

THE OFFER:
Name: ${data.bang_bang?.name || 'Not named'}
Promise: ${data.bang_bang?.promise || data.icp?.promise || 'Not specified'}

WHO IT'S FOR:
${data.bang_bang?.who_for || 'Not specified'}

WHO IT'S NOT FOR:
${data.bang_bang?.who_not_for || data.icp?.who_not_for || 'Not specified'}

THE PLAN/PHASES:
${(data.bang_bang?.phases || []).filter(p => p.name).map((p, i) => `Phase ${i + 1}: ${p.name} (${p.duration}) — ${p.description}. Outcome: ${p.outcome}`).join('\n') || 'Not specified'}

VALUE STACK:
${(data.bang_bang?.stack || []).filter(s => s.component).map(s => `- ${s.component} (Value: £${s.value || '?'}) — ${s.description}`).join('\n') || 'Not specified'}

PRICING:
Total: £${data.bang_bang?.price || '?'}
Staggered payments: ${(data.bang_bang?.staggered_payments || []).filter(p => p.amount).map(p => `${p.month}: £${p.amount}`).join(', ') || 'Not specified'}
Pay-in-full discount: ${data.bang_bang?.pay_in_full_discount || 'Not specified'}

BONUSES:
${(data.bang_bang?.bonuses || []).filter(b => b.name).map(b => `- ${b.name} (Value: £${b.value || '?'}) — ${b.description}`).join('\n') || 'None'}

GUARANTEE:
Type: ${data.bang_bang?.guarantee_type || 'Not specified'}
Detail: ${data.bang_bang?.guarantee_detail || 'Not specified'}
Duration: ${data.bang_bang?.guarantee_duration || 'Not specified'}

URGENCY & SCARCITY:
Scarcity: ${data.bang_bang?.scarcity || 'Not specified'}
Urgency: ${data.bang_bang?.urgency || 'Not specified'}
Intake model: ${data.bang_bang?.intake_model ? 'Yes' : 'No'}

SOCIAL PROOF:
${data.bang_bang?.big_names || 'Not specified'}
${data.bang_bang?.results_numbers || ''}
Types: ${(data.bang_bang?.social_proof || []).join(', ') || 'None'}

DELIVERY:
Model: ${(data.bang_bang?.delivery_model || []).join(', ') || 'Not specified'}
Touch points: ${(data.bang_bang?.touch_points || []).join(', ') || 'Not specified'}

CONTINUITY:
${data.bang_bang?.continuity_offer || 'Not specified'} — ${data.bang_bang?.continuity_format || ''} at £${data.bang_bang?.continuity_price || '?'}/month

TIERS:
${(data.bang_bang?.tiers || []).filter(t => t.name).map(t => `${t.name}: ${t.range} — ${t.description}`).join('\n') || 'Single tier'}

CTA: ${data.bang_bang?.cta_action || 'Apply'}

DISTINCTION ENGINE:
Engine name: ${de.engine_name || 'Not set'}
Pillars: ${de.pillar_1 || ''}, ${de.pillar_2 || ''}, ${de.pillar_3 || ''}

BRAND VOICE:
${brand.name ? `Brand: ${brand.name}` : ''}
${brand.personality ? `Personality: ${(brand.personality || []).join(', ')}` : ''}
${brand.contrarian_belief ? `Contrarian belief: ${brand.contrarian_belief}` : ''}
${hero.origin ? `Origin story: ${hero.origin}` : ''}
${hero.turning_point ? `Turning point: ${hero.turning_point}` : ''}
${hero.gift ? `Gift to clients: ${hero.gift}` : ''}

COMMUNICATION:
Daily: ${(data.comms?.daily || []).join(', ') || 'Not set'}
1:1 calls: ${data.comms?.calls_1_1 || 'Not set'}
Group calls: ${data.comms?.group_calls || 'Not set'}
Events: ${data.comms?.events || 'Not set'}
Workshops: ${data.comms?.workshops || 'Not set'}

Write the COMPLETE offer document. Structure it like Taki Moore's Black Belt:
1. Personal hook — "I'm going to work with a handful of [their people] to [promise]"
2. "Here's what we're doing..." — overview of the plan
3. Credibility — their story, results, social proof
4. "This won't work for you if..." / "But if you..." lists
5. The plan broken into phases with clear outcomes
6. "We make it easy to get started" — pricing, payment plan
7. Guarantee — make it feel like zero risk
8. QuickFacts™ — tiers if applicable
9. Qualification criteria
10. CTA — "Step 1: [action]. Step 2: We'll review..."
11. P.S. — bonus teaser

Write in first person. Keep it conversational. Use their brand voice. Make it feel like a letter from someone who genuinely wants to help.`

    } else if (type === 'sold-out-dip-draft') {
      const brand = data.brand?.brand_star || {}
      systemPrompt = `You are an expert micro-offer copywriter. You write compelling, short-form sales pages for entry-level offers that bridge to a premium programme. Style: conversational, direct, warm. Like Taki Moore but for the first milestone only.${brand.personality ? ` Match this brand personality: ${(brand.personality || []).join(', ')}.` : ''}`
      userPrompt = `Write a Micro Offer (The Dip) sales document:

THE DIP:
Name: ${data.dip?.name || 'Not named'}
Promise: ${data.dip?.promise || data.path_planner?.milestone_1?.promise || 'Not specified'}
Problem it solves: ${data.dip?.problem || 'Not specified'}
Outcome: ${data.dip?.outcome || 'Not specified'}
Format: ${data.dip?.format || 'Not specified'}
Duration: ${data.dip?.duration || 'Not specified'}
Price: £${data.dip?.price || '?'}

BONUSES:
${(data.dip?.bonuses || []).filter(b => b.name).map(b => `- ${b.name} (£${b.value || '?'}) — ${b.description}`).join('\n') || 'None'}

GUARANTEE:
${data.dip?.guarantee_type || 'Not specified'} — ${data.dip?.guarantee_detail || ''}

BRIDGE TO MAIN OFFER:
${data.dip?.bridge_to_main || 'Not specified'}

BELIEF TO CREATE:
${data.dip?.belief_to_create || 'Not specified'}

MAIN OFFER CONTEXT:
Main offer name: ${data.bang_bang?.name || 'Not named'}
Main offer price: £${data.bang_bang?.price || '?'}
Main offer promise: ${data.bang_bang?.promise || data.icp?.promise || ''}

Write the complete micro offer document:
1. Hook — what specific problem does this solve right now?
2. "Here's the plan for the next [duration]..."
3. What they'll achieve (be specific)
4. What's included
5. Bonuses
6. Price (no payment plan — single price, low barrier)
7. Guarantee
8. Bridge tease — hint at what comes next (the main offer) without hard-selling it
9. CTA

Keep it shorter and punchier than the main offer. This should feel like an easy yes.`

    } else if (type === 'sold-out-comms-suggest') {
      systemPrompt = 'You are a programme delivery expert for coaches and consultants. You design communication plans that are sustainable for the coach and high-value for the client. Be practical and specific.'
      userPrompt = `Suggest a communication and delivery plan for this programme:

OFFER: ${data.bang_bang?.name || 'Not named'}
DURATION: ${data.path_planner?.total_duration || 'Not specified'}
DELIVERY MODEL: ${(data.bang_bang?.delivery_model || []).join(', ') || 'Not specified'}
TOUCH POINTS SELECTED: ${(data.bang_bang?.touch_points || []).join(', ') || 'None'}
SECTOR: ${data.icp?.sector || 'Not specified'}

CURRENT SETUP:
Daily comms: ${(data.comms?.daily || []).join(', ') || 'Not set'}
Async feedback: ${(data.comms?.async_feedback || []).join(', ') || 'Not set'}
1:1 calls: ${data.comms?.calls_1_1 || 'Not set'}
Group calls: ${data.comms?.group_calls || 'Not set'}
Events: ${data.comms?.events || 'Not set'}
Workshops: ${data.comms?.workshops || 'Not set'}
Education platform: ${data.comms?.education_platform || 'Not set'}

Suggest:

1. **DAILY COMMUNICATION** — What should daily touchpoints look like? WhatsApp/Slack? What's the right cadence?

2. **ASYNC FEEDBACK** — When and how should they provide feedback? Loom? Voice notes?

3. **CALL STRUCTURE** — 1:1 frequency and duration. Group call frequency. What format works best?

4. **EVENTS & WORKSHOPS** — How often? Virtual vs in-person? What topics?

5. **EDUCATION LEVERAGE** — Where should education do the heavy lifting? What platform? What content should be pre-built vs live?

6. **SUSTAINABILITY CHECK** — Is this delivery model sustainable at 10, 20, 30+ clients? What breaks first?

Be specific to their niche and offer type.`
    } else if (type === 'content-capture-structure') {
      const emailFrameworkGuides = {
        '4ps': '4 Ps FRAMEWORK (Promise → Picture → Proof → Push):\n- PROMISE: State a clear, compelling desired outcome for the reader\n- PICTURE: Get the reader to visualise themselves in the desired state — use concrete, visual language (not abstract). Make them SEE and FEEL the result\n- PROOF: Provide evidence — a client result, a testimonial, a specific number. Social proof that this works\n- PUSH: Clear call to action — tell them the exact next step',
        'nesb': 'NESB FRAMEWORK (New → Easy → Safe → Big):\n- NEW: Position this as a new method or approach — if the reader feels they\'ve already tried this, they\'ll disregard it\n- EASY: Show it\'s simple and achievable — people are put off by complexity (unless your brand is about hard work, in which case lean into that)\n- SAFE: Minimise risk — guarantees, foolproof language, evidence that this is low-risk\n- BIG: Make it feel like a massive opportunity they won\'t want to miss',
        'aida': 'AIDA FRAMEWORK (Attention → Interest → Desire → Action):\n- ATTENTION: (This will be the hook/subject line — skip it here, start from Interest)\n- INTEREST: Build on the initial attention with more detail, benefits, and intrigue\n- DESIRE: Create desire by showcasing value and how it solves their specific problems. Shift their beliefs — make them think "he\'s right, I do make that excuse"\n- ACTION: Clearly prompt the next step',
      }

      const emailTypeGuides = {
        'social-proof': 'SOCIAL PROOF EMAIL: Show your list you\'re great at what you do. Include client results, testimonials, screenshots, before/after stories. Sign off with a subtle CTA (not a hard sell). The goal is to build trust and authority.',
        'value': 'VALUE EMAIL: Share genuine value — insights, tips, a breakdown of your latest content. The bulk of your email strategy. Can reference your latest video/post with context. The goal is to give so much value they want to learn more.',
        'offer': 'OFFER EMAIL: Direct CTA inviting people to work with you. Be clear and compelling about what you\'re offering and why now. Use sparingly (1-2 per month). The goal is conversion.',
      }

      const structureGuides = {
        'yap': 'SHORT-FORM VIDEO (60 seconds max). Write the body ONLY — no hook/opening. Include: story/context (15-20 seconds), key steps or list (20-25 seconds), payoff/insight (5-10 seconds), CTA (5 seconds). Short sentences. Conversational. Written to be spoken aloud.',
        'carousel': 'CAROUSEL POST (7-10 slides). Write slides 2 onwards ONLY — no first slide hook. Include: Slides 2-3 = Story/context. Slides 4-7 = Steps or list (one per slide, concise). Slide 8-9 = Payoff/key insight. Final slide = CTA. Each slide 1-2 short sentences max.',
        'email': 'EMAIL BODY ONLY — no subject line or opening hook line.',
        'youtube': 'YOUTUBE VIDEO BODY ONLY — no title or intro hook. Include: LOOSE STRUCTURE as bullet-point talking points. Cover: the story/context, 3-5 key talking points derived from the capture, the payoff/main insight, and the CTA. Each bullet 1 sentence max. Keep it loose so they speak naturally.',
        'talking-head': 'TALKING HEAD VIDEO BODY (60-90 seconds). No opening hook. Include: story/context (1-2 bullets), 2-3 key insights or steps, the payoff (one clear takeaway), and a subtle CTA. Bullet-point talking points, not scripted. Slightly polished but conversational.',
        'photo-caption': 'PHOTO CAPTION BODY ONLY — no first line hook. Include: Story (2-3 short paragraphs, personal and raw). Key insight or steps (use line breaks or bullet points). Payoff (the lesson). CTA (question to drive comments or link direction). Under 250 words.',
      }

      let emailContext = ''
      if (data.format === 'email') {
        const fwGuide = emailFrameworkGuides[data.email_framework] || ''
        const typeGuide = emailTypeGuides[data.email_type] || ''
        emailContext = `\n\nEMAIL TYPE: ${typeGuide}\n\nCOPYWRITING FRAMEWORK TO FOLLOW:\n${fwGuide}`
      }

      systemPrompt = data.format === 'email'
        ? 'You are an expert email copywriter for coaches, consultants, and service providers. You write like a real person — short sentences, line breaks after every 1-2 sentences, conversational tone. You speak to ONE person, not a crowd. You use concrete, visual language that the reader can picture. You never write chunky paragraphs. You never use spam trigger words (free, guarantee, act now, limited time, etc.). You never sound like AI. Every line is written to get the reader to read the next line.'
        : 'You are a content strategist for coaches, consultants, and service providers. You write direct, engaging content. No fluff. No corporate speak. Write like a real person who gives genuine value. You know their brand voice, their audience, and their offer.'

      const phaseContext = data.phase_week_type ? `\n\nCONTENT PHASE CONTEXT:
This is a ${data.phase_week_type.toUpperCase()} WEEK in their content phase "${data.phase_name || ''}".
${data.phase_week_type === 'reach' ? 'REACH WEEK: Content should be bold, shareable, wide-appeal. Use contrarian takes, relatable stories, and hooks designed to be shared beyond their current audience. Prioritise virality and new eyeballs over depth.' : ''}${data.phase_week_type === 'trust' ? 'TRUST WEEK: Content should build authority and connection. Use personal stories, behind-the-scenes, deep value, client transformations, and genuine insights. Prioritise depth and relatability over reach.' : ''}${data.phase_week_type === 'sales' ? 'SALES WEEK: Content should drive conversion. Use social proof, testimonials, offer breakdowns, urgency, and clear CTAs. Position their offer as the obvious next step. Prioritise action over engagement.' : ''}` : ''

      userPrompt = `Write the BODY/STRUCTURE of this content piece. Do NOT write the hook — that will be added separately.

SOURCE MATERIAL (from their real week):
${data.captures}

${data.business_context ? `THEIR BUSINESS CONTEXT:
${data.business_context}` : ''}${phaseContext}

CTA DIRECTION: ${data.cta}

FORMAT: ${structureGuides[data.format] || structureGuides['yap']}${emailContext}

Rules:
- Do NOT include a hook, opening line, subject line, or title — start with the story/body
- Weave in the source material naturally
- Extract 3-5 actionable steps or insights
- End with a clear payoff and CTA
- Write in first person
- Be specific — use details from the source material
- If business context is provided, write as THEM
${data.format === 'email' ? `- CRITICAL EMAIL RULES:
  - Every sentence gets its own line. No chunky paragraphs.
  - Write as if you're talking to ONE friend, not a list
  - Use concrete, visual language — if you can't drop it on your foot, rewrite it
  - Keep it 300-500 words max
  - Include a PS line for urgency or personal touch
  - NEVER use these words: free, guarantee, act now, limited time, click here, congratulations, special promotion, risk-free, winner, no cost, best price
  - Follow the copywriting framework selected above — structure the body accordingly` : ''}`
    } else if (type === 'content-capture-hooks') {
      const hookFormatGuides = {
        'yap': 'These hooks will be the FIRST 3-5 SECONDS of a short-form video. They must be spoken aloud, punchy, and immediately grab attention. Write them as something someone would say direct to camera.',
        'carousel': 'These hooks will be SLIDE 1-2 of a carousel post. They must be bold, visual text that stops the scroll. Short. Provocative. Works as standalone text on an image.',
        'email': `Each hook should be TWO parts: a SUBJECT LINE (under 50 chars, curiosity-driven, NEVER use spam trigger words like free/guarantee/act now/limited time/click here/congratulations) and an OPENING LINE (the first sentence of the email that makes them keep reading — short, punchy, speaks to one person). Format as: Subject: [subject] | Opening: [first line].${data.email_type === 'social-proof' ? ' This is a social proof email — the hook should hint at a result or transformation.' : data.email_type === 'value' ? ' This is a value email — the hook should create curiosity about an insight or lesson.' : data.email_type === 'offer' ? ' This is an offer email — the hook should create urgency or desire without being spammy.' : ''}`,
        'youtube': 'Each hook should be TWO parts: a THUMBNAIL TITLE (under 8 words, uppercase-friendly, curiosity-driven) and a SPOKEN INTRO (first 15-30 seconds as a spoken script that hooks the viewer). Format as: Title: [title] | Intro: [spoken opening]',
        'talking-head': 'These hooks will be the OPENING STATEMENT delivered direct to camera. Bold, confident, slightly provocative. One sentence that makes someone stop scrolling.',
        'photo-caption': 'These hooks will be the FIRST LINE of a caption (before the "see more" fold). Must stop the scroll. Short, punchy, creates curiosity. One line only.',
      }

      const hooksPhaseContext = data.phase_week_type ? `\n\nCONTENT PHASE: This is a ${data.phase_week_type.toUpperCase()} WEEK.
${data.phase_week_type === 'reach' ? 'Hooks should be bold, shareable, and designed to reach new audiences. Prioritise contrarian, surprising, or universally relatable hooks.' : ''}${data.phase_week_type === 'trust' ? 'Hooks should draw people in with personal stories, vulnerability, or deep expertise. Prioritise curiosity and emotional connection.' : ''}${data.phase_week_type === 'sales' ? 'Hooks should create urgency or showcase results. Prioritise social proof, transformation, and desire-building.' : ''}` : ''

      systemPrompt = 'You are a content strategist for coaches, consultants, and service providers. You write scroll-stopping hooks tailored to specific content formats. No fluff. Every hook must be specific to what the person actually experienced — never generic.'
      userPrompt = `Based on this person's content structure and story, suggest 5 hooks tailored to their specific format.

THE STORY/CAPTURE:
${data.captures}

THE CONTENT STRUCTURE (already written — the hook needs to lead into this):
${data.structure || 'Not yet generated'}

${data.business_context ? `THEIR BUSINESS CONTEXT:
${data.business_context}` : ''}${hooksPhaseContext}

FORMAT-SPECIFIC HOOK REQUIREMENTS:
${hookFormatGuides[data.format] || hookFormatGuides['yap']}

HOOK TEMPLATES TO DRAW FROM:
${data.templates}

Rules:
- Each hook must be COMPLETE and ready to use
- Each hook must be tailored to the ${data.format || 'short-form'} format as described above
- The hooks must lead naturally into the content structure above
- Sound like THEM — aligned with their brand, sector, and audience
- Pick the 5 best-fitting templates and fill them in using the person's actual story
- Make them punchy, curiosity-driven, and format-appropriate
- Return ONLY the 5 hooks, one per line, numbered 1-5. No explanation.`
    } else if (type === 'content-capture') {
      const formatGuides = {
        'yap': 'SHORT-FORM VIDEO SCRIPT (60 seconds max). Write a punchy script with: opening hook (first 3 seconds grab attention), story/context (15-20 seconds), key steps or list (20-25 seconds), payoff/insight (5-10 seconds), CTA (5 seconds). Use short sentences. Conversational tone. Written to be spoken aloud.',
        'carousel': 'CAROUSEL POST (7-10 slides). Structure: Slide 1 = Hook (bold, provocative statement). Slides 2-3 = Story/context. Slides 4-7 = Steps or list (one per slide, concise). Slide 8-9 = Payoff/key insight. Final slide = CTA. Each slide should be 1-2 short sentences max. Use line breaks for readability.',
        'email': 'EMAIL. Structure: Subject line (curiosity-driven, under 50 chars). Opening line hooks the reader personally. Story section (2-3 short paragraphs, conversational). List/steps section (bullet points). Payoff paragraph (the key takeaway). CTA with clear next step. PS line for urgency or personal touch. Keep total length 300-500 words.',
        'youtube': 'YOUTUBE VIDEO. Structure:\n\n1. THUMBNAIL TITLE — Write a short, punchy title for the thumbnail (under 8 words, curiosity-driven, uppercase friendly).\n\n2. INTRO (this IS the hook) — The hook they selected is the intro. Write it out as a 15-30 second spoken intro script that hooks the viewer immediately.\n\n3. LOOSE STRUCTURE — Provide a bullet-point outline of what to cover in the video. Keep it loose (not scripted) so they can speak naturally. Include: the story/context, 3-5 key talking points derived from the capture, the payoff/main insight, and the CTA. Each bullet should be 1 sentence max — just enough to remind them what to say next.',
        'talking-head': 'TALKING HEAD VIDEO (60-90 seconds, professionally shot). Structure:\n\n1. HOOK — The selected hook delivered direct to camera as a bold opening statement.\n\n2. LOOSE STRUCTURE — Bullet-point talking points (not scripted). Include: the story/context (1-2 bullets), 2-3 key insights or steps, the payoff (one clear takeaway), and a subtle CTA. Each bullet is 1 sentence max — just enough to keep them on track while speaking naturally. Slightly more polished tone than YAP but still conversational.',
        'photo-caption': 'PHOTO CAPTION. Write a compelling caption that works with a photo. Structure: Hook (first line must stop the scroll — use line break after). Story (2-3 short paragraphs, personal and raw). Key insight or steps (use line breaks or bullet points). Payoff (the lesson). CTA (question to drive comments or link direction). Keep under 300 words.',
      }

      const needsCaption = ['yap', 'carousel', 'talking-head', 'youtube'].includes(data.format)
      const captionInstruction = needsCaption ? `\n\nAFTER the main content, add a section titled "--- CAPTION ---" and write a social media caption to accompany this post. The caption should:
- Open with a scroll-stopping first line (can reuse or rework the hook)
- Expand on the key insight or lesson in 3-5 short lines
- End with a CTA (question to drive comments, or direction to link in bio / DM)
- Use line breaks between every sentence — no chunky paragraphs
- Include 3-5 relevant hashtags at the end
- Keep it under 200 words
- Write in first person, same tone as the main content` : ''

      const finalPhaseContext = data.phase_week_type ? `\n\nCONTENT PHASE: This is a ${data.phase_week_type.toUpperCase()} WEEK.
${data.phase_week_type === 'reach' ? 'Tone should be bold and shareable. End with a CTA that encourages sharing or following.' : ''}${data.phase_week_type === 'trust' ? 'Tone should be personal and valuable. End with a CTA that deepens the relationship (comment, save, DM).' : ''}${data.phase_week_type === 'sales' ? 'Tone should be confident and conversion-focused. End with a clear CTA to take the next step (buy, book, apply).' : ''}` : ''

      systemPrompt = 'You are a content strategist for coaches, consultants, and service providers. You assemble final content pieces by combining a hook with an existing body structure. Write like a real person. No fluff. No corporate speak.'
      userPrompt = `Combine this hook with the existing content structure into one polished, final piece of content.

HOOK: ${data.hook}

EXISTING CONTENT STRUCTURE (body already written):
${data.structure || ''}

SOURCE MATERIAL (for reference):
${data.captures}

${data.business_context ? `THEIR BUSINESS CONTEXT:
${data.business_context}` : ''}${finalPhaseContext}

CTA DIRECTION: ${data.cta}

FORMAT: ${formatGuides[data.format] || formatGuides['yap']}

Rules:
- START with the hook — integrate it as the opening in the format-appropriate way
- For EMAIL: hook becomes the subject line + first line, then the body follows
- For YAP/TALKING HEAD: hook becomes the spoken opening, then the structure follows
- For YOUTUBE: hook becomes the title + spoken intro, then the loose structure follows
- For CAROUSEL: hook becomes slide 1 (and optionally slide 2), then the rest follows
- For PHOTO CAPTION: hook becomes the first line before the fold, then the body follows
- Blend the hook and structure seamlessly — don't just paste them together
- Keep the structure's content but refine the transitions so it flows naturally from the hook
- Write in first person, confident, direct tone
- The content should subtly position them as the expert without being salesy${captionInstruction}`
    }

    // ── Comeback Story™ — MAP ─────────────────────────────────────────────────
    if (type === 'comeback-map') {
      systemPrompt = `You are the story engine inside "The Comeback Story", a carousel playbook for men rebuilding after a collapse. A client picked collapse type "${data.collapse_type}" and wrote this raw story:
"""${data.dump}"""
TASK 1 — Extract. For each beat, pull what their story actually contains, quoting or closely paraphrasing THEIR words. Null only if genuinely absent. Never invent facts. Beats: opener (a reason to tell it today: anniversary, object found, message received, small milestone, or change happening now), receipt_date (exact date it became real), receipt_proof (visible proof: headline, letter, photo, message, document), line (where they decided + first 2-3 raw actions), zero (one small thing they could NOT do at the restart), graft (unglamorous work nobody clapped for), ally (who backed them), stakes (what made it bigger than them), wins (2-3 concrete provable results), chain (what was STILL hanging over them while winning), truth (the one thing their journey proves).
TASK 2 — Motifs. Exactly 3 short phrases (3-6 words) drawn from THEIR language or imagery, usable at the decision moment and again at the end. Never "line in the sand".
TASK 3 — Gaps. For each null beat (plus receipt_date if no date, opener if no reason-to-tell-today), ONE sharp second-person British question that uses details from their story to jog memory. Max 6, prioritised: receipt_date, receipt_proof, opener, chain, zero, stakes.
Respond ONLY with JSON: {"found":{"opener":null_or_string,"receipt_date":null_or_string,"receipt_proof":null_or_string,"line":null_or_string,"zero":null_or_string,"graft":null_or_string,"ally":null_or_string,"stakes":null_or_string,"wins":null_or_string,"chain":null_or_string,"truth":null_or_string},"motifs":["","",""],"questions":[{"key":"","q":"","hint":""}]}`
      userPrompt = `Analyse the story above and return the JSON.`
    }

    // ── Comeback Story™ — COMPOSE ───────────────────────────────────────────────
    if (type === 'comeback-compose') {
      const rewriteFlag = data.rewrite ? 'This is a REWRITE — take a noticeably different angle on the wording, keep all facts.' : ''
      systemPrompt = `You are the copywriter inside "The Comeback Story" carousel playbook. Compose a 10-slide story carousel for this client, built ONLY from their material. ${rewriteFlag}
COLLAPSE TYPE: ${data.collapse_type}
RAW STORY: """${data.dump}"""
MAPPED BEATS: ${JSON.stringify(data.found || {})}
GAP ANSWERS: ${JSON.stringify(data.gap_answers || {})}
THEIR MOTIF: "${data.chosen_motif}"
HOW TO WRITE IT: First compose the whole thing as ONE continuous piece of spoken narration — a man telling his story in one take — then cut it into 10 slides at the tension points. The swipe is the punctuation. Never write a slide as an isolated caption.
THE 10 CUTS: 1 CLIFFHANGER (present-tense reason to tell it today, one moment, zero backstory, end mid-tension). 2 RECEIPT (date + what caught up with them, reference their visible proof). 3 THE LINE (where they decided + raw first actions, MUST contain the motif verbatim). 4 ZERO POINT (restart with nothing, include their small humiliation, contrast: nothing vs a vision). 5 GRAFT. 6 ALLY (if alone, solitude is the point). 7 STAKES. 8 WINS (named plainly). 9 HIDDEN CHAIN (the late twist, darkest slide). 10 HANDOVER (one truth pivoted onto the reader, ending with a command that reuses the motif).
FLOW RULES: every slide except 10 ends with forward pull the next slide answers; thread 1-2 concrete details through as callbacks; vary sentence length, never three same-length sentences in a row; read-aloud test — sounds like a man talking, contractions on, natural connectives allowed.
VOICE: first person, their vocabulary lifted where possible, British English, 1-3 sentences per slide, no em-dashes, no tricolons, no hype, no invented facts. Thin beat = keep it short, never pad.
Also: one anthem caption (max 8 words) in their register, and per-slide one-line image direction using photos this man would plausibly have.
Respond ONLY with JSON: {"slides":[{"n":1,"beat":"CLIFFHANGER","text":"","image":""},{"n":2,"beat":"RECEIPT","text":"","image":""},{"n":3,"beat":"THE LINE","text":"","image":""},{"n":4,"beat":"ZERO POINT","text":"","image":""},{"n":5,"beat":"GRAFT","text":"","image":""},{"n":6,"beat":"ALLY","text":"","image":""},{"n":7,"beat":"STAKES","text":"","image":""},{"n":8,"beat":"WINS","text":"","image":""},{"n":9,"beat":"HIDDEN CHAIN","text":"","image":""},{"n":10,"beat":"HANDOVER","text":"","image":""}],"caption":""}`
      userPrompt = `Write the 10-slide carousel and return the JSON.`
    }

    // ── The Show Up Page Builder™ ──────────────────────────────────────────────
    if (type === 'show-up-page') {
      systemPrompt = `You are a direct, brutally honest marketing strategist building a booking thank-you page for a coach. The page has one job: get booked prospects to show up to the call, prepared and pre-sold. It is not a sales page. They already said yes. Work only from the client data provided. Never invent client names, numbers, results, or biographical facts.

GAP PROTOCOL: before writing anything, audit the provided data against every deliverable. If anything required is missing or too thin to build from (a thesis with no substance, a client win with no number, pillars with no friction removers), do not produce partial deliverables and do not write around the hole with placeholders. Instead output a single block in this exact format and nothing else:

GAPS:
- [source module] | [what's missing] | [the question to ask the client, in plain language]

One line per hole, maximum four questions per source, each question answerable in a sentence or two. If the data is sufficient, skip the GAPS block entirely and produce all deliverables.

TONE: the client's stored Tone & Voice profile is the primary authority for how everything sounds. Every deliverable — page copy, all four scripts, the testimonial brief — is written in their stated register, using their phrasing patterns and respecting anything they've said they'd never say. Where their profile is silent, fall back to the baseline voice rules below. Where the two conflict, their profile wins.

BASELINE VOICE RULES: sounds like a voice note to a mate, not marketing. No em-dashes. No memo words (however, therefore, moreover, furthermore, additionally). Never "It's not X. It's Y." reversals. No parallel tricolons. Specifics over adjectives. Vary sentence length so the right-hand margin is jagged, not straight. Profanity only if their tone profile says so. Strip anything that wouldn't survive being said out loud in a pub.

PAGE STRUCTURE — this matches the exact layout of a proven high-converting thank-you page (basealpha.uk/thank-you):

1. HERO / CONFIRMATION. Centred bold thank-you headline (e.g. "Thank You for Booking a Call") + a short motivational paragraph. Directly below: Video 1 (the Call Briefing) as a large embedded video.

2. IMPORTANT REMINDER + WHAT TO EXPECT. These sit together in one section, side by side on desktop. LEFT SIDE: "Important Reminder" heading + one paragraph (cancellation policy + environment: quiet place, laptop not phone, the call is on ${data.build_gaps?.call_platform || 'Zoom'} via the calendar invite link, no phone call is coming). Then "What to Expect" heading + one short motivational paragraph. RIGHT SIDE: A 3-card video grid, each card has a video embed slot + subheading + short paragraph: Card 1 = programme overview video + programme name + pillars listed. Card 2 = differentiation video + "I'll have your back" + coach commitment paragraph. Card 3 = commitment filter video + "You have to be committed" + who this is for.

3. LIFE-CHANGING TRANSFORMATIONS. Centred heading. A grid of 4-9 transformation photo placeholders with no captions, just images.

4. HOW DOES IT WORK? Each case study is a card with image on the left and text on the right (same layout for all, NOT alternating). Subheading is the pillar name (e.g. "Base Alpha Performance System."). The text is one long narrative paragraph — name the client, their life situation, what they struggled with, how it affected them personally, what the programme did through this pillar, the measurable result, the life outcome. End with one sentence connecting back to the pillar philosophy. Conversational, not marketing copy. Built from client wins data only.

5. VIDEO TESTIMONIALS. Centred heading "Here's what our members think". Two video testimonial embeds stacked vertically (not a grid).

6. WRITTEN TESTIMONIALS. Heading "Testimonials" + subheading "Here's what success looks like". A 3-column responsive grid of testimonial cards, each with: full raw quote text (keep real voice, imperfect grammar), photo placeholder, client name. 6-9 cards. On mobile these become a slider.

7. FOOTER. Logo, social icons (YouTube, Twitter/X, Facebook, Instagram), nav links (Home, About, etc.), legal links (Terms, Privacy), copyright.

Not on the page: pricing.

VIDEO 1 — CALL BRIEFING (90-120s, Section 1). Beats: welcome and well done for booking > logistics as instructions (the call is on ${data.build_gaps?.call_platform || 'Zoom'} via the link in the invite; take it on a laptop, not a phone, because screen sharing; quiet, distraction-free room) > call objective in one sentence > redirect: programme details are in the videos below so call time isn't wasted on them > what they get if it's a fit > the filter, once ("not everybody is accepted; if you're not ready for change, cancel") > THE action: go to your email and confirm the call > compressed programme overview (pillars in one breath, delivery in 2-3 sentences) > why selective (success rates) > risk reversal if one exists > one credential line as scenery, never a stack > close logistics (text reminder coming, meeting link in the email and calendar invite). Beats 8-11 must take less time than beats 1-7.

VIDEO 2 — PROGRAMME (2-3 min, Section 3). Built from the Sold Out offer data. Beats: name the system and pillars > each pillar gets what it does plus a friction remover ("no elaborate recipes, minimal prep" / "3-5 hours a week, demo videos") > flag the most important pillar and say why > 2-4 case studies as borrowed arcs: a vivid scene of where the client was > the barrier named as a belief or behaviour > the turn > the result with a specific number or direct quote > the life outcome (what the number bought them) > vary the barrier across case studies > self-aware cut-off into one commitment line ("if you commit, we will not let you fail"). Every case study comes from the client wins data only.

VIDEO 3 — DIFFERENTIATION (2-3 min, Section 3). Built from the Distinction Engine output. Beats: open inside the viewer's head ("how is this different from everything you've tried") > diagnose the real missing piece: the client's genuine differentiation thesis > mirror the viewer's symptoms so they feel read > back the thesis with the strongest proof available in the client's data (their track record, their method, their story if story material exists — never fabricated) > the anti-polish line, owned out loud > close on "and that's why what I deliver is different." Between beats use only but-type or so-type connectives. "And then" is banned.

VIDEO 4 — COMMITMENT FILTER (45-75s, Section 3). Built from the Premium Position output. Beats: "Is this for you? Honestly, it might be. It might not be." > selective because success rates matter, which is why the call exists > who it IS for, in action language > one real proof stat only if the data contains one > "nothing personal" plus the mission zoomed out > warm close ("if that's something you can get behind, I can't wait to speak to you").

TESTIMONIAL BRIEF (a message the coach sends their own clients). Beat list, no script: where you started (specific, slightly self-deprecating) > what you tried that failed and how the coach came in > what the process was actually like (tailored plans, check-ins, gradual adjustments, access) > the result with one number > what changed beyond the obvious > community texture if real > who you'd recommend it to. Tell them rough delivery beats polish; 2-5 minutes raw, the coach trims.

DELIVERABLES — produce all of these as a JSON object with these exact keys:
"section_1_hero": the thank-you headline on line 1, the motivational paragraph on line 2 (separated by newline),
"section_2_reminder": the Important Reminder paragraph (cancellation + environment in one paragraph),
"section_2_expect_intro": the "What to Expect" motivational paragraph,
"section_2_card_1_title": programme name (e.g. "The Ascend Programme"),
"section_2_card_1_text": programme pillars in one sentence (e.g. "This programme is built on four key areas: X, Y, Z and W"),
"section_2_card_2_title": "I'll have your back" or equivalent,
"section_2_card_2_text": coach commitment paragraph (what they get, how results happen),
"section_2_card_3_title": "You have to be committed" or equivalent,
"section_2_card_3_text": client commitment paragraph (growth mindset, willing to do the work),
"section_4_casestudies": array of objects [{pillar_name, narrative}] — one per programme pillar. pillar_name is the system component (e.g. "Base Alpha Performance System."). narrative is one FULL conversational paragraph: name the client, their situation, struggle, how it affected them, what the programme did through this pillar, the measurable result, life outcome, one sentence tying back to the pillar philosophy,
"section_5_video_testimonials_heading": heading for video testimonials section (e.g. "Here's what our members think"),
"section_6_testimonials": array of objects [{name, quote}] — 6 to 9 raw testimonial cards from client wins. Keep real voice, real length, imperfect grammar. Never compose quotes,
"section_7_footer": empty string (footer is standard),
"video_1": Video Script 1 The Call Briefing word for word,
"video_2": Video Script 2 The Programme full script,
"video_3": Video Script 3 The Differentiation Story full script,
"video_4": Video Script 4 The Commitment Filter full script,
"testimonial_brief": The Testimonial Brief formatted as a sendable message,
"qa_report": QA report checking all eight sections present in order; every video slot has its matching script; policy and environment instructions present with the platform link called out; no copy block repeated; every case study and testimonial drawn from real client data with names; branded terms spelled correctly; filter appears in Video 4 plus one line in Video 1 and nowhere else; read-aloud check passed; flag anything the coach still needs to supply or fix.

Respond ONLY with valid JSON. No markdown fences.`

      userPrompt = `Build the Show Up Page for this client.

TONE & VOICE PROFILE:
${JSON.stringify(data.tone_profile || {}, null, 2)}

DISTINCTION ENGINE OUTPUT:
${JSON.stringify(data.distinction_engine || {}, null, 2)}

PREMIUM POSITION OUTPUT:
${JSON.stringify(data.premium_position || {}, null, 2)}

SOLD OUT OFFER:
${JSON.stringify(data.sold_out || {}, null, 2)}

CLIENT WINS:
${JSON.stringify(data.client_wins || [], null, 2)}

BUILD DETAILS:
- Call type: ${data.build_gaps?.call_type || 'Strategy call'}
- Call length: ${data.build_gaps?.call_length || '30 minutes'}
- Call platform: ${data.build_gaps?.call_platform || 'Zoom'}
- Cancellation policy: ${data.build_gaps?.cancellation_policy || '24 hours notice'}
- Booking tool: ${data.build_gaps?.booking_tool || 'Calendly'}
- Guarantee: ${data.build_gaps?.guarantee || 'None stated'}
- Language: ${data.build_gaps?.language || 'British English'}

GAP ANSWERS (additional context from plug-the-gap):
${JSON.stringify(data.gap_answers || {}, null, 2)}

Produce all deliverables as JSON.`
    }

    // ── Show Up Page Builder™ — HTML Page Generation ────────────────────────
    if (type === 'show-up-page-html') {
      const imgs = data.images || {}
      const vids = data.video_urls || {}
      systemPrompt = `You are an elite web designer. Produce a single, self-contained, production-grade HTML file for a booking thank-you page. It must look like it was shipped by a design agency. Match the exact structural layout described below.

TECHNICAL REQUIREMENTS:
- One HTML file. All CSS in a single <style> block. No external CSS frameworks.
- Load Google Fonts via <link> tag.
- CSS custom properties (variables) for all colours and fonts.
- Fully responsive: 3 container widths (container-xl ~1200px, container-lg ~960px, container-md ~720px). Mobile breakpoint at 768px stacks all multi-column layouts to single column.
- Semantic HTML5. No JavaScript required.
- The page must render perfectly as a standalone .html file.
- Do NOT wrap output in markdown code fences. Return ONLY raw HTML starting with <!DOCTYPE html>.

STYLE VARIABLES:
--bg: ${data.styles?.bg || '#ffffff'};
--panel-bg: ${data.styles?.panelBg || '#f8f8f8'};
--accent: ${data.styles?.accent || '#C9A84C'};
--heading-color: ${data.styles?.headingColor || '#1a1a1a'};
--subheading-color: ${data.styles?.subheadingColor || '#C9A84C'};
--body-color: ${data.styles?.bodyColor || '#444444'};
--heading-font: '${data.styles?.headingFont || 'Manrope'}', sans-serif;
--body-font: '${data.styles?.bodyFont || 'Manrope'}', sans-serif;

EXACT PAGE STRUCTURE (7 sections, match this precisely):

SECTION 1 — HERO
- Generous padding (80-100px top, 60px bottom).
- Container: widest (container-xl) for heading, slightly narrower (container-lg) for video.
- h1 centred, large but not enormous (use clamp for responsive sizing, e.g. clamp(28px, 5vw, 42px)). Font weight 800.
- Below h1: a styled paragraph (slightly larger than body text, ~18px), centred, max-width ~620px.
- Below paragraph: a 16:9 video embed. If a video URL is provided, embed as iframe. Otherwise render a placeholder div (background: var(--panel-bg), border-radius: 12px, height: 0, padding-top: 56.17%, position: relative) with a centred label that says exactly "Video 1: Call Briefing" so the client knows what goes here.

SECTION 2 — IMPORTANT REMINDER + WHAT TO EXPECT + VIDEOS
- Container: container-lg.
- Layout: STACKED vertically — NOT side by side. Two text blocks full-width on top, then three videos in a row underneath.
- TOP ROW: Two text panels side by side (desktop), stacking on mobile.
  - Panel 1 (50% width): h2 "Important Reminder" + p (cancellation policy and environment instructions). Background: var(--panel-bg), border-radius 12px, padding 32px.
  - Panel 2 (50% width): h2 "What to Expect" + p (slightly larger text ~17px, motivational paragraph). Background: var(--panel-bg), border-radius 12px, padding 32px.
  - Gap between panels: 24px.
- BOTTOM ROW: 3 video cards in a horizontal row (desktop), stacking on mobile. 24px gap between cards.
  - Each card: video embed (16:9, same pattern as hero — if no video URL, render a placeholder with a SPECIFIC label) + h3 (bold, ~18px) + p (regular body text). Background: var(--panel-bg), border-radius 12px, padding 20px.
  - Card 1: Programme overview video (placeholder label: "Video 2: Programme Overview") + programme title + pillars sentence.
  - Card 2: Differentiation video (placeholder label: "Video 3: Differentiation Story") + "I'll have your back" + coach commitment text.
  - Card 3: Commitment video (placeholder label: "Video 4: Commitment Filter") + "You have to be committed" + client commitment text.
- Gap between text row and video row: 32px.

SECTION 3 — LIFE-CHANGING TRANSFORMATIONS
- Very generous vertical padding (padding-vertical: 96-120px equivalent).
- h2 centred, slightly smaller variant.
- Container: container-md (narrower, keeps images tighter).
- Image grid: 3 columns on desktop, 2 on tablet, 1 on mobile. Gap: 12-16px.
- Images: if URLs provided, use <img> with object-fit: cover, border-radius: 8-12px, aspect-ratio or fixed height. If no URLs, render placeholder divs (background: var(--panel-bg), aspect-ratio: 3/4, border-radius: 12px) with no label.

SECTION 4 — HOW DOES IT WORK
- Container: container-lg.
- h2 left-aligned.
- Cards wrapper with top margin.
- Each case study card: horizontal flex (image left, text right). NOT alternating — same layout for every card.
  - Image: 40% width, aspect-ratio ~3/4, object-fit: cover, border-radius: 12px. If URL provided use <img>, otherwise placeholder div.
  - Text: 60% width. h3 with <strong> (pillar name, bold). p with full narrative paragraph (body text, 15-16px, line-height 1.8).
  - Cards separated by 40-48px vertical gap.
- On mobile: image stacks above text, full width.

SECTION 5 — VIDEO TESTIMONIALS
- Padding: generous vertical (80px).
- Container: container-md.
- h2 centred with bottom padding.
- Two video embeds stacked vertically with 24px gap between them. Same 16:9 embed pattern. If no video URL, use placeholder with label "Testimonial Video 1" and "Testimonial Video 2" respectively.

SECTION 6 — WRITTEN TESTIMONIALS
- Generous vertical padding (96-120px).
- h2 left-aligned or centred.
- Subline below h2: uppercase, bold, smaller text.
- 3-column grid on desktop, 1 column on mobile. Gap: 20-24px.
- Each testimonial card (background: var(--panel-bg), border-radius: 12px, padding: 24-32px):
  - p: the full quote text (body text size, line-height 1.7, font-style: normal — NOT italic).
  - Below quote: avatar holder (flex row, align centre, gap 12px):
    - Circular image (48-64px diameter, border-radius: 50%, object-fit: cover). If URL provided use <img>, otherwise a coloured circle with the first letter of the name.
    - Name text (bold, 14px).

SECTION 7 — FOOTER
- Border-top: 1px solid rgba(0,0,0,0.08).
- Padding: 48px.
- Two rows:
  - Row 1: Navigation links (horizontal, centred or spaced) + Logo image (if provided) + Social icon links (YouTube, Twitter/X, Facebook, Instagram — render as simple SVG icons or unicode symbols).
  - Row 2: Legal links (Terms, Privacy) + Copyright line.
- All footer text small (12-13px), muted colour.

IMAGE DATA (use these URLs where provided, placeholder divs where not):
- Logo URL: ${imgs.logo || 'none'}
- Transformation photos: ${JSON.stringify(imgs.transformations || [])}
- Case study photos (one per pillar): ${JSON.stringify(imgs.case_studies || [])}
- Testimonial photos: ${JSON.stringify(imgs.testimonial_photos || [])}

VIDEO URLS (embed as 16:9 iframes where provided, placeholder divs where not):
- Hero video (Video 1): ${vids.video_1 || 'none'}
- Programme video (Card 1 in Section 2): ${vids.video_2 || 'none'}
- Differentiation video (Card 2 in Section 2): ${vids.video_3 || 'none'}
- Commitment video (Card 3 in Section 2): ${vids.video_4 || 'none'}
- Testimonial video 1: ${vids.testimonial_1 || 'none'}
- Testimonial video 2: ${vids.testimonial_2 || 'none'}

For any YouTube URL, convert to embed format (youtube.com/watch?v=ID becomes youtube.com/embed/ID). For Vimeo, use player.vimeo.com/video/ID. For Loom, replace /share/ with /embed/.

CLIENT NAME: ${data.client_name || ''}`

      userPrompt = `Build the complete HTML page using this content. Inject the copy into the matching sections.

PAGE COPY:
${JSON.stringify(data.generated_output || {}, null, 2)}

Return ONLY the complete HTML. No markdown, no explanation, no code fences. Start with <!DOCTYPE html>.`
    }

    // ── Phase Suggestion ──────────────────────────────────────────────────────
    if (type === 'phase-suggestion') {
      const stageDescriptions = {
        early: 'EARLY STAGE — Still defining their brand, offer, and audience. No clear positioning yet. Need visibility and audience-building first.',
        building: 'BUILDING STAGE — Brand identity exists but offer is not yet defined or launched. Need to build authority and trust while developing their offer.',
        launching: 'LAUNCHING STAGE — Has an offer but still building traction. Need a mix of reach, trust-building, and initial sales pushes.',
        scaling: 'SCALING STAGE — Offer, brand, and system are in place. Need to optimise content for consistent lead generation and conversion.',
      }

      const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      systemPrompt = `You are a content strategy advisor for coaches, consultants, and service providers. You design multi-week content phases that balance three content types: REACH (grow audience — shareable, bold, wide-net content), TRUST (build authority — value, storytelling, behind-the-scenes), and SALES (drive conversion — offers, social proof, urgency, CTAs). You are direct, strategic, and commercially sharp. No fluff. You always return valid JSON with no markdown formatting or code fences.

You have deep knowledge of launch timing, seasonal buying patterns, and industry-specific calendar events. You understand that every sales push needs a REASON — a hook that justifies urgency. You draw from proven launch strategies used by top online coaches and service providers (Jeff Walker's Product Launch Formula, Amy Porterfield's list-building sequences, Russell Brunson's challenge funnels, Daniel Priestley's oversubscribed model).

Today's date is ${todayStr}.`

      userPrompt = `Design a content phase for this business. Suggest the ideal phase length, name, and week-by-week content type (reach, trust, or sales).

BUSINESS STAGE: ${stageDescriptions[data.business_stage] || stageDescriptions['building']}

${data.business_context ? `BUSINESS CONTEXT:\n${data.business_context}` : ''}

REQUESTED DURATION: ${data.requested_duration || 6} weeks (you can suggest a different length if it makes more sense for their stage)

## LAUNCH REASON — EVERY SALES PHASE NEEDS ONE

A sales push without a reason feels desperate. Every phase that includes 2+ sales weeks MUST have a clear launch trigger. Suggest the most relevant one based on the date, niche, and offer type. Categories:

**Seasonal / Calendar:**
- New Year (Jan) — fresh start, resolution energy
- Back to School (Sept) — new term, new habits
- Black Friday / Cyber Monday (late Nov) — price-driven urgency
- Christmas (Dec) — gift offers, "treat yourself" positioning
- Summer (Jun-Aug) — "get ahead while competitors rest", or "summer reset"
- Q4 push (Oct-Nov) — "finish the year strong"
- Tax year end (Mar-Apr UK, varies elsewhere) — financial urgency
- Half-term / school holidays — relevant for parent-facing niches

**Business Cycle:**
- New cohort launch — natural open/close doors
- Founding member pricing — early-bird urgency
- Price increase — "current price ends [date]"
- Beta / pilot intake — limited spots, first-mover advantage
- Anniversary / milestone — celebrating with a special offer
- Case study close — "we just finished with [client], taking 3 more"
- Waitlist open — demand-driven scarcity
- Scholarship / bursary intake — "opening X funded spots for [specific type of person]"
- Case study launch — "looking for X people to document the full journey" (positions the offer as an opportunity, not a sale)
- Challenge / sprint — "free 5-day [topic] challenge, then doors open for those who want to go deeper"
- Results review — "just reviewed our Q[X] numbers, here's what's working — opening [X] spots for people who want the same"

**Industry / Niche-Specific:**
- Based on the client's sector, what seasonal patterns affect THEIR audience's buying behaviour?
- When does their ideal client feel the pain most acutely?
- When do budgets get allocated or renewed?
- What industry events, conferences, or cycles create natural momentum?

If the client's niche is known, suggest the specific trigger most relevant to THEIR audience. For example:
- Fitness coaches → Jan (New Year), Sept (back to routine), pre-summer (Apr-May)
- Business coaches → Jan (planning), Sept (Q4 push), tax year end
- Therapists/wellbeing → Jan (mental health awareness), Sept (burnout season)
- E-commerce consultants → pre-Black Friday (Oct), Q1 planning
- Career coaches → Jan (new job energy), Sept (post-summer reassessment)

CRITICAL — BRAND VOICE ALIGNMENT:
All launch reasons, phase names, and wording MUST match the person's brand personality and positioning. If their business context includes personality traits, values, or tone, reflect that in the naming. For example:
- A high-end premium coach doesn't say "discount" — they say "invitation-only intake" or "founding member allocation"
- A no-nonsense direct coach doesn't say "scholarship opportunity" — they say "case study spots" or "results sprint"
- A warm community-builder doesn't say "limited spots" — they say "opening the doors to [X] new members"
Never use generic marketing language. Use the language of THEIR brand.

Include the suggested launch reason in the explanation.

## Guidelines by stage:
- EARLY: Heavy reach (60-70%), some trust (20-30%), minimal sales (0-10%). Focus on getting seen. Do NOT include sales weeks — they have nothing to sell yet.
- BUILDING: Balanced reach (30-40%) and trust (40-50%), light sales (10-20%). Build authority. If they don't have an offer yet, zero sales weeks.
- LAUNCHING: Trust-heavy start (weeks 1-3), then shift to sales (weeks 4+). Build desire, then convert. The sales weeks should be tied to the launch reason.
- SCALING: Structured cycles — reach → trust → trust → sales, repeat. Consistent pipeline. Sales weeks should align with the next relevant seasonal or business trigger.

## Stage misalignment warnings:
- If the stage is EARLY or BUILDING and the client seems to want a launch phase, you MUST warn them in the explanation: "You're not ready for a sales-heavy phase yet. You need at least 6 weeks of reach and trust content before your first sales push. Here's what to do instead." Then design a reach/trust phase with zero or minimal sales.
- If the stage is BUILDING and they have no offer defined (no offer name in the business context), warn them: "You don't have a defined offer yet — sales weeks won't work until you build one. Focus on reach and trust to grow your audience while you develop your offer."
- A launch phase (with 2+ sales weeks) should only be suggested for LAUNCHING or SCALING stages.

## General rules:
- Never start a phase with a sales week (build trust first)
- Never have more than 2 sales weeks back-to-back
- End phases with either a sales push or a trust cooldown depending on what comes next
- Reach weeks work best at the start of a phase or after a sales push
- The phase name should reflect the launch reason if there is one (e.g. "Q4 Push", "New Year Sprint", "Cohort 3 Launch")

Return ONLY valid JSON in this exact format (no markdown, no code fences, no explanation outside the JSON):
{
  "name": "Phase name reflecting the launch reason or strategy",
  "duration": <number of weeks>,
  "weeks": ["reach", "trust", "sales", ...],
  "launch_reason": "The specific trigger/reason for any sales push in this phase (e.g. 'Black Friday — discounted founding member pricing', 'New cohort intake — doors close Sept 20th'). Null if no sales weeks.",
  "explanation": "3-4 sentences explaining: (1) WHY this sequence works for their stage, (2) what the launch reason is and why it's the right one for their niche right now, (3) any warnings about stage misalignment. Be specific to their sector and offer."
}`
    }

    // ── Amplifier Ads™ Script Builder ──────────────────────────────────────

    if (type === 'amplifier-ads-generate') {
      const VOICE_RULES = `Voice rules (non-negotiable):
- British English
- Short, direct sentences
- Specific numbers over vague claims
- No em-dashes anywhere
- No rhetorical flourish
- Never use the "it's not X, it's Y" contrast pattern
- No tricolons (three-part parallel lists)
- Sounds like a person talking to camera, never like marketing copy`

      systemPrompt = `You are writing three spoken video ad scripts for a coach's Instagram Amplifier Ad. The ad's only job is to get the right stranger to FOLLOW the page. Nothing is being sold.

The 6-part framework every script must follow:
1. Call-out: open with the exact ICP keywords so Meta routes the ad
2. Aspiration or pain: name what they want or what keeps stopping them
3. CTA early: tell them to follow the page within the first 5 to 10 seconds of speech (roughly the first 25 words)
4. Proof: the client result(s), with the numbers and timeframe exactly as given
5. Old way and its flaws: their old way, the coach's named method, the difference stated plainly
6. Repeat the CTA to close

Rules for all three:
- 90 to 130 spoken words each
- The follow CTA must appear within the first 25 words AND again at the end
- Use the proof numbers exactly as given, never invent or round them
- Mention the named method once, late, described in plain English, as scenery not a pitch

${VOICE_RULES}

Respond with ONLY this JSON, no markdown fences, no preamble:
{"variants":[{"angle":"Straight Call-Out","script":"..."},{"angle":"Receipt Drop","script":"..."},{"angle":"Contrarian Proof","script":"..."}]}`

      const proof2Line = data.proof2 ? `- Proof 2: ${data.proof2}` : ''
      userPrompt = `Coach's data:
- ICP call-out keywords: ${data.icp || ''}
- Aspiration: ${data.aspiration || ''}
- Pain: ${data.pain || ''}
- Daily content topic: ${data.topic || ''}
- Proof 1: ${data.proof1 || ''}
${proof2Line}
- Without (thing they hate doing): ${data.hateDoing || ''}
- Old way: ${data.oldWay || ''}
- What the old way costs them: ${data.oldWayCost || ''}
- Named method: ${data.method || ''}
- What the method does: ${data.methodDoes || ''}

Write exactly three scripts, one per angle:
1. "Straight Call-Out": opens on the ICP and their pain, classic structure
2. "Receipt Drop": opens on the strongest number from the proof, then reveals whose result it is, then the framework beats
3. "Contrarian Proof": opens by attacking the old way, then proof, then the method`
    }

    if (type === 'amplifier-ads-refine') {
      const VOICE_RULES = `Voice rules (non-negotiable):
- British English
- Short, direct sentences
- Specific numbers over vague claims
- No em-dashes anywhere
- No rhetorical flourish
- Never use the "it's not X, it's Y" contrast pattern
- No tricolons (three-part parallel lists)
- Sounds like a person talking to camera, never like marketing copy`

      systemPrompt = `You rewrite spoken Instagram ad scripts. The ad's only job is getting the right stranger to follow the page. Keep the 6-part structure intact: call-out, aspiration/pain, early follow CTA (within the first 25 words), proof with exact numbers, old way vs named method, closing follow CTA. Keep it 90 to 130 spoken words.

${VOICE_RULES}

Respond with ONLY the rewritten script text. No quotes, no preamble, no markdown.`

      userPrompt = `Here is a spoken Instagram ad script whose only job is getting the right stranger to follow the page:

"${data.currentScript || ''}"

Rewrite it following this instruction: ${data.instruction || ''}`
    }

    // ── Sales Call Script™ — Generate ─────────────────────────────────────

    if (type === 'sales-script-generate') {
      const VOICE_RULES = `Voice rules (non-negotiable):
- Plain British English
- Short sentences
- Specific numbers over vague claims
- No em-dashes anywhere in the output
- No "it's not X, it's Y" contrast constructions
- No tricolons (three-part parallel lists)
- No rhetorical flourish
- Sounds like the member talking, not a template
- The method name appears exactly once, late in Phase 5, as scenery not a pitch
- Proof numbers used exactly as given, never rounded or inflated
- Placeholders for live-call data use square brackets: [current], [target], [date], [their number], [cause 1], [cause 2], [cause 3], [worth-it number]. Never invent values for these.`

      const resultsBlock = data.useOwnStory
        ? `The member will use their own transformation story. Reference ${data.firstName}'s personal journey in the ${data.niche} space.`
        : (data.results || []).map((r, i) => `Result ${i + 1}: ${r.name} started at ${r.started}. ${r.changed}. Now at ${r.now}.`).join('\n')

      const objectionsBlock = data.objections && data.objections.length > 0
        ? `The ICP's known objections/excuses: ${data.objections.join(', ')}. Reword the Phase 6 questions to reference these specific excuses where relevant.`
        : 'No specific objections stored. Use standard partner/timing/think-about-it questions.'

      systemPrompt = `You write personalised sales call scripts. Every line is for a real person to say out loud on a live 45-minute call. The job of the call is a decision: a yes or a clear no.

${VOICE_RULES}

You must return structured JSON with one object per phase, each with a "lines" array. Each line is an object with "type" ("spoken" or "note") and "text".

SCRIPT STRUCTURE:

PHASE 1: FRAME (2 min)
Set the agenda and get permission for the decision. One spoken paragraph covering: I'll ask questions to understand where you are, we'll look at where you want to be and what's in the way, if I can help I'll show you how, if not I'll say so, at the end you'll know if it's a yes or a no. Ends with "Fair?"
Rules: no small talk beyond 60 seconds. Say "yes or no at the end" out loud. Get a verbal yes before moving on.

PHASE 2: DISCOVERY (10 min)
Five questions, business facts only:
1. What they sell, at what price, how people find them (reword to the member's offer type: ${data.niche})
2. Last month's revenue
3. Where leads come from right now, honestly
4. What they've already tried that didn't work (reference: ${data.alreadyTried || 'the old approaches'})
5. Why they booked now, what changed
Rules: write the numbers down. Question 5 is the fuel for the close. Do not fix anything yet. Add coaching notes as "note" type lines.

PHASE 3: TARGET (5 min)
Ask for a monthly number at 90 days. Sense-check: 2x to 4x current is credible, 10x is fantasy and you say so. ${data.incomeLevel ? `The ICP's typical revenue range is ${data.incomeLevel}, so calibrate the sense-check to this.` : ''}
Lock it: "So the game is [current] to [target] by [date]."
Then the cost of staying put: "If nothing changes in 90 days, what happens?" Let them answer, do not fill the silence.
Then the worth-it question: "If we could get you to [target] in 90 days, what would that be worth to you?" Write down [their number].

PHASE 4: THE GAP (8 min)
Reflect back: "You're at [current]. You want [target]. The reason you're not there is [cause 1], [cause 2], [cause 3]. Does that sound right?"
Gap causes MUST be drawn from these ICP problems, not generic:
${data.problems.map((p, i) => `- Problem ${i + 1}: ${p}`).join('\n')}
${data.pains.length > 0 ? `ICP pains: ${data.pains.join(', ')}` : ''}
Two or three causes maximum. Use their phrases. Get the yes. Do not mention the programme.

PHASE 5: THE PROCESS (10 min)
"There are three things that have to happen to get you from [current] to [target]."
Three steps, each mapped one-to-one to these pillars:
Step 1: ${data.pillars[0]} — ${data.pillarDescriptions[0]}
Step 2: ${data.pillars[1]} — ${data.pillarDescriptions[1]}
Step 3: ${data.pillars[2]} — ${data.pillarDescriptions[2]}

Each step: one sentence on what it is, one on why it matters for them, one on what done looks like.
Then one proof story in three lines: where they started, what changed, where they are now.
The method "${data.engineName}" is named exactly once here, late, as scenery. Not as a pitch.
Rules: teach generously. The sell is support and speed, not the information. Every step points back to Discovery.

PHASE 6: OBJECTIONS BEFORE THE PITCH (5 min)
Opener: "Before I tell you how we'd work together, I want to check a few things."
Three questions in order:
1. Partner: is there anyone else who'd need to be part of the decision
2. Timing: anything on the time side that would stop them doing the work over 90 days
3. Think about it: how they normally decide when investing in the business
${objectionsBlock}
Price is not asked here. It was set up by the worth-it question in Phase 3.
Close: "Anything else that would stop you saying yes if this was right?" If no, pitch. If yes, handle and ask again.

THE PITCH (5 min)
"Based on everything you've told me, here's what I'd recommend."
Programme: ${data.programmeName}
Deliverables: ${data.deliverables}
${data.programmeLength ? `Duration: ${data.programmeLength}` : ''}
Price: ${data.price} (stated once)
${data.paymentPlan ? `Payment plan: ${data.paymentPlan}` : ''}
Then: "How does that sound?" Then silence.

OBJECTION HANDLING (inside Phase 6 response):
Return four objection blocks under an "objections" key, each with the same "lines" array format:
- "partner": If partner bites — offer to get them on now or confirm they make the business calls. Lock: "So if this is right, you're in a position to say yes today?" If they truly need the partner, book the follow-up now.
- "timing": If timing bites — "When would be the right time?" Then replay their cost of staying put.
- "think": If think-about-it bites — "What specifically would you be thinking about?" Their answer is partner, timing or price in disguise. Handle that one. Then: "So if that was sorted, you'd be able to decide today?"
- "price": If price bites after the pitch — "You said getting to [target] was worth [their number]. This is ${data.price}. What's the hesitation?" Cash flow means payment plan. Belief means back to the gap and the proof. If yes: take payment on the call. Never send the link later. If no: "Fair enough. What's missing?" One more round, then let them go cleanly.

Respond with ONLY this JSON structure, no markdown fences, no preamble:
{"phase_1":{"lines":[{"type":"spoken","text":"..."},{"type":"note","text":"..."}]},"phase_2":{"lines":[...]},"phase_3":{"lines":[...]},"phase_4":{"lines":[...]},"phase_5":{"lines":[...]},"phase_6":{"lines":[...]},"pitch":{"lines":[...]},"objections":{"partner":{"lines":[...]},"timing":{"lines":[...]},"think":{"lines":[...]},"price":{"lines":[...]}}}`

      userPrompt = `Build the full sales call script for this member:

Member: ${data.firstName}, niche: ${data.niche}
ICP: ${data.icpDescription}
ICP pains: ${data.pains.join(', ')}
Desired outcome / promise: ${data.desiredOutcome}
What they've already tried (old way): ${data.alreadyTried || 'Not specified'}
ICP income level: ${data.incomeLevel || 'Not specified'}

Problems the method solves:
${data.problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Method: ${data.engineName}
Pillars:
1. ${data.pillars[0]} — ${data.pillarDescriptions[0]}
2. ${data.pillars[1]} — ${data.pillarDescriptions[1]}
3. ${data.pillars[2]} — ${data.pillarDescriptions[2]}
Promise: ${data.promise}

Programme: ${data.programmeName}
Price: ${data.price}
${data.paymentPlan ? `Payment plan: ${data.paymentPlan}` : ''}
Deliverables: ${data.deliverables}
${data.programmeLength ? `Duration: ${data.programmeLength}` : ''}

Proof:
${resultsBlock}

Write the complete script now.`
    }

    // ── Sales Call Script™ — Refine Phase ─────────────────────────────────

    if (type === 'sales-script-refine') {
      systemPrompt = `You rewrite individual phases of a sales call script. Keep the same structure and purpose of the phase. Every line is for a real person to say out loud on a live call.

Voice rules (non-negotiable):
- Plain British English
- Short sentences
- Specific numbers over vague claims
- No em-dashes anywhere
- No "it's not X, it's Y" contrast constructions
- No tricolons
- No rhetorical flourish
- Sounds like the member talking, not a template
- Placeholders use square brackets: [current], [target], [date], [their number], [cause 1], [cause 2], [cause 3], [worth-it number]

Respond with ONLY a JSON array of line objects, no markdown fences, no preamble:
[{"type":"spoken","text":"..."},{"type":"note","text":"..."}]`

      const currentText = (data.currentLines || []).map(l => l.type === 'note' ? `[Note: ${l.text}]` : l.text).join('\n')

      userPrompt = `Here is the current phase (${data.phaseKey}) of a sales call script for ${data.firstName} (${data.niche}):

${currentText}

Rewrite it following this instruction: ${data.instruction}

Keep the phase structure intact. Return only the JSON array of line objects.`
    }

    // ── Sales Coach™ — Analyse Transcript ─────────────────────────────────

    if (type === 'sales-coach-analyse') {
      const scriptContext = data.scriptJson ? `
The member has a saved sales call script. Compare what they actually said against what they planned to say. Here is their planned script structure:
${JSON.stringify(data.scriptJson, null, 0)}

When analysing, note where they deviated from their script and whether those deviations helped or hurt.` : ''

      systemPrompt = `You are a brutally honest sales call coach. You analyse sales call transcripts against a proven 6-phase call structure and tell the caller exactly what worked, what didn't, and what to fix.

THE 6-PHASE STRUCTURE you are coaching against:

PHASE 1: FRAME (2 min) — Set the agenda, get permission for a yes-or-no decision at the end. Say "fair?" and get verbal agreement.

PHASE 2: DISCOVERY (10 min) — Five business-fact questions: what they sell and at what price, last month's revenue, where leads come from, what they've tried that hasn't worked, why they booked now.

PHASE 3: TARGET (5 min) — Get a 90-day revenue target, sense-check it (2-4x is credible, 10x is fantasy), lock it with "So the game is [current] to [target] by [date]." Then cost of staying put, then the worth-it question.

PHASE 4: THE GAP (8 min) — Reflect back the gap between current and target. Name 2-3 causes using their words. Get the yes. Do not mention the programme.

PHASE 5: THE PROCESS (10 min) — Three steps mapped to pillars. One sentence each on what it is, why it matters, what done looks like. One proof story. Method named once, late, as scenery.

PHASE 6: OBJECTIONS BEFORE THE PITCH (5 min) — Check partner, timing, think-about-it BEFORE pitching. Handle each one. Then pitch: programme name, deliverables, price once. "How does that sound?" Then silence.

COACHING RULES:
- Be specific. Quote the transcript. Don't give generic advice.
- Plain British English. Short sentences. No em-dashes.
- If a phase was skipped entirely, mark it "missing" and explain what that cost them.
- If the caller talked too much and didn't listen, say so.
- If they pitched too early, say so.
- If they handled an objection well, give them credit.
- Score each phase: "strong", "okay", "weak", or "missing".
- Give an overall score out of 10.
${scriptContext}

${data.callOutcome ? `Call outcome: ${data.callOutcome}` : ''}
${data.callNotes ? `Caller's own notes: ${data.callNotes}` : ''}

Respond with ONLY this JSON structure, no markdown fences:
{
  "overall_score": 7,
  "overall_verdict": "strong|okay|weak",
  "summary": "2-3 sentence overall assessment",
  "phases": [
    {
      "name": "Phase 1: Frame",
      "verdict": "strong|okay|weak|missing",
      "worked": ["specific thing that worked"],
      "didnt_work": ["specific thing that didn't"],
      "improve": ["specific actionable fix"],
      "excerpt": "key quote from the transcript for this phase"
    }
  ],
  "top_3_fixes": ["most important fix", "second", "third"],
  "script_comparison": "paragraph comparing planned script vs actual call, or null if no script provided",
  "best_line": "the single best thing they said on the call, quoted exactly",
  "worst_line": "the single worst thing they said, quoted exactly, or null if nothing terrible"
}`

      userPrompt = `Analyse this sales call transcript for ${data.firstName || 'the caller'} (${data.niche || 'coach/consultant'}).

TRANSCRIPT:
${data.transcript}

Give the full phase-by-phase breakdown. Be specific and quote the transcript.`
    }

    // ── AI Client Insights — Admin Only ─────────────────────────────────
    if (type === 'client-insights') {
      systemPrompt = `You are a senior business coach analysing a client's monthly performance data. You have access to their full history and must produce a coaching report.

YOUR TOOLS KNOWLEDGE — The Motherboard platform has these tools available to clients. When recommending actions, direct the client to the specific tool:
- **Sold Out Playbook** — For refining their offer, niche, pricing, Bang Bang (main offer) and Dip (micro offer). Direct here for offer/positioning leaks.
- **Premium Position Blueprint** — For brand positioning, authority building, and standing out. Direct here for differentiation/brand leaks.
- **Wealth Wired Workbook** — For money mindset, pricing confidence, and financial planning. Direct here for pricing/money mindset leaks.
- **Content Capture** — For content strategy, hooks, scripts, and posting plans. Direct here for content/audience growth leaks.
- **Sales Scripts** — For building and refining their sales call script. Direct here for closing/conversion leaks.
- **Sales Coach** — For analysing recorded sales call transcripts. Direct here if close rate is low.
- **Amplifier Ads** — For creating paid ad copy. Direct here if organic reach is plateauing.
- **The Comeback Map** — For re-engaging cold leads and past clients. Direct here for retention/re-engagement leaks.
- **Show Up Pages** — For building landing pages and lead magnets. Direct here for lead generation leaks.
- **Daily KPI Tracker** — For daily activity tracking. Direct here if consistency is the issue.
- **Monthly Review** — For monthly reflection and target setting. They're already using this.

ANALYSIS RULES:
- Be specific. Use their actual numbers. Don't give generic advice.
- Plain British English. Short sentences. No em-dashes.
- Compare month-on-month trends. Flag improving AND declining metrics.
- Calculate conversion rates between pipeline stages (e.g. DMs to offers, offers to calls, calls to closes).
- Identify the biggest leak (where the most opportunity is being lost).
- If data is missing for certain months, work with what you have.
- When recommending actions, specify WHICH Motherboard tool to use and WHAT to do inside it.

Respond with ONLY this JSON structure, no markdown fences:
{
  "overall_health": "growing|stable|declining|critical",
  "health_score": 7,
  "summary": "2-3 sentence overall assessment of where this client's business is right now",
  "trajectory": "2-3 sentence assessment of the direction — are things getting better or worse month on month?",
  "leaks": [
    {
      "area": "Short name of the leak",
      "severity": "critical|moderate|minor",
      "detail": "What the numbers show and why this is a problem",
      "action": "Specific action to fix it",
      "tool": "Which Motherboard tool to use",
      "tool_action": "Exactly what to do inside that tool"
    }
  ],
  "improvements": [
    {
      "area": "What improved",
      "detail": "The numbers showing the improvement and by how much",
      "keep_doing": "What they should keep doing"
    }
  ],
  "month_on_month": [
    {
      "month": "Month Year",
      "highlights": "Key things that happened this month",
      "revenue": 0,
      "verdict": "strong|okay|weak"
    }
  ],
  "top_3_priorities": [
    {
      "priority": "What to focus on",
      "why": "Why this matters most right now",
      "tool": "Which Motherboard tool",
      "action": "Specific first step inside that tool"
    }
  ],
  "retention_analysis": "Paragraph analysing their retention/churn data if available, or null if no retention data exists yet"
}`

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const reviewsFormatted = (data.allReviews || [])
        .sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)
        .map(r => `${monthNames[r.month]} ${r.year}: ${JSON.stringify(r)}`)
        .join('\n\n')

      userPrompt = `Analyse the full monthly review history for ${data.clientName || 'this client'} (${data.business || 'business'}, ${data.industry || 'industry not specified'}).

FULL MONTHLY REVIEW HISTORY:
${reviewsFormatted}

Give the full coaching report. Be specific and use their actual numbers. Identify the biggest leaks, celebrate improvements, and give clear action points with specific Motherboard tools to use.`
    }

    // ── Monthly Cohort Summary — Admin Only ────────────────────────────
    if (type === 'monthly-cohort-summary') {
      systemPrompt = `You are a senior business coach reviewing the monthly performance of your entire client cohort. You must produce a coaching-ready summary that helps the coach (Imthiaz) understand the state of the group and prioritise his coaching time.

ANALYSIS RULES:
- Use actual numbers from the data. Never fabricate.
- Plain British English. Short sentences. No em-dashes.
- Identify who is thriving and who needs urgent attention.
- Spot common patterns across the group (e.g. multiple clients struggling with the same thing).
- Flag revenue concentration risks (if most revenue comes from 1-2 clients).
- Calculate conversion rates where possible (DMs to calls, calls to closes).
- Be direct and actionable. This is for the coach, not the clients.

Respond with ONLY this JSON structure, no markdown fences:
{
  "overall_summary": "3-4 sentence summary of how the cohort performed this month. Include total revenue, completion rate, and overall vibe.",
  "top_performers": [
    { "name": "Client name", "reason": "Why they stood out this month — use their actual numbers" }
  ],
  "needs_attention": [
    { "name": "Client name", "concern": "What the data shows — be specific with numbers", "action": "What Imthiaz should do in the next check-in" }
  ],
  "patterns": [
    "Common pattern 1 across multiple clients",
    "Common pattern 2"
  ],
  "revenue_breakdown": "Paragraph analysing where the revenue is coming from, concentration risks, and growth trends across the group",
  "coaching_priorities": [
    { "priority": "What to focus on as a coach this month", "detail": "Why this matters and who it affects" }
  ]
}`

      const reviewsFormatted = (data.reviews || []).map(r => `${r.clientName} (${r.business || 'no business listed'}): ${JSON.stringify(r)}`).join('\n\n')

      userPrompt = `Analyse the ${data.month} ${data.year} monthly reviews for the entire cohort.

COMPLETION: ${data.completedCount}/${data.totalClients} clients have completed their review.

ALL CLIENT REVIEWS FOR ${data.month?.toUpperCase()} ${data.year}:
${reviewsFormatted}

Give me the full cohort summary. Be specific. Use actual numbers. Tell me who is killing it, who needs help, what patterns you see across the group, and where I should focus my coaching energy.`
    }

    if (!systemPrompt) {
      return NextResponse.json({ error: 'Unknown plan type' }, { status: 400 })
    }

    const maxTokens = type === 'monthly-cohort-summary' ? 6000
      : type === 'client-insights' ? 8000
      : type === 'sales-coach-analyse' ? 6000
      : type === 'sales-script-generate' ? 8000
      : type === 'sales-script-refine' ? 2000
      : type === 'amplifier-ads-generate' ? 2000
      : type === 'amplifier-ads-refine' ? 1000
      : type === 'unshakeable' && Number(data.duration) >= 14 ? 4500
      : (type === 'show-up-page' || type === 'show-up-page-html') ? 16000
      : (type === 'sold-out-bangbang-draft' || type === 'sold-out-dip-draft' || type === 'comeback-compose') ? 4000
      : (type === 'sold-out-niche-research' || type === 'content-capture' || type === 'content-capture-structure' || type === 'comeback-map' || type === 'phase-suggestion') ? 3000
      : 2500

    const message = await callAnthropicAPI(systemPrompt, userPrompt, maxTokens)

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // Monthly Cohort Summary — parse structured JSON report
    if (type === 'monthly-cohort-summary') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ summary: parsed })
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 6000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const cleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          return NextResponse.json({ summary: parsed })
        } catch (retryErr) {
          console.error('Monthly cohort summary JSON parse failed:', retryErr)
          return NextResponse.json({ error: 'Failed to parse summary. Please try again.' }, { status: 500 })
        }
      }
    }

    // Client Insights — parse structured JSON report
    if (type === 'client-insights') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ insights: parsed })
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 8000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const cleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          return NextResponse.json({ insights: parsed })
        } catch (retryErr) {
          console.error('Client insights JSON parse failed:', retryErr)
          return NextResponse.json({ error: 'Failed to parse insights. Please try again.' }, { status: 500 })
        }
      }
    }

    // Sales Call Script — parse full script JSON
    if (type === 'sales-script-generate') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ script: parsed })
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 8000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json({ script: retryParsed })
        } catch {
          return NextResponse.json({ error: 'Failed to parse script. Please try again.' }, { status: 500 })
        }
      }
    }

    // Sales Call Script — parse refined phase lines
    if (type === 'sales-script-refine') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ lines: Array.isArray(parsed) ? parsed : parsed.lines || [] })
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON array, no markdown fences.', 2000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json({ lines: Array.isArray(retryParsed) ? retryParsed : retryParsed.lines || [] })
        } catch {
          return NextResponse.json({ error: 'Failed to parse refined phase. Please try again.' }, { status: 500 })
        }
      }
    }

    // Sales Coach — parse analysis JSON
    if (type === 'sales-coach-analyse') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ analysis: parsed })
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 6000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json({ analysis: retryParsed })
        } catch {
          return NextResponse.json({ error: 'Failed to parse analysis. Please try again.' }, { status: 500 })
        }
      }
    }

    // Amplifier Ads — parse JSON variants or return refined script
    if (type === 'amplifier-ads-generate') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ variants: parsed.variants || [] })
      } catch (parseErr) {
        // Retry once with explicit JSON instruction
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 2000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json({ variants: retryParsed.variants || [] })
        } catch {
          return NextResponse.json({ error: 'Failed to parse scripts. Please try again.' }, { status: 500 })
        }
      }
    }

    if (type === 'amplifier-ads-refine') {
      return NextResponse.json({ script: text.replace(/^["']|["']$/g, '').trim() })
    }

    // For Show Up Page HTML — return raw HTML string
    if (type === 'show-up-page-html') {
      const html = text.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim()
      return NextResponse.json({ html })
    }

    // For Show Up Page Builder, parse structured JSON
    if (type === 'show-up-page') {
      console.log('Show Up API raw text length:', text.length, 'first 200:', text.slice(0, 200))
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        // Check for GAPS block (plain text, not JSON)
        if (cleaned.startsWith('GAPS:')) {
          const gapLines = cleaned.split('\n').filter(l => l.startsWith('- ')).map(l => {
            const parts = l.replace('- ', '').split(' | ')
            return { source: parts[0]?.trim(), missing: parts[1]?.trim(), question: parts[2]?.trim() }
          })
          return NextResponse.json({ gaps: gapLines })
        }
        const parsed = JSON.parse(cleaned)
        return NextResponse.json(parsed)
      } catch (parseErr) {
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', 16000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          if (retryCleaned.startsWith('GAPS:')) {
            const gapLines = retryCleaned.split('\n').filter(l => l.startsWith('- ')).map(l => {
              const parts = l.replace('- ', '').split(' | ')
              return { source: parts[0]?.trim(), missing: parts[1]?.trim(), question: parts[2]?.trim() }
            })
            return NextResponse.json({ gaps: gapLines })
          }
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json(retryParsed)
        } catch (retryErr) {
          console.error('Show Up Page JSON parse failed after retry:', retryErr)
          return NextResponse.json({ error: 'Failed to parse output. Please try again.' }, { status: 500 })
        }
      }
    }

    // For comeback story, parse structured JSON
    if (type === 'comeback-map' || type === 'comeback-compose') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json(parsed)
      } catch (parseErr) {
        // One automatic retry on malformed output
        try {
          const retry = await callAnthropicAPI(systemPrompt, userPrompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown fences.', type === 'comeback-compose' ? 4000 : 3000)
          const retryText = retry.content[0].type === 'text' ? retry.content[0].text : ''
          const retryCleaned = retryText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const retryParsed = JSON.parse(retryCleaned)
          return NextResponse.json(retryParsed)
        } catch (retryErr) {
          console.error('Comeback Story JSON parse failed after retry:', retryErr)
          return NextResponse.json({ error: 'Failed to parse story output. Please try again.' }, { status: 500 })
        }
      }
    }

    // For AI accelerator, parse structured JSON tool
    if (type === 'ai-accelerator') {
      try {
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ tool: parsed })
      } catch (parseErr) {
        console.error('AI Accelerator JSON parse failed:', parseErr)
        return NextResponse.json({ error: 'Failed to parse tool output' }, { status: 500 })
      }
    }

    // For unshakeable/flywheel, parse structured JSON tasks
    if (type === 'unshakeable') {
      try {
        // Strip any markdown fences the model might add
        const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json({ tasks: parsed.tasks || [], summary: parsed.summary || '', plan: text })
      } catch (parseErr) {
        // If JSON parse fails, return as text plan fallback
        console.error('JSON parse failed, returning as text:', parseErr)
        return NextResponse.json({ plan: text })
      }
    }

    return NextResponse.json({ plan: text })
  } catch (err) {
    console.error('Generate plan error:', err?.status, err?.message, JSON.stringify(err?.error))
    const msg = err.status === 529 ? 'AI is temporarily busy — please try again in a minute' : (err.message || 'Failed to generate plan')
    return NextResponse.json({ error: msg, detail: `${err?.status} ${err?.error?.message || err?.message}`, version: 'v2-fetch' }, { status: 500 })
  }
}

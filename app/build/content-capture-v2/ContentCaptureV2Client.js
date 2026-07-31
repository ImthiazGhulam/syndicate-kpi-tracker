'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'start', t: 'Just getting going', s: 'Small audience, building from scratch' },
  { id: 'build', t: 'Growing steadily', s: 'Audience and results coming in, nothing on sale right now' },
  { id: 'launch', t: 'Selling right now', s: 'Doors are open or opening — a launch is on' },
  { id: 'recovery', t: 'Recovery after a launch', s: 'Doors just closed — rebuild trust, no selling for a couple of weeks' },
  { id: 'ever', t: 'Always open', s: 'People can join my offer any time' },
]

const MIX = {
  start: { reach: 3, value: 2, sales: 0 },
  build: { reach: 2, value: 2, sales: 1 },
  launch: { reach: 1, value: 1, sales: 3 },
  recovery: { reach: 55, value: 45, sales: 0 },
  ever: { reach: 2, value: 2, sales: 1 },
}

const MOMENTS = [
  { id: 'client', t: 'A client did or said something', s: 'A win, a struggle, a message, a breakthrough' },
  { id: 'receipt', t: "I've got a result or a number", s: "Mine or a client's — a figure, a screenshot, a milestone" },
  { id: 'question', t: 'I keep getting asked something', s: 'A question or objection from DMs, calls or comments' },
  { id: 'personal', t: 'Something from my own story', s: 'A mistake, a low point, a lesson, a memory' },
  { id: 'industry', t: 'Something in my industry is wrong', s: 'Advice everyone repeats that I disagree with' },
  { id: 'bts', t: "Something I'm doing this week", s: "What I'm building, running or fixing" },
]

const TYPESHORT = { client: 'Client', receipt: 'Result', question: 'Question', personal: 'My story', industry: 'Industry', bts: 'This week' }

const JOBNAMES = { reach: 'Get noticed', value: 'Build trust', sales: 'Make a sale', email: 'Email your list', longform: 'Go deeper on YouTube' }
const JOBLONG = { reach: 'a post to get noticed by new people', value: 'a post that builds trust with followers', sales: 'a post that sells to your warm audience', email: "this week's email to your list", longform: "this week's YouTube video — the deep version of a topic" }

const DAYSETS = {
  1: ['Wednesday'], 2: ['Tuesday', 'Thursday'], 3: ['Monday', 'Wednesday', 'Friday'],
  4: ['Monday', 'Tuesday', 'Thursday', 'Friday'], 5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  7: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

const CARDS = {
  c1: { nm: 'A story video, straight to camera', fmt: 'a 30–90 second spoken video script (100–220 words), delivered to camera', out: "Write it as a spoken script. First line: [ON SCREEN: what's visually in frame in second one]. Then the script. Open mid-scene with no introductions. End by turning it onto the viewer, then one button line that loops back to the opening.", cta: 'End by asking them to follow — nothing else, this reaches strangers.', dont: ['Cramming two stories into one video', 'Opening with who you are — start with what happened'] },
  c2: { nm: 'A carousel that names their problem', fmt: 'a 6–8 slide carousel post', out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1 names the problem as they feel it. Middle slides show it from inside their week. Slides 5–6 reframe the real cause — do NOT teach the full fix. Second-to-last slide speaks to the reader directly. Last slide is the ask. Then write 'CAPTION:' with a 2–3 line caption.", cta: 'Ask for a follow, or a comment word if they have a freebie.', dont: ['Teaching the full fix', 'Slide one that reads like a chapter title'] },
  c3: { nm: "A quick 'one mistake, one fix' video", fmt: 'a 30–60 second spoken video script', out: "Write it as a spoken script. First line: [ON SCREEN: ...]. Name the mistake and its cost, show the mistake, give the one-move fix, one line on why it works, turn on the viewer, end.", cta: 'Ask them to follow.', dont: ['Three mistakes in one video', "A fix that needs backstory they don't have"] },
  c4: { nm: 'A quick result post', fmt: 'a 5–15 second text-on-screen reel plus caption', out: "Write 'ON SCREEN:' with the single line of text over the footage (fully readable in one glance), then 'B-ROLL:' one line describing ordinary footage from their week, then 'CAPTION:' with 3–5 short lines of context: who, where they started, the one principle.", cta: 'The follow ask goes in the caption.', dont: ['Rounding the number', 'Explaining the whole method in the caption'] },
  c6: { nm: 'A step-by-step carousel of something you actually did', fmt: 'a 7–10 slide carousel post', out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1: the outcome with the number. One step per slide, each ending on a small open loop. Include the practitioner details only someone who's done it would know. Second-to-last: what having this changes for them. Last slide: the ask. Then 'CAPTION:' 2–3 lines.", cta: "A comment word that sends the full version or freebie. Never 'buy'.", dont: ['A sales pitch bolted onto ten slides of value', "Steps generic enough for anyone's post"] },
  c7: { nm: 'Your client\'s story, slide by slide', fmt: "an 8–10 slide carousel telling one client's transformation", out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1: the result with the number. Slides 2–3: where they were, one vivid scene not a summary. Slides 4–5: the turning point. Slides 6–7: where they are now with exact figures. Slide 8: the one principle. Then turn on the reader, then the ask. Then 'CAPTION:' 2–3 lines. The client is the hero throughout.", cta: 'A comment word for the breakdown or freebie.', dont: ['Making yourself the hero of their story', 'Skipping the struggle so the win reads as luck'] },
  c9: { nm: 'A YouTube video script', fmt: 'a script treatment for an 8–15 minute YouTube video', out: "Write '[TITLE:' a plain title for people who already follow them — no clickbait, no SEO tricks]. Then 'OPENING (word for word):' the first 60–90 seconds as a verbatim spoken script — open assuming context, as if the viewer came from their posts or emails this week. Then 3–5 'SECTION:' blocks, each with the section's point in one line plus the key spoken lines and the practitioner detail to include. Then 'CLOSE (word for word):' a verbatim ending that invites them onto the email list as the single ask.", cta: 'Join the email list — the one ask, at the close.', dont: ['Clickbait packaging for an audience that already knows you', "Holding back the good bits — the generosity is the trust engine"] },
  c11: { nm: 'A result video — the number first, the why after', fmt: 'a 30–90 second spoken video script (100–220 words)', out: "Write it as a spoken script. First line: [ON SCREEN: the number]. The result in sentence one. Then 'here's why'. The mechanism in two or three concrete beats. The takeaway, the turn on the viewer, and a button line that loops back to the number.", cta: 'A comment word for the full breakdown.', dont: ['A vague mechanism', 'Burying the number in sentence three'] },
  c12: { nm: 'Ask your audience a real question', fmt: 'a 3–4 frame story sequence with polls', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1 poses a real either/or from their week. Mark polls: [POLL: A / B]. Final frame promises the public answer within the week.", cta: 'The poll is the ask.', dont: ['Asking and never answering', 'Fake choices'] },
  c13: { nm: 'A short story email to your list', fmt: 'a 150–300 word email', out: "Write 'SUBJECT:' (the moment itself, not the lesson), then the email. Open inside the scene. Tell what happened plainly. Land the one lesson once. Sign off warm. No pitch, no PS with a link.", cta: 'Close by inviting a genuine reply.', dont: ['Three lessons in one email', "A 'quick plug before I go'"] },
  c14: { nm: 'A proof post to your warm audience', fmt: 'a 4–6 frame story sequence (or short post) to followers', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1: the result, no wind-up. Then who they were. Then the one thing that made the difference (not the method). Then one plain bridge line to the offer. Final frame: one ask.", cta: 'Buy, book, or message — stated once.', dont: ['Teaching the method', 'Stacking five clients where one would land'] },
  c15: { nm: 'Answer the objection out loud', fmt: 'a 60–120 word piece for followers', out: "Write it as a short spoken script. Open with the objection in their exact words, in quotes. Agree with the fair part honestly. Give the one fact that changes the calculation. One gentle line of arithmetic on what staying put costs. One ask.", cta: 'Message with a word, or the link.', dont: ['Answering a weaker version of what they said', 'Handling objections nobody raised'] },
  c16: { nm: 'The deadline post', fmt: 'a 3–5 frame story sequence, under 30 seconds total', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1: the fact — the date and number left, no preamble. Then the honest reason the limit exists. Then one line of proof. Then what goes when the door shuts. Final frame: the word or link. Mark: [COUNTDOWN].", cta: 'The word or the link. Nothing else.', dont: ['Apologising for selling', 'Extending the deadline after it passes'] },
  c17: { nm: 'A launch email to your list', fmt: 'a 50–150 word launch email', out: "Write 'SUBJECT:' stating the fact plainly — warm lists don't need tricking into opens. Then the email: the fact first (the date, what's closing or open), the honest reason it exists, one line of proof if a number was given, what changes either side of the line, and one link ask stated once. Short sentences. The shorter the better.", cta: 'The link, once.', dont: ['A newsletter wearing a launch email\'s timing', 'Burying the fact under a story'] },
  c18: { nm: "A 'want first look?' story sequence", fmt: 'a 3–5 frame story sequence to followers', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1: what the offer is, one line. Frame 2: who it's for and who it isn't for yet. Frame 3: the gap it closes. Frame 4: the hand-raise — 'want the details? send the word'.", cta: 'Reply with a word for the details — interest, not money.', dont: ['The full pitch in the stories', 'Running this more than every 2–3 weeks'] },
}

const ARCS = {
  scar: { n: 'Scar Story', beats: "(1) The decision. (2) The cost, with the specific figure. (3) What it revealed. (4) The rule now lived by. (5) Turn on the viewer — their version of the mistake should look expensive now. (6) Button that loops to the opening. The size of the loss implies the size of the game." },
  fall: { n: 'Fall and Rebuild', beats: "(1) The peak, with a number. (2) The collapse in one brutal line. (3) Skip the middle entirely — jump straight to the rebuilt state. (4) One lesson only. (5) Turn on the viewer. (6) Button that loops to the opening. The rebuild IS the credential." },
  imr: { n: 'In Media Res', beats: "(1) The scene, present tense, sensory — drop into the worst moment with zero context. (2) Rewind: how they got there, with any credential arriving only as scenery. (3) The turn. (4) Land the lesson back inside the opening scene. (5) Turn on the viewer. (6) Button that loops to the opening." },
  contra: { n: 'Contrarian Proof', beats: "(1) The common advice, as everyone says it. (2) The bet against it. (3) The result, with the number. (4) The nuance — when the common advice IS right. This beat is mandatory; it's what keeps the piece honest instead of clickbait. (5) Turn on the viewer. (6) Button that loops to the opening." },
  borrowed: { n: 'Borrowed Arc', beats: "(1) Where the client was — one vivid scene, never a summary. (2) The turning point in the work. (3) Where they are now, exact figures. (4) The principle that made the difference, stated once. (5) Turn on the viewer — someone like them should think 'that could be me'. (6) Button. The client is the hero; the writer is only the guide who was once where they were." },
  receipt: { n: 'Receipt Drop', beats: "(1) The receipt in sentence one. (2) 'Here's why.' (3) The mechanism in two or three concrete beats. (4) The takeaway. (5) Turn on the viewer. (6) Button that loops back to the number." },
}

// Base enrichment questions per moment type — used as fallback
const ENRICH_BASE = {
  client: [['scene', 'Paint the scene — what actually happened?', 'Where were you, what was said, what did you see.'], ['verb', 'What did they actually say, word for word?', 'The exact line. Skip if nothing was said.'], ['num', 'Is there a number in it?', 'A figure, a timeframe, a count. Skip if not.']],
  receipt: [['num', "What's the exact number?", 'Exact beats rounded. £4,215 beats £4K.'], ['scene', "What's the story behind it?", 'Where did this start, what was it before.'], ['change', 'The one thing that made the difference?', 'One move, not the whole method.']],
  question: [['verb', 'What do they ask, word for word?', 'The exact phrasing is your opening line.'], ['scene', 'When did it last come up?', 'The DM, the call, the comment.'], ['change', 'Your honest answer in one line?', "The short version you'd give a mate."]],
  personal: [['scene', 'Take me to the moment — where were you?', 'Present tense if you can. The room, the day.'], ['num', 'Any numbers or dates in it?', 'The year, the figure, the cost. Skip if not.'], ['change', 'What changed after?', 'The before and the after, however small.']],
  industry: [['verb', "What's the advice everyone repeats?", "Their words, the way it's always said."], ['change', 'What do you believe instead?', 'Your actual position, one line.'], ['num', 'A result that backs you up?', "Honest answer — skip if not yet."]],
  bts: [['scene', 'What are you working on this week?', 'The thing itself, plainly.'], ['change', "What will be different when it's done?", 'For you or for them.'], ['num', 'Any numbers attached?', 'Dates, counts, targets. Skip if not.']],
}

// Job-adapted enrichment — different questions depending on whether reach, value, or sales
function getEnrichQuestions(momentType, job) {
  if (job === 'sales') {
    switch (momentType) {
      case 'client': return [
        ['scene', 'What happened with this client?', 'The situation, the struggle, or the win — the part a prospect would see themselves in.'],
        ['num', "What's the measurable result?", 'Revenue, timeline, percentage — the number that proves it worked.'],
        ['change', 'What would they say to someone on the fence?', "The line they'd use to describe the change, in their words."],
      ]
      case 'receipt': return [
        ['num', "What's the exact number?", 'Exact beats rounded. £4,215 beats £4K.'],
        ['scene', 'Whose result is this, and where did they start?', 'Name (or anonymised), and what life looked like before.'],
        ['change', 'What about your offer made this result possible?', 'The specific thing in your programme that drove it.'],
      ]
      case 'question': return [
        ['verb', 'What objection or question did they raise?', 'Their exact words — this becomes the opening line.'],
        ['scene', 'What context were they in when they asked?', 'DM, call, comment — and what stage of buying were they at.'],
        ['change', 'What fact about your offer dissolves this objection?', 'The specific mechanic or guarantee that changes the calculation.'],
      ]
      default: return ENRICH_BASE[momentType] || ENRICH_BASE.client
    }
  }
  if (job === 'value') {
    switch (momentType) {
      case 'client': return [
        ['scene', 'Walk me through what happened — the before and the turn.', 'The scene where things changed for them. One vivid detail beats a summary.'],
        ['verb', 'What did they actually say?', 'The exact line — this carries the emotion the method description never can.'],
        ['change', 'What principle or step made the difference?', 'The one thing from your method that unlocked it — not the whole system, the lever.'],
      ]
      case 'receipt': return [
        ['num', "What's the exact number?", 'Exact beats rounded. £4,215 beats £4K.'],
        ['change', "What's the mechanism behind this result?", "Not 'consistency' — the actual move. What did you or they do differently."],
        ['scene', 'What was the situation before this number existed?', 'The contrast is what makes the result land.'],
      ]
      case 'question': return [
        ['verb', 'What do they ask, word for word?', 'The exact phrasing is your opening line.'],
        ['change', 'What do most people get wrong about this?', 'The reframe — the thing they haven\'t considered.'],
        ['scene', 'Can you show a real example of the right approach?', 'A client, a number, a before/after that proves the reframe.'],
      ]
      case 'bts': return [
        ['scene', 'What exactly are you building or doing?', 'The specific task, plainly described.'],
        ['change', 'What will this change for your clients?', 'The outcome they care about, not the feature.'],
        ['num', 'Any numbers — timeline, count, target?', 'Skip if not.'],
      ]
      default: return ENRICH_BASE[momentType] || ENRICH_BASE.client
    }
  }
  // Reach (default) — designed for cold audience, pattern interrupt, relatability
  switch (momentType) {
    case 'client': return [
      ['scene', 'Paint the scene — what actually happened?', 'Where were you, what was said, what did you see. Cold audiences need the movie, not the summary.'],
      ['verb', 'What did they actually say, word for word?', 'The exact line — this is what stops the scroll.'],
      ['num', 'Is there a number in it?', 'A figure, a timeframe, a count. Skip if not.'],
    ]
    case 'personal': return [
      ['scene', 'Take me to the moment — where were you?', 'Present tense if you can. The room, the day, the feeling. Strangers need to see the scene.'],
      ['num', 'Any numbers or dates in it?', 'The year, the figure, the cost. Specifics stop scrollers.'],
      ['change', 'What changed after?', 'The before and the after — the contrast is what makes a stranger care.'],
    ]
    case 'industry': return [
      ['verb', "What's the advice everyone repeats?", "Their words, the way it's always said. The more recognisable, the better the pattern interrupt."],
      ['change', 'What do you believe instead?', 'Your actual position, one line. The bet against the crowd.'],
      ['num', 'A result that backs you up?', "Without a number, this is just an opinion. With one, it's proof."],
    ]
    default: return ENRICH_BASE[momentType] || ENRICH_BASE.client
  }
}

// Legacy accessor for code that just needs type-based questions
const ENRICH = ENRICH_BASE

// Format options per job — the user picks which format the piece gets written in
const FORMAT_OPTIONS = {
  reach: [
    { id: 'talking-head', label: 'Talking Head Reel', desc: 'You to camera, 30–90 seconds', icon: '🎬' },
    { id: 'text-reel', label: 'Text Reel', desc: 'B-roll with text overlay, 5–15 seconds', icon: '📱' },
    { id: 'carousel', label: 'Carousel', desc: '6–8 slides, the save format', icon: '📊' },
    { id: 'green-screen', label: 'Green Screen', desc: 'You reacting to something on screen', icon: '🟩' },
    { id: 'skit', label: 'Skit / POV', desc: 'Acted scenario, pattern interrupt', icon: '🎭' },
  ],
  value: [
    { id: 'carousel', label: 'Carousel', desc: '7–10 slides, method or case study', icon: '📊' },
    { id: 'talking-head', label: 'Talking Head Reel', desc: 'You to camera explaining or proving', icon: '🎬' },
    { id: 'screen-recording', label: 'Screen Recording', desc: 'Show the work, the tool, the process', icon: '🖥️' },
    { id: 'story-sequence', label: 'Story Sequence', desc: '3–8 frames to warm audience', icon: '📖' },
    { id: 'youtube', label: 'YouTube Script', desc: '8–15 min deep video', icon: '▶️' },
  ],
  sales: [
    { id: 'story-sequence', label: 'Story Sequence', desc: '4–6 frames, proof or deadline', icon: '📖' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Direct to followers, 30–60 seconds', icon: '🎬' },
    { id: 'testimonial', label: 'Testimonial / Screenshot', desc: 'Client result or DM receipt', icon: '💬' },
    { id: 'carousel', label: 'Case Study Carousel', desc: 'Client transformation slide by slide', icon: '📊' },
  ],
  email: [
    { id: 'story-email', label: 'Story Email', desc: '150–300 words, one lesson, no pitch', icon: '✉️' },
    { id: 'launch-email', label: 'Launch Email', desc: '50–150 words, fact first, one link', icon: '🚀' },
  ],
  longform: [
    { id: 'youtube', label: 'YouTube Script', desc: '8–15 min deep video', icon: '▶️' },
  ],
}

// Map format choice to generation instructions
const FORMAT_PROMPTS = {
  'talking-head': { fmt: 'a 30–90 second spoken video script (100–220 words), delivered to camera', out: "Write it as a spoken script. First line: [ON SCREEN: what's visually in frame in second one]. Then the script. Open mid-scene with no introductions. End by turning it onto the viewer, then one button line that loops back to the opening." },
  'text-reel': { fmt: 'a 5–15 second text-on-screen reel plus caption', out: "Write 'ON SCREEN:' with the single line of text over the footage (fully readable in one glance), then 'B-ROLL:' one line describing ordinary footage from their week, then 'CAPTION:' with 3–5 short lines of context." },
  'carousel': { fmt: 'a 6–10 slide carousel post', out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1 is the hook — one claim, one outcome, one tension. One idea per slide. Second-to-last slide turns on the reader. Last slide is the ask. Then 'CAPTION:' with a 2–3 line caption." },
  'green-screen': { fmt: 'a 30–60 second green screen reaction video script', out: "Write it as a spoken script. First line: [ON SCREEN: the article/screenshot/post being reacted to]. Your first line names what's wrong, surprising or useful. Two or three beats of commentary. The takeaway in your frame, not theirs. Turn and button." },
  'skit': { fmt: 'a 15–45 second skit or POV video', out: "Write 'ON SCREEN TEXT: POV: {{scenario}}'. Then describe the scene: what happens, played straight. One turn — the exaggeration or reveal. Then 'CAPTION:' landing the real point in one line." },
  'screen-recording': { fmt: 'a 45–90 second screen recording walkthrough', out: "Write it as a narrated walkthrough. Hook names the outcome first. Then step by step: 'SCREEN: [what's visible]' followed by 'NARRATION: [what you say]' for each step. End on the finished state." },
  'story-sequence': { fmt: 'a 3–8 frame story sequence', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1 opens a loop. Each frame earns the tap to the next. Mix media suggestions: [TALKING CLIP], [SCREENSHOT], [TEXT FRAME], [POLL]. Final frame carries the CTA." },
  'testimonial': { fmt: 'a testimonial or social proof post', out: "Open on the result or strongest line — never 'so tell us about yourself'. Where they were, in their words, one vivid detail. The turn: what changed. Where they are now, with a number. Your frame in the caption: the principle that made the difference." },
  'youtube': { fmt: 'a script treatment for an 8–15 minute YouTube video', out: "Write '[TITLE:' a plain title for people who already follow]. Then 'OPENING (word for word):' 60–90 seconds spoken. Then 3–5 'SECTION:' blocks with key points and spoken lines. Then 'CLOSE (word for word):' ending that invites onto the email list." },
  'story-email': { fmt: 'a 150–300 word email', out: "Write 'SUBJECT:' (the moment itself, not the lesson), then the email. Open inside the scene. Tell what happened plainly. Land the one lesson once. Sign off warm. No pitch, no PS with a link." },
  'launch-email': { fmt: 'a 50–150 word launch email', out: "Write 'SUBJECT:' stating the fact plainly. Then the email: the fact first, the honest reason it exists, one line of proof if given, what changes either side of the line, one link ask stated once. Short sentences." },
}

const BUILD_LINES = [
  'Reading your moment...', 'Picking the shape...', 'Writing in your voice...', 'Sharpening the hook...', 'Checking the ask matches the job...',
]

const GOAL_MIX = {
  growth: { reach: 60, value: 30, sales: 10 },
  trust: { reach: 25, value: 60, sales: 15 },
  conversion: { reach: 15, value: 25, sales: 60 },
}

const GOALS = [
  { id: 'growth', t: 'More people finding me', s: 'Growth-weighted week — most posts reach new people' },
  { id: 'trust', t: 'Turning followers into believers', s: 'Trust-weighted week — most posts deepen belief' },
  { id: 'conversion', t: 'Driving sales', s: 'Conversion-weighted week — most posts sell to warm audience' },
  { id: 'default', t: 'Not sure — set it from my stage', s: 'Use the default ratios for your current stage' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function mixFor(stage, n, goal) {
  const stageBase = MIX[stage] || MIX.build
  const noSales = stageBase.sales === 0
  let base = (goal && goal !== 'default' && GOAL_MIX[goal]) ? GOAL_MIX[goal] : stageBase
  // If stage forbids sales, redistribute sales share into reach and value proportionally
  if (noSales && base.sales > 0) {
    const rv = base.reach + base.value
    base = { reach: Math.round(base.reach * 100 / rv), value: Math.round(base.value * 100 / rv), sales: 0 }
  }
  const t = base.reach + base.value + base.sales
  if (t === 0) return { reach: n, value: 0, sales: 0 }
  const raw = { reach: n * base.reach / t, value: n * base.value / t, sales: n * base.sales / t }
  const out = { reach: Math.floor(raw.reach), value: Math.floor(raw.value), sales: Math.floor(raw.sales) }
  let left = n - (out.reach + out.value + out.sales)
  const rem = [['reach', raw.reach - out.reach], ['value', raw.value - out.value], ['sales', raw.sales - out.sales]].sort((a, b) => b[1] - a[1])
  for (const [k] of rem) { if (left <= 0) break; if (k === 'sales' && noSales) continue; out[k]++; left-- }
  while (left > 0) { out.reach++; left-- }
  if (n > 0 && out.reach === 0) { out.reach = 1; if (out.value > 0) out.value--; else if (out.sales > 0) out.sales-- }
  return out
}

function assignDays(n) {
  if (n <= 7) return (DAYSETS[n] || DAYSETS[5]).slice()
  const week = DAYSETS[7]
  const out = []
  const tally = {}
  for (let i = 0; i < n; i++) { const day = week[i % 7]; tally[day] = (tally[day] || 0) + 1; out.push(day) }
  const seen = {}
  return out.map(day => { if (tally[day] > 1) { seen[day] = (seen[day] || 0) + 1; return day + ' · post ' + seen[day] } return day })
}

function pickArc(momId, m, cardId) {
  if (cardId === 'c7') return ARCS.borrowed
  if (cardId === 'c11') return ARCS.receipt
  if (cardId === 'c1') {
    if (momId === 'industry') return ARCS.contra
    if (momId === 'personal') {
      if (m && m.enrichment && m.enrichment.num && m.enrichment.num.trim()) return ARCS.scar
      if (m && m.enrichment && m.enrichment.scene && m.enrichment.scene.trim()) return ARCS.imr
      return ARCS.fall
    }
    return ARCS.imr
  }
  return null
}

function routeMoment(momId, job, hasNum, userStage) {
  if (job === 'email') return { card: userStage === 'launch' ? 'c17' : 'c13' }
  if (job === 'longform') return { card: 'c9' }
  if (job === 'sales') {
    if (momId === 'client' || momId === 'receipt') return { card: 'c14' }
    if (momId === 'question') return { card: 'c15' }
    if (momId === 'bts' && userStage === 'launch') return { card: 'c16' }
    return { card: 'c18' }
  }
  if (job === 'value') {
    if (momId === 'client') return { card: 'c7' }
    if (momId === 'receipt') return { card: 'c11' }
    if (momId === 'question' || momId === 'bts') return { card: 'c6' }
    if (momId === 'personal') return { card: 'c13' }
    return { card: 'c6' }
  }
  if (momId === 'personal') return { card: 'c1' }
  if (momId === 'industry') {
    if (hasNum) return { card: 'c1' }
    return { card: 'c2', swap: "No result attached to the disagreement yet, so this runs as a problem-naming post. Get the receipt and it becomes a far stronger \"I did the opposite\" story." }
  }
  if (momId === 'receipt') return { card: 'c4' }
  if (momId === 'question') return { card: 'c3' }
  if (momId === 'client') return { card: 'c4' }
  return { card: 'c3' }
}

function buildPrompt(c, m, redoNote, arc, ctx, cardKey) {
  const e = m.enrichment || {}
  const facts = [`The moment, in their words: "${m.line}"`]
  if (e.scene) facts.push(`The scene: "${e.scene}"`)
  if (e.verb) facts.push(`Said word for word: "${e.verb}"`)
  if (e.num) facts.push(`The number: "${e.num}"`)
  if (e.change) facts.push(`What changed: "${e.change}"`)

  // Selective context injection based on card type
  const isStory = ['c1', 'c7', 'c11', 'c13'].includes(cardKey)
  const isReach = ['c1', 'c2', 'c3', 'c4'].includes(cardKey)
  const isValue = ['c6', 'c7', 'c9', 'c11', 'c12', 'c13'].includes(cardKey)
  const isSales = ['c14', 'c15', 'c16', 'c17', 'c18'].includes(cardKey)
  const isYouTube = cardKey === 'c9'
  const isObjection = cardKey === 'c15'

  let brandContext = ''
  let voiceOverride = ''
  if (ctx) {
    const lines = []

    // REACH cards: Brand Star positioning (who they serve, contrarian belief, personality)
    if (isReach && ctx.positioning) {
      if (ctx.positioning.worksWithDesc) lines.push(`Who they work with: ${ctx.positioning.worksWithDesc}`)
      if (ctx.positioning.refuses) lines.push(`Who they refuse: ${ctx.positioning.refuses}`)
      if (ctx.positioning.contrarian) lines.push(`Contrarian belief: ${ctx.positioning.contrarian}`)
      if (ctx.positioning.whatYouDo) lines.push(`What they do: ${ctx.positioning.whatYouDo}`)
      if (ctx.positioning.sector) lines.push(`Sector: ${ctx.positioning.sector}`)
      if (ctx.positioning.personality) lines.push(`Brand personality: ${ctx.positioning.personality}`)
    }

    // VALUE cards: Distinction Engine + Remarkable
    if (isValue) {
      if (ctx.distinction) {
        if (ctx.distinction.engineName) lines.push(`Method name: ${ctx.distinction.engineName}`)
        if (ctx.distinction.promise) lines.push(`Method promise: ${ctx.distinction.promise}`)
        if (ctx.distinction.problems.length) lines.push(`Problems solved: ${ctx.distinction.problems.join(', ')}`)
        if (ctx.distinction.pillars.length) lines.push(`Pillars: ${ctx.distinction.pillars.join(', ')}`)
      }
      if (ctx.remarkable) {
        if (ctx.remarkable.differentiator) lines.push(`Key differentiator: ${ctx.remarkable.differentiator}`)
        if (ctx.remarkable.mechanism) lines.push(`Mechanism: ${ctx.remarkable.mechanism}`)
      }
    }

    // STORY cards: Hero data
    if (isStory && ctx.hero) {
      if (ctx.hero.origin) lines.push(`Origin story: ${ctx.hero.origin}`)
      if (ctx.hero.turningPoint) lines.push(`Turning point: ${ctx.hero.turningPoint}`)
      if (ctx.hero.gift) lines.push(`What they give clients: ${ctx.hero.gift}`)
      if (ctx.hero.why) lines.push(`Their why: ${ctx.hero.why}`)
      if (ctx.hero.identityLabel) lines.push(`Identity label: ${ctx.hero.identityLabel}`)
    }

    // SALES cards: full Sold Out context (ICP, Bang Bang, Dip)
    if (isSales) {
      if (ctx.offer) {
        if (ctx.offer.offerName) lines.push(`Offer name: ${ctx.offer.offerName}`)
        if (ctx.offer.corePromise) lines.push(`Offer promise: ${ctx.offer.corePromise}`)
        if (ctx.offer.price) lines.push(`Offer price: £${ctx.offer.price}`)
        if (ctx.offer.whoItsFor) lines.push(`Offer is for: ${ctx.offer.whoItsFor}`)
        if (ctx.offer.whoItsNotFor) lines.push(`Offer is NOT for: ${ctx.offer.whoItsNotFor}`)
        if (ctx.offer.guaranteeType) lines.push(`Guarantee: ${ctx.offer.guaranteeType}${ctx.offer.guarantee ? ' — ' + ctx.offer.guarantee : ''}`)
        if (ctx.offer.scarcity) lines.push(`Scarcity: ${ctx.offer.scarcity}`)
        if (ctx.offer.deliveryModel) lines.push(`Delivery: ${ctx.offer.deliveryModel}`)
        if (ctx.offer.resultsNumbers) lines.push(`Results numbers: ${ctx.offer.resultsNumbers}`)
        if (ctx.offer.bigNames) lines.push(`Notable clients: ${ctx.offer.bigNames}`)
        if (ctx.offer.continuityOffer) lines.push(`After the programme: ${ctx.offer.continuityOffer}`)
        if (ctx.offer.ctaAction) lines.push(`CTA: ${ctx.offer.ctaAction}`)
        if (ctx.offer.dipName) lines.push(`Micro offer (The Dip): ${ctx.offer.dipName}${ctx.offer.dipPrice ? ' — £' + ctx.offer.dipPrice : ''}`)
        if (ctx.offer.dipPromise) lines.push(`Micro offer promise: ${ctx.offer.dipPromise}`)
        if (ctx.offer.dipProblem) lines.push(`Micro offer solves: ${ctx.offer.dipProblem}`)
        if (ctx.offer.dipBridge) lines.push(`Bridge to main offer: ${ctx.offer.dipBridge}`)
      }
      if (ctx.icp) {
        if (ctx.icp.pains) lines.push(`Their core pains: ${ctx.icp.pains}`)
        if (ctx.icp.costOfInaction) lines.push(`Cost of doing nothing: ${ctx.icp.costOfInaction}`)
        if (ctx.icp.triggerMoment) lines.push(`What makes them act: ${ctx.icp.triggerMoment}`)
        // Objection post gets the full objections list verbatim
        if (isObjection && ctx.icp.realObjections) lines.push(`Real objections heard from this audience (use verbatim): ${ctx.icp.realObjections}`)
      }
      if (ctx.programmeDuration) lines.push(`Programme duration: ${ctx.programmeDuration}`)
    }

    // YouTube (c9) exception: gets method + offer name only for the soft close-mention
    if (isYouTube && ctx.offer) {
      if (ctx.offer.offerName) lines.push(`Offer name (for the single soft mention at the close only): ${ctx.offer.offerName}`)
    }

    if (lines.length > 0) {
      const header = isSales
        ? `\nTHIS PERSON'S BRAND AND OFFER (use to shape the selling — reference the offer, price, proof and objections directly):`
        : `\nTHIS PERSON'S BRAND CONTEXT (use to guide tone and positioning — do NOT mention any offer, programme name, or price):`
      brandContext = `${header}\n${lines.join('\n')}`
    }

    // Voice profile — ALWAYS injected, every card
    if (ctx.voice) {
      const vl = []
      if (ctx.voice.directness) vl.push(`Directness: ${ctx.voice.directness}`)
      if (ctx.voice.formality) vl.push(`Formality: ${ctx.voice.formality}`)
      if (ctx.voice.phrasesUse) vl.push(`Phrases they actually use: ${ctx.voice.phrasesUse}`)
      if (ctx.voice.phrasesAvoid) vl.push(`Phrases they would NEVER use: ${ctx.voice.phrasesAvoid}`)
      if (vl.length > 0) {
        voiceOverride = `\nTHIS PERSON'S VOICE PROFILE (override the generic voice rules below with these specifics — this is how they actually talk):
${vl.join('\n')}`
      }
    }
  }

  return `WHAT TO WRITE: ${c.fmt}.
FORMAT INSTRUCTIONS: ${c.out}
THE CALL TO ACTION: ${c.cta}
${arc ? `
STORY ARC — ${arc.n}. Follow these beats in this order, one arc only, never blended with another:
${arc.beats}
STORY RULES: The reader or viewer is the hero — the writer is only the guide who was once where they are. Credentials are never announced, only leaked as scenery ("back when I was..." never "as a successful..."). The villain must be a scene, not an abstract noun. The turn back onto the viewer is mandatory — without it, this is just someone talking about themselves.` : ''}
${brandContext}

THE ONLY FACTS YOU MAY USE:
${facts.join('\n')}

ABSOLUTE RULE — NO INVENTION: never invent names, numbers, results, dates, clients or details not in the facts above. If a detail is genuinely needed but missing, write a placeholder in this exact form: {{WHAT'S NEEDED}}. Two honest placeholders beat one invented fact.
${voiceOverride}

VOICE (non-negotiable baseline — the person's voice profile above takes priority where it specifies something different):
- British English. Sounds like a voice note to a mate, not a crafted marketing piece.
- Vary sentence length deliberately — short punches, the occasional longer one that builds. No droning.
- No em-dashes. No "It's not X. It's Y." constructions. No three-part parallel lists.
- No memo words: never "however", "therefore", "moreover", "furthermore", "additionally".
- Connect beats with tension and consequence: but / so / which is why / problem was. "And then" is banned — if it fits a gap, that gap carries no story.
- Specifics over adjectives. Use their exact words and numbers wherever given.
- The reader should finish confronted by themselves, not impressed by the writer.
- If the voice profile says they use specific phrases, work those in naturally. If it says they'd never use certain phrases, avoid them completely.
${redoNote ? `\nTHE LAST DRAFT WASN'T RIGHT: ${redoNote} Take a genuinely different angle.` : ''}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function DimLabel({ children }) {
  return <p className="text-zinc-500 text-sm mb-5 max-w-xl">{children}</p>
}

function Question({ children }) {
  return <h1 className="text-2xl font-bold font-display tracking-tight mb-1">{children}</h1>
}

function OptionButton({ children, sub, selected, onClick }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition border ${selected ? 'bg-gold/10 text-gold border-gold/30' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'}`}>
      {children}
      {sub && <span className="block text-zinc-500 text-xs mt-1 font-normal">{sub}</span>}
    </button>
  )
}

function Btn({ children, onClick, disabled, gold }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${gold ? 'bg-gold hover:bg-gold-light text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
      {children}
    </button>
  )
}

function NoteBox({ children, gold }) {
  return (
    <div className={`border-l-2 ${gold ? 'border-gold' : 'border-zinc-700'} px-4 py-3 bg-zinc-900 text-sm text-zinc-400 rounded-r mt-3`}>
      {children}
    </div>
  )
}

function LogLine({ moment, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-2 text-sm">
      <span className="text-xs font-bold text-gold/60 uppercase tracking-widest min-w-[78px]">{TYPESHORT[moment.type]}</span>
      <span className="flex-1 text-white">{moment.line}</span>
      <button onClick={onDelete} className="text-zinc-600 hover:text-white px-1">×</button>
    </div>
  )
}

function WritingScreen({ line, label }) {
  return (
    <div className="text-center py-16">
      <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gold text-sm font-bold uppercase tracking-widest animate-pulse mb-2">{label || 'WRITING YOUR PIECE'}</p>
      {line && <p className="text-zinc-500 text-sm">{line}</p>}
    </div>
  )
}

function PieceCard({ title, subtitle, piece, swap, dont, onCopy, onRewrite, onToEmail, onToYT }) {
  const [copied, setCopied] = useState(false)
  const [showDont, setShowDont] = useState(false)

  function handleCopy() {
    if (piece && navigator.clipboard) navigator.clipboard.writeText(piece)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  function renderPiece(text) {
    if (!text) return <span className="text-zinc-500">This one didn't write. Tap rewrite to try again.</span>
    return text.split(/(\{\{[^}]+\}\})/).map((part, i) =>
      part.startsWith('{{') ? <span key={i} className="text-gold font-bold text-xs">{part}</span> : part
    )
  }

  return (
    <div className="glass-card p-5 mb-3">
      <div className="flex justify-between items-baseline mb-3 gap-3 flex-wrap">
        <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{title}</h4>
        {subtitle && <span className="text-xs text-zinc-600 uppercase tracking-widest">{subtitle}</span>}
      </div>
      {swap && <NoteBox gold><span className="text-gold font-bold">One switch made:</span> {swap}</NoteBox>}
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300 mt-3">{renderPiece(piece)}</div>
      {piece && piece.includes('{{') && (
        <NoteBox gold><span className="text-gold font-bold">The gold gaps are yours.</span> Details you didn't give — nothing was made up. Drop the real thing in and it's done.</NoteBox>
      )}
      {dont && dont.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowDont(!showDont)} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-400">
            {showDont ? '− ' : '+ '}What to avoid
          </button>
          {showDont && <NoteBox>{dont.map((k, i) => <span key={i}>× {k}<br /></span>)}</NoteBox>}
        </div>
      )}
      <div className="flex gap-2 mt-4 flex-wrap">
        <Btn gold onClick={onCopy || handleCopy} disabled={!piece}>{copied ? 'Copied' : 'Copy it'}</Btn>
        {onRewrite && <Btn onClick={onRewrite}>Rewrite it</Btn>}
        {onToEmail && <Btn onClick={onToEmail}>→ Email version</Btn>}
        {onToYT && <Btn onClick={onToYT}>→ YouTube version</Btn>}
      </div>
    </div>
  )
}

function Modal({ open, title, body, options, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="glass-card max-w-[560px] w-full p-7 relative mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-xl text-zinc-600 hover:text-white">×</button>
        <h3 className="text-lg font-bold font-display tracking-tight text-gold mb-3">{title}</h3>
        <p className="text-sm text-zinc-400 mb-4">{body}</p>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <OptionButton key={i} onClick={opt[1]}>{opt[0]}</OptionButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function BottomSheet({ open, title, subtitle, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-zinc-950 border-t border-gold/20 rounded-t-xl max-w-[680px] w-full p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <GoldLabel>{title}</GoldLabel>
        {subtitle && <p className="text-xs text-zinc-500 mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

const SALES_ANGLES = [
  { id: 'main-offer', t: 'My main offer', s: 'Your core programme' },
  { id: 'micro-offer', t: 'My micro offer / The Dip', s: 'Lower-barrier entry product' },
  { id: 'seasonal', t: 'Seasonal or event-based', s: 'Black Friday, New Year, back to school, etc.' },
  { id: 'new-launch', t: 'Something brand new', s: 'A new offer or programme launching' },
  { id: 'waitlist', t: 'Waitlist / coming soon', s: 'Building interest before doors open' },
  { id: 'testimonial-push', t: 'Proof and social proof', s: 'Client results driving the sale' },
]

function SlotCard({ job, moment, onPick, onCapture, onClear, salesAngle, onSalesAngle, offerContext }) {
  const [expanded, setExpanded] = useState(false)
  const [capType, setCapType] = useState('client')
  const [capLine, setCapLine] = useState('')

  if (moment) {
    return (
      <div className="rounded-lg border p-4 mb-2 bg-zinc-900 border-zinc-800">
        <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
        <p className="text-sm text-zinc-300 py-1">{moment.line}</p>
        <div className="flex gap-3">
          <button onClick={onPick} className="text-xs font-bold text-gold/50 hover:text-gold uppercase tracking-widest pt-1">Change</button>
          <button onClick={onClear} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest pt-1">Clear</button>
        </div>
      </div>
    )
  }

  if (!expanded) {
    return (
      <div className="rounded-lg border p-4 mb-2 bg-zinc-900/50 border-zinc-800/50">
        <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
        <div className="flex gap-2 mt-2">
          <button onClick={() => setExpanded(true)} className="text-xs font-bold text-gold/50 hover:text-gold uppercase tracking-widest">+ Capture here</button>
          <button onClick={onPick} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest">Pick from log</button>
        </div>
      </div>
    )
  }

  // Sales angle picker for sales slots
  if (job === 'sales' && !salesAngle) {
    return (
      <div className="rounded-lg border p-4 mb-2 bg-zinc-900 border-gold/20">
        <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
        <p className="text-sm text-zinc-400 mt-2 mb-3">What are you selling in this post?</p>
        {offerContext && (offerContext.offerName || offerContext.dipName) && (
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-3 border border-zinc-700/50">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">From your playbooks</span>
            {offerContext.offerName && <p className="text-xs text-zinc-300 mt-1">Main offer: <span className="text-gold">{offerContext.offerName}</span>{offerContext.price ? ` — £${offerContext.price}` : ''}</p>}
            {offerContext.dipName && <p className="text-xs text-zinc-300 mt-1">Micro offer: <span className="text-gold">{offerContext.dipName}</span>{offerContext.dipPrice ? ` — £${offerContext.dipPrice}` : ''}</p>}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {SALES_ANGLES.map(a => (
            <button key={a.id} onClick={() => onSalesAngle(a.id)} className="text-left px-3 py-2 rounded-lg text-sm border bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition">
              <span className="font-bold text-white">{a.t}</span>
              <span className="block text-xs text-zinc-500">{a.s}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setExpanded(false)} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest mt-3">← Cancel</button>
      </div>
    )
  }

  // Capture: type selector + one-line input only — enrichment happens in "Flesh them out"
  function submit() {
    if (!capLine.trim()) return
    onCapture(capType, capLine.trim(), {}, salesAngle)
    setCapLine('')
    setExpanded(false)
  }

  return (
    <div className="rounded-lg border p-4 mb-2 bg-zinc-900 border-gold/20">
      <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
      {job === 'sales' && salesAngle && (
        <p className="text-xs text-zinc-500 mt-1">Selling: {SALES_ANGLES.find(a => a.id === salesAngle)?.t}</p>
      )}
      <div className="flex gap-1.5 flex-wrap mt-3 mb-2">
        {MOMENTS.map(m => (
          <button key={m.id} onClick={() => setCapType(m.id)}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition border ${capType === m.id ? 'bg-gold/10 text-gold border-gold/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'}`}>
            {TYPESHORT[m.id]}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={capLine} onChange={e => setCapLine(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="One line — what happened?"
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-sm" />
        <Btn gold onClick={submit}>→</Btn>
      </div>
      <button onClick={() => { setExpanded(false); setCapLine('') }} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest mt-2">← Cancel</button>
    </div>
  )
}

function DialRing({ pct, color, trackColor, size = 64, stroke = 5 }) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (circ * animated / 100)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 50)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
    </svg>
  )
}

function MixDials({ reach, value, sales, total }) {
  const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0
  const items = [
    { label: 'Reach', count: reach, color: '#10b981', track: 'rgba(16,185,129,0.15)' },
    { label: 'Trust', count: value, color: '#3b82f6', track: 'rgba(59,130,246,0.15)' },
    { label: 'Sales', count: sales, color: '#C9A84C', track: 'rgba(201,168,76,0.15)' },
  ]
  return (
    <div className="flex justify-around items-center">
      {items.map(it => (
        <div key={it.label} className="flex flex-col items-center gap-1">
          <div className="relative">
            <DialRing pct={pct(it.count)} color={it.color} trackColor={it.track} size={56} stroke={4} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{pct(it.count)}%</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{it.label}</span>
          <span className="text-xs font-bold text-zinc-400">{it.count} post{it.count !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  )
}

function Stepper({ label, note, value, onMinus, onPlus, minDisabled, maxDisabled }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 mb-2 flex items-center justify-between gap-3">
      <div>
        <span className="text-xs font-bold text-gold uppercase tracking-widest">{label}</span>
        <div className="text-xs text-zinc-500 mt-1">{note}</div>
      </div>
      <div className="flex items-center gap-3">
        <Btn onClick={onMinus} disabled={minDisabled}>−</Btn>
        <span className="font-display text-lg font-bold text-gold min-w-[16px] text-center">{value}</span>
        <Btn onClick={onPlus} disabled={maxDisabled}>+</Btn>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ContentCaptureV2Client() {
  const router = useRouter()
  const [clientId, setClientId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Profile
  const [stage, setStage] = useState(null)
  const [hasList, setHasList] = useState(null)
  const [doesYT, setDoesYT] = useState(null)
  const [piecesN, setPiecesN] = useState(null)
  const [emailN, setEmailN] = useState(null)
  const [ytN, setYtN] = useState(null)

  // Capture log
  const [log, setLog] = useState([])
  const [capType, setCapType] = useState('client')
  const [capLine, setCapLine] = useState('')

  // Screen
  const [screen, setScreen] = useState('loading')

  // Quick mode
  const [quickMoment, setQuickMoment] = useState(null)
  const [quickJob, setQuickJob] = useState(null)
  const [enrichIdx, setEnrichIdx] = useState(0)
  const [quickPiece, setQuickPiece] = useState(null)
  const [quickCard, setQuickCard] = useState(null)
  const [quickRoute, setQuickRoute] = useState(null)
  const [quickArc, setQuickArc] = useState(null)

  // Weekly mode
  const [weekGoal, setWeekGoal] = useState(null)
  const [weekSlots, setWeekSlots] = useState([])
  const [salesAngles, setSalesAngles] = useState({})
  const [weekIdx, setWeekIdx] = useState(0)
  const [weekPieces, setWeekPieces] = useState([])
  const [aiQuestions, setAiQuestions] = useState(null)
  const [aiQLoading, setAiQLoading] = useState(false)
  const [chosenFormats, setChosenFormats] = useState({})

  // Modals
  const [modal, setModal] = useState(null)
  const [picker, setPicker] = useState(null)

  // Writing state
  const [writing, setWriting] = useState(false)
  const [writingLine, setWritingLine] = useState('')

  // Flow context: where to go after stage/channels
  const [afterChannels, setAfterChannels] = useState('home')

  // Playbook data (loaded once for AI context)
  const [playbookContext, setPlaybookContext] = useState(null)

  const saveTimer = useRef(null)

  // ── Auth + Load ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: client } = await supabase.from('clients').select('id').eq('email', user.email).maybeSingle()
      if (!client) { router.push('/login'); return }
      setClientId(client.id)

      // Load profile
      const { data: profile, error: profileError } = await supabase.from('cc_profiles').select('*').eq('client_id', client.id).maybeSingle()
      if (profileError) console.warn('cc_profiles table may not exist yet:', profileError.message)
      if (profile) {
        setStage(profile.stage)
        setHasList(profile.has_list)
        setDoesYT(profile.does_yt)
        setPiecesN(profile.pieces_per_week)
        setEmailN(profile.email_count)
        setYtN(profile.yt_count)
      }

      // Load capture log
      const { data: logData, error: logError } = await supabase.from('cc_capture_log').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      if (logError) console.warn('cc_capture_log table may not exist yet:', logError.message)
      if (logData) setLog(logData)

      // Load playbook data for AI context
      const [ppRes, deRes, soRes] = await Promise.all([
        supabase.from('premium_position').select('*').eq('client_id', client.id).maybeSingle(),
        supabase.from('distinction_engine').select('*').eq('client_id', client.id).maybeSingle(),
        supabase.from('offer_playbooks').select('*').eq('client_id', client.id).maybeSingle(),
      ])
      const ctx = {}
      if (ppRes.data) {
        const pp = ppRes.data
        const star = pp.brand_star || {}
        const hero = pp.hero || {}
        const remarkable = pp.remarkable || {}
        const tone = star.tone || {}
        ctx.positioning = {
          worksWithDesc: star.specific_description || '',
          refuses: star.refuse || '',
          notFor: star.not_for || '',
          contrarian: star.contrarian_belief || '',
          whatYouDo: star.what_you_do || '',
          sector: star.sector || '',
          personality: Array.isArray(star.personality) ? star.personality.join(', ') : '',
        }
        ctx.voice = {
          directness: tone.directness || '',
          formality: tone.formality || '',
          phrasesUse: tone.phrases_use || '',
          phrasesAvoid: tone.phrases_avoid || '',
        }
        ctx.hero = {
          origin: hero.origin || '',
          turningPoint: hero.turning_point || '',
          lesson: hero.lesson || '',
          gift: hero.gift || '',
          why: hero.why || '',
          identityLabel: hero.identity_label || '',
        }
        ctx.remarkable = {
          category: remarkable.category || '',
          mechanism: remarkable.mechanism || '',
          differentiator: remarkable.differentiator || '',
          provocation: remarkable.provocation || '',
        }
      }
      if (deRes.data) {
        const de = deRes.data
        ctx.distinction = {
          engineName: de.engine_name || '',
          problems: [de.problem_1, de.problem_2, de.problem_3].filter(Boolean),
          pillars: [de.pillar_1, de.pillar_2, de.pillar_3].filter(Boolean),
          promise: de.promise || '',
        }
      }
      if (soRes.data) {
        const so = soRes.data
        const bb = so.bang_bang || {}
        const icp = so.icp || {}
        const dip = so.dip || {}
        const path = so.path_planner || {}
        ctx.offer = {
          offerName: bb.name || '',
          corePromise: bb.promise || '',
          whoItsFor: bb.who_for || '',
          whoItsNotFor: bb.who_not_for || '',
          price: bb.price || '',
          guarantee: bb.guarantee_detail || '',
          guaranteeType: bb.guarantee_type || '',
          scarcity: bb.scarcity || '',
          urgency: bb.urgency || '',
          socialProof: Array.isArray(bb.social_proof) ? bb.social_proof.join(', ') : '',
          bigNames: bb.big_names || '',
          resultsNumbers: bb.results_numbers || '',
          deliveryModel: Array.isArray(bb.delivery_model) ? bb.delivery_model.join(', ') : '',
          continuityOffer: bb.continuity_offer || '',
          ctaAction: bb.cta_action || '',
          dipName: dip.name || '',
          dipPrice: dip.price || '',
          dipPromise: dip.promise || '',
          dipProblem: dip.problem || '',
          dipOutcome: dip.outcome || '',
          dipFormat: dip.format || '',
          dipBridge: dip.bridge_to_main || '',
        }
        ctx.icp = {
          promise: icp.promise || '',
          dreamOutcome: icp.dream_outcome || '',
          specificDescription: icp.specific_description || '',
          pains: Array.isArray(icp.pains) ? icp.pains.filter(Boolean).join(', ') : '',
          realObjections: Array.isArray(icp.real_objections) ? icp.real_objections.join(', ') : '',
          costOfInaction: icp.cost_of_inaction || '',
          triggerMoment: icp.trigger_moment || '',
          whoNotFor: icp.who_not_for || '',
          pyramidLevel: icp.pyramid_level || '',
        }
        if (path.total_duration) ctx.programmeDuration = path.total_duration
      }
      if (Object.keys(ctx).length > 0) setPlaybookContext(ctx)

      setLoading(false)
      if (profile && profile.stage && profile.has_list !== null) {
        setScreen('home')
      } else if (profile && profile.stage) {
        setScreen('channels')
      } else {
        setScreen('stage')
      }
      } catch (err) {
        console.error('Content Capture V2 init error:', err)
        setLoading(false)
        setScreen('stage')
      }
    }
    init()
  }, [router])

  // ── Save helpers ──────────────────────────────────────────────────────────

  const saveProfile = useCallback(async (updates) => {
    if (!clientId) return
    await supabase.from('cc_profiles').upsert({ client_id: clientId, ...updates }, { onConflict: 'client_id' })
  }, [clientId])

  const addLogEntry = useCallback(async (type, line) => {
    if (!clientId) return null
    const { data } = await supabase.from('cc_capture_log').insert({ client_id: clientId, type, line, enrichment: {} }).select().single()
    return data
  }, [clientId])

  const updateLogEntry = useCallback(async (id, enrichment) => {
    if (!clientId) return
    await supabase.from('cc_capture_log').update({ enrichment }).eq('id', id)
  }, [clientId])

  const deleteLogEntry = useCallback(async (id) => {
    if (!clientId) return
    await supabase.from('cc_capture_log').delete().eq('id', id)
    setLog(prev => prev.filter(m => m.id !== id))
  }, [clientId])

  // ── Generation ────────────────────────────────────────────────────────────

  async function generateEnrichQuestions(momentLine, momentType, job) {
    const jobLabel = { reach: 'a post to get noticed by strangers (cold reach)', value: 'a post to build trust with followers (warm audience)', sales: 'a post to sell to warm audience', email: 'an email to their list', longform: 'a YouTube video' }[job] || job
    const typeLabel = TYPESHORT[momentType] || momentType
    const prompt = `You are inside a content tool. A coach has logged this moment:

"${momentLine}"

Moment type: ${typeLabel}
This will become: ${jobLabel}

Generate exactly 3 follow-up questions to extract the detail needed to write this piece. Each question should react to what they actually wrote — reference their specific words, names, or situation.

Rules:
- Questions must be specific to THIS moment, not generic
- Ask for the detail that's missing from what they wrote — don't ask for things they already said
- One question should dig for a specific number, date, or measurable detail
- One should dig for a vivid scene, quote, or sensory detail
- One should dig for the insight, lesson, or change that makes it a story
- Keep questions short and direct — one line each, like a coach would ask
- Add a one-line hint under each question

Return as JSON array of exactly 3 items: [["key", "question", "hint"], ...] where key is one of: scene, verb, num, change. Nothing else — no markdown, no explanation.`

    try {
      const res = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) return null
      const parsed = JSON.parse(data.content)
      if (Array.isArray(parsed) && parsed.length === 3) return parsed
      return null
    } catch {
      return null
    }
  }

  async function generate(card, moment, redoNote, arc, cardKey) {
    const prompt = buildPrompt(card, moment, redoNote, arc, playbookContext, cardKey)
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Generation failed')
    return data.content
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const baseN = stage ? (MIX[stage] || MIX.build).reach + (MIX[stage] || MIX.build).value + (MIX[stage] || MIX.build).sales : 5
  const pieceCount = piecesN || baseN
  const emailCount = emailN !== null ? emailN : (hasList ? 1 : 0)
  const ytCount = ytN !== null ? ytN : (doesYT ? 1 : 0)
  const mix = mixFor(stage, pieceCount, weekGoal)

  // ── Build week slots ──────────────────────────────────────────────────────

  function buildWeekSlots(goalOverride) {
    const m = mixFor(stage, pieceCount, goalOverride !== undefined ? goalOverride : weekGoal)
    const slots = []
    for (let i = 0; i < m.reach; i++) slots.push({ job: 'reach' })
    for (let i = 0; i < m.value; i++) slots.push({ job: 'value' })
    for (let i = 0; i < m.sales; i++) slots.push({ job: 'sales' })
    const days = assignDays(slots.length)
    slots.forEach((s, i) => { s.day = days[i] || 'Any day'; s.moment = null; s.piece = null; s.card = null })
    if (hasList) {
      const ed = ['Thursday', 'Monday', 'Saturday', 'Tuesday', 'Friday', 'Wednesday', 'Sunday']
      for (let i = 0; i < emailCount; i++) slots.push({ job: 'email', day: ed[i] || 'Any day', moment: null, piece: null, card: null })
    }
    if (doesYT) {
      const yd = ['Sunday', 'Wednesday', 'Friday']
      for (let i = 0; i < ytCount; i++) slots.push({ job: 'longform', day: yd[i] || 'Any day', moment: null, piece: null, card: null })
    }
    return slots
  }

  function suggestFill(slots) {
    const used = new Set()
    const pref = {
      reach: ['personal', 'industry', 'receipt', 'question', 'client', 'bts'],
      value: ['client', 'receipt', 'question', 'bts', 'personal', 'industry'],
      sales: ['client', 'receipt', 'question', 'bts', 'personal', 'industry'],
      email: ['personal', 'client', 'bts', 'receipt', 'question', 'industry'],
      longform: ['question', 'bts', 'client', 'receipt', 'industry', 'personal'],
    }
    slots.forEach(sl => { if (sl.moment) used.add(sl.moment.id) })
    slots.forEach(sl => {
      if (sl.moment) return
      for (const t of (pref[sl.job] || pref.reach)) {
        const m = log.find(x => x.type === t && !used.has(x.id))
        if (m) { sl.moment = m; if (sl.job !== 'email' && sl.job !== 'longform') used.add(m.id); break }
      }
      if (!sl.moment && (sl.job === 'email' || sl.job === 'longform')) {
        const feed = slots.find(s => s.moment && s.job !== 'email' && s.job !== 'longform')
        if (feed) sl.moment = feed.moment
      }
    })
    return [...slots]
  }

  // ── Screen: Stage ─────────────────────────────────────────────────────────

  if (screen === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-px bg-gold animate-pulse" />
      </div>
    )
  }

  if (screen === 'stage') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={stage ? () => setScreen('home') : null} onStage={() => {}} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>Where's your <span className="text-gold font-medium">business at</span> right now?</Question>
          <DimLabel>One tap. This quietly shapes what your week looks like and what the tool suggests. Change it any time up top.</DimLabel>
          <div className="flex flex-col gap-2">
            {STAGES.map(s => (
              <OptionButton key={s.id} onClick={async () => { setStage(s.id); await saveProfile({ stage: s.id }); setScreen('channels') }}>
                {s.t}<span className="block text-zinc-600 text-[12.5px] mt-1">{s.s}</span>
              </OptionButton>
            ))}
          </div>
          {stage && (
            <div className="flex justify-between mt-6">
              <GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (screen === 'channels') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={stage ? () => setScreen('home') : null} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>Two quick things about your <span className="text-gold font-medium">channels</span>.</Question>
          <DimLabel>These decide whether your week includes an email and a YouTube video alongside the posts.</DimLabel>
          <GoldLabel>Do you have an email list?</GoldLabel>
          <div className="flex flex-col gap-2 mb-5">
            <OptionButton selected={hasList === true} onClick={() => { setHasList(true) }}>Yes<span className="block text-zinc-600 text-[12.5px] mt-1">Even a small one — your week gets one email to keep it warm</span></OptionButton>
            <OptionButton selected={hasList === false} onClick={() => { setHasList(false) }}>Not yet<span className="block text-zinc-600 text-[12.5px] mt-1">Your posts will route people toward starting one</span></OptionButton>
          </div>
          <GoldLabel>Are you making YouTube videos?</GoldLabel>
          <div className="flex flex-col gap-2">
            <OptionButton selected={doesYT === true} onClick={() => { setDoesYT(true) }}>Yes<span className="block text-zinc-600 text-[12.5px] mt-1">Your week gets one deep video — the full version of a topic, for people who already follow you</span></OptionButton>
            <OptionButton selected={doesYT === false} onClick={() => { setDoesYT(false) }}>Not yet<span className="block text-zinc-600 text-[12.5px] mt-1">Posts and email carry the trust work for now</span></OptionButton>
          </div>
          <div className="flex justify-end mt-6">
            <Btn gold onClick={async () => {
              const hl = hasList === null ? false : hasList
              const dy = doesYT === null ? false : doesYT
              setHasList(hl); setDoesYT(dy)
              await saveProfile({ has_list: hl, does_yt: dy })
              setScreen(afterChannels)
              setAfterChannels('home')
            }}>Done →</Btn>
          </div>
        </main>
      </div>
    )
  }

  // ── Screen: Home ──────────────────────────────────────────────────────────

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => { setAfterChannels('home'); setScreen('stage') }} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <button onClick={() => router.push('/client')} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Dashboard
          </button>
          <div className="w-8 h-px bg-gold mb-4" />
          <GoldLabel>The Motherboard · Content system</GoldLabel>
          <Question>What do you want to <span className="text-gold font-medium">do</span>?</Question>
          {stage && (
            <div className="glass-card p-4 mb-6">
              <GoldLabel>Your stage</GoldLabel>
              <select
                value={stage}
                onChange={async (e) => { setStage(e.target.value); await saveProfile({ stage: e.target.value }) }}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition appearance-none cursor-pointer"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C9A84C' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.t}</option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-2">{STAGES.find(s => s.id === stage)?.s}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-7">
            <button onClick={() => { setQuickMoment(null); setQuickJob(null); setEnrichIdx(0); setScreen('quick-moment') }}
              className="text-left glass-card p-5 transition hover:border-gold/30 hover:-translate-y-px hover:shadow-glow-gold-sm">
              <p className="text-sm font-bold font-display text-gold uppercase tracking-widest mb-1">WRITE ONE POST NOW</p>
              <p className="text-sm text-zinc-500">Something happened — turn it into content in two minutes.</p>
            </button>
            <button onClick={() => {
              setWeekGoal(null)
              if (!stage) { setAfterChannels('week-goal'); setScreen('stage'); return }
              setScreen('week-goal')
            }}
              className="text-left glass-card p-5 transition hover:border-gold/30 hover:-translate-y-px hover:shadow-glow-gold-sm">
              <p className="text-sm font-bold font-display text-gold uppercase tracking-widest mb-1">PLAN MY WEEK</p>
              <p className="text-sm text-zinc-500">
                {pieceCount} posts this week ({mix.reach} to get noticed, {mix.value} to build trust{mix.sales ? `, ${mix.sales} to sell` : ''})
                {hasList && emailCount ? `, plus ${emailCount === 1 ? 'an email' : emailCount + ' emails'} to your list` : ''}
                {doesYT && ytCount ? `, plus ${ytCount === 1 ? 'a YouTube video' : ytCount + ' YouTube videos'}` : ''}.
                Build it all in one sitting.
              </p>
            </button>
          </div>

          <GoldLabel>Your moments — log them the day they happen</GoldLabel>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {MOMENTS.map(m => (
              <button key={m.id} onClick={() => setCapType(m.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition border ${capType === m.id ? 'bg-gold/10 text-gold border-gold/30' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>
                {TYPESHORT[m.id]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={capLine} onChange={e => setCapLine(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddLog() }}
              placeholder='"Sarah said she finally trusts her bank app."'
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm" />
            <Btn gold onClick={handleAddLog}>Log</Btn>
          </div>

          <div className="mt-4">
            {log.length === 0 ? (
              <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center text-zinc-500 text-sm">
                Nothing logged yet. One line a day is the whole habit — the tool builds from these.
              </div>
            ) : (
              log.map(m => <LogLine key={m.id} moment={m} onDelete={() => deleteLogEntry(m.id)} />)
            )}
          </div>
        </main>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </div>
    )
  }

  // ── Quick Mode: Moment Selection ──────────────────────────────────────────

  if (screen === 'quick-moment') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>What's <span className="text-gold font-medium">actually happened</span>?</Question>
          <DimLabel>Real content starts with real life.</DimLabel>
          {log.length > 0 && (
            <>
              <GoldLabel>From your log</GoldLabel>
              <div className="flex flex-col gap-2 mb-5">
                {log.map(m => (
                  <OptionButton key={m.id} onClick={() => { setQuickMoment(m); setScreen('quick-job') }}>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gold/60 mb-1">{TYPESHORT[m.type]}</span>
                    {m.line}
                  </OptionButton>
                ))}
              </div>
              <GoldLabel>Or something new</GoldLabel>
            </>
          )}
          <div className="flex flex-col gap-2">
            {MOMENTS.map(m => (
              <OptionButton key={m.id} onClick={() => setScreen('quick-line-' + m.id)} sub={m.s}>{m.t}</OptionButton>
            ))}
          </div>
          <div className="mt-6"><GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn></div>
        </main>
      </div>
    )
  }

  // ── Quick Mode: New Moment Line ───────────────────────────────────────────

  if (screen.startsWith('quick-line-')) {
    const typeId = screen.replace('quick-line-', '')
    const mt = MOMENTS.find(x => x.id === typeId)
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>Tell me in <span className="text-gold font-medium">one line</span>.</Question>
          <DimLabel>{mt.t} — just the bones. We'll flesh it out next.</DimLabel>
          <textarea rows={2} autoFocus value={capLine} onChange={e => setCapLine(e.target.value)}
            placeholder="e.g. Sarah told me she finally trusts the number in her bank app."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none" />
          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => { setCapLine(''); setScreen('quick-moment') }}>← Back</GhostBtn>
            <Btn gold onClick={async () => {
              if (!capLine.trim()) return
              const entry = await addLogEntry(typeId, capLine.trim())
              if (entry) {
                setLog(prev => [entry, ...prev])
                setQuickMoment(entry)
                setCapLine('')
                setScreen('quick-job')
              }
            }}>Next →</Btn>
          </div>
        </main>
      </div>
    )
  }

  // ── Quick Mode: Job Selection ─────────────────────────────────────────────

  if (screen === 'quick-job') {
    const sug = ({ start: 'reach', build: 'value', launch: 'sales', recovery: 'reach', ever: 'value' })[stage] || 'reach'
    const jobs = [
      { j: 'reach', t: 'Get noticed', s: "Reach new people who don't know you" },
      { j: 'value', t: 'Build trust', s: 'Turn followers into believers' },
      { j: 'sales', t: 'Make a sale', s: 'Warm audience, something to act on' },
    ]
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>This can do <span className="text-gold font-medium">one job</span>. Which?</Question>
          <DimLabel>Based on your stage, I'd point it at "{jobs.find(x => x.j === sug).t}" — but it's your call.</DimLabel>
          <div className="flex flex-col gap-2">
            {jobs.map(x => (
              <OptionButton key={x.j} selected={x.j === sug} onClick={() => {
                if (x.j === 'sales' && stage === 'start') {
                  setModal({
                    title: 'One honest thing first',
                    body: "Sales posts work on a warm audience, and yours is still growing — right now it'd be closing an empty room. The fastest route to sales is a few weeks of getting noticed and building trust first.",
                    options: [
                      ['Grow the audience first', () => { setModal(null); setQuickJob('reach'); setEnrichIdx(0); setScreen('quick-enrich') }],
                      ['I\'ve got warm people — sell anyway', () => { setModal(null); setQuickJob('sales'); setEnrichIdx(0); setScreen('quick-enrich') }],
                    ],
                  })
                  return
                }
                setQuickJob(x.j); setEnrichIdx(0); setScreen('quick-enrich')
              }}>
                {x.t}{x.j === sug ? ' — suggested' : ''}<span className="block text-zinc-600 text-[12.5px] mt-1">{x.s}</span>
              </OptionButton>
            ))}
          </div>
          <div className="mt-6"><GhostBtn onClick={() => setScreen('quick-moment')}>← Back</GhostBtn></div>
        </main>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </div>
    )
  }

  // ── Quick Mode: Enrichment ────────────────────────────────────────────────

  if (screen === 'quick-enrich' && quickMoment) {
    const qs = getEnrichQuestions(quickMoment.type, quickJob)
    const [key, q, hint] = qs[enrichIdx]
    const enrichVal = (quickMoment.enrichment || {})[key] || ''

    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>{q}</Question>
          <DimLabel>{hint}</DimLabel>
          <textarea rows={2} autoFocus defaultValue={enrichVal}
            id="enrich-input"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none" />
          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => { if (enrichIdx > 0) setEnrichIdx(enrichIdx - 1); else setScreen('quick-job') }}>← Back</GhostBtn>
            <div className="flex gap-3 items-center">
              <button onClick={() => advanceEnrich(true)} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">Skip</button>
              <Btn gold onClick={() => advanceEnrich(false)}>{enrichIdx < qs.length - 1 ? 'Next →' : 'Write my post →'}</Btn>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Quick Mode: Writing / Result ──────────────────────────────────────────

  if (screen === 'quick-writing') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <WritingScreen line={writingLine} label="WRITING YOUR PIECE" />
        </main>
      </div>
    )
  }

  if (screen === 'quick-result' && quickCard) {
    const card = CARDS[quickCard]
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <GoldLabel>Your piece</GoldLabel>
          <h3 className="text-lg font-display tracking-[0.06em] text-white mb-4">{card.nm.toUpperCase()}</h3>
          <PieceCard
            title="Ready to post"
            piece={quickPiece}
            swap={quickRoute?.swap}
            dont={card.dont}
            onRewrite={() => {
              setModal({
                title: "What's off about it?",
                body: 'Pick the closest — the correction shapes the rewrite.',
                options: [
                  ['Too salesy — soften it', () => { setModal(null); doQuickWrite('It read too salesy. Softer, more human, the offer lighter.') }],
                  ['Too formal — loosen it up', () => { setModal(null); doQuickWrite('Too formal and written. Looser, more like talking.') }],
                  ["Doesn't sound like me — plainer", () => { setModal(null); doQuickWrite("Didn't sound like a real person. Plainer, blunter, shorter sentences.") }],
                  ['Just try a different angle', () => { setModal(null); doQuickWrite('Take a completely different angle on the same moment.') }],
                ],
              })
            }}
            onToEmail={hasList && quickCard !== 'c13' && quickCard !== 'c17' ? () => doRepurpose(stage === 'launch' ? 'c17' : 'c13', 'YOUR LIST') : undefined}
            onToYT={doesYT && quickCard !== 'c9' ? () => doRepurpose('c9', 'YOUTUBE') : undefined}
          />
          <div className="mt-4">
            <Btn onClick={() => setScreen('home')}>Done</Btn>
          </div>
        </main>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </div>
    )
  }

  // ── Weekly Mode: Goal ──────────────────────────────────────────────────────

  if (screen === 'week-goal') {
    function selectGoal(goalId) {
      if (goalId === 'conversion' && stage === 'start') {
        setModal({
          title: 'One honest thing first',
          body: "Sales posts work on a warm audience, and yours is still growing — right now it'd be closing an empty room. The fastest route to sales is a few weeks of getting noticed and building trust first.",
          options: [
            ['Grow the audience first', () => { setModal(null); setWeekGoal('growth'); const slots = buildWeekSlots('growth'); setWeekSlots(slots); setScreen('board') }],
            ['I\'ve got warm people — sell anyway', () => { setModal(null); setWeekGoal('conversion'); const slots = buildWeekSlots('conversion'); setWeekSlots(slots); setScreen('board') }],
          ],
        })
        return
      }
      setWeekGoal(goalId)
      const slots = buildWeekSlots(goalId)
      setWeekSlots(slots)
      setScreen('board')
    }

    // Preview mixes for the dials
    const previewN = pieceCount
    const mixes = {
      growth: mixFor(stage, previewN, 'growth'),
      trust: mixFor(stage, previewN, 'trust'),
      conversion: mixFor(stage, previewN, 'conversion'),
      default: mixFor(stage, previewN, 'default'),
    }

    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => { setAfterChannels('home'); setScreen('stage') }} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <Question>What are you trying to <span className="text-gold font-medium">achieve</span> with your posting right now?</Question>
          <DimLabel>This shapes how your week splits between reach, trust and sales content.</DimLabel>
          <div className="flex flex-col gap-3">
            {GOALS.map(g => {
              const m = mixes[g.id]
              return (
                <button key={g.id} onClick={() => selectGoal(g.id)}
                  className="w-full text-left rounded-lg border bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition p-4">
                  <span className="text-sm font-bold text-white">{g.t}</span>
                  <span className="block text-xs text-zinc-500 mt-1 mb-3">{g.s}</span>
                  <MixDials reach={m.reach} value={m.value} sales={m.sales} total={previewN} />
                </button>
              )
            })}
          </div>
          <div className="mt-6"><GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn></div>
        </main>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </div>
    )
  }

  // ── Weekly Mode: Board ────────────────────────────────────────────────────

  if (screen === 'board') {
    const filled = weekSlots.filter(s => s.moment).length
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <GoldLabel>Your week — shaped by your stage</GoldLabel>
          <Question>Match <span className="text-gold font-medium">moments</span> to the week's posts.</Question>
          <DimLabel>Tap a slot, pick a moment. Or let the tool suggest and adjust from there. Empty slots just get skipped.</DimLabel>

          <Stepper label="Feed posts" note={pieceCount === baseN ? 'The pace your stage suggests' : pieceCount > baseN ? 'Above your stage\'s pace' : 'A lighter week'}
            value={pieceCount} onMinus={() => changePieceCount(-1)} onPlus={() => changePieceCount(1)} minDisabled={pieceCount <= 1} maxDisabled={pieceCount >= 21} />
          {hasList && (
            <Stepper label="Emails to your list" note={emailCount === 1 ? 'One a week keeps it warm' : emailCount === 0 ? 'Skipping the list this week' : 'More than one needs genuinely separate moments'}
              value={emailCount} onMinus={() => changeEmailCount(-1)} onPlus={() => changeEmailCount(1)} minDisabled={emailCount <= 0} maxDisabled={emailCount >= 7} />
          )}
          {doesYT && (
            <Stepper label="YouTube videos" note={ytCount === 1 ? 'One deep video a week' : ytCount === 0 ? 'No video this week' : 'A heavy schedule'}
              value={ytCount} onMinus={() => changeYtCount(-1)} onPlus={() => changeYtCount(1)} minDisabled={ytCount <= 0} maxDisabled={ytCount >= 3} />
          )}

          <div className="glass-card p-4 mb-4">
            <GoldLabel>Content mix</GoldLabel>
            <MixDials reach={mix.reach} value={mix.value} sales={mix.sales} total={pieceCount} />
          </div>

          <div className="mt-2">
            {(() => {
              const grouped = []
              let lastDay = null
              weekSlots.forEach((sl, i) => {
                const dayBase = sl.day.split(' · ')[0]
                if (dayBase !== lastDay) {
                  grouped.push({ type: 'day', day: dayBase })
                  lastDay = dayBase
                }
                grouped.push({ type: 'slot', sl, i })
              })
              return grouped.map((item, gi) =>
                item.type === 'day' ? (
                  <div key={'day-' + gi} className="mt-4 mb-2 first:mt-0">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.day}</span>
                  </div>
                ) : (
                  <SlotCard key={item.i} job={item.sl.job} moment={item.sl.moment}
                    onPick={() => setPicker(item.i)}
                    onClear={() => { const updated = [...weekSlots]; updated[item.i].moment = null; setWeekSlots(updated) }}
                    salesAngle={salesAngles[item.i]}
                    onSalesAngle={(angle) => setSalesAngles(prev => ({ ...prev, [item.i]: angle }))}
                    offerContext={playbookContext?.offer}
                    onCapture={async (type, line, enrichment, angle) => {
                      const entry = await addLogEntry(type, line)
                      if (entry) {
                        entry.enrichment = enrichment
                        await updateLogEntry(entry.id, enrichment)
                        setLog(prev => [entry, ...prev])
                        const updated = [...weekSlots]
                        updated[item.i].moment = entry
                        if (angle) setSalesAngles(prev => ({ ...prev, [item.i]: angle }))
                        setWeekSlots(updated)
                      }
                    }} />
                )
              )
            })()}
          </div>

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn>
            <div className="flex gap-3">
              <Btn onClick={() => { setWeekSlots(suggestFill([...weekSlots])) }}>Suggest for me</Btn>
              <Btn gold disabled={!filled} onClick={() => {
                const assigned = weekSlots.filter(s => s.moment)
                setWeekPieces(assigned)
                setWeekIdx(0); setScreen('week-enrich')
              }}>Flesh them out →</Btn>
            </div>
          </div>
        </main>

        <BottomSheet open={picker !== null} title={picker !== null ? JOBLONG[weekSlots[picker]?.job] : ''} onClose={() => setPicker(null)}
          subtitle={(weekSlots[picker]?.job === 'email' || weekSlots[picker]?.job === 'longform') ? 'Reusing a moment from a feed post is the smart move here — same material, deeper format.' : undefined}>
          {picker !== null && (() => {
            const job = weekSlots[picker].job
            const reuse = job === 'email' || job === 'longform'
            const usedIds = new Set(weekSlots.filter((s, x) => s.moment && x !== picker && s.job !== 'email' && s.job !== 'longform').map(s => s.moment.id))
            const avail = reuse ? log : log.filter(m => !usedIds.has(m.id))
            return avail.length ? (
              <div className="flex flex-col gap-2">
                {avail.map(m => (
                  <OptionButton key={m.id} onClick={() => {
                    const updated = [...weekSlots]
                    updated[picker].moment = m
                    setWeekSlots(updated); setPicker(null)
                  }}>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gold/60 mb-1">{TYPESHORT[m.type]}</span>
                    {m.line}
                  </OptionButton>
                ))}
                <div className="flex gap-3 mt-3">
                  <Btn onClick={() => { const updated = [...weekSlots]; updated[picker].moment = null; setWeekSlots(updated); setPicker(null) }}>Leave empty</Btn>
                  <Btn onClick={() => setPicker(null)}>Close</Btn>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center text-zinc-500 text-sm">
                {log.length === 0
                  ? 'No moments logged yet. Head back to the home screen and log a few — a client thing, a number, a question you keep getting.'
                  : 'Every logged moment is already placed. Log another from the home screen, or leave this slot empty.'}
              </div>
            )
          })()}
        </BottomSheet>
      </div>
    )
  }

  // ── Weekly Mode: Enrichment ───────────────────────────────────────────────

  if (screen === 'week-enrich') {
    if (weekIdx >= weekPieces.length) {
      doWeekWrite()
      return (
        <div className="min-h-screen bg-zinc-950 text-white">
          <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
          <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
            <WritingScreen label="WRITING YOUR WEEK" />
          </main>
        </div>
      )
    }

    const sl = weekPieces[weekIdx]
    const m = sl.moment
    const fallbackQs = getEnrichQuestions(m.type, sl.job)

    // Generate AI-tailored questions when the post changes
    if (!aiQuestions && !aiQLoading) {
      setAiQLoading(true)
      generateEnrichQuestions(m.line, m.type, sl.job).then(qs => {
        setAiQuestions(qs)
        setAiQLoading(false)
      }).catch(() => {
        setAiQuestions(null)
        setAiQLoading(false)
      })
    }

    const qs = aiQuestions || fallbackQs

    if (aiQLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 bg-grid text-white">
          <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
          <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
            <p className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-2">
              Post {weekIdx + 1} of {weekPieces.length} · {JOBNAMES[sl.job]} · {sl.day}
            </p>
            <div className="glass-card p-4 mb-6">
              <p className="text-sm text-white">{m.line}</p>
            </div>
            <WritingScreen label="TAILORING YOUR QUESTIONS" line="Reading what you wrote and working out what to ask..." />
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <p className="text-xs font-bold text-gold/60 uppercase tracking-widest mb-2">
            Post {weekIdx + 1} of {weekPieces.length} · {JOBNAMES[sl.job]} · {sl.day}
          </p>
          <div className="glass-card p-4 mb-6">
            <p className="text-sm text-white">{m.line}</p>
            <span className="text-xs text-gold/60 uppercase tracking-widest">{TYPESHORT[m.type]}</span>
          </div>
          <Question>Flesh this one out.</Question>
          <DimLabel>These questions are based on what you wrote. Answer what you can — skip what doesn't apply.</DimLabel>

          <div className="space-y-4">
            {qs.map(([key, q, hint], qi) => (
              <div key={`${weekIdx}-${key}`} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <label className="block text-sm font-bold text-white mb-1">{q}</label>
                <p className="text-xs text-zinc-500 mb-2">{hint}</p>
                <textarea
                  rows={2}
                  defaultValue={(m.enrichment || {})[key] || ''}
                  id={`week-enrich-${weekIdx}-${key}`}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none"
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <GoldLabel>Pick the format</GoldLabel>
            <DimLabel>How should this piece be built?</DimLabel>
            <div className="grid grid-cols-2 gap-2">
              {(FORMAT_OPTIONS[sl.job] || FORMAT_OPTIONS.reach).map(f => (
                <button key={f.id} onClick={() => setChosenFormats(prev => ({ ...prev, [weekIdx]: f.id }))}
                  className={`text-left px-3 py-3 rounded-lg border transition ${chosenFormats[weekIdx] === f.id ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 text-zinc-300'}`}>
                  <span className="text-sm">{f.icon} {f.label}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => {
              setAiQuestions(null)
              if (weekIdx > 0) { setWeekIdx(weekIdx - 1) }
              else setScreen('board')
            }}>← Back</GhostBtn>
            <Btn gold disabled={!chosenFormats[weekIdx]} onClick={() => {
              const enrichment = { ...(m.enrichment || {}) }
              qs.forEach(([key]) => {
                const el = document.getElementById(`week-enrich-${weekIdx}-${key}`)
                if (el) enrichment[key] = el.value.trim()
              })
              m.enrichment = enrichment
              updateLogEntry(m.id, enrichment)
              setAiQuestions(null)
              if (weekIdx < weekPieces.length - 1) {
                setWeekIdx(weekIdx + 1)
              } else {
                doWeekWrite()
              }
            }}>
              {weekIdx < weekPieces.length - 1 ? 'Next post →' : 'Write the week →'}
            </Btn>
          </div>
        </main>
      </div>
    )
  }

  // ── Weekly Mode: Writing ──────────────────────────────────────────────────

  if (screen === 'week-writing') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <WritingScreen line={writingLine} label={`WRITING POST ${weekIdx + 1} OF ${weekPieces.length}`} />
        </main>
      </div>
    )
  }

  // ── Weekly Mode: Review ───────────────────────────────────────────────────

  if (screen === 'week-review') {
    const finishedCount = weekPieces.filter(s => s.piece).length

    function copyAll() {
      const txt = weekPieces.filter(s => s.piece).map(s =>
        `=== ${s.day.toUpperCase()} — ${JOBNAMES[s.job].toUpperCase()} — ${s.cardObj.nm} ===\n\n${s.piece}`
      ).join('\n\n\n')
      if (navigator.clipboard) navigator.clipboard.writeText(txt)
    }

    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <GoldLabel>Your week, written</GoldLabel>
          <Question><span className="text-gold font-medium">{finishedCount}</span> posts, ready to go.</Question>
          <DimLabel>Each one from a real moment of yours. Copy them out, or rewrite any that don't sound right.</DimLabel>

          {weekPieces.map((sl, i) => (
            <PieceCard key={i}
              title={`${sl.day} · ${JOBNAMES[sl.job]} · ${sl.cardObj.nm}`}
              piece={sl.piece}
              swap={sl.swap}
              dont={sl.cardObj.dont}
              onRewrite={() => {
                setModal({
                  title: "What's off about it?",
                  body: 'Pick the closest — the correction shapes the rewrite.',
                  options: [
                    ['Too salesy — soften it', () => { setModal(null); rewriteWeekPiece(i, 'It read too salesy. Softer, more human, the offer lighter.') }],
                    ['Too formal — loosen it up', () => { setModal(null); rewriteWeekPiece(i, 'Too formal and written. Looser, more like talking.') }],
                    ["Doesn't sound like me — plainer", () => { setModal(null); rewriteWeekPiece(i, "Didn't sound like a real person. Plainer, blunter, shorter sentences.") }],
                    ['Just try a different angle', () => { setModal(null); rewriteWeekPiece(i, 'Take a completely different angle on the same moment.') }],
                  ],
                })
              }}
              onToEmail={sl.job !== 'email' && hasList ? async () => {
                const cardKey = stage === 'launch' ? 'c17' : 'c13'
                setScreen('week-writing'); setWritingLine(sl.moment.line)
                try {
                  const piece = await generate(CARDS[cardKey], sl.moment, null, null, cardKey)
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'email', day: 'Thursday', moment: sl.moment, cardObj: CARDS[cardKey], cardKey, piece, swap: null, arc: null })
                    return updated
                  })
                } catch {}
                setScreen('week-review')
              } : undefined}
              onToYT={sl.job !== 'longform' && doesYT ? async () => {
                setScreen('week-writing'); setWritingLine(sl.moment.line)
                try {
                  const piece = await generate(CARDS.c9, sl.moment, null, null, 'c9')
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'longform', day: 'Sunday', moment: sl.moment, cardObj: CARDS.c9, cardKey: 'c9', piece, swap: null, arc: null })
                    return updated
                  })
                } catch {}
                setScreen('week-review')
              } : undefined}
            />
          ))}

          <div className="flex gap-3 mt-6">
            <Btn gold onClick={copyAll}>Copy the whole week</Btn>
            <Btn onClick={() => setScreen('home')}>Done</Btn>
          </div>
        </main>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </div>
    )
  }

  // ── Fallback ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-px bg-gold animate-pulse" />
    </div>
  )

  // ── Action Handlers ───────────────────────────────────────────────────────

  async function handleAddLog() {
    if (!capLine.trim()) return
    const entry = await addLogEntry(capType, capLine.trim())
    if (entry) {
      setLog(prev => [entry, ...prev])
      setCapLine('')
    }
  }

  async function advanceEnrich(skip) {
    const qs = getEnrichQuestions(quickMoment.type, quickJob)
    const [key] = qs[enrichIdx]
    const val = skip ? '' : (document.getElementById('enrich-input')?.value?.trim() || '')
    const updated = { ...quickMoment, enrichment: { ...(quickMoment.enrichment || {}), [key]: val } }
    setQuickMoment(updated)
    await updateLogEntry(quickMoment.id, updated.enrichment)

    if (enrichIdx < qs.length - 1) {
      setEnrichIdx(enrichIdx + 1)
    } else {
      doQuickWrite(null, updated)
    }
  }

  async function doQuickWrite(redoNote, momentOverride) {
    const m = momentOverride || quickMoment
    const hasNum = !!(m.enrichment && m.enrichment.num && m.enrichment.num.trim())
    const r = routeMoment(m.type, quickJob, hasNum, stage)
    const card = CARDS[r.card]
    const arc = pickArc(m.type, m, r.card)

    setQuickCard(r.card)
    setQuickRoute(r)
    setQuickArc(arc)
    setScreen('quick-writing')
    setWritingLine(`${card.nm}${arc ? ' — ' + arc.n + ' shape' : ''} — from your moment, your words, your numbers.`)

    try {
      const piece = await generate(card, m, redoNote, arc, r.card)
      setQuickPiece(piece)
    } catch {
      setQuickPiece(null)
    }
    setScreen('quick-result')
  }

  async function doRepurpose(cardKey, label) {
    const card = CARDS[cardKey]
    setScreen('quick-writing')
    setWritingLine(quickMoment.line)
    try {
      const piece = await generate(card, quickMoment, null, null, cardKey)
      setQuickCard(cardKey)
      setQuickRoute({})
      setQuickPiece(piece)
    } catch {
      setQuickPiece(null)
    }
    setScreen('quick-result')
  }

  function changePieceCount(delta) {
    const n = Math.max(1, Math.min(21, pieceCount + delta))
    setPiecesN(n); saveProfile({ pieces_per_week: n })
    // Rebuild slots with new count — must compute mix inline since state hasn't flushed
    const m = mixFor(stage, n, weekGoal)
    const slots = []; const old = weekSlots.filter(s => s.moment).map(s => ({ job: s.job, moment: s.moment }))
    for (let i = 0; i < m.reach; i++) slots.push({ job: 'reach' })
    for (let i = 0; i < m.value; i++) slots.push({ job: 'value' })
    for (let i = 0; i < m.sales; i++) slots.push({ job: 'sales' })
    const days = assignDays(slots.length)
    slots.forEach((s, i) => { s.day = days[i] || 'Any day'; s.moment = null; s.piece = null; s.card = null })
    if (hasList) { const ed = ['Thursday','Monday','Saturday','Tuesday','Friday','Wednesday','Sunday']; for (let i = 0; i < emailCount; i++) slots.push({ job: 'email', day: ed[i] || 'Any day', moment: null, piece: null, card: null }) }
    if (doesYT) { const yd = ['Sunday','Wednesday','Friday']; for (let i = 0; i < ytCount; i++) slots.push({ job: 'longform', day: yd[i] || 'Any day', moment: null, piece: null, card: null }) }
    old.forEach(o => { const sl = slots.find(s => s.job === o.job && !s.moment); if (sl) sl.moment = o.moment })
    setWeekSlots(slots)
  }

  function changeEmailCount(delta) {
    const n = Math.max(0, Math.min(7, emailCount + delta))
    setEmailN(n); saveProfile({ email_count: n })
    setWeekSlots(buildWeekSlots())
  }

  function changeYtCount(delta) {
    const n = Math.max(0, Math.min(3, ytCount + delta))
    setYtN(n); saveProfile({ yt_count: n })
    setWeekSlots(buildWeekSlots())
  }


  async function doWeekWrite() {
    setScreen('week-writing')
    const pieces = [...weekPieces]
    for (let i = 0; i < pieces.length; i++) {
      const sl = pieces[i]
      const m = sl.moment
      setWeekIdx(i)
      setWritingLine(m.line)
      const hasNum = !!(m.enrichment && m.enrichment.num && m.enrichment.num.trim())
      const r = routeMoment(m.type, sl.job, hasNum, stage)
      const baseCard = CARDS[r.card]
      const arc = pickArc(m.type, m, r.card)

      // Use chosen format if one was picked, otherwise use the routed card
      const fmt = chosenFormats[i]
      const fmtPrompt = fmt && FORMAT_PROMPTS[fmt]
      const card = fmtPrompt ? { ...baseCard, fmt: fmtPrompt.fmt, out: fmtPrompt.out, nm: (FORMAT_OPTIONS[sl.job] || FORMAT_OPTIONS.reach).find(f => f.id === fmt)?.label || baseCard.nm } : baseCard

      sl.cardObj = card
      sl.cardKey = r.card
      sl.chosenFormat = fmt
      sl.swap = r.swap
      sl.arc = arc
      try {
        sl.piece = await generate(card, m, null, arc, r.card)
      } catch {
        sl.piece = null
      }
    }
    setWeekPieces(pieces)
    setScreen('week-review')
  }

  async function rewriteWeekPiece(idx, redoNote) {
    const sl = weekPieces[idx]
    setScreen('week-writing')
    setWritingLine(sl.moment.line)
    try {
      sl.piece = await generate(sl.cardObj, sl.moment, redoNote, sl.arc, sl.cardKey)
    } catch {}
    setWeekPieces([...weekPieces])
    setScreen('week-review')
  }
}

// ── Header ──────────────────────────────────────────────────────────────────

function Header({ onHome, onStage }) {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
      <button onClick={onHome} className="text-zinc-400 hover:text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <span className="text-xs font-bold font-display text-gold uppercase tracking-widest">Content Capture V2</span>
      <button onClick={onStage} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">Stage</button>
    </div>
  )
}

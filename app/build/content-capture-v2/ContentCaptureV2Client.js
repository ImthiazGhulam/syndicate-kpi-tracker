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
  { id: 'pov', t: 'A POV or hypothetical', s: '"If I wanted to X..." / "I want to achieve X" / flip the desired result on its head' },
  { id: 'bts', t: "Something I'm doing this week", s: "What I'm building, running or fixing" },
]

const TYPESHORT = { client: 'Client', receipt: 'Result', question: 'Question', personal: 'My story', industry: 'Industry', pov: 'POV', bts: 'This week' }

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
  c19: { nm: 'A lead magnet carousel — solve the problem, offer the freebie', fmt: 'a 7–10 slide carousel post', out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1: the big promise with the pain built in, end with \u{1F449}. Slide 2: the pain deeper, as a specific scene the reader recognises from their week. Slide 3: the reframe — what they haven't tried — plus a save ask, end with \u{1F449}. Slides 4–7: three or four steps that solve the problem properly, each actionable with real detail, an example, a number or a script, no teasers. Second-to-last slide: the turn — one short honest jab about the cost of staying stuck. Final slide: comment the keyword below, here's exactly what you'll get — no pitch. Then 'CAPTION:' 2–4 short sentences with the keyword repeated once.", cta: 'Comment the keyword. State exactly what gets sent. No pitch, no selling.', dont: ['Teasing the steps instead of teaching them', 'A pitch disguised as a CTA', 'Using leverage, unlock, elevate, or game-changer'] },
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
  pov: [['scene', "What's the hypothetical — what would you do or want to achieve?", 'The POV setup: "If I wanted to..." or "I want to..." — state the goal or the inverse.'], ['change', "What would actually need to happen to get there?", 'The real steps, not the obvious answer. What would most people miss?'], ['num', 'Any numbers or proof to ground it?', 'A real example, a client result, a timeframe that makes it concrete. Skip if purely hypothetical.']],
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
      case 'pov': return [
        ['scene', "What's the POV — what goal or scenario are you setting up?", 'State the hypothetical clearly: "If I wanted to..." or "I want to achieve..."'],
        ['change', 'What would you actually need to do — step by step?', 'The real method, not the obvious answer. What would most people miss or do wrong?'],
        ['num', 'Can you ground it with a real example or result?', 'A client who did this, a number that proves it, a timeline that makes it tangible.'],
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
    case 'pov': return [
      ['scene', "What's the POV — what would someone need to do or want to achieve?", '"If I wanted to hit 10k months" or "If I want to never worry about leads again" — state the goal or flip the desired result.'],
      ['change', "What's the real answer most people wouldn't think of?", 'The non-obvious step, the counterintuitive move. This is the scroll-stopper.'],
      ['num', 'Any proof you can anchor it with?', 'A client who did exactly this, a number, a timeframe. Makes a hypothetical feel real.'],
    ]
    default: return ENRICH_BASE[momentType] || ENRICH_BASE.client
  }
}

// Legacy accessor for code that just needs type-based questions
const ENRICH = ENRICH_BASE

// The four content engines
const ENGINES = [
  { id: 'story', label: 'Story', desc: 'A moment, a scar, a transformation — builds recognition and belief', icon: '📖' },
  { id: 'teaching', label: 'Teaching', desc: 'Method, how-to, the mistake and the fix — builds authority', icon: '🎓' },
  { id: 'proof', label: 'Proof', desc: 'Results, receipts, testimonials — builds certainty', icon: '📊' },
  { id: 'offer', label: 'Offer', desc: 'The thing for sale, the deadline, the reason now — builds decisions', icon: '🔥' },
]

// Format matrix: job × engine → available formats (from the playbook spec)
const FORMAT_MATRIX = {
  'reach_story': [
    { id: 'talking-head', label: 'Talking Head Reel', desc: 'You to camera, 30–90 seconds', icon: '🎬' },
    { id: 'text-reel', label: 'Text Reel', desc: 'B-roll with text overlay, 5–15 seconds', icon: '📱' },
    { id: 'yap', label: 'Yap / Voice Note Style', desc: 'Unscripted, walking or sat in the car', icon: '🎤' },
    { id: 'rant', label: 'Rant', desc: 'Higher energy, opinion-led, contrarian', icon: '🔊' },
    { id: 'skit', label: 'Skit / POV', desc: 'Acted scenario, pattern interrupt', icon: '🎭' },
  ],
  'reach_teaching': [
    { id: 'carousel', label: 'Carousel', desc: '6–8 slides, the save format', icon: '📊' },
    { id: 'green-screen', label: 'Green Screen / Whiteboard', desc: 'You reacting or explaining on screen', icon: '🟩' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Quick teach to camera', icon: '🎬' },
    { id: 'quote-card', label: 'Quote Card', desc: 'One sharp line, screenshot aesthetic', icon: '💬' },
  ],
  'reach_proof': [
    { id: 'text-reel', label: 'Text Reel', desc: 'Number as the hook, b-roll underneath', icon: '📱' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Quick result to camera', icon: '🎬' },
    { id: 'before-after', label: 'Before / After', desc: 'Visual transformation or stat comparison', icon: '🔄' },
  ],
  'reach_offer': [], // Never — offer content doesn't reach strangers
  'value_story': [
    { id: 'carousel', label: 'Carousel', desc: 'Case study or borrowed arc, slide by slide', icon: '📊' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Story to camera, longer form', icon: '🎬' },
    { id: 'youtube', label: 'YouTube Long Form', desc: '8–15 min deep story (Comeback Story)', icon: '▶️' },
    { id: 'story-email', label: 'Email', desc: 'Story email to your list', icon: '✉️' },
    { id: 'voice-note', label: 'Voice Note Style', desc: 'Softest register, like talking to a friend', icon: '🎤' },
  ],
  'value_teaching': [
    { id: 'carousel', label: 'Carousel', desc: 'Method or step-by-step, 7–10 slides', icon: '📊' },
    { id: 'youtube', label: 'YouTube Long Form', desc: 'Full deep-teach video', icon: '▶️' },
    { id: 'screen-recording', label: 'Screen Recording', desc: 'Show the work, the tool, the process', icon: '🖥️' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Method explained to camera', icon: '🎬' },
    { id: 'story-email', label: 'Email', desc: 'Teaching email to your list', icon: '✉️' },
    { id: 'over-shoulder', label: 'Over the Shoulder', desc: 'Camera on you working, same rules as screen recording', icon: '📹' },
  ],
  'value_proof': [
    { id: 'carousel', label: 'Case Study Carousel', desc: 'Client transformation slide by slide', icon: '📊' },
    { id: 'talking-head', label: 'Receipt Drop Reel', desc: 'Number first, mechanism after', icon: '🎬' },
    { id: 'screenshot-post', label: 'Screenshot Post', desc: 'DM, payment notification, result — fastest proof', icon: '📸' },
    { id: 'before-after', label: 'Before / After', desc: 'Visual transformation, works anywhere change is visible', icon: '🔄' },
  ],
  'value_offer': [
    { id: 'story-sequence', label: 'Waitlist Story Sequence', desc: '3–5 frames, hand-raise before doors open', icon: '📖' },
  ],
  'sales_story': [
    { id: 'story-sequence', label: 'Story Sequence', desc: 'Compressed arc, 4–6 frames to followers', icon: '📖' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Quick story to warm audience', icon: '🎬' },
  ],
  'sales_teaching': [], // Never as the lead at BOF
  'sales_proof': [
    { id: 'testimonial', label: 'Testimonial / Video', desc: 'Client speaking or their results shown', icon: '💬' },
    { id: 'screenshot-post', label: 'Screenshot / DM Receipt', desc: 'The message, the payment, the proof', icon: '📸' },
    { id: 'carousel', label: 'Case Study Carousel', desc: 'Client transformation as proof', icon: '📊' },
    { id: 'before-after', label: 'Before / After', desc: 'Visual transformation with the number', icon: '🔄' },
  ],
  'sales_offer': [
    { id: 'story-sequence', label: 'Story Sequence', desc: 'Deadline, countdown, proof + offer', icon: '📖' },
    { id: 'launch-email', label: 'Launch Email', desc: 'Fact first, one link, short', icon: '🚀' },
    { id: 'talking-head', label: 'Talking Head', desc: 'Direct to followers, sell straight', icon: '🎬' },
  ],
  'email_story': [
    { id: 'story-email', label: 'Story Email', desc: '150–300 words, one lesson, no pitch', icon: '✉️' },
  ],
  'email_teaching': [
    { id: 'story-email', label: 'Teaching Email', desc: 'Method or lesson to your list', icon: '✉️' },
  ],
  'email_proof': [
    { id: 'story-email', label: 'Proof Email', desc: 'Client result + one lesson', icon: '✉️' },
  ],
  'email_offer': [
    { id: 'launch-email', label: 'Launch Email', desc: 'Fact first, deadline, one link', icon: '🚀' },
  ],
  'longform_story': [
    { id: 'youtube', label: 'YouTube — Comeback Story', desc: 'Full 7-beat transformation', icon: '▶️' },
  ],
  'longform_teaching': [
    { id: 'youtube', label: 'YouTube — Deep Teach', desc: 'Full method, no gaps, generosity is the engine', icon: '▶️' },
  ],
  'longform_proof': [
    { id: 'youtube', label: 'YouTube — Case Study', desc: 'One client, told properly', icon: '▶️' },
  ],
  'longform_offer': [],
}

// Which engines are available per job (offer never available at TOF)
function getAvailableEngines(job) {
  return ENGINES.filter(e => {
    const key = `${job}_${e.id}`
    const formats = FORMAT_MATRIX[key]
    return formats && formats.length > 0
  })
}

function getFormatsForJobEngine(job, engine) {
  return FORMAT_MATRIX[`${job}_${engine}`] || []
}

// Legacy flat format options for backward compat
const FORMAT_OPTIONS = {
  reach: [{ id: 'talking-head', label: 'Talking Head Reel', desc: 'You to camera', icon: '🎬' }, { id: 'text-reel', label: 'Text Reel', desc: 'B-roll with text', icon: '📱' }, { id: 'carousel', label: 'Carousel', desc: '6–8 slides', icon: '📊' }, { id: 'green-screen', label: 'Green Screen', desc: 'Reacting on screen', icon: '🟩' }],
  value: [{ id: 'carousel', label: 'Carousel', desc: 'Method or case study', icon: '📊' }, { id: 'talking-head', label: 'Talking Head', desc: 'Explaining or proving', icon: '🎬' }, { id: 'youtube', label: 'YouTube', desc: 'Deep video', icon: '▶️' }],
  sales: [{ id: 'story-sequence', label: 'Story Sequence', desc: 'Proof or deadline', icon: '📖' }, { id: 'talking-head', label: 'Talking Head', desc: 'Direct to followers', icon: '🎬' }, { id: 'testimonial', label: 'Testimonial', desc: 'Client result', icon: '💬' }],
  email: [{ id: 'story-email', label: 'Story Email', desc: 'One lesson, no pitch', icon: '✉️' }, { id: 'launch-email', label: 'Launch Email', desc: 'Fact first, one link', icon: '🚀' }],
  longform: [{ id: 'youtube', label: 'YouTube Script', desc: '8–15 min deep video', icon: '▶️' }],
}

// Map format choice to generation instructions
const FORMAT_PROMPTS = {
  'talking-head': { fmt: 'a 30–90 second spoken video script (100–220 words), delivered to camera, plus caption', out: "Write it as a spoken script. First line: [ON SCREEN: what's visually in frame in second one]. Then the script. Open mid-scene with no introductions. End by turning it onto the viewer, then one button line that loops back to the opening. Then 'CAPTION:' with a 2–3 line caption to post alongside the video." },
  'text-reel': { fmt: 'a 5–15 second text-on-screen reel plus caption', out: "Write 'ON SCREEN:' with the single line of text over the footage (fully readable in one glance), then 'B-ROLL:' one line describing ordinary footage from their week, then 'CAPTION:' with 3–5 short lines of context." },
  'carousel': { fmt: 'a 6–10 slide carousel post', out: "Write it slide by slide: 'SLIDE 1:' etc, under 40 words per slide. Slide 1 is the hook — one claim, one outcome, one tension. One idea per slide. Second-to-last slide turns on the reader. Last slide is the ask. Then 'CAPTION:' with a 2–3 line caption." },
  'green-screen': { fmt: 'a 30–60 second green screen reaction video script plus caption', out: "Write it as a spoken script. First line: [ON SCREEN: the article/screenshot/post being reacted to]. Your first line names what's wrong, surprising or useful. Two or three beats of commentary. The takeaway in your frame, not theirs. Turn and button. Then 'CAPTION:' with a 2–3 line caption to post alongside the video." },
  'skit': { fmt: 'a 15–45 second skit or POV video', out: "Write 'ON SCREEN TEXT: POV: {{scenario}}'. Then describe the scene: what happens, played straight. One turn — the exaggeration or reveal. Then 'CAPTION:' landing the real point in one line." },
  'screen-recording': { fmt: 'a 45–90 second screen recording walkthrough plus caption', out: "Write it as a narrated walkthrough. Hook names the outcome first. Then step by step: 'SCREEN: [what's visible]' followed by 'NARRATION: [what you say]' for each step. End on the finished state. IMPORTANT: name the specific tool, system, or method step being shown — not vague 'mindset work' but the actual thing on screen. Then 'CAPTION:' with a 2–3 line caption to post alongside the video." },
  'over-shoulder': { fmt: 'a 45–90 second over-the-shoulder video script plus caption', out: "Write it as a spoken narration over footage of you working. Hook names the outcome. Walk through what you're doing step by step, naming the specific tool, template, or process visible. End on the finished state. Same rules as screen recording but the camera is on you, not the screen. Then 'CAPTION:' with a 2–3 line caption to post alongside the video." },
  'story-sequence': { fmt: 'a 3–8 frame story sequence plus caption', out: "Write it frame by frame: 'FRAME 1:' etc. Frame 1 opens a loop. Each frame earns the tap to the next. Mix media suggestions: [TALKING CLIP], [SCREENSHOT], [TEXT FRAME], [POLL]. Final frame carries the CTA. Then 'CAPTION:' with a 1–2 line caption if posting as a feed story highlight." },
  'testimonial': { fmt: 'a testimonial or social proof post plus caption', out: "Open on the result or strongest line — never 'so tell us about yourself'. Where they were, in their words, one vivid detail. The turn: what changed — name the SPECIFIC step, method, or thing inside the programme that made the difference, not vague 'mindset shift'. Where they are now, with a number. Then 'CAPTION:' with 3–5 short lines framing the principle that made the difference, turning it on the reader." },
  'screenshot-post': { fmt: 'a screenshot/DM receipt post with caption', out: "Write 'SCREENSHOT:' describing what the screenshot shows (the DM, the payment, the message — describe it, don't invent it). Then 'CAPTION:' with 3–5 short lines: who this person is (one line), where they started, the specific thing that changed, and one line that turns it on the reader. Never explain the method — the screenshot IS the proof." },
  'before-after': { fmt: 'a before/after comparison post with caption', out: "Write 'BEFORE:' one vivid line describing where they were (specific, not 'struggling'). Then 'AFTER:' one vivid line describing where they are now (with a number). Then 'THE CHANGE:' the one specific thing that happened between the two — name the method step, the system, or the decision. Then 'CAPTION:' 3–5 short lines turning it on the reader." },
  'quote-card': { fmt: 'a single-line quote card with caption', out: "Write 'QUOTE:' one sharp line that could only sit under this person's brand — not a generic motivational quote. It should name a specific truth from their work. Then 'CAPTION:' 2–3 lines expanding on why this matters, grounded in a real moment or client." },
  'yap': { fmt: 'a 30–90 second unscripted talking video (yap style) plus caption', out: "Write it as loose spoken notes — not a polished script. Mark: [SETTING: walking/car/desk]. Then the key beats to hit in order, written as bullet thoughts not full sentences. The structure is held loosely in the head. End with one clear point. This is deliberately casual — sloppy is a brand choice, not laziness. Then 'CAPTION:' with a 1–2 line caption to post alongside the video." },
  'rant': { fmt: 'a 30–60 second high-energy opinion video plus caption', out: "Write it as a spoken script. Higher energy, opinion-led. Open with the thing that's wrong. Build the case in 3 beats. Land the contrarian position with conviction. Turn on the viewer. This format works because it's genuinely felt — fake outrage reads instantly. Then 'CAPTION:' with a 1–2 line caption to post alongside the video." },
  'voice-note': { fmt: 'a 60–90 second voice note style video plus caption', out: "Write it as you'd speak into a voice note to a close friend. Softest register. No hook, no structure — just the thought as it came to you. Good for MOF depth. Mark: [TONE: intimate, like 1am voice note]. The lack of polish IS the format. Then 'CAPTION:' with a 1–2 line caption to post alongside the video." },
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
  if (momId === 'pov') return { card: 'c2' }
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
  const isValue = ['c6', 'c7', 'c9', 'c11', 'c12', 'c13', 'c19'].includes(cardKey)
  const isSales = ['c14', 'c15', 'c16', 'c17', 'c18'].includes(cardKey)
  const isYouTube = cardKey === 'c9'
  const isObjection = cardKey === 'c15'

  let brandContext = ''
  if (ctx) {
    const lines = []

    // ── PREMIUM POSITION: Brand Star — reach (full), value (lighter), sales (who it's not for) ──
    if (ctx.positioning) {
      if (isReach || isValue) {
        if (ctx.positioning.worksWithDesc) lines.push(`Who they work with: ${ctx.positioning.worksWithDesc}`)
        if (ctx.positioning.refuses) lines.push(`Who they refuse: ${ctx.positioning.refuses}`)
        if (ctx.positioning.contrarian) lines.push(`Contrarian belief: ${ctx.positioning.contrarian}`)
        if (ctx.positioning.sector) lines.push(`Sector: ${ctx.positioning.sector}`)
        if (ctx.positioning.personality) lines.push(`Brand personality: ${ctx.positioning.personality}`)
      }
      if (isReach) {
        if (ctx.positioning.whatYouDo) lines.push(`What they do: ${ctx.positioning.whatYouDo}`)
      }
      if (isSales) {
        if (ctx.positioning.refuses) lines.push(`Who they refuse (use as a filter): ${ctx.positioning.refuses}`)
        if (ctx.positioning.worksWithDesc) lines.push(`Who they work with: ${ctx.positioning.worksWithDesc}`)
      }
    }

    // ── PREMIUM POSITION: Hero — reach (personal stories), value (depth), not sales ──
    if ((isReach || isValue || isStory) && ctx.hero) {
      if (ctx.hero.origin) lines.push(`Origin story: ${ctx.hero.origin}`)
      if (ctx.hero.turningPoint) lines.push(`Turning point: ${ctx.hero.turningPoint}`)
      if (ctx.hero.gift) lines.push(`What they give clients: ${ctx.hero.gift}`)
      if (ctx.hero.why) lines.push(`Their why: ${ctx.hero.why}`)
      if (ctx.hero.identityLabel) lines.push(`Identity label: ${ctx.hero.identityLabel}`)
    }

    // ── PREMIUM POSITION: Remarkable — value + sales (mechanism is proof) ──
    if ((isValue || isSales) && ctx.remarkable) {
      if (ctx.remarkable.differentiator) lines.push(`Key differentiator: ${ctx.remarkable.differentiator}`)
      if (ctx.remarkable.mechanism) lines.push(`Mechanism: ${ctx.remarkable.mechanism}`)
      if (isValue && ctx.remarkable.provocation) lines.push(`Provocation: ${ctx.remarkable.provocation}`)
    }

    // ── DISTINCTION ENGINE — reach (problems only), value (full), sales (method name + promise) ──
    if (ctx.distinction) {
      if (isReach) {
        if (ctx.distinction.problems.length) lines.push(`Problems their audience faces (use to name the pain, never teach the system): ${ctx.distinction.problems.join(', ')}`)
      }
      if (isValue) {
        if (ctx.distinction.engineName) lines.push(`Method name: ${ctx.distinction.engineName}`)
        if (ctx.distinction.promise) lines.push(`Method promise: ${ctx.distinction.promise}`)
        if (ctx.distinction.problems.length) lines.push(`Problems solved: ${ctx.distinction.problems.join(', ')}`)
        if (ctx.distinction.pillars.length) lines.push(`Pillars: ${ctx.distinction.pillars.join(', ')}`)
      }
      if (isSales) {
        if (ctx.distinction.engineName) lines.push(`Method name: ${ctx.distinction.engineName}`)
        if (ctx.distinction.promise) lines.push(`Method promise: ${ctx.distinction.promise}`)
      }
    }

    // ── SOLD OUT ICP — reach (pains, dream outcome, trigger), value (+ objections, cost of inaction), sales (full) ──
    if (ctx.icp) {
      if (isReach) {
        if (ctx.icp.pains) lines.push(`Their core pains (this is their language — use it to name what they feel): ${ctx.icp.pains}`)
        if (ctx.icp.dreamOutcome) lines.push(`Their dream outcome: ${ctx.icp.dreamOutcome}`)
        if (ctx.icp.triggerMoment) lines.push(`What makes them finally act: ${ctx.icp.triggerMoment}`)
      }
      if (isValue) {
        if (ctx.icp.pains) lines.push(`Their core pains: ${ctx.icp.pains}`)
        if (ctx.icp.dreamOutcome) lines.push(`Their dream outcome: ${ctx.icp.dreamOutcome}`)
        if (ctx.icp.triggerMoment) lines.push(`What makes them act: ${ctx.icp.triggerMoment}`)
        if (ctx.icp.realObjections) lines.push(`Common objections (use as teaching material — the things everyone thinks): ${ctx.icp.realObjections}`)
        if (ctx.icp.costOfInaction) lines.push(`Cost of doing nothing: ${ctx.icp.costOfInaction}`)
      }
      if (isSales) {
        if (ctx.icp.pains) lines.push(`Their core pains: ${ctx.icp.pains}`)
        if (ctx.icp.dreamOutcome) lines.push(`Their dream outcome: ${ctx.icp.dreamOutcome}`)
        if (ctx.icp.costOfInaction) lines.push(`Cost of doing nothing: ${ctx.icp.costOfInaction}`)
        if (ctx.icp.triggerMoment) lines.push(`What makes them act: ${ctx.icp.triggerMoment}`)
        if (isObjection && ctx.icp.realObjections) lines.push(`Real objections heard from this audience (use verbatim): ${ctx.icp.realObjections}`)
      }
    }

    // ── SOLD OUT OFFER — sales only (full Bang Bang + Dip), YouTube (offer name for soft close) ──
    if (isSales && ctx.offer) {
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
      if (ctx.programmeDuration) lines.push(`Programme duration: ${ctx.programmeDuration}`)
    }
    if (isYouTube && ctx.offer) {
      if (ctx.offer.offerName) lines.push(`Offer name (for the single soft mention at the close only): ${ctx.offer.offerName}`)
    }

    if (lines.length > 0) {
      const header = isSales
        ? `\nTHIS PERSON'S BRAND AND OFFER (use to shape the selling — reference the offer, price, proof and objections directly):`
        : `\nTHIS PERSON'S BRAND CONTEXT (use to guide tone, positioning, and who the content speaks to — do NOT mention any offer name, programme name, or price):`
      brandContext = `${header}\n${lines.join('\n')}`
    }

    // Lead magnet context for c19
    if (cardKey === 'c19' && ctx?.magnet) {
      const ml = []
      if (ctx.magnet.name) ml.push(`Freebie name: ${ctx.magnet.name}`)
      if (ctx.magnet.promise) ml.push(`Freebie promise: ${ctx.magnet.promise}`)
      if (ctx.magnet.keyword) ml.push(`Keyword to comment: ${ctx.magnet.keyword}`)
      if (ctx.magnet.methodSteps?.length) ml.push(`Method steps (sharpen these, don't replace): ${ctx.magnet.methodSteps.join(' \u2192 ')}`)
      if (ml.length) brandContext += `\n\nTHE FREEBIE (this carousel drives comments for this specific lead magnet):\n${ml.join('\n')}`
    }

    // Ambient keyword context for non-c19 cards with comment-word CTAs
    if (cardKey !== 'c19' && ctx?.activeMagnet) {
      brandContext += `\n\nACTIVE LEAD MAGNET (if the CTA is a comment-word, use this keyword): Keyword: "${ctx.activeMagnet.keyword}" — they get: ${ctx.activeMagnet.promise}`
    }

  }

  return `Write ${c.fmt}.

${c.out}

CTA: ${c.cta}
${arc ? `\nUse the ${arc.n} shape:\n${arc.beats}` : ''}
${brandContext}

The moment: ${facts.join('. ')}

Only use facts from above. Anything missing: write {{WHAT'S NEEDED}} in gold caps. Never invent.
${redoNote ? `\nLast draft wasn't right: ${redoNote}` : ''}`
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

function PieceCard({ title, subtitle, piece, swap, dont, onCopy, onRewrite, onToEmail, onToYT, onChangeFormat, onSave, posted, onTogglePosted }) {
  const [copied, setCopied] = useState(false)
  const [showDont, setShowDont] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(piece || '')

  // Sync draft when piece changes externally (rewrite, format change)
  useEffect(() => { setDraft(piece || '') }, [piece])

  function handleCopy() {
    if (piece && navigator.clipboard) navigator.clipboard.writeText(piece)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  function renderPiece(text) {
    if (!text) return <span className="text-zinc-500">This one didn't write. Tap rewrite to try again.</span>
    if (text.startsWith('{{ERROR:')) return <span className="text-red-400">{text.replace('{{ERROR:', '').replace('}}', '')}</span>
    return text.split(/(\{\{[^}]+\}\})/).map((part, i) =>
      part.startsWith('{{') ? <span key={i} className="text-gold font-bold text-xs">{part}</span> : part
    )
  }

  if (editing) {
    return (
      <div className="glass-card p-5 mb-3 border-gold/30">
        <div className="flex justify-between items-baseline mb-3 gap-3 flex-wrap">
          <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{title}</h4>
          <span className="text-xs text-gold uppercase tracking-widest">Editing</span>
        </div>
        <textarea rows={12} value={draft} onChange={e => setDraft(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none" />
        <div className="flex gap-2 mt-3">
          <Btn gold onClick={() => { if (onSave) onSave(draft); setEditing(false) }}>Save</Btn>
          <Btn onClick={() => { setDraft(piece || ''); setEditing(false) }}>Cancel</Btn>
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card p-5 mb-3 ${posted ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : ''}`}>
      <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {onTogglePosted && (
            <button onClick={onTogglePosted} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${posted ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'}`}>
              {posted && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </button>
          )}
          <h4 className={`text-xs font-bold uppercase tracking-widest ${posted ? 'text-emerald-400' : 'text-gold'}`}>{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {posted && <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Posted</span>}
          {subtitle && <span className="text-xs text-zinc-600 uppercase tracking-widest">{subtitle}</span>}
        </div>
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
        {onSave && <Btn onClick={() => setEditing(true)}>Edit</Btn>}
        {onRewrite && <Btn onClick={onRewrite}>Rewrite</Btn>}
        {onChangeFormat && <Btn onClick={onChangeFormat}>Change format</Btn>}
        {onToEmail && <Btn onClick={onToEmail}>→ Email</Btn>}
        {onToYT && <Btn onClick={onToYT}>→ YouTube</Btn>}
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
  const [saving, setSaving] = useState(false)

  // Sales angle dropdown — builds options from SALES_ANGLES + playbook data
  function SalesDropdown() {
    if (job !== 'sales') return null
    return (
      <div className="mb-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Selling</label>
        <select value={salesAngle || ''} onChange={e => onSalesAngle(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold transition appearance-none cursor-pointer"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23C9A84C' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
          <option value="">— What are you selling? —</option>
          {offerContext?.offerName && <option value="main-offer">{offerContext.offerName}{offerContext.price ? ` — £${offerContext.price}` : ''}</option>}
          {offerContext?.dipName && <option value="micro-offer">{offerContext.dipName}{offerContext.dipPrice ? ` — £${offerContext.dipPrice}` : ''}</option>}
          {(!offerContext?.offerName) && <option value="main-offer">My main offer</option>}
          {(!offerContext?.dipName) && <option value="micro-offer">My micro offer / The Dip</option>}
          <option value="seasonal">Seasonal or event-based</option>
          <option value="new-launch">Something brand new</option>
          <option value="waitlist">Waitlist / coming soon</option>
          <option value="testimonial-push">Proof and social proof</option>
        </select>
      </div>
    )
  }

  async function submit() {
    if (!capLine.trim() || saving) return
    setSaving(true)
    await onCapture(capType, capLine.trim(), {}, salesAngle)
    setCapLine('')
    setExpanded(false)
    setSaving(false)
  }

  // Filled state — moment assigned
  if (moment) {
    return (
      <div className="rounded-lg border p-4 mb-2 bg-zinc-900 border-gold/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
        </div>
        <p className="text-sm text-zinc-300 py-1">{moment.line}</p>
        <SalesDropdown />
        <div className="flex gap-3">
          <button onClick={onPick} className="text-xs font-bold text-gold/50 hover:text-gold uppercase tracking-widest pt-1">Change</button>
          <button onClick={onClear} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest pt-1">Clear</button>
        </div>
      </div>
    )
  }

  // Collapsed state — no moment
  if (!expanded) {
    return (
      <div className="rounded-lg border p-4 mb-2 bg-zinc-900/50 border-zinc-800/50">
        <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
        <SalesDropdown />
        <div className="flex gap-2 mt-2">
          <button onClick={() => setExpanded(true)} className="text-xs font-bold text-gold/50 hover:text-gold uppercase tracking-widest">+ Capture here</button>
          <button onClick={onPick} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest">Pick from log</button>
        </div>
      </div>
    )
  }

  // Expanded state — capture input
  return (
    <div className="rounded-lg border p-4 mb-2 bg-zinc-900 border-gold/20">
      <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[job]}</span>
      <SalesDropdown />
      <div className="flex gap-1.5 flex-wrap mt-2 mb-2">
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
        <Btn gold onClick={submit} disabled={saving}>{saving ? '...' : '→'}</Btn>
      </div>
      <button onClick={() => { setExpanded(false); setCapLine('') }} className="text-xs font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest mt-2">← Cancel</button>
    </div>
  )
}

function EditablePieceCard({ title, piece, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(piece || '')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (piece && navigator.clipboard) navigator.clipboard.writeText(piece)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  if (editing) {
    return (
      <div className="glass-card p-5 mb-3 border-gold/30">
        <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-3">{title}</h4>
        <textarea rows={10} value={draft} onChange={e => setDraft(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none" />
        <div className="flex gap-2 mt-3">
          <Btn gold onClick={() => { onSave(draft); setEditing(false) }}>Save</Btn>
          <Btn onClick={() => { setDraft(piece || ''); setEditing(false) }}>Cancel</Btn>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 mb-3">
      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-3">{title}</h4>
      <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">{piece || <span className="text-zinc-500">No content generated.</span>}</div>
      <div className="flex gap-2 mt-4">
        <Btn gold onClick={handleCopy} disabled={!piece}>{copied ? 'Copied' : 'Copy'}</Btn>
        <Btn onClick={() => setEditing(true)}>Edit</Btn>
        <button onClick={onDelete} className="text-xs font-bold text-red-500/60 hover:text-red-400 uppercase tracking-widest ml-auto py-3">Delete</button>
      </div>
    </div>
  )
}

function VoiceCalibration({ samples, onSave }) {
  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState(samples.length > 0 ? [...samples] : ['', '', ''])

  if (!open) {
    return (
      <div className="mt-6">
        <button onClick={() => { setDrafts(samples.length > 0 ? [...samples] : ['', '', '']); setOpen(true) }}
          className={`w-full text-left glass-card p-4 transition hover:border-gold/30 ${samples.length > 0 ? '' : 'border-dashed border-gold/20'}`}>
          <GoldLabel>Your voice</GoldLabel>
          {samples.length > 0 && samples.some(s => s.trim()) ? (
            <p className="text-xs text-zinc-400">{samples.filter(s => s.trim()).length} writing sample{samples.filter(s => s.trim()).length !== 1 ? 's' : ''} saved — the AI writes in your voice. Tap to edit.</p>
          ) : (
            <p className="text-xs text-zinc-500">Paste 2-3 pieces of content you've actually written. The AI will match your voice instead of sounding generic.</p>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 glass-card p-5">
      <GoldLabel>Train your voice</GoldLabel>
      <p className="text-xs text-zinc-500 mb-4">Paste 2-3 captions, emails, or posts you've written yourself. These teach the AI how you actually sound — not how coaches "should" sound.</p>
      {drafts.map((d, i) => (
        <div key={i} className="mb-3">
          <label className="text-xs text-zinc-500 mb-1 block">Sample {i + 1}</label>
          <textarea rows={4} value={d} onChange={e => { const u = [...drafts]; u[i] = e.target.value; setDrafts(u) }}
            placeholder={i === 0 ? "Paste a caption or post you wrote..." : "Another one — the more variety, the better the match..."}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none" />
        </div>
      ))}
      <div className="flex gap-3 mt-2">
        <Btn gold onClick={() => { onSave(drafts.filter(d => d.trim())); setOpen(false) }}>Save voice samples</Btn>
        <Btn onClick={() => setOpen(false)}>Cancel</Btn>
      </div>
    </div>
  )
}

function EnrichCard({ idx, sl, engine, format, onEngineChange, onFormatChange, playbookContext }) {
  const [open, setOpen] = useState(true)
  const m = sl.moment
  const availEngines = getAvailableEngines(sl.job)
  const availFormats = engine ? getFormatsForJobEngine(sl.job, engine) : []
  const fallbackQs = getEnrichQuestions(m.type, sl.job)
  const bothChosen = engine && format

  return (
    <div className={`glass-card mb-3 overflow-hidden ${bothChosen ? 'border-gold/20' : ''}`}>
      {/* Header — always visible, tappable to collapse */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${bothChosen ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
          <span className="text-xs font-bold text-gold uppercase tracking-widest">{JOBNAMES[sl.job]}</span>
          <span className="text-xs text-zinc-500 truncate">— {m.line.slice(0, 50)}{m.line.length > 50 ? '...' : ''}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {engine && format && <span className="text-[10px] text-zinc-500">{ENGINES.find(e => e.id === engine)?.icon} {availFormats.find(f => f.id === format)?.label || format}</span>}
          <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.06]">
          {/* Moment line */}
          <p className="text-sm text-zinc-300 mt-3 mb-3">{m.line}</p>

          {/* Sales context */}
          {sl.job === 'sales' && playbookContext?.offer && (
            <div className="bg-zinc-800/50 rounded-lg p-3 mb-3 border border-zinc-700/50">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your offer</span>
              {playbookContext.offer.offerName && <p className="text-xs text-zinc-300 mt-1"><span className="text-gold">{playbookContext.offer.offerName}</span>{playbookContext.offer.price ? ` — £${playbookContext.offer.price}` : ''}</p>}
              {playbookContext.offer.dipName && <p className="text-xs text-zinc-300 mt-1"><span className="text-gold">{playbookContext.offer.dipName}</span>{playbookContext.offer.dipPrice ? ` — £${playbookContext.offer.dipPrice}` : ''}</p>}
            </div>
          )}

          {/* Engine picker */}
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Engine</label>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {availEngines.map(eng => (
              <button key={eng.id} onClick={() => onEngineChange(eng.id)}
                className={`text-left px-2.5 py-2 rounded-lg border transition text-xs ${engine === eng.id ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400'}`}>
                {eng.icon} {eng.label}
              </button>
            ))}
          </div>

          {/* Format picker */}
          {engine && (
            <>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Format</label>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {availFormats.map(f => (
                  <button key={f.id} onClick={() => onFormatChange(f.id)}
                    className={`text-left px-2.5 py-2 rounded-lg border transition text-xs ${format === f.id ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600 text-zinc-400'}`}>
                    {f.icon} {f.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Questions — static fallback (AI questions removed from this view for reliability) */}
          {bothChosen && (
            <>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 mt-4">Flesh it out</label>
              {fallbackQs.map(([key, q, hint]) => (
                <div key={`${idx}-${key}`} className="mb-3">
                  <label className="block text-xs font-bold text-white mb-1">{q}</label>
                  <p className="text-[10px] text-zinc-500 mb-1">{hint}</p>
                  <textarea rows={2} defaultValue="" id={`enrich-${idx}-${key}`}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-sm resize-none" />
                </div>
              ))}
            </>
          )}

          {!bothChosen && <p className="text-xs text-zinc-600 mt-2">Pick engine + format to unlock the questions.</p>}
        </div>
      )}
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
  const [chosenEngines, setChosenEngines] = useState({})
  const [chosenFormats, setChosenFormats] = useState({})

  // Saved weeks
  const [savedWeeks, setSavedWeeks] = useState([])
  const [viewingWeek, setViewingWeek] = useState(null)

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [streakCount, setStreakCount] = useState(0)

  // Modals
  const [modal, setModal] = useState(null)
  const [picker, setPicker] = useState(null)

  // Writing state
  const [writing, setWriting] = useState(false)
  const [writingLine, setWritingLine] = useState('')

  // Flow context: where to go after stage/channels
  const [afterChannels, setAfterChannels] = useState('home')

  // Phase planner
  const [phases, setPhases] = useState([])
  const [activePhase, setActivePhase] = useState(null)
  const [phaseView, setPhaseView] = useState('list')
  const [phaseName, setPhaseName] = useState('')
  const [phaseStartDate, setPhaseStartDate] = useState('')
  const [phaseDuration, setPhaseDuration] = useState(6)
  const [phaseWeeks, setPhaseWeeks] = useState([])
  const [editingPhaseId, setEditingPhaseId] = useState(null)
  const [phaseSaving, setPhaseSaving] = useState(false)
  const [phaseSuggesting, setPhaseSuggesting] = useState(false)
  const [phaseAiSuggestion, setPhaseAiSuggestion] = useState(null)

  // Playbook data (loaded once for AI context)
  const [playbookContext, setPlaybookContext] = useState(null)
  const [voiceSamples, setVoiceSamples] = useState([])

  // Lead magnet state
  const [magnetData, setMagnetData] = useState(null)
  const [memberMagnets, setMemberMagnets] = useState([])
  const [freePushSlots, setFreePushSlots] = useState({})
  const [freePushMagnet, setFreePushMagnet] = useState({})

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

      // Load saved weeks
      const { data: weeksData } = await supabase.from('cc_weeks').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20)
      if (weeksData) setSavedWeeks(weeksData)

      // Load voice samples from profile
      if (profile && profile.voice_samples) setVoiceSamples(profile.voice_samples)

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
        const de = deRes.data.engine_data || deRes.data
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

      // Load lead magnets for this client
      const { data: magnets } = await supabase.from('lead_magnets').select('id, name, promise, keyword, dm_flow_live, problem_line, method_steps').eq('client_id', client.id)
      if (magnets && magnets.length > 0) setMemberMagnets(magnets)

      // Fetch content phases
      const { data: allPhases } = await supabase.from('content_phases').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      if (allPhases) {
        setPhases(allPhases)
        const active = allPhases.find(p => p.is_active)
        if (active) setActivePhase(active)
      }

      // Check for magnet_id query param (deep link from lead magnets page)
      const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const magnetId = searchParams.get('magnet_id')

      setLoading(false)
      if (magnetId && magnets) {
        const found = magnets.find(m => String(m.id) === magnetId)
        if (found) {
          setMagnetData(found)
          setScreen('magnet-generate')
          return
        }
      }
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

  async function generateEnrichQuestions(momentLine, momentType, job, engine, format) {
    const jobLabel = { reach: 'a post to get noticed by strangers (cold reach)', value: 'a post to build trust with followers (warm audience)', sales: 'a post to sell to warm audience', email: 'an email to their list', longform: 'a YouTube video' }[job] || job
    const typeLabel = TYPESHORT[momentType] || momentType
    const engineLabel = engine ? (ENGINES.find(e => e.id === engine)?.label || engine) : 'not yet chosen'
    const formatLabel = format || 'not yet chosen'

    // For sales posts, include offer context so questions reference the actual offer
    let offerInfo = ''
    if (job === 'sales' && playbookContext?.offer) {
      const o = playbookContext.offer
      const parts = []
      if (o.offerName) parts.push(`Offer: ${o.offerName}${o.price ? ' (£' + o.price + ')' : ''}`)
      if (o.corePromise) parts.push(`Promise: ${o.corePromise}`)
      if (o.guaranteeType) parts.push(`Guarantee: ${o.guaranteeType}`)
      if (o.scarcity) parts.push(`Scarcity: ${o.scarcity}`)
      if (o.dipName) parts.push(`Micro offer: ${o.dipName}${o.dipPrice ? ' (£' + o.dipPrice + ')' : ''}`)
      if (playbookContext.icp?.pains) parts.push(`Audience pains: ${playbookContext.icp.pains}`)
      if (playbookContext.icp?.realObjections) parts.push(`Common objections: ${playbookContext.icp.realObjections}`)
      if (parts.length) offerInfo = `\n\nThis person's offer (from their Sold Out playbook — reference these details in your questions):\n${parts.join('\n')}`
    }

    const prompt = `You are inside a content tool. A coach has logged this moment:

"${momentLine}"

Moment type: ${typeLabel}
This will become: ${jobLabel}
Content engine: ${engineLabel} (${engine === 'story' ? 'builds recognition and belief through narrative' : engine === 'teaching' ? 'builds authority through method and how-to' : engine === 'proof' ? 'builds certainty through results and receipts' : engine === 'offer' ? 'builds decisions through the thing for sale' : 'to be determined'})
Format: ${formatLabel}${offerInfo}

Generate exactly 3 follow-up questions to extract the detail needed to write this specific type of piece. Each question should react to what they actually wrote — reference their specific words, names, or situation.

Rules:
- Questions must be specific to THIS moment AND this engine/format combination
- ${engine === 'story' ? 'Dig for the scene, the emotion, the turning point — stories need vivid detail and a before/after. Ask what specifically changed and what caused the change (not "mindset" — the actual step, decision, or system).' : engine === 'teaching' ? 'Dig for the SPECIFIC method, step, tool, or system they used or taught — not vague "mindset work" or "consistency". What exactly did they do? What tool or framework? What was the process step by step? Teaching content needs the practitioner detail that only someone who has actually done it would know.' : engine === 'proof' ? 'Dig for the exact number, the timeline, the starting point, AND what specifically inside their programme or method produced this result — name the system, the step, the tool. "What did you actually change or do that caused this?" not "how did it feel".' : engine === 'offer' ? 'Dig for the deadline, the constraint, the reason now — offer content needs urgency and a clear ask.' : 'Ask for the detail that is missing.'}
- CRITICAL: always ask what SPECIFICALLY caused the result or change — the exact method step, system, tool, framework, or decision. Never accept "mindset", "consistency", or "hard work" as the answer. Push for the concrete thing they did differently inside their programme.
- Ask for the detail that's missing from what they wrote — don't ask for things they already said
- Keep questions short and direct — one line each, like a coach would ask
- Add a one-line hint under each question that guides them toward specifics, not feelings

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

  const lastGenModel = useRef(null)

  async function generate(card, moment, redoNote, arc, cardKey, opts = {}) {
    const prompt = buildPrompt(card, moment, redoNote, arc, opts.contextOverride || playbookContext, cardKey)
    const voiceCtx = {}
    if (playbookContext?.voice) voiceCtx.voice = playbookContext.voice
    if (voiceSamples && voiceSamples.length > 0) voiceCtx.samples = voiceSamples
    const body = { prompt, voiceContext: Object.keys(voiceCtx).length > 0 ? voiceCtx : undefined }
    if (opts.maxTokens) body.maxTokens = opts.maxTokens
    if (redoNote && opts.previousDraft) {
      body.isRewrite = true
      body.previousDraft = opts.previousDraft
    }
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Generation failed')
    lastGenModel.current = data.model || null
    return data.content
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const baseN = stage ? (MIX[stage] || MIX.build).reach + (MIX[stage] || MIX.build).value + (MIX[stage] || MIX.build).sales : 5
  const pieceCount = (piecesN && piecesN >= 3) ? piecesN : baseN
  const emailCount = emailN !== null ? emailN : (hasList ? 1 : 0)
  const ytCount = ytN !== null ? ytN : (doesYT ? 1 : 0)
  const mix = mixFor(stage, pieceCount, weekGoal)

  // ── Navigation ──────────────────────────────────────────────────────────

  // ── Phase Planner Functions ──────────────────────────────────────────────

  const initPhaseWeeks = (count) => setPhaseWeeks(Array.from({ length: count }, (_, i) => ({ week: i + 1, type: 'trust' })))

  const resetPhaseForm = () => { setPhaseName(''); setPhaseStartDate(''); setPhaseDuration(6); setPhaseWeeks([]); setEditingPhaseId(null); setPhaseAiSuggestion(null) }

  const startCreatePhase = () => {
    resetPhaseForm()
    const today = new Date()
    const dow = today.getDay()
    const daysUntilMon = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow
    const nextMon = new Date(today); nextMon.setDate(today.getDate() + daysUntilMon)
    setPhaseStartDate(nextMon.toISOString().split('T')[0])
    initPhaseWeeks(6)
    setPhaseView('create')
  }

  const editPhase = (phase) => {
    setPhaseName(phase.name); setPhaseStartDate(phase.start_date); setPhaseDuration(phase.weeks.length)
    setPhaseWeeks(phase.weeks); setEditingPhaseId(phase.id); setPhaseView('edit')
  }

  const suggestPhase = async () => {
    setPhaseSuggesting(true); setPhaseAiSuggestion(null)
    try {
      // Build business context from loaded playbook data
      const ctxParts = []
      const pc = playbookContext || {}
      if (pc.positioning?.whatYouDo) ctxParts.push(`What they do: ${pc.positioning.whatYouDo}`)
      if (pc.positioning?.sector) ctxParts.push(`Sector: ${pc.positioning.sector}`)
      if (pc.distinction?.engineName) ctxParts.push(`Branded system: ${pc.distinction.engineName}`)
      if (pc.distinction?.promise) ctxParts.push(`Distinction promise: ${pc.distinction.promise}`)
      if (pc.offer?.offerName) ctxParts.push(`Main offer: ${pc.offer.offerName}`)
      if (pc.offer?.corePromise) ctxParts.push(`Offer promise: ${pc.offer.corePromise}`)
      if (pc.offer?.price) ctxParts.push(`Price: £${pc.offer.price}`)
      if (pc.icp?.specificDescription) ctxParts.push(`Ideal client: ${pc.icp.specificDescription}`)
      if (pc.icp?.dreamOutcome) ctxParts.push(`Dream outcome: ${pc.icp.dreamOutcome}`)
      if (pc.offer?.dipName) ctxParts.push(`Entry offer: ${pc.offer.dipName}`)

      const stageMap = { start: 'early', build: 'building', launch: 'launching', recovery: 'building', ever: 'scaling' }
      const res = await fetch('/api/generate-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phase-suggestion', data: { business_context: ctxParts.join('\n'), business_stage: stageMap[stage] || 'building', requested_duration: phaseDuration } }),
      })
      const result = await res.json()
      if (result.plan) {
        try {
          // Strip markdown code fences if present
          const cleaned = result.plan.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          setPhaseAiSuggestion(parsed)
          if (parsed.name) setPhaseName(parsed.name)
          // Set weeks FIRST, then duration — avoids initPhaseWeeks overwriting
          if (parsed.weeks) {
            const newWeeks = parsed.weeks.map((type, i) => ({ week: i + 1, type }))
            setPhaseWeeks(newWeeks)
            setPhaseDuration(newWeeks.length)
          } else if (parsed.duration) {
            setPhaseDuration(parsed.duration)
          }
        } catch { setPhaseAiSuggestion({ explanation: result.plan }) }
      }
    } catch (err) { console.error('Phase suggestion error:', err) }
    setPhaseSuggesting(false)
  }

  const savePhase = async () => {
    if (!phaseName || !phaseStartDate || phaseWeeks.length === 0 || !clientId) return
    setPhaseSaving(true)
    await supabase.from('content_phases').update({ is_active: false }).eq('client_id', clientId)
    const payload = { client_id: clientId, name: phaseName, start_date: phaseStartDate, weeks: phaseWeeks, is_active: true, updated_at: new Date().toISOString() }
    if (editingPhaseId) { await supabase.from('content_phases').update(payload).eq('id', editingPhaseId) }
    else { await supabase.from('content_phases').insert(payload) }
    const { data: refreshed } = await supabase.from('content_phases').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
    if (refreshed) { setPhases(refreshed); setActivePhase(refreshed.find(p => p.is_active) || null) }
    setPhaseSaving(false); setPhaseView('list'); resetPhaseForm()
  }

  const deletePhase = async (id) => {
    await supabase.from('content_phases').delete().eq('id', id)
    setPhases(prev => prev.filter(p => p.id !== id))
    if (activePhase?.id === id) setActivePhase(null)
    // deleted
  }

  const activatePhase = async (id) => {
    await supabase.from('content_phases').update({ is_active: false }).eq('client_id', clientId)
    await supabase.from('content_phases').update({ is_active: true }).eq('id', id)
    setPhases(prev => prev.map(p => ({ ...p, is_active: p.id === id })))
    setActivePhase(phases.find(p => p.id === id))
    // activated
  }

  const getPhaseCurrentWeek = (phase) => {
    if (!phase) return null
    const today = new Date(); const start = new Date(phase.start_date)
    const weekNum = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 7)) + 1
    if (weekNum < 1 || weekNum > phase.weeks.length) return null
    const w = phase.weeks.find(w => w.week === weekNum)
    return w ? { ...w, weekNum, total: phase.weeks.length } : null
  }

  const phaseWeekToGoal = { reach: 'growth', trust: 'trust', sales: 'conversion' }
  const [planningPhaseWeek, setPlanningPhaseWeek] = useState(null)

  const planPhaseWeek = (weekNum) => {
    if (!activePhase) return
    const weekData = activePhase.weeks.find(w => w.week === weekNum)
    if (!weekData) return
    const goal = phaseWeekToGoal[weekData.type] || 'default'
    setWeekGoal(goal)
    const slots = buildWeekSlots(goal)
    setWeekSlots(slots)
    setPlanningPhaseWeek(weekNum)
  }

  const exitPhaseWeekPlan = () => {
    setPlanningPhaseWeek(null)
    setWeekSlots([])
    setPicker(null)
  }

  function navigateTo(screenId, data) {
    if (screenId === 'quick-moment') {
      setQuickMoment(null); setQuickJob(null); setEnrichIdx(0)
    }
    if (screenId === 'week-goal') {
      setWeekGoal(null)
      if (!stage) { setAfterChannels('week-goal'); setScreen('stage'); return }
    }
    if (screenId === 'view-week' && data) {
      setViewingWeek(data)
    }
    if (screenId === 'view-weeks') {
      // Show list of all weeks — reuse view-week with null to show list
      setViewingWeek(null)
    }
    setScreen(screenId)
  }

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

    // Cadence: auto-suggest freebie push on one value slot if conditions met
    const gOverride = goalOverride !== undefined ? goalOverride : weekGoal
    const liveMagnets = memberMagnets.filter(mg => mg.dm_flow_live)
    if (liveMagnets.length > 0 && stage !== 'launch') {
      const validGoals = ['trust', 'growth', 'default']
      const validStages = ['recovery', 'build', 'start', 'ever']
      if ((gOverride && validGoals.includes(gOverride)) || validStages.includes(stage)) {
        // Check last c19 in saved weeks
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const recentC19 = savedWeeks.some(w => (w.piece_ids || []).some(p => p.cardKey === 'c19' && new Date(w.week_start).getTime() > sevenDaysAgo))
        if (!recentC19) {
          const firstValueIdx = slots.findIndex(s => s.job === 'value')
          if (firstValueIdx >= 0) {
            setFreePushSlots(prev => ({ ...prev, [firstValueIdx]: true }))
            if (liveMagnets.length === 1) {
              setFreePushMagnet(prev => ({ ...prev, [firstValueIdx]: String(liveMagnets[0].id) }))
            }
          }
        }
      }
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
      <div className="min-h-screen bg-zinc-950 bg-grid text-white flex items-center justify-center">
        <div className="max-w-lg w-full px-4">
          <Question>Where's your <span className="text-gold font-medium">business at</span> right now?</Question>
          <DimLabel>One tap. This shapes what your week looks like and what the tool suggests.</DimLabel>
          <div className="flex flex-col gap-2">
            {STAGES.map(s => (
              <OptionButton key={s.id} onClick={async () => { setStage(s.id); await saveProfile({ stage: s.id }); setScreen('channels') }}>
                {s.t}<span className="block text-zinc-500 text-xs mt-1 font-normal">{s.s}</span>
              </OptionButton>
            ))}
          </div>
          {stage && (
            <div className="flex justify-between mt-6">
              <GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (screen === 'channels') {
    return (
      <div className="min-h-screen bg-zinc-950 bg-grid text-white flex items-center justify-center">
        <div className="max-w-lg w-full px-4">
          <Question>Two quick things about your <span className="text-gold font-medium">channels</span>.</Question>
          <DimLabel>These decide whether your week includes an email and a YouTube video alongside the posts.</DimLabel>
          <GoldLabel>Do you have an email list?</GoldLabel>
          <div className="flex flex-col gap-2 mb-5">
            <OptionButton selected={hasList === true} onClick={() => { setHasList(true) }}>Yes<span className="block text-zinc-500 text-xs mt-1 font-normal">Even a small one — your week gets one email to keep it warm</span></OptionButton>
            <OptionButton selected={hasList === false} onClick={() => { setHasList(false) }}>Not yet<span className="block text-zinc-500 text-xs mt-1 font-normal">Your posts will route people toward starting one</span></OptionButton>
          </div>
          <GoldLabel>Are you making YouTube videos?</GoldLabel>
          <div className="flex flex-col gap-2">
            <OptionButton selected={doesYT === true} onClick={() => { setDoesYT(true) }}>Yes<span className="block text-zinc-500 text-xs mt-1 font-normal">Your week gets one deep video</span></OptionButton>
            <OptionButton selected={doesYT === false} onClick={() => { setDoesYT(false) }}>Not yet<span className="block text-zinc-500 text-xs mt-1 font-normal">Posts and email carry the trust work for now</span></OptionButton>
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
        </div>
      </div>
    )
  }

  // ── Screen: Phase Planner ────────────────────────────────────────────────

  if (screen === 'phase-planner') {
    const currentWeek = activePhase ? getPhaseCurrentWeek(activePhase) : null

    // ── Inline board for a specific phase week ──
    if (planningPhaseWeek && activePhase) {
      const pwData = activePhase.weeks.find(w => w.week === planningPhaseWeek)
      const pwType = PHASE_WEEK_TYPES.find(t => t.id === pwData?.type)
      const pwColors = PHASE_WEEK_COLORS[pwData?.type] || PHASE_WEEK_COLORS.trust
      const pwStart = new Date(activePhase.start_date); pwStart.setDate(pwStart.getDate() + (planningPhaseWeek - 1) * 7)
      const pwEnd = new Date(pwStart); pwEnd.setDate(pwEnd.getDate() + 6)
      const fmtD = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      const filled = weekSlots.filter(s => s.moment).length

      return (
        <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          {/* Week header */}
          <button onClick={exitPhaseWeekPlan} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Phase
          </button>

          <div className={`p-4 rounded-lg border ${pwColors.bg} ${pwColors.border} mb-6`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{pwType?.icon}</span>
                <span className="text-white font-bold">Week {planningPhaseWeek} — {pwType?.label}</span>
              </div>
              <span className="text-zinc-500 text-xs">{fmtD(pwStart)} — {fmtD(pwEnd)}</span>
            </div>
            <p className={`text-xs ${pwColors.text}`}>{pwType?.desc}</p>
          </div>

          <GoldLabel>Plan Week {planningPhaseWeek}</GoldLabel>
          <Question>Match <span className="text-gold font-medium">moments</span> to this week's posts.</Question>
          <DimLabel>Tap a slot, pick a moment. Or let the tool suggest and adjust from there.</DimLabel>

          <Stepper label="Feed posts" note={pieceCount === baseN ? 'The pace your stage suggests' : pieceCount > baseN ? 'Above your stage\'s pace' : 'A lighter week'}
            value={pieceCount} onMinus={() => changePieceCount(-1)} onPlus={() => changePieceCount(1)} minDisabled={pieceCount <= 3} maxDisabled={pieceCount >= 21} />
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
                if (dayBase !== lastDay) { grouped.push({ type: 'day', day: dayBase }); lastDay = dayBase }
                grouped.push({ type: 'slot', sl, i })
              })
              return grouped.map((item, gi) =>
                item.type === 'day' ? (
                  <div key={'day-' + gi} className="mt-4 mb-2 first:mt-0">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.day}</span>
                  </div>
                ) : (
                  <div key={item.i}>
                    <SlotCard job={item.sl.job} moment={item.sl.moment}
                      onPick={() => setPicker(item.i)}
                      onClear={() => { const updated = [...weekSlots]; updated[item.i].moment = null; setWeekSlots(updated) }}
                      salesAngle={salesAngles[item.i]}
                      onSalesAngle={(angle) => setSalesAngles(prev => ({ ...prev, [item.i]: angle }))}
                      offerContext={playbookContext?.offer}
                      onCapture={async (type, line, enrichment, angle) => {
                        try {
                          const entry = await addLogEntry(type, line)
                          if (entry) {
                            entry.enrichment = enrichment || {}
                            if (Object.keys(entry.enrichment).length > 0) await updateLogEntry(entry.id, entry.enrichment)
                            setLog(prev => [entry, ...prev])
                            setWeekSlots(prev => { const updated = [...prev]; updated[item.i] = { ...updated[item.i], moment: entry }; return updated })
                            if (angle) setSalesAngles(prev => ({ ...prev, [item.i]: angle }))
                          } else {
                            const localMoment = { id: `local-${Date.now()}`, type, line, enrichment: enrichment || {}, created_at: new Date().toISOString() }
                            setWeekSlots(prev => { const updated = [...prev]; updated[item.i] = { ...updated[item.i], moment: localMoment }; return updated })
                          }
                        } catch (err) {
                          const localMoment = { id: `local-${Date.now()}`, type, line, enrichment: enrichment || {}, created_at: new Date().toISOString() }
                          setWeekSlots(prev => { const updated = [...prev]; updated[item.i] = { ...updated[item.i], moment: localMoment }; return updated })
                        }
                      }} />
                    {item.sl.job === 'value' && memberMagnets.length > 0 && (
                      <div className="ml-4 mb-2 flex items-center gap-2">
                        <button onClick={() => {
                          const isOn = !freePushSlots[item.i]
                          setFreePushSlots(prev => ({ ...prev, [item.i]: isOn }))
                          if (!isOn) setFreePushMagnet(prev => { const u = { ...prev }; delete u[item.i]; return u })
                        }} className={`text-[10px] font-bold uppercase tracking-widest transition ${freePushSlots[item.i] ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}>
                          {freePushSlots[item.i] ? '● Freebie push ON' : '○ Freebie push'}
                        </button>
                        {freePushSlots[item.i] && memberMagnets.length > 1 && (
                          <select value={freePushMagnet[item.i] || ''} onChange={e => setFreePushMagnet(prev => ({ ...prev, [item.i]: e.target.value }))}
                            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-gold appearance-none cursor-pointer">
                            <option value="">Pick magnet...</option>
                            {memberMagnets.map(mg => <option key={mg.id} value={mg.id}>{mg.name} ({mg.keyword})</option>)}
                          </select>
                        )}
                        {freePushSlots[item.i] && memberMagnets.length === 1 && (
                          <span className="text-[10px] text-zinc-500">{memberMagnets[0].name} ({memberMagnets[0].keyword})</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              )
            })()}
          </div>

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={exitPhaseWeekPlan}>← Back to Phase</GhostBtn>
            <div className="flex gap-3">
              <Btn onClick={() => { setWeekSlots(suggestFill([...weekSlots])) }}>Suggest for me</Btn>
              <Btn gold disabled={!filled} onClick={() => {
                const assigned = weekSlots.filter(s => s.moment).map(s => ({ ...s, moment: { ...s.moment, enrichment: {} } }))
                setWeekPieces(assigned)
                setWeekIdx(0); setChosenEngines({}); setChosenFormats({}); setAiQuestions(null); setScreen('week-enrich')
              }}>Flesh them out ({filled}/{weekSlots.length}) →</Btn>
            </div>
          </div>

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
                      const idx = picker
                      setWeekSlots(prev => { const updated = [...prev]; updated[idx] = { ...updated[idx], moment: m }; return updated })
                      setPicker(null)
                    }}>
                      <span className="block text-xs font-bold uppercase tracking-widest text-gold/60 mb-1">{TYPESHORT[m.type]}</span>
                      {m.line}
                    </OptionButton>
                  ))}
                  <div className="flex gap-3 mt-3">
                    <Btn onClick={() => { const idx = picker; setWeekSlots(prev => { const u = [...prev]; u[idx] = { ...u[idx], moment: null }; return u }); setPicker(null) }}>Leave empty</Btn>
                    <Btn onClick={() => setPicker(null)}>Close</Btn>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center text-zinc-500 text-sm">
                  {log.length === 0 ? 'No moments logged yet. Head back to the home screen and log a few.' : 'Every logged moment is already placed. Log another from the home screen, or leave this slot empty.'}
                </div>
              )
            })()}
          </BottomSheet>
          <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
        </SidebarLayout>
      )
    }

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
        <GoldLabel>Phase Planner</GoldLabel>
        <Question>Plan your content strategy across <span className="text-gold font-medium">multiple weeks</span></Question>

        {phaseView === 'list' ? (
          <div className="space-y-6">
            {/* Active phase */}
            {activePhase && (
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Active Phase</span>
                  <div className="flex items-center gap-2">
                    {currentWeek && <span className="text-zinc-500 text-xs">Week {currentWeek.weekNum} of {currentWeek.total}</span>}
                    <button onClick={() => editPhase(activePhase)} className="text-zinc-500 hover:text-white text-xs transition">Edit</button>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold text-lg mb-1">{activePhase.name}</h3>
                  {activePhase.launch_reason && (
                    <p className="text-amber-400 text-xs mb-3">{activePhase.launch_reason}</p>
                  )}
                  <div className="flex gap-1 mb-5">
                    {activePhase.weeks.map((w, i) => (
                      <div key={i} className={`flex-1 h-3 rounded-full ${PHASE_WEEK_COLORS[w.type]?.dot} ${currentWeek && w.week === currentWeek.weekNum ? 'ring-1 ring-white/30' : 'opacity-40'}`} />
                    ))}
                  </div>

                  {/* Each week as a clickable card */}
                  <div className="space-y-2">
                    {activePhase.weeks.map(w => {
                      const colors = PHASE_WEEK_COLORS[w.type]
                      const wType = PHASE_WEEK_TYPES.find(t => t.id === w.type)
                      const isCurrent = currentWeek && w.week === currentWeek.weekNum
                      const weekStart = new Date(activePhase.start_date)
                      weekStart.setDate(weekStart.getDate() + (w.week - 1) * 7)
                      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
                      const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      const isPast = new Date() > weekEnd

                      return (
                        <button
                          key={w.week}
                          onClick={() => planPhaseWeek(w.week)}
                          className={`w-full text-left p-4 rounded-lg border transition ${
                            isCurrent
                              ? `${colors.bg} ${colors.border} ring-1 ring-white/10`
                              : isPast
                                ? 'bg-zinc-900/50 border-zinc-800/50 opacity-50'
                                : `bg-zinc-900 border-zinc-800 hover:${colors.border} hover:${colors.bg}`
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                              <span className="text-white text-sm font-bold">Week {w.week}</span>
                              {isCurrent && <span className="text-[9px] font-bold uppercase tracking-widest bg-gold/20 text-gold px-2 py-0.5 rounded-full">This Week</span>}
                            </div>
                            <span className="text-zinc-500 text-xs">{fmt(weekStart)} — {fmt(weekEnd)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{wType?.icon}</span>
                              <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{wType?.label}</span>
                              <span className="text-zinc-600 text-xs ml-1">— {wType?.desc}</span>
                            </div>
                            <span className={`text-xs ${colors.text}`}>Plan →</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {!activePhase && (
              <div className="glass-card p-8 text-center">
                <p className="text-zinc-400 text-sm mb-4">No active phase. Create one to plan your content strategy.</p>
              </div>
            )}

            <button onClick={startCreatePhase} className="w-full py-4 rounded font-bold text-sm uppercase tracking-widest bg-gold text-black hover:bg-gold/90 transition">+ New Phase</button>

            {phases.filter(p => !p.is_active).length > 0 && (
              <div>
                <GoldLabel>Previous Phases</GoldLabel>
                <div className="space-y-3">
                  {phases.filter(p => !p.is_active).map(phase => (
                    <div key={phase.id} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold text-sm">{phase.name}</h4>
                        <span className="text-zinc-600 text-xs">{phase.weeks.length} weeks</span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {phase.weeks.map((w, i) => <div key={i} className={`flex-1 h-2 rounded-full ${PHASE_WEEK_COLORS[w.type]?.dot} opacity-50`} />)}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => activatePhase(phase.id)} className="px-3 py-1.5 text-xs font-semibold bg-gold/10 border border-gold/30 rounded text-gold hover:bg-gold/20 transition">Reactivate</button>
                        <button onClick={() => editPhase(phase)} className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white transition">Edit</button>
                        <button onClick={() => deletePhase(phase.id)} className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-red-400 hover:text-red-300 transition">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <GoldLabel>Phase Name</GoldLabel>
              <input type="text" value={phaseName} onChange={e => setPhaseName(e.target.value)} placeholder="e.g. Q3 Launch Push, Authority Build..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm" />
            </div>

            <div>
              <GoldLabel>Start Date</GoldLabel>
              <input type="date" value={phaseStartDate} onChange={e => setPhaseStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm" />
            </div>

            <div>
              <GoldLabel>Duration</GoldLabel>
              <div className="flex gap-3">
                {PHASE_DURATION_OPTIONS.map(d => (
                  <button key={d} onClick={() => { setPhaseDuration(d); initPhaseWeeks(d); setPhaseAiSuggestion(null) }}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition border ${phaseDuration === d ? 'bg-gold/20 text-gold border-gold/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'}`}>{d} weeks</button>
                ))}
              </div>
            </div>

            <button onClick={suggestPhase} disabled={phaseSuggesting}
              className="w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest border border-gold/30 text-gold hover:bg-gold/10 transition disabled:opacity-50">
              {phaseSuggesting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  Analysing your business stage...
                </span>
              ) : '⚡ Suggest Phase Based on My Stage'}
            </button>

            {phaseAiSuggestion?.explanation && (
              <div className="glass-card p-4 border-gold/20">
                <GoldLabel>AI Recommendation</GoldLabel>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{phaseAiSuggestion.explanation}</p>
                {phaseAiSuggestion.launch_reason && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Launch Reason</p>
                    <p className="text-zinc-300 text-sm">{phaseAiSuggestion.launch_reason}</p>
                  </div>
                )}
              </div>
            )}

            {phaseWeeks.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {PHASE_WEEK_TYPES.map(wt => {
                    const colors = PHASE_WEEK_COLORS[wt.id]
                    return (
                      <div key={wt.id} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{wt.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{wt.label}</span>
                        </div>
                        <p className="text-zinc-500 text-xs leading-snug">{wt.desc}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-1">
                  {phaseWeeks.map((w, i) => <div key={i} className={`flex-1 h-3 rounded-full ${PHASE_WEEK_COLORS[w.type]?.dot}`} />)}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PHASE_WEEK_TYPES.map(wt => {
                    const count = phaseWeeks.filter(w => w.type === wt.id).length
                    const pct = phaseWeeks.length > 0 ? Math.round((count / phaseWeeks.length) * 100) : 0
                    const colors = PHASE_WEEK_COLORS[wt.id]
                    return (
                      <div key={wt.id} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <span className={`text-xs font-bold ${colors.text}`}>{wt.icon} {count}</span>
                        <span className="text-zinc-500 text-xs"> / {phaseWeeks.length} ({pct}%)</span>
                      </div>
                    )
                  })}
                </div>

                <GoldLabel>Plan Each Week</GoldLabel>
                <div className="space-y-3">
                  {phaseWeeks.map(w => {
                    const colors = PHASE_WEEK_COLORS[w.type]
                    const weekStart = new Date(phaseStartDate || new Date()); weekStart.setDate(weekStart.getDate() + (w.week - 1) * 7)
                    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
                    const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    return (
                      <div key={w.week} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            <span className="text-white text-sm font-bold">Week {w.week}</span>
                          </div>
                          <span className="text-zinc-500 text-xs">{fmt(weekStart)} — {fmt(weekEnd)}</span>
                        </div>
                        <div className="flex gap-2">
                          {PHASE_WEEK_TYPES.map(wt => {
                            const isActive = w.type === wt.id
                            const wtC = PHASE_WEEK_COLORS[wt.id]
                            return (
                              <button key={wt.id} onClick={() => setPhaseWeeks(prev => prev.map(pw => pw.week === w.week ? { ...pw, type: wt.id } : pw))}
                                className={`flex-1 py-2 px-2 rounded text-xs font-bold uppercase tracking-wider transition ${isActive ? `${wtC.bg} ${wtC.border} ${wtC.text} border` : 'bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}>
                                {wt.icon} {wt.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <button onClick={() => { setPhaseView('list'); resetPhaseForm() }} className="flex-1 py-3 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white transition">Cancel</button>
              <button onClick={savePhase} disabled={!phaseName || !phaseStartDate || phaseWeeks.length === 0 || phaseSaving}
                className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition ${phaseName && phaseStartDate && phaseWeeks.length > 0 && !phaseSaving ? 'bg-gold text-black hover:bg-gold/90' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
                {phaseSaving ? 'Saving...' : editingPhaseId ? 'Update Phase' : 'Save Phase'}
              </button>
            </div>
          </div>
        )}
      </SidebarLayout>
    )
  }

  // ── Screen: Home ──────────────────────────────────────────────────────────

  if (screen === 'home') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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

          <VoiceCalibration samples={voiceSamples} onSave={async (samples) => {
            setVoiceSamples(samples)
            await saveProfile({ voice_samples: samples })
          }} />

          {savedWeeks.length > 0 && (
            <div className="mt-8">
              <GoldLabel>Past weeks</GoldLabel>
              <div className="space-y-2">
                {savedWeeks.map(w => {
                  const pieces = w.piece_ids || []
                  const date = new Date(w.week_start)
                  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  const m = w.mix || {}
                  return (
                    <button key={w.id} onClick={() => { setViewingWeek(w); setScreen('view-week') }}
                      className="w-full text-left glass-card p-4 transition hover:border-gold/30">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-white">Week of {dateStr}</span>
                        <span className="text-xs text-zinc-500">{pieces.length} post{pieces.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs text-zinc-500">
                        {m.reach > 0 && <span>{m.reach} reach</span>}
                        {m.value > 0 && <span>{m.value} trust</span>}
                        {m.sales > 0 && <span>{m.sales} sales</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
    )
  }

  // ── Quick Mode: Moment Selection ──────────────────────────────────────────

  if (screen === 'quick-moment') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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
      </SidebarLayout>
    )
  }

  // ── Quick Mode: New Moment Line ───────────────────────────────────────────

  if (screen.startsWith('quick-line-')) {
    const typeId = screen.replace('quick-line-', '')
    const mt = MOMENTS.find(x => x.id === typeId)
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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
      </SidebarLayout>
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
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
    )
  }

  // ── Quick Mode: Enrichment ────────────────────────────────────────────────

  if (screen === 'quick-enrich' && quickMoment) {
    const qs = getEnrichQuestions(quickMoment.type, quickJob)
    const [key, q, hint] = qs[enrichIdx]
    const enrichVal = (quickMoment.enrichment || {})[key] || ''

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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
      </SidebarLayout>
    )
  }

  // ── Quick Mode: Writing / Result ──────────────────────────────────────────

  if (screen === 'quick-writing') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <WritingScreen line={writingLine} label="WRITING YOUR PIECE" />
      </SidebarLayout>
    )
  }

  if (screen === 'quick-result' && quickCard) {
    const card = CARDS[quickCard]
    const quickJob_ = quickJob || 'reach'
    const unwiredMagnet = quickPiece && memberMagnets.length > 0
      ? memberMagnets.find(mg => mg.keyword && quickPiece.toLowerCase().includes(mg.keyword.toLowerCase()) && !mg.dm_flow_live)
      : null
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GoldLabel>Your piece</GoldLabel>
          <h3 className="text-lg font-display tracking-[0.06em] text-white mb-4">{card.nm.toUpperCase()}</h3>
          <PieceCard
            title="Ready to post"
            piece={quickPiece}
            swap={quickRoute?.swap}
            dont={card.dont}
            posted={quickPiece?.posted || false}
            onSave={(newText) => setQuickPiece(newText)}
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
            onChangeFormat={() => {
              const availableEngines = getAvailableEngines(quickJob_)
              setModal({
                title: 'Change the format',
                body: 'Pick a new engine and format — the piece will be rewritten.',
                options: availableEngines.flatMap(eng => {
                  const formats = getFormatsForJobEngine(quickJob_, eng.id)
                  return formats.map(f => ([
                    `${eng.icon} ${eng.label} → ${f.label}`,
                    async () => {
                      setModal(null)
                      const fmtPrompt = FORMAT_PROMPTS[f.id]
                      if (!fmtPrompt) return
                      const newCard = { ...card, fmt: fmtPrompt.fmt, out: fmtPrompt.out, nm: f.label }
                      setScreen('quick-writing'); setWritingLine(quickMoment.line)
                      try {
                        const piece = await generate(newCard, quickMoment, null, quickArc, quickCard)
                        setQuickPiece(piece)
                        setQuickCard(quickCard)
                      } catch (err) {
                        setQuickPiece(`{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`)
                      }
                      setScreen('quick-result')
                    }
                  ]))
                }),
              })
            }}
            onToEmail={hasList && quickCard !== 'c13' && quickCard !== 'c17' ? () => doRepurpose(stage === 'launch' ? 'c17' : 'c13', 'YOUR LIST') : undefined}
            onToYT={doesYT && quickCard !== 'c9' ? () => doRepurpose('c9', 'YOUTUBE') : undefined}
          />
          {unwiredMagnet && (
            <NoteBox gold>
              <span className="text-gold font-bold">Keyword '{unwiredMagnet.keyword}' isn't wired to your DMs yet</span> — comments will go nowhere.
              <button onClick={() => router.push('/build/lead-magnets')} className="block text-gold font-bold text-xs uppercase tracking-widest mt-2 hover:text-white transition">Set it up →</button>
            </NoteBox>
          )}
          <div className="mt-4">
            <Btn onClick={() => setScreen('home')}>Done</Btn>
          </div>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
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
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
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
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
    )
  }

  // ── Weekly Mode: Board ────────────────────────────────────────────────────

  if (screen === 'board') {
    const filled = weekSlots.filter(s => s.moment).length
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GoldLabel>Your week — shaped by your stage</GoldLabel>
          <Question>Match <span className="text-gold font-medium">moments</span> to the week's posts.</Question>
          <DimLabel>Tap a slot, pick a moment. Or let the tool suggest and adjust from there. Empty slots just get skipped.</DimLabel>

          <Stepper label="Feed posts" note={pieceCount === baseN ? 'The pace your stage suggests' : pieceCount > baseN ? 'Above your stage\'s pace' : 'A lighter week'}
            value={pieceCount} onMinus={() => changePieceCount(-1)} onPlus={() => changePieceCount(1)} minDisabled={pieceCount <= 3} maxDisabled={pieceCount >= 21} />
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
                  <div key={item.i}>
                  <SlotCard job={item.sl.job} moment={item.sl.moment}
                    onPick={() => setPicker(item.i)}
                    onClear={() => { const updated = [...weekSlots]; updated[item.i].moment = null; setWeekSlots(updated) }}
                    salesAngle={salesAngles[item.i]}
                    onSalesAngle={(angle) => setSalesAngles(prev => ({ ...prev, [item.i]: angle }))}
                    offerContext={playbookContext?.offer}
                    onCapture={async (type, line, enrichment, angle) => {
                      try {
                        const entry = await addLogEntry(type, line)
                        if (entry) {
                          entry.enrichment = enrichment || {}
                          if (Object.keys(entry.enrichment).length > 0) await updateLogEntry(entry.id, entry.enrichment)
                          setLog(prev => [entry, ...prev])
                          setWeekSlots(prev => {
                            const updated = [...prev]
                            updated[item.i] = { ...updated[item.i], moment: entry }
                            return updated
                          })
                          if (angle) setSalesAngles(prev => ({ ...prev, [item.i]: angle }))
                        } else {
                          const localMoment = { id: `local-${Date.now()}`, type, line, enrichment: enrichment || {}, created_at: new Date().toISOString() }
                          setWeekSlots(prev => {
                            const updated = [...prev]
                            updated[item.i] = { ...updated[item.i], moment: localMoment }
                            return updated
                          })
                        }
                      } catch (err) {
                        console.error('Capture failed:', err)
                        const localMoment = { id: `local-${Date.now()}`, type, line, enrichment: enrichment || {}, created_at: new Date().toISOString() }
                        setWeekSlots(prev => {
                          const updated = [...prev]
                          updated[item.i] = { ...updated[item.i], moment: localMoment }
                          return updated
                        })
                      }
                    }} />
                  {item.sl.job === 'value' && memberMagnets.length > 0 && (
                    <div className="ml-4 mb-2 flex items-center gap-2">
                      <button onClick={() => {
                        const isOn = !freePushSlots[item.i]
                        setFreePushSlots(prev => ({ ...prev, [item.i]: isOn }))
                        if (!isOn) setFreePushMagnet(prev => { const u = { ...prev }; delete u[item.i]; return u })
                        if (isOn && stage === 'launch' && playbookContext?.offer?.offerName) {
                          setModal({ title: 'Heads up', body: `This week is selling ${playbookContext.offer.offerName} — a freebie push splits the ask.`, options: [['Got it', () => setModal(null)]] })
                        }
                      }}
                        className={`text-[10px] font-bold uppercase tracking-widest transition ${freePushSlots[item.i] ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}>
                        {freePushSlots[item.i] ? '● Freebie push ON' : '○ Freebie push'}
                      </button>
                      {freePushSlots[item.i] && memberMagnets.length > 1 && (
                        <select value={freePushMagnet[item.i] || ''} onChange={e => setFreePushMagnet(prev => ({ ...prev, [item.i]: e.target.value }))}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-gold appearance-none cursor-pointer">
                          <option value="">Pick magnet...</option>
                          {memberMagnets.map(mg => <option key={mg.id} value={mg.id}>{mg.name} ({mg.keyword})</option>)}
                        </select>
                      )}
                      {freePushSlots[item.i] && memberMagnets.length === 1 && (
                        <span className="text-[10px] text-zinc-500">{memberMagnets[0].name} ({memberMagnets[0].keyword})</span>
                      )}
                      {freePushSlots[item.i] && (() => {
                        const chosenMg = memberMagnets.length === 1 ? memberMagnets[0] : memberMagnets.find(m => String(m.id) === freePushMagnet[item.i])
                        if (!chosenMg) return null
                        const lastC19 = savedWeeks.flatMap(w => (w.piece_ids || []).filter(p => p.cardKey === 'c19')).find(p => {
                          const d = new Date(p.date || 0)
                          return (Date.now() - d.getTime()) < 7 * 24 * 60 * 60 * 1000
                        })
                        if (!lastC19) return null
                        return <span className="text-[10px] text-zinc-500 italic">You pushed this freebie recently — keyword CTAs on regular posts are still working for it.</span>
                      })()}
                    </div>
                  )}
                  </div>
                )
              )
            })()}
          </div>

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn>
            <div className="flex gap-3">
              <Btn onClick={() => { setWeekSlots(suggestFill([...weekSlots])) }}>Suggest for me</Btn>
              <Btn gold disabled={!filled} onClick={() => {
                const assigned = weekSlots.filter(s => s.moment).map(s => ({
                  ...s,
                  moment: { ...s.moment, enrichment: {} }
                }))
                setWeekPieces(assigned)
                setWeekIdx(0); setChosenEngines({}); setChosenFormats({}); setAiQuestions(null); setScreen('week-enrich')
              }}>Flesh them out ({filled}/{weekSlots.length}) →</Btn>
            </div>
          </div>
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
                    const idx = picker
                    setWeekSlots(prev => {
                      const updated = [...prev]
                      updated[idx] = { ...updated[idx], moment: m }
                      return updated
                    })
                    setPicker(null)
                  }}>
                    <span className="block text-xs font-bold uppercase tracking-widest text-gold/60 mb-1">{TYPESHORT[m.type]}</span>
                    {m.line}
                  </OptionButton>
                ))}
                <div className="flex gap-3 mt-3">
                  <Btn onClick={() => { const idx = picker; setWeekSlots(prev => { const u = [...prev]; u[idx] = { ...u[idx], moment: null }; return u }); setPicker(null) }}>Leave empty</Btn>
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
      </SidebarLayout>
    )
  }

  // ── Weekly Mode: Enrichment (all posts on one page) ────────────────────────

  if (screen === 'week-enrich') {
    // Group pieces by day
    const dayGroups = []
    let lastDay = null
    weekPieces.forEach((sl, i) => {
      const dayBase = (sl.day || '').split(' · ')[0]
      if (dayBase !== lastDay) { dayGroups.push({ day: dayBase, pieces: [] }); lastDay = dayBase }
      dayGroups[dayGroups.length - 1].pieces.push({ sl, i })
    })

    const allReady = weekPieces.every((_, i) => chosenEngines[i] && chosenFormats[i])

    function collectAllEnrichment() {
      weekPieces.forEach((sl, i) => {
        const qs = getEnrichQuestions(sl.moment.type, sl.job)
        const enrichment = {}
        qs.forEach(([key]) => {
          const el = document.getElementById(`enrich-${i}-${key}`)
          if (el) enrichment[key] = el.value.trim()
        })
        sl.moment.enrichment = enrichment
        if (sl.moment.id && !sl.moment.id.toString().startsWith('local-')) {
          updateLogEntry(sl.moment.id, enrichment)
        }
      })
    }

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GoldLabel>Flesh out your week</GoldLabel>
          <Question>{weekPieces.length} posts to build.</Question>
          <DimLabel>Pick engine + format for each post, answer the questions, then write them all.</DimLabel>

          {dayGroups.map((group, gi) => (
            <div key={gi} className="mb-6">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 mt-4 border-b border-zinc-800 pb-2">{group.day}</p>
              {group.pieces.map(({ sl, i }) => (
                <EnrichCard key={i} idx={i} sl={sl}
                  engine={chosenEngines[i]} format={chosenFormats[i]}
                  onEngineChange={(eng) => { setChosenEngines(prev => ({ ...prev, [i]: eng })); setChosenFormats(prev => { const u = { ...prev }; delete u[i]; return u }) }}
                  onFormatChange={(fmt) => setChosenFormats(prev => ({ ...prev, [i]: fmt }))}
                  playbookContext={playbookContext}
                />
              ))}
            </div>
          ))}

          <div className="flex justify-between mt-6 sticky bottom-0 bg-zinc-950/90 backdrop-blur-sm py-4 -mx-4 px-4 border-t border-zinc-800">
            <GhostBtn onClick={() => setScreen('board')}>← Back to board</GhostBtn>
            <Btn gold disabled={!allReady} onClick={() => { collectAllEnrichment(); doWeekWrite() }}>
              Write the week ({weekPieces.filter((_, i) => chosenEngines[i] && chosenFormats[i]).length}/{weekPieces.length} ready) →
            </Btn>
          </div>
      </SidebarLayout>
    )
  }

  // ── Weekly Mode: Writing ──────────────────────────────────────────────────

  if (screen === 'week-writing') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <WritingScreen line={writingLine} label={weekPieces.length > 0 ? `WRITING POST ${weekIdx + 1} OF ${weekPieces.length}` : 'CONVERTING TO EMAIL'} />
      </SidebarLayout>
    )
  }

  // ── Weekly Mode: Review ───────────────────────────────────────────────────

  if (screen === 'week-review') {
    const finishedCount = weekPieces.filter(s => s.piece).length

    // Check for unwired magnet keywords across all pieces
    const unwiredWeekMagnets = memberMagnets.length > 0
      ? memberMagnets.filter(mg => mg.keyword && !mg.dm_flow_live && weekPieces.some(sl => sl.piece && sl.piece.toLowerCase().includes(mg.keyword.toLowerCase())))
      : []

    function copyAll() {
      const txt = weekPieces.filter(s => s.piece).map(s =>
        `=== ${s.day.toUpperCase()} — ${JOBNAMES[s.job].toUpperCase()} — ${s.cardObj.nm} ===\n\n${s.piece}`
      ).join('\n\n\n')
      if (navigator.clipboard) navigator.clipboard.writeText(txt)
    }

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GoldLabel>Your week, written</GoldLabel>
          <Question><span className="text-gold font-medium">{finishedCount}</span> posts, ready to go.</Question>
          <DimLabel>Each one from a real moment of yours. Copy them out, or rewrite any that don't sound right.</DimLabel>

          {weekPieces.map((sl, i) => (
            <PieceCard key={i}
              title={`${sl.day} · ${JOBNAMES[sl.job]} · ${sl.cardObj.nm}`}
              piece={sl.piece}
              swap={sl.swap}
              dont={sl.cardObj.dont}
              posted={sl.posted || false}
              onTogglePosted={() => {
                setWeekPieces(prev => {
                  const updated = [...prev]
                  updated[i] = { ...updated[i], posted: !updated[i].posted }
                  return updated
                })
              }}
              onSave={(newText) => {
                setWeekPieces(prev => {
                  const updated = [...prev]
                  updated[i] = { ...updated[i], piece: newText }
                  return updated
                })
              }}
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
              onChangeFormat={() => {
                const engine = sl.chosenEngine || (sl.arc ? 'story' : 'teaching')
                const availableEngines = getAvailableEngines(sl.job)
                setModal({
                  title: 'Change the format',
                  body: 'Pick a new engine and format — the piece will be rewritten.',
                  options: availableEngines.flatMap(eng => {
                    const formats = getFormatsForJobEngine(sl.job, eng.id)
                    return formats.map(f => ([
                      `${eng.icon} ${eng.label} → ${f.label}`,
                      async () => {
                        setModal(null)
                        const fmtPrompt = FORMAT_PROMPTS[f.id]
                        if (!fmtPrompt) return
                        const newCard = { ...sl.cardObj, fmt: fmtPrompt.fmt, out: fmtPrompt.out, nm: f.label }
                        setScreen('week-writing'); setWritingLine(sl.moment.line)
                        try {
                          const piece = await generate(newCard, sl.moment, null, sl.arc, sl.cardKey)
                          setWeekPieces(prev => {
                            const updated = [...prev]
                            updated[i] = { ...updated[i], piece, cardObj: newCard, chosenFormat: f.id, chosenEngine: eng.id }
                            return updated
                          })
                        } catch (err) {
                          setWeekPieces(prev => {
                            const updated = [...prev]
                            updated[i] = { ...updated[i], piece: `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}` }
                            return updated
                          })
                        }
                        setScreen('week-review')
                      }
                    ]))
                  }),
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
                } catch (err) {
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'email', day: 'Thursday', moment: sl.moment, cardObj: CARDS[cardKey], cardKey, piece: `{{ERROR:${err.message || 'Generation failed'}. Tap rewrite.}}`, swap: null, arc: null })
                    return updated
                  })
                }
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
                } catch (err) {
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'longform', day: 'Sunday', moment: sl.moment, cardObj: CARDS.c9, cardKey: 'c9', piece: `{{ERROR:${err.message || 'Generation failed'}. Tap rewrite.}}`, swap: null, arc: null })
                    return updated
                  })
                }
                setScreen('week-review')
              } : undefined}
            />
          ))}

          {unwiredWeekMagnets.length > 0 && unwiredWeekMagnets.map(mg => (
            <NoteBox key={mg.id} gold>
              <span className="text-gold font-bold">Keyword '{mg.keyword}' isn't wired to your DMs yet</span> — comments will go nowhere.
              <button onClick={() => router.push('/build/lead-magnets')} className="block text-gold font-bold text-xs uppercase tracking-widest mt-2 hover:text-white transition">Set it up →</button>
            </NoteBox>
          ))}

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => setScreen('board')}>← Back to board</GhostBtn>
            <div className="flex gap-3">
              <Btn gold onClick={copyAll}>Copy the whole week</Btn>
              <Btn onClick={() => setScreen('home')}>Done</Btn>
            </div>
          </div>
        <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
    )
  }

  // ── View All Weeks ─────────────────────────────────────────────────────────

  if (screen === 'view-weeks') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GoldLabel>Past weeks</GoldLabel>
          <Question>Your content history.</Question>
          <DimLabel>Tap any week to view and copy the content.</DimLabel>
          {savedWeeks.length === 0 ? (
            <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center text-zinc-500 text-sm">
              No weeks saved yet. Plan your first week and the content will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {savedWeeks.map(w => {
                const pieces = w.piece_ids || []
                const date = new Date(w.week_start)
                const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                const m = w.mix || {}
                return (
                  <div key={w.id} className="glass-card p-4 transition hover:border-gold/30">
                    <button onClick={() => navigateTo('view-week', w)} className="w-full text-left">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-white">Week of {dateStr}</span>
                        <span className="text-xs text-zinc-500">{pieces.length} post{pieces.length !== 1 ? 's' : ''}</span>
                      </div>
                      {(() => {
                        const postedCount = pieces.filter(p => p.posted).length
                        const pct = pieces.length > 0 ? Math.round((postedCount / pieces.length) * 100) : 0
                        return (
                          <>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex gap-3 text-xs text-zinc-500">
                                {m.reach > 0 && <span>{m.reach} reach</span>}
                                {m.value > 0 && <span>{m.value} trust</span>}
                                {m.sales > 0 && <span>{m.sales} sales</span>}
                              </div>
                              <span className={`text-[10px] font-bold ${postedCount === pieces.length && pieces.length > 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>{postedCount}/{pieces.length}</span>
                            </div>
                            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                              <div className={`h-full rounded-full transition-all ${postedCount === pieces.length && pieces.length > 0 ? 'bg-emerald-500' : 'bg-gold/60'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        )
                      })()}
                    </button>
                    <div className="flex gap-2 mt-3 border-t border-zinc-800 pt-3">
                      <button onClick={() => navigateTo('view-week', w)} className="text-xs font-bold text-gold/60 hover:text-gold uppercase tracking-widest">View</button>
                      <button onClick={() => navigateTo('edit-week', w)} className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest">Edit</button>
                      <button onClick={async () => {
                        if (!confirm('Delete this week? This cannot be undone.')) return
                        await supabase.from('cc_weeks').delete().eq('id', w.id)
                        setSavedWeeks(prev => prev.filter(x => x.id !== w.id))
                      }} className="text-xs font-bold text-red-500/60 hover:text-red-400 uppercase tracking-widest ml-auto">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
      </SidebarLayout>
    )
  }

  // ── View Saved Week ────────────────────────────────────────────────────────

  if (screen === 'view-week' && viewingWeek) {
    const pieces = viewingWeek.piece_ids || []
    const date = new Date(viewingWeek.week_start)
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const m = viewingWeek.mix || {}

    function copyAllSaved() {
      const txt = pieces.filter(p => p.piece).map(p =>
        `=== ${(p.day || '').toUpperCase()} — ${(JOBNAMES[p.job] || p.job || '').toUpperCase()} — ${p.format || ''} ===\n\n${p.piece}`
      ).join('\n\n\n')
      if (navigator.clipboard) navigator.clipboard.writeText(txt)
    }

    async function deleteWeek() {
      if (!confirm('Delete this week and all its content? This cannot be undone.')) return
      await supabase.from('cc_weeks').delete().eq('id', viewingWeek.id)
      setSavedWeeks(prev => prev.filter(x => x.id !== viewingWeek.id))
      setViewingWeek(null)
      setScreen('view-weeks')
    }

    async function deletePiece(idx) {
      const updated = [...pieces]
      updated.splice(idx, 1)
      const newWeek = { ...viewingWeek, piece_ids: updated }
      await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
      setViewingWeek(newWeek)
      setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
    }

    async function rewriteSavedPiece(idx, redoNote) {
      const p = pieces[idx]
      const prevDraft = p.piece && !p.piece.startsWith('{{ERROR:') ? p.piece : undefined
      const moment = { line: p.momentLine || p.piece?.slice(0, 80) || '', type: p.momentType || 'client', enrichment: {} }
      const card = CARDS[p.cardKey || 'c1'] || { fmt: 'a social media post', out: 'Write the piece.', cta: 'Follow.', dont: [] }
      setScreen('week-writing'); setWritingLine(moment.line)
      try {
        const newPiece = await generate(card, moment, redoNote, null, p.cardKey || 'c1', prevDraft ? { previousDraft: prevDraft } : {})
        const updated = [...pieces]
        updated[idx] = { ...updated[idx], piece: newPiece }
        const newWeek = { ...viewingWeek, piece_ids: updated }
        await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
        setViewingWeek(newWeek)
        setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
      } catch (err) {
        const updated = [...pieces]
        updated[idx] = { ...updated[idx], piece: `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}` }
        const newWeek = { ...viewingWeek, piece_ids: updated }
        setViewingWeek(newWeek)
      }
      setScreen('view-week')
    }

    async function updatePiece(idx, newText) {
      const updated = [...pieces]
      updated[idx] = { ...updated[idx], piece: newText }
      const newWeek = { ...viewingWeek, piece_ids: updated }
      await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
      setViewingWeek(newWeek)
      setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
    }

    async function convertToEmail(idx) {
      const currentPieces = viewingWeek.piece_ids || []
      const p = currentPieces[idx]
      if (!p) return
      const cardKey = stage === 'launch' ? 'c17' : 'c13'
      const card = CARDS[cardKey]
      const momentLine = p.momentLine || p.piece?.slice(0, 80) || ''
      const moment = { line: momentLine, type: p.momentType || 'client', enrichment: {} }
      setScreen('week-writing'); setWritingLine(momentLine)
      try {
        const emailPiece = await generate(card, moment, null, null, cardKey)
        const freshPieces = [...(viewingWeek.piece_ids || [])]
        freshPieces.splice(idx + 1, 0, {
          day: 'Thursday',
          job: 'email',
          format: card.nm,
          momentLine: momentLine,
          momentType: moment.type,
          piece: emailPiece || '',
          cardKey,
        })
        await supabase.from('cc_weeks').update({ piece_ids: freshPieces }).eq('id', viewingWeek.id)
        const newWeek = { ...viewingWeek, piece_ids: freshPieces }
        setViewingWeek(newWeek)
        setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
      } catch (err) {
        console.error('Email conversion failed:', err)
      }
      setScreen('view-week')
    }

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GhostBtn onClick={() => setScreen('view-weeks')}>← All weeks</GhostBtn>
          <div className="mt-4 mb-6">
            <GoldLabel>Saved week</GoldLabel>
            <Question>Week of {dateStr}</Question>
            {(() => {
              const postedCount = pieces.filter(p => p.posted).length
              const pct = pieces.length > 0 ? Math.round((postedCount / pieces.length) * 100) : 0
              return (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-3 text-xs text-zinc-500">
                      <span>{pieces.length} post{pieces.length !== 1 ? 's' : ''}</span>
                      {m.reach > 0 && <span>· {m.reach} reach</span>}
                      {m.value > 0 && <span>· {m.value} trust</span>}
                      {m.sales > 0 && <span>· {m.sales} sales</span>}
                    </div>
                    <span className={`text-xs font-bold ${postedCount === pieces.length ? 'text-emerald-400' : 'text-zinc-500'}`}>{postedCount}/{pieces.length} posted</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${postedCount === pieces.length ? 'bg-emerald-500' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })()}
          </div>

          {pieces.map((p, i) => (
            <PieceCard key={`${viewingWeek.id}-${i}`}
              title={`${p.day || ''} · ${JOBNAMES[p.job] || p.job || ''} · ${p.format || ''}`}
              piece={p.piece}
              posted={p.posted || false}
              onTogglePosted={async () => {
                const updated = [...pieces]
                updated[i] = { ...updated[i], posted: !updated[i].posted }
                setViewingWeek(prev => ({ ...prev, piece_ids: updated }))
                await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
              }}
              onSave={(newText) => updatePiece(i, newText)}
              onToEmail={p.job !== 'email' ? () => convertToEmail(i) : undefined}
              onRewrite={() => {
                setModal({
                  title: "What's off about it?",
                  body: 'Pick the closest — the correction shapes the rewrite.',
                  options: [
                    ['Too salesy — soften it', () => { setModal(null); rewriteSavedPiece(i, 'It read too salesy. Softer, more human, the offer lighter.') }],
                    ['Too formal — loosen it up', () => { setModal(null); rewriteSavedPiece(i, 'Too formal and written. Looser, more like talking.') }],
                    ["Doesn't sound like me — plainer", () => { setModal(null); rewriteSavedPiece(i, "Didn't sound like a real person. Plainer, blunter, shorter sentences.") }],
                    ['Just try a different angle', () => { setModal(null); rewriteSavedPiece(i, 'Take a completely different angle on the same moment.') }],
                  ],
                })
              }}
              onChangeFormat={() => {
                const job = p.job || 'reach'
                const availableEngines = getAvailableEngines(job)
                setModal({
                  title: 'Change the format',
                  body: 'Pick a new engine and format — the piece will be rewritten.',
                  options: availableEngines.flatMap(eng => {
                    const formats = getFormatsForJobEngine(job, eng.id)
                    return formats.map(f => ([
                      `${eng.icon} ${eng.label} → ${f.label}`,
                      async () => {
                        setModal(null)
                        const fmtPrompt = FORMAT_PROMPTS[f.id]
                        if (!fmtPrompt) return
                        const moment = { line: p.momentLine || p.piece?.slice(0, 80) || '', type: p.momentType || 'client', enrichment: {} }
                        const card = { fmt: fmtPrompt.fmt, out: fmtPrompt.out, nm: f.label, cta: CARDS[p.cardKey || 'c1']?.cta || '', dont: [] }
                        setScreen('week-writing'); setWritingLine(moment.line)
                        try {
                          const newPiece = await generate(card, moment, null, null, p.cardKey || 'c1')
                          updatePiece(i, newPiece)
                          const updated = [...pieces]
                          updated[i] = { ...updated[i], piece: newPiece, format: f.label }
                          const newWeek = { ...viewingWeek, piece_ids: updated }
                          await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
                          setViewingWeek(newWeek)
                          setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
                        } catch (err) {
                          const updated = [...pieces]
                          updated[i] = { ...updated[i], piece: `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}` }
                          setViewingWeek({ ...viewingWeek, piece_ids: updated })
                        }
                        setScreen('view-week')
                      }
                    ]))
                  }),
                })
              }}
            />
          ))}

          <div className="flex justify-between mt-6">
            <button onClick={deleteWeek} className="text-xs font-bold text-red-500/60 hover:text-red-400 uppercase tracking-widest">Delete entire week</button>
            <div className="flex gap-3">
              <Btn gold onClick={copyAllSaved}>Copy the whole week</Btn>
              <Btn onClick={() => setScreen('view-weeks')}>Done</Btn>
            </div>
          </div>
          <Modal open={!!modal} title={modal?.title} body={modal?.body} options={modal?.options || []} onClose={() => setModal(null)} />
      </SidebarLayout>
    )
  }

  // ── Edit Week (re-enter the board with existing pieces) ───────────────────

  if (screen === 'edit-week' && viewingWeek) {
    const pieces = viewingWeek.piece_ids || []
    const date = new Date(viewingWeek.week_start)
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
          <GhostBtn onClick={() => navigateTo('view-week', viewingWeek)}>← Back to week</GhostBtn>
          <div className="mt-4 mb-6">
            <GoldLabel>Editing week</GoldLabel>
            <Question>Week of {dateStr}</Question>
            <DimLabel>Edit any piece below. Changes save automatically.</DimLabel>
          </div>

          {pieces.map((p, i) => (
            <div key={`edit-${viewingWeek.id}-${i}`} className="glass-card p-5 mb-3">
              <div className="flex justify-between items-baseline mb-3">
                <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{p.day || ''} · {JOBNAMES[p.job] || p.job || ''} · {p.format || ''}</h4>
                <button onClick={async () => {
                  const updated = [...pieces]
                  updated.splice(i, 1)
                  const newWeek = { ...viewingWeek, piece_ids: updated }
                  await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
                  setViewingWeek(newWeek)
                  setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
                }} className="text-xs font-bold text-red-500/60 hover:text-red-400 uppercase tracking-widest">Remove</button>
              </div>
              {p.momentLine && <p className="text-xs text-zinc-500 mb-2">Moment: {p.momentLine}</p>}
              <textarea
                rows={8}
                defaultValue={p.piece || ''}
                onBlur={async (e) => {
                  const val = e.target.value
                  if (val !== p.piece) {
                    const updated = [...pieces]
                    updated[i] = { ...updated[i], piece: val }
                    const newWeek = { ...viewingWeek, piece_ids: updated }
                    await supabase.from('cc_weeks').update({ piece_ids: updated }).eq('id', viewingWeek.id)
                    setViewingWeek(newWeek)
                    setSavedWeeks(prev => prev.map(w => w.id === viewingWeek.id ? newWeek : w))
                  }
                }}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none"
              />
            </div>
          ))}

          <div className="flex gap-3 mt-6">
            <Btn gold onClick={() => navigateTo('view-week', viewingWeek)}>Done editing</Btn>
          </div>
      </SidebarLayout>
    )
  }

  // ── Screen: Magnet Generate ──────────────────────────────────────────────

  if (screen === 'magnet-generate' && magnetData) {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
        <GhostBtn onClick={() => router.push('/build/lead-magnets')}>← Back to Lead Magnets</GhostBtn>
        <div className="mt-4 mb-6">
          <GoldLabel>Lead Magnet Carousel</GoldLabel>
          <Question>Build a carousel for <span className="text-gold font-medium">{magnetData.name || 'your freebie'}</span></Question>
          <div className="glass-card p-4 mt-4 mb-4">
            {magnetData.name && <p className="text-sm text-white mb-1"><span className="text-gold font-bold">Freebie:</span> {magnetData.name}</p>}
            {magnetData.promise && <p className="text-sm text-zinc-400 mb-1"><span className="text-gold font-bold">Promise:</span> {magnetData.promise}</p>}
            {magnetData.keyword && <p className="text-sm text-zinc-400"><span className="text-gold font-bold">Keyword:</span> {magnetData.keyword}</p>}
          </div>
        </div>
        {!quickPiece && !writing && (
          <Btn gold onClick={() => doMagnetGenerate()}>Generate carousel</Btn>
        )}
        {writing && <WritingScreen line="Building your lead magnet carousel..." label="WRITING YOUR PIECE" />}
        {quickPiece && !writing && (
          <>
            <PieceCard
              title="Lead Magnet Carousel"
              subtitle={CARDS.c19.nm}
              piece={quickPiece}
              dont={CARDS.c19.dont}
              onRewrite={() => doMagnetGenerate('Lead with the pain in slide 1 instead of the promise. The reader should feel the problem before they see the solution.')}
            />
            <div className="flex gap-3 mt-4">
              <Btn onClick={() => doMagnetGenerate('Lead with the pain in slide 1 instead of the promise. The reader should feel the problem before they see the solution.')}>Second version</Btn>
              <Btn onClick={() => { setQuickPiece(null); router.push('/build/lead-magnets') }}>Done</Btn>
            </div>
          </>
        )}
      </SidebarLayout>
    )
  }

  if (screen === 'magnet-writing') {
    return (
      <SidebarLayout screen={screen} onNavigate={navigateTo} savedWeeks={savedWeeks} log={log} stage={stage} streakCount={streakCount} router={router}>
        <WritingScreen line="Building your lead magnet carousel..." label="WRITING YOUR PIECE" />
      </SidebarLayout>
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
      const piece = await generate(card, m, redoNote, arc, r.card, redoNote && quickPiece && !quickPiece.startsWith('{{ERROR:') ? { previousDraft: quickPiece } : {})
      setQuickPiece(piece)
      if (piece && m.id && !String(m.id).startsWith('local-')) {
        supabase.from('cc_capture_log').update({ used_at: new Date().toISOString() }).eq('id', m.id)
      }
    } catch (err) {
      setQuickPiece(`{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`)
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
    } catch (err) {
      setQuickPiece(`{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`)
    }
    setScreen('quick-result')
  }

  async function doMagnetGenerate(redoNote) {
    if (!magnetData) return
    setWriting(true)
    setScreen('magnet-generate')
    const syntheticMoment = { line: magnetData.problem_line || magnetData.promise || magnetData.name, type: 'question', enrichment: {} }
    const magnetCtx = { ...playbookContext, magnet: { name: magnetData.name, promise: magnetData.promise, keyword: magnetData.keyword, methodSteps: magnetData.method_steps || [] } }
    try {
      const prevDraft = redoNote && quickPiece && !quickPiece.startsWith('{{ERROR:') ? quickPiece : undefined
      const piece = await generate(CARDS.c19, syntheticMoment, redoNote, null, 'c19', { contextOverride: magnetCtx, ...(prevDraft ? { previousDraft: prevDraft } : {}) })
      setQuickPiece(piece)
    } catch (err) {
      setQuickPiece(`{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`)
    }
    setWriting(false)
  }

  function changePieceCount(delta) {
    const n = Math.max(3, Math.min(21, pieceCount + delta))
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

      // Check if this slot has freebie push enabled
      const origSlotIdx = weekSlots.findIndex((ws, wi) => ws.moment && ws.moment.id === m.id && ws.job === sl.job)
      const isFreePush = freePushSlots[origSlotIdx]
      if (isFreePush) {
        const chosenMg = memberMagnets.length === 1 ? memberMagnets[0] : memberMagnets.find(mg => String(mg.id) === freePushMagnet[origSlotIdx])
        if (chosenMg) {
          const syntheticMoment = { line: chosenMg.problem_line || chosenMg.promise || m.line, type: m.type, enrichment: m.enrichment || {} }
          const magnetCtx = { ...playbookContext, magnet: { name: chosenMg.name, promise: chosenMg.promise, keyword: chosenMg.keyword, methodSteps: chosenMg.method_steps || [] } }
          sl.cardObj = CARDS.c19
          sl.cardKey = 'c19'
          sl.chosenFormat = 'carousel'
          sl.swap = null
          sl.arc = null
          try {
            sl.piece = await generate(CARDS.c19, syntheticMoment, null, null, 'c19', { contextOverride: magnetCtx })
            sl.model = lastGenModel.current
          } catch (err) {
            sl.piece = `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`
            sl.model = null
          }
          continue
        }
      }

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
        sl.model = lastGenModel.current
      } catch (err) {
        sl.piece = `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`
        sl.model = null
      }
    }
    setWeekPieces(pieces)

    // Save the week to Supabase
    if (clientId) {
      const now = new Date()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      const weekStart = monday.toISOString().split('T')[0]

      const pieceData = pieces.map(sl => ({
          day: sl.day,
          job: sl.job,
          format: sl.chosenFormat || sl.cardObj?.nm || '',
          momentLine: sl.moment?.line || '',
          momentType: sl.moment?.type || '',
          piece: sl.piece || '',
          cardKey: sl.cardKey || '',
          model: sl.model || null,
          posted: sl.posted || false,
        }))
      const weekData = {
        client_id: clientId,
        week_start: weekStart,
        mix: { reach: mix.reach, value: mix.value, sales: mix.sales, goal: weekGoal },
        piece_ids: pieceData,
      }
      // Check for existing week to upsert
      const { data: existingWeek } = await supabase.from('cc_weeks').select('id').eq('client_id', clientId).eq('week_start', weekStart).maybeSingle()
      let savedWeek
      if (existingWeek) {
        const { data } = await supabase.from('cc_weeks').update({ mix: weekData.mix, piece_ids: pieceData }).eq('id', existingWeek.id).select().single()
        savedWeek = data
        if (savedWeek) setSavedWeeks(prev => prev.map(w => w.id === savedWeek.id ? savedWeek : w))
      } else {
        const { data } = await supabase.from('cc_weeks').insert(weekData).select().single()
        savedWeek = data
        if (savedWeek) setSavedWeeks(prev => [savedWeek, ...prev])
      }

      // Mark used moments
      const usedIds = pieces.filter(sl => sl.piece && !sl.piece.startsWith('{{ERROR:') && sl.moment?.id && !String(sl.moment.id).startsWith('local-')).map(sl => sl.moment.id)
      if (usedIds.length > 0) {
        await supabase.from('cc_capture_log').update({ used_at: new Date().toISOString() }).in('id', usedIds)
      }
    }

    setScreen('week-review')
  }

  async function rewriteWeekPiece(idx, redoNote) {
    const sl = weekPieces[idx]
    const prevDraft = sl.piece && !sl.piece.startsWith('{{ERROR:') ? sl.piece : undefined
    setScreen('week-writing')
    setWritingLine(sl.moment.line)
    try {
      sl.piece = await generate(sl.cardObj, sl.moment, redoNote, sl.arc, sl.cardKey, prevDraft ? { previousDraft: prevDraft } : {})
    } catch (err) {
      sl.piece = `{{ERROR:The writer couldn't connect — ${err.message || 'unknown error'}. Tap rewrite to retry.}}`
    }
    setWeekPieces([...weekPieces])
    setScreen('week-review')
  }
}

// ── Sidebar + Layout ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'home', label: 'Command Centre', icon: '🏠' },
  { id: 'phase-planner', label: 'Phase Planner', icon: '📅' },
  { id: 'quick-moment', label: 'Write One Post', icon: '✍️' },
  { id: 'week-goal', label: 'Plan My Week', icon: '📆' },
  { id: 'view-weeks', label: 'Past Weeks', icon: '📚' },
]

const PHASE_WEEK_TYPES = [
  { id: 'reach', label: 'Reach', icon: '📡', desc: 'Grow your audience — shareable, bold, wide-net content' },
  { id: 'trust', label: 'Trust', icon: '🤝', desc: 'Build authority — value, storytelling, behind-the-scenes' },
  { id: 'sales', label: 'Sales', icon: '💰', desc: 'Drive conversion — offers, social proof, urgency, CTAs' },
]

const PHASE_DURATION_OPTIONS = [4, 6, 8, 12]

const PHASE_WEEK_COLORS = {
  reach: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', dot: 'bg-blue-500' },
  trust: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  sales: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' },
}

function SidebarLayout({ screen, onNavigate, savedWeeks, savedPosts, log, stage, streakCount, children, router }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const activeSection = screen === 'home' ? 'home'
    : screen === 'phase-planner' ? 'phase-planner'
    : screen.startsWith('quick') || screen.startsWith('magnet') ? 'quick-moment'
    : screen.startsWith('week') || screen === 'board' ? 'week-goal'
    : screen === 'view-weeks' || screen === 'view-week' ? 'view-weeks'
    : 'home'

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid text-white">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold font-display text-gold uppercase tracking-widest">Content Capture</span>
        <div className="w-6" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 left-0 z-30 w-72 h-screen glass-sidebar flex flex-col transition-transform md:transition-none overflow-y-auto`}>
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold font-display text-white tracking-tight">Content Capture</h2>
            <p className="text-xs text-zinc-500 mt-1">V2 · Your content system</p>
            {streakCount > 0 && (
              <div className="flex items-center gap-2 mt-3 bg-gold/10 rounded-lg px-3 py-2 border border-gold/20">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-gold">{streakCount} day streak</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="px-2 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Tools</p>
            {NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { onNavigate(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition mb-0.5 ${
                  activeSection === item.id
                    ? 'text-gold bg-gold/10 border border-gold/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}>
                <span className="text-sm w-5 text-center">{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
              </button>
            ))}

            {/* Capture log summary */}
            <p className="px-2 pt-5 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Capture Log</p>
            <div className="px-2 mb-1">
              <span className="text-xs text-zinc-500">{log.length} moment{log.length !== 1 ? 's' : ''} logged</span>
            </div>

            {/* Past weeks */}
            {savedWeeks.length > 0 && (
              <>
                <p className="px-2 pt-5 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Recent Weeks</p>
                {savedWeeks.slice(0, 5).map(w => {
                  const pieces = w.piece_ids || []
                  const date = new Date(w.week_start)
                  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  return (
                    <button key={w.id} onClick={() => { onNavigate('view-week', w); setSidebarOpen(false) }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition mb-0.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                      <span className="font-bold">{dateStr}</span>
                      <span className="text-zinc-600 ml-2">{pieces.length} post{pieces.length !== 1 ? 's' : ''}</span>
                    </button>
                  )
                })}
              </>
            )}

            {/* Stage indicator */}
            {stage && (
              <>
                <p className="px-2 pt-5 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Stage</p>
                <div className="px-3 py-2">
                  <span className="text-xs font-bold text-gold">{STAGES.find(s => s.id === stage)?.t}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <button onClick={() => router.push('/client')} className="w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
              ← Dashboard
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 min-h-screen px-4 py-8 lg:px-12 lg:py-10 max-w-3xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

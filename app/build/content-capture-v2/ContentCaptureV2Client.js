'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'start', t: 'Just getting going', s: 'Small audience, building from scratch' },
  { id: 'build', t: 'Growing steadily', s: 'Audience and results coming in, nothing on sale right now' },
  { id: 'launch', t: 'Selling right now', s: 'Doors are open or opening — a launch is on' },
  { id: 'ever', t: 'Always open', s: 'People can join my offer any time' },
]

const MIX = {
  start: { reach: 3, value: 2, sales: 0 },
  build: { reach: 2, value: 2, sales: 1 },
  launch: { reach: 1, value: 1, sales: 3 },
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

const ENRICH = {
  client: [['scene', 'Paint the scene — what actually happened?', 'Where were you, what was said, what did you see.'], ['verb', 'What did they actually say, word for word?', 'The exact line. Skip if nothing was said.'], ['num', 'Is there a number in it?', 'A figure, a timeframe, a count. Skip if not.']],
  receipt: [['num', "What's the exact number?", 'Exact beats rounded. £4,215 beats £4K.'], ['scene', "What's the story behind it?", 'Where did this start, what was it before.'], ['change', 'The one thing that made the difference?', 'One move, not the whole method.']],
  question: [['verb', 'What do they ask, word for word?', 'The exact phrasing is your opening line.'], ['scene', 'When did it last come up?', 'The DM, the call, the comment.'], ['change', 'Your honest answer in one line?', "The short version you'd give a mate."]],
  personal: [['scene', 'Take me to the moment — where were you?', 'Present tense if you can. The room, the day.'], ['num', 'Any numbers or dates in it?', 'The year, the figure, the cost. Skip if not.'], ['change', 'What changed after?', 'The before and the after, however small.']],
  industry: [['verb', "What's the advice everyone repeats?", "Their words, the way it's always said."], ['change', 'What do you believe instead?', 'Your actual position, one line.'], ['num', 'A result that backs you up?', "Honest answer — skip if not yet."]],
  bts: [['scene', 'What are you working on this week?', 'The thing itself, plainly.'], ['change', "What will be different when it's done?", 'For you or for them.'], ['num', 'Any numbers attached?', 'Dates, counts, targets. Skip if not.']],
}

const BUILD_LINES = [
  'Reading your moment...', 'Picking the shape...', 'Writing in your voice...', 'Sharpening the hook...', 'Checking the ask matches the job...',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function mixFor(stage, n) {
  const base = MIX[stage] || MIX.build
  const t = base.reach + base.value + base.sales
  const raw = { reach: n * base.reach / t, value: n * base.value / t, sales: n * base.sales / t }
  const out = { reach: Math.floor(raw.reach), value: Math.floor(raw.value), sales: Math.floor(raw.sales) }
  let left = n - (out.reach + out.value + out.sales)
  const rem = [['reach', raw.reach - out.reach], ['value', raw.value - out.value], ['sales', raw.sales - out.sales]].sort((a, b) => b[1] - a[1])
  for (const [k] of rem) { if (left <= 0) break; if (k === 'sales' && base.sales === 0) continue; out[k]++; left-- }
  while (left > 0) { out.reach++; left-- }
  if (base.sales === 0) out.sales = 0
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

function buildPrompt(c, m, redoNote, arc) {
  const e = m.enrichment || {}
  const facts = [`The moment, in their words: "${m.line}"`]
  if (e.scene) facts.push(`The scene: "${e.scene}"`)
  if (e.verb) facts.push(`Said word for word: "${e.verb}"`)
  if (e.num) facts.push(`The number: "${e.num}"`)
  if (e.change) facts.push(`What changed: "${e.change}"`)
  return `WHAT TO WRITE: ${c.fmt}.
FORMAT INSTRUCTIONS: ${c.out}
THE CALL TO ACTION: ${c.cta}
${arc ? `
STORY ARC — ${arc.n}. Follow these beats in this order, one arc only, never blended with another:
${arc.beats}
STORY RULES: The reader or viewer is the hero — the writer is only the guide who was once where they are. Credentials are never announced, only leaked as scenery ("back when I was..." never "as a successful..."). The villain must be a scene, not an abstract noun. The turn back onto the viewer is mandatory — without it, this is just someone talking about themselves.` : ''}

THE ONLY FACTS YOU MAY USE:
${facts.join('\n')}

ABSOLUTE RULE — NO INVENTION: never invent names, numbers, results, dates, clients or details not in the facts above. If a detail is genuinely needed but missing, write a placeholder in this exact form: {{WHAT'S NEEDED}}. Two honest placeholders beat one invented fact.

VOICE (non-negotiable):
- British English. Sounds like a voice note to a mate, not a crafted marketing piece.
- Vary sentence length deliberately — short punches, the occasional longer one that builds. No droning.
- No em-dashes. No "It's not X. It's Y." constructions. No three-part parallel lists.
- No memo words: never "however", "therefore", "moreover", "furthermore", "additionally".
- Connect beats with tension and consequence: but / so / which is why / problem was. "And then" is banned — if it fits a gap, that gap carries no story.
- Specifics over adjectives. Use their exact words and numbers wherever given.
- The reader should finish confronted by themselves, not impressed by the writer.
${redoNote ? `\nTHE LAST DRAFT WASN'T RIGHT: ${redoNote} Take a genuinely different angle.` : ''}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-[10px] font-bold text-gold uppercase tracking-[0.2em] mb-2">{children}</label>
}

function DimLabel({ children }) {
  return <p className="text-zinc-500 text-[13px] mb-5 max-w-xl">{children}</p>
}

function Question({ children }) {
  return <h2 className="text-xl md:text-2xl font-normal text-white mb-2 leading-tight">{children}</h2>
}

function GoldBar() {
  return <div className="w-8 h-px bg-gold mb-5" />
}

function OptionButton({ children, sub, selected, onClick }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-5 py-4 rounded border transition-all text-[15px] font-light leading-snug ${selected ? 'border-gold bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.02] hover:border-gold/30 hover:bg-white/[0.03]'}`}>
      {children}
      {sub && <span className="block text-zinc-600 text-[12.5px] mt-1">{sub}</span>}
    </button>
  )
}

function Btn({ children, onClick, disabled, gold }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`text-[10.5px] font-mono uppercase tracking-[0.16em] px-5 py-3 rounded border transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${gold ? 'border-gold text-gold hover:bg-gold hover:text-zinc-950' : 'border-white/[0.08] text-zinc-400 hover:border-gold/30 hover:text-white'}`}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-600 hover:text-zinc-400 py-2">
      {children}
    </button>
  )
}

function NoteBox({ children, gold }) {
  return (
    <div className={`border-l-2 ${gold ? 'border-gold' : 'border-white/[0.08]'} px-4 py-3 bg-white/[0.02] text-[13.5px] text-zinc-400 rounded-r mt-3`}>
      {children}
    </div>
  )
}

function LogLine({ moment, onDelete }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded px-4 py-3 mb-2 text-sm">
      <span className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-gold/50 min-w-[78px]">{TYPESHORT[moment.type]}</span>
      <span className="flex-1 text-white">{moment.line}</span>
      <button onClick={onDelete} className="text-zinc-600 hover:text-white px-1">×</button>
    </div>
  )
}

function WritingScreen({ line, label }) {
  return (
    <div className="text-center py-16">
      <div className="w-10 h-px bg-gold mx-auto mb-6 animate-pulse" />
      <p className="font-display text-sm tracking-[0.14em] text-gold mb-3">{label || 'WRITING YOUR PIECE'}</p>
      {line && <p className="text-zinc-400 text-[13.5px]">{line}</p>}
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
      part.startsWith('{{') ? <span key={i} className="text-gold font-mono text-[12.5px]">{part}</span> : part
    )
  }

  return (
    <div className="bg-white/[0.03] border border-gold/20 rounded p-5 mb-3">
      <div className="flex justify-between items-baseline mb-3 gap-3 flex-wrap">
        <h4 className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-gold">{title}</h4>
        {subtitle && <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-600">{subtitle}</span>}
      </div>
      {swap && <NoteBox gold><span className="text-gold font-medium">One switch made:</span> {swap}</NoteBox>}
      <div className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-white mt-3">{renderPiece(piece)}</div>
      {piece && piece.includes('{{') && (
        <NoteBox gold><span className="text-gold font-medium">The gold gaps are yours.</span> Details you didn't give — nothing was made up. Drop the real thing in and it's done.</NoteBox>
      )}
      {dont && dont.length > 0 && (
        <div className="mt-3">
          <button onClick={() => setShowDont(!showDont)} className="font-mono text-[10px] tracking-[0.16em] uppercase text-zinc-600 hover:text-zinc-400">
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-[6vh_18px] overflow-y-auto" onClick={onClose}>
      <div className="bg-[#121214] border border-gold/20 rounded max-w-[560px] w-full p-7 relative animate-fade-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-xl text-zinc-600 hover:text-white">×</button>
        <h3 className="font-display text-sm tracking-[0.1em] text-gold mb-3">{title}</h3>
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-[#121214] border border-gold/20 rounded-t max-w-[680px] w-full p-6 max-h-[70vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
        <h3 className="font-mono text-[10px] tracking-[0.18em] uppercase text-gold mb-1">{title}</h3>
        {subtitle && <p className="text-[12.5px] text-zinc-600 mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

function SlotCard({ job, day, moment, onPick }) {
  return (
    <div className={`bg-white/[0.02] border ${moment ? 'border-white/[0.08]' : 'border-white/[0.06]'} rounded px-4 py-3 mb-2 transition`}>
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-gold">{JOBNAMES[job]}</span>
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-zinc-600">{day}</span>
      </div>
      {moment ? (
        <>
          <p className="text-sm text-white py-1">{moment.line}</p>
          <button onClick={onPick} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-gold/50 hover:text-gold pt-1">Change moment</button>
        </>
      ) : (
        <button onClick={onPick} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-gold/50 hover:text-gold py-2">+ Pick a moment</button>
      )}
    </div>
  )
}

function Stepper({ label, note, value, onMinus, onPlus, minDisabled, maxDisabled }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded px-4 py-3 mb-2 flex items-center justify-between gap-3">
      <div>
        <span className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-gold">{label}</span>
        <div className="text-[12px] text-zinc-600 mt-1">{note}</div>
      </div>
      <div className="flex items-center gap-3">
        <Btn onClick={onMinus} disabled={minDisabled}>−</Btn>
        <span className="font-display text-lg text-gold min-w-[16px] text-center">{value}</span>
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
  const [weekSlots, setWeekSlots] = useState([])
  const [weekIdx, setWeekIdx] = useState(0)
  const [weekEnrichIdx, setWeekEnrichIdx] = useState(0)
  const [weekPieces, setWeekPieces] = useState([])

  // Modals
  const [modal, setModal] = useState(null)
  const [picker, setPicker] = useState(null)

  // Writing state
  const [writing, setWriting] = useState(false)
  const [writingLine, setWritingLine] = useState('')

  const saveTimer = useRef(null)

  // ── Auth + Load ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: client } = await supabase.from('clients').select('id').eq('email', user.email).maybeSingle()
      if (!client) { router.push('/login'); return }
      setClientId(client.id)

      // Load profile
      const { data: profile } = await supabase.from('cc_profiles').select('*').eq('client_id', client.id).maybeSingle()
      if (profile) {
        setStage(profile.stage)
        setHasList(profile.has_list)
        setDoesYT(profile.does_yt)
        setPiecesN(profile.pieces_per_week)
        setEmailN(profile.email_count)
        setYtN(profile.yt_count)
      }

      // Load capture log
      const { data: logData } = await supabase.from('cc_capture_log').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
      if (logData) setLog(logData)

      setLoading(false)
      if (profile && profile.stage && profile.has_list !== null) {
        setScreen('home')
      } else if (profile && profile.stage) {
        setScreen('channels')
      } else {
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

  async function generate(card, moment, redoNote, arc) {
    const prompt = buildPrompt(card, moment, redoNote, arc)
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
  const mix = mixFor(stage, pieceCount)

  // ── Build week slots ──────────────────────────────────────────────────────

  function buildWeekSlots() {
    const m = mixFor(stage, pieceCount)
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={stage ? () => setScreen('home') : null} onStage={() => {}} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={stage ? () => setScreen('home') : null} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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
              setScreen('home')
            }}>Done →</Btn>
          </div>
        </main>
      </div>
    )
  }

  // ── Screen: Home ──────────────────────────────────────────────────────────

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <GoldBar />
          <GoldLabel>The Motherboard · Content system</GoldLabel>
          <Question>What do you want to <span className="text-gold font-medium">do</span>?</Question>

          <div className="flex flex-col gap-3 mb-7">
            <button onClick={() => { setQuickMoment(null); setQuickJob(null); setEnrichIdx(0); setScreen('quick-moment') }}
              className="text-left bg-white/[0.02] border border-white/[0.08] rounded p-5 transition hover:border-gold hover:bg-white/[0.03] hover:-translate-y-px hover:shadow-lg">
              <p className="font-display text-[13px] tracking-[0.1em] text-gold mb-1">WRITE ONE POST NOW</p>
              <p className="text-[13.5px] text-zinc-400">Something happened — turn it into content in two minutes.</p>
            </button>
            <button onClick={() => {
              if (log.length === 0) {
                setModal({ title: 'The log is empty', body: "The week builds from your logged moments, and there's nothing in yet. Log a few from this week — a client thing, a number, a question you keep getting — then come back.", options: [['Log some moments', () => setModal(null)]] })
                return
              }
              const slots = buildWeekSlots()
              setWeekSlots(slots); setWeekIdx(0); setWeekEnrichIdx(0); setScreen('board')
            }}
              className="text-left bg-white/[0.02] border border-white/[0.08] rounded p-5 transition hover:border-gold hover:bg-white/[0.03] hover:-translate-y-px hover:shadow-lg">
              <p className="font-display text-[13px] tracking-[0.1em] text-gold mb-1">PLAN MY WEEK</p>
              <p className="text-[13.5px] text-zinc-400">
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
                className={`border rounded px-2.5 py-1.5 font-mono text-[9px] tracking-[0.1em] uppercase transition ${capType === m.id ? 'border-gold text-gold' : 'border-white/[0.08] text-zinc-400'}`}>
                {TYPESHORT[m.id]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={capLine} onChange={e => setCapLine(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddLog() }}
              placeholder='"Sarah said she finally trusts her bank app."'
              className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-[14.5px] font-light" />
            <Btn gold onClick={handleAddLog}>Log</Btn>
          </div>

          <div className="mt-4">
            {log.length === 0 ? (
              <div className="border border-dashed border-white/[0.08] rounded p-6 text-center text-zinc-600 text-[13.5px]">
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <Question>What's <span className="text-gold font-medium">actually happened</span>?</Question>
          <DimLabel>Real content starts with real life.</DimLabel>
          {log.length > 0 && (
            <>
              <GoldLabel>From your log</GoldLabel>
              <div className="flex flex-col gap-2 mb-5">
                {log.map(m => (
                  <OptionButton key={m.id} onClick={() => { setQuickMoment(m); setScreen('quick-job') }}>
                    <span className="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-gold/50 mb-1">{TYPESHORT[m.type]}</span>
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <Question>Tell me in <span className="text-gold font-medium">one line</span>.</Question>
          <DimLabel>{mt.t} — just the bones. We'll flesh it out next.</DimLabel>
          <textarea rows={2} autoFocus value={capLine} onChange={e => setCapLine(e.target.value)}
            placeholder="e.g. Sarah told me she finally trusts the number in her bank app."
            className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-[14.5px] font-light resize-none" />
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
    const sug = ({ start: 'reach', build: 'value', launch: 'sales', ever: 'value' })[stage] || 'reach'
    const jobs = [
      { j: 'reach', t: 'Get noticed', s: "Reach new people who don't know you" },
      { j: 'value', t: 'Build trust', s: 'Turn followers into believers' },
      { j: 'sales', t: 'Make a sale', s: 'Warm audience, something to act on' },
    ]
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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
    const qs = ENRICH[quickMoment.type]
    const [key, q, hint] = qs[enrichIdx]
    const enrichVal = (quickMoment.enrichment || {})[key] || ''

    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <Question>{q}</Question>
          <DimLabel>{hint}</DimLabel>
          <textarea rows={2} autoFocus defaultValue={enrichVal}
            id="enrich-input"
            className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-[14.5px] font-light resize-none" />
          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => { if (enrichIdx > 0) setEnrichIdx(enrichIdx - 1); else setScreen('quick-job') }}>← Back</GhostBtn>
            <div className="flex gap-3 items-center">
              <button onClick={() => advanceEnrich(true)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-zinc-600 hover:text-zinc-400">Skip</button>
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <WritingScreen line={writingLine} label="WRITING YOUR PIECE" />
        </main>
      </div>
    )
  }

  if (screen === 'quick-result' && quickCard) {
    const card = CARDS[quickCard]
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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

  // ── Weekly Mode: Board ────────────────────────────────────────────────────

  if (screen === 'board') {
    const filled = weekSlots.filter(s => s.moment).length
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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

          <div className="mt-2">
            {weekSlots.map((sl, i) => (
              <SlotCard key={i} job={sl.job} day={sl.day} moment={sl.moment} onPick={() => setPicker(i)} />
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => setScreen('home')}>← Back</GhostBtn>
            <div className="flex gap-3">
              <Btn onClick={() => { setWeekSlots(suggestFill([...weekSlots])) }}>Suggest for me</Btn>
              <Btn gold disabled={!filled} onClick={() => {
                const assigned = weekSlots.filter(s => s.moment)
                setWeekPieces(assigned)
                setWeekIdx(0); setWeekEnrichIdx(0); setScreen('week-enrich')
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
                    <span className="block font-mono text-[8.5px] tracking-[0.1em] uppercase text-gold/50 mb-1">{TYPESHORT[m.type]}</span>
                    {m.line}
                  </OptionButton>
                ))}
                <div className="flex gap-3 mt-3">
                  <Btn onClick={() => { const updated = [...weekSlots]; updated[picker].moment = null; setWeekSlots(updated); setPicker(null) }}>Leave empty</Btn>
                  <Btn onClick={() => setPicker(null)}>Close</Btn>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/[0.08] rounded p-6 text-center text-zinc-600 text-[13.5px]">
                Every logged moment is already placed. Log another from the home screen, or leave this slot empty.
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
          <main className="max-w-[680px] mx-auto px-5 py-8">
            <WritingScreen label="WRITING YOUR WEEK" />
          </main>
        </div>
      )
    }

    const sl = weekPieces[weekIdx]
    const m = sl.moment
    const qs = ENRICH[m.type]
    const [key, q, hint] = qs[weekEnrichIdx]
    const enrichVal = (m.enrichment || {})[key] || ''

    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-gold/50 mb-4">
            Post {weekIdx + 1} of {weekPieces.length} · {JOBNAMES[sl.job]} · {sl.day}
          </p>
          <p className="text-zinc-600 text-[13px] mb-2">{m.line}</p>
          <Question>{q}</Question>
          <DimLabel>{hint}</DimLabel>
          <textarea rows={2} autoFocus defaultValue={enrichVal} id="week-enrich-input"
            className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold text-[14.5px] font-light resize-none" />
          <div className="flex justify-between mt-6">
            <GhostBtn onClick={() => {
              if (weekEnrichIdx > 0) setWeekEnrichIdx(weekEnrichIdx - 1)
              else if (weekIdx > 0) { setWeekIdx(weekIdx - 1); setWeekEnrichIdx(ENRICH[weekPieces[weekIdx - 1].moment.type].length - 1) }
              else setScreen('board')
            }}>← Back</GhostBtn>
            <div className="flex gap-3 items-center">
              <button onClick={() => advanceWeekEnrich(true)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-zinc-600 hover:text-zinc-400">Skip</button>
              <Btn gold onClick={() => advanceWeekEnrich(false)}>
                {weekEnrichIdx < qs.length - 1 ? 'Next →' : (weekIdx < weekPieces.length - 1 ? 'Next post →' : 'Write the week →')}
              </Btn>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Weekly Mode: Writing ──────────────────────────────────────────────────

  if (screen === 'week-writing') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header onHome={() => setScreen('home')} onStage={() => setScreen('stage')} />
        <main className="max-w-[680px] mx-auto px-5 py-8">
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
                  const piece = await generate(CARDS[cardKey], sl.moment, null, null)
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'email', day: 'Thursday', moment: sl.moment, cardObj: CARDS[cardKey], piece, swap: null, arc: null })
                    return updated
                  })
                } catch {}
                setScreen('week-review')
              } : undefined}
              onToYT={sl.job !== 'longform' && doesYT ? async () => {
                setScreen('week-writing'); setWritingLine(sl.moment.line)
                try {
                  const piece = await generate(CARDS.c9, sl.moment, null, null)
                  setWeekPieces(prev => {
                    const updated = [...prev]
                    updated.splice(i + 1, 0, { job: 'longform', day: 'Sunday', moment: sl.moment, cardObj: CARDS.c9, piece, swap: null, arc: null })
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
    const qs = ENRICH[quickMoment.type]
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
      const piece = await generate(card, m, redoNote, arc)
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
      const piece = await generate(card, quickMoment, null, null)
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
    setWeekSlots(buildWeekSlots())
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

  async function advanceWeekEnrich(skip) {
    const sl = weekPieces[weekIdx]
    const m = sl.moment
    const qs = ENRICH[m.type]
    const [key] = qs[weekEnrichIdx]
    const val = skip ? '' : (document.getElementById('week-enrich-input')?.value?.trim() || '')
    m.enrichment = { ...(m.enrichment || {}), [key]: val }
    await updateLogEntry(m.id, m.enrichment)

    if (weekEnrichIdx < qs.length - 1) {
      setWeekEnrichIdx(weekEnrichIdx + 1)
    } else if (weekIdx < weekPieces.length - 1) {
      setWeekIdx(weekIdx + 1)
      setWeekEnrichIdx(0)
    } else {
      doWeekWrite()
    }
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
      const card = CARDS[r.card]
      const arc = pickArc(m.type, m, r.card)
      sl.cardObj = card
      sl.swap = r.swap
      sl.arc = arc
      try {
        sl.piece = await generate(card, m, null, arc)
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
      sl.piece = await generate(sl.cardObj, sl.moment, redoNote, sl.arc)
    } catch {}
    setWeekPieces([...weekPieces])
    setScreen('week-review')
  }
}

// ── Header ──────────────────────────────────────────────────────────────────

function Header({ onHome, onStage }) {
  return (
    <header className="border-b border-white/[0.06] bg-zinc-950/90 sticky top-0 z-40">
      <div className="max-w-[680px] mx-auto px-5 py-4 flex items-center justify-between">
        <button onClick={onHome} className="font-display text-[12px] font-bold tracking-[0.18em]">
          CONTENT CAPTURE<span className="text-gold">™</span>
          <span className="font-mono text-[8px] tracking-[0.2em] text-zinc-950 bg-gold rounded px-1.5 py-0.5 ml-1.5 align-[2px]">V2</span>
        </button>
        <button onClick={onStage} className="font-mono text-[9px] tracking-[0.16em] uppercase text-zinc-600 hover:text-zinc-400 px-2 py-1 border border-transparent rounded hover:border-white/[0.08]">
          My stage
        </button>
      </div>
    </header>
  )
}

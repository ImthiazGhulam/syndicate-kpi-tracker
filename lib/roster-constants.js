// The Roster — shared constants
// Feature name and all labels live here so the whole module can be renamed in one place.

export const ROSTER_NAME = 'The Roster'
export const ROSTER_TRADEMARK = 'The Roster\u2122'

// ── Lifecycle columns ───────────────────────────────────────────────────────

export const ROSTER_COLUMNS = [
  { id: 'onboarding',    label: 'Onboarding',          color: 'border-sky-500/40 bg-sky-500/5',     dot: 'bg-sky-400' },
  { id: 'active',        label: 'Active',              color: 'border-emerald-500/40 bg-emerald-500/5', dot: 'bg-emerald-400' },
  { id: 'at_risk',       label: 'At Risk',             color: 'border-amber-500/40 bg-amber-500/5', dot: 'bg-amber-400' },
  { id: 'resign_window', label: 'Resign Window',       color: 'border-red-500/40 bg-red-500/5',     dot: 'bg-red-400' },
  { id: 'resigned',      label: 'Resigned / Churned',  color: 'border-zinc-500/40 bg-zinc-500/5',   dot: 'bg-zinc-400' },
]

// Status values that map to the terminal "Resigned / Churned" column
export const TERMINAL_STATUSES = ['resigned', 'churned']

// Statuses the touch engine processes
export const TOUCHABLE_STATUSES = ['onboarding', 'active', 'at_risk']

// ── Health ──────────────────────────────────────────────────────────────────

export const HEALTH_COLORS = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red:   'bg-red-400',
}

export const HEALTH_TEXT = {
  green: 'text-emerald-400',
  amber: 'text-amber-400',
  red:   'text-red-400',
}

// ── Cadence defaults ────────────────────────────────────────────────────────

export const DEFAULT_CADENCE_DAYS = 10
export const DEFAULT_RED_DAYS = 14
export const WINS_STALE_DAYS = 30   // no win in 30 days + amber → at_risk
export const RESIGN_RUNWAY_DAYS = 45

// ── Resign stages ───────────────────────────────────────────────────────────

export const RESIGN_STAGES = [
  { id: 't45_book_call', label: 'Book the resign call',  offsetDays: 45, description: 'Book the resign call with the client.' },
  { id: 't30_win_stack', label: 'Win Stack',             offsetDays: 30, description: 'Generate and review the Win Stack document.' },
  { id: 't14_script',   label: 'Resign script',         offsetDays: 14, description: 'Generate the resign conversation script.' },
  { id: 'call_outcome', label: 'Call outcome',           offsetDays: 7,  description: 'Record the outcome of the resign call.' },
]

export const CHURN_REASONS = [
  { value: 'price',      label: 'Price' },
  { value: 'results',    label: 'Results' },
  { value: 'life',       label: 'Life circumstances' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'other',      label: 'Other' },
]

export const MAX_SNOOZES = 3

// ── Touch types & channels ──────────────────────────────────────────────────

export const TOUCH_TYPES = {
  personal: 'Personal',
  work: 'Work',
}

export const TOUCH_CHANNELS = {
  whatsapp: 'WhatsApp',
  call: 'Call',
  other: 'Other',
}

// ── Life Notes onboarding prompts ───────────────────────────────────────────

export const ONBOARDING_PROMPTS = [
  { key: 'whatsapp',   label: 'WhatsApp number',                              placeholder: '+44 7700 900000', isPhone: true },
  { key: 'home',       label: 'Who\u2019s at home?',                          placeholder: 'Partner, kids, pets \u2014 names and ages' },
  { key: 'hobbies',    label: 'What do they do when they\u2019re not working?', placeholder: 'Running, gaming, cooking...' },
  { key: 'obsession',  label: 'Team / club / obsession?',                     placeholder: 'Stoke City, CrossFit, vintage cars...' },
  { key: 'upcoming',   label: 'Anything coming up?',                          placeholder: 'Holiday, wedding, house move, race, launch...' },
  { key: 'personal',   label: 'One thing you know about them that has nothing to do with business', placeholder: 'Anything personal or random' },
]

// ── AI draft constraints ────────────────────────────────────────────────────

export const DRAFT_MAX_WORDS = 40
export const DRAFT_SYSTEM_BRIEF = `Write one WhatsApp message from the coach to this client. It must hinge on exactly one Life Note \u2014 pick the most timely one. It must contain no reference to their business, content, results, calls, or the programme. No "just checking in", no "hope you\u2019re well", no call to action. Under ${DRAFT_MAX_WORDS} words. Match the coach\u2019s voice profile exactly (slang, swearing, punctuation, energy). It should read like a mate who remembered something. Return JSON: { "message": "...", "life_note_id": "..." }.`

// ── Resign script fallback structure (no Scantily Clad Sales in codebase) ──

export const RESIGN_SCRIPT_STAGES = [
  { step: 1, label: 'Open on a Life Note',          instruction: 'Start the conversation with something personal \u2014 not business.' },
  { step: 2, label: 'Walk the Win Stack together',  instruction: 'Go through every win they\u2019ve had this term. Use their own words.' },
  { step: 3, label: 'Ask what they want next',       instruction: 'Ask what they want the next 12 months to look like.' },
  { step: 4, label: 'Name the gap',                  instruction: 'Name the gap between that vision and where they are now.' },
  { step: 5, label: 'Present the resign option',     instruction: 'Present the option to continue, framing around closing the gap.' },
  { step: 6, label: 'Lock a date',                   instruction: 'If they resign, lock a new start date and term end date.' },
]

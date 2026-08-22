'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import LoadingOverlay from '../../components/LoadingOverlay'


// ── Sub-components (outside main for mobile perf) ───────────────────────────

function TextInput({ value, onChange, placeholder, disabled }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm disabled:opacity-50"
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3, disabled }) {
  return (
    <textarea
      rows={rows}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm disabled:opacity-50"
    />
  )
}

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}

function SourceTag({ children }) {
  return <span className="text-[10px] text-zinc-500 uppercase tracking-widest ml-2">{children}</span>
}

function FieldGroup({ label, children, gold, source, missing }) {
  return (
    <div className={`mb-4 ${missing ? 'ring-1 ring-red-500/40 rounded-lg p-3 -mx-3' : ''}`}>
      <div className="flex items-baseline">
        {gold ? <GoldLabel>{label}</GoldLabel> : <Label>{label}</Label>}
        {source && <SourceTag>{source}</SourceTag>}
      </div>
      {missing && <p className="text-red-400 text-xs mb-2">Required</p>}
      {children}
    </div>
  )
}

const GENERATE_STATUS = [
  'Reading your offer data...',
  'Building Phase 1: Frame...',
  'Writing Discovery questions...',
  'Mapping your pillars to the process...',
  'Crafting objection handling...',
  'Writing the pitch...',
  'Checking voice rules...',
]

const REFINE_STATUS = [
  'Rewriting this phase...',
  'Applying your instruction...',
  'Polishing...',
]

const PHASE_META = [
  { key: 'phase_1', name: 'Phase 1: Frame', time: '2 min' },
  { key: 'phase_2', name: 'Phase 2: Discovery', time: '10 min' },
  { key: 'phase_3', name: 'Phase 3: Target', time: '5 min' },
  { key: 'phase_4', name: 'Phase 4: The Gap', time: '8 min' },
  { key: 'phase_5', name: 'Phase 5: The Process', time: '10 min' },
  { key: 'phase_6', name: 'Phase 6: Objections', time: '5 min' },
  { key: 'pitch', name: 'The Pitch', time: '5 min' },
]

const OBJECTION_BLOCKS = [
  { key: 'partner', label: 'Partner' },
  { key: 'timing', label: 'Timing' },
  { key: 'think', label: 'Think About It' },
  { key: 'price', label: 'Price' },
]

const PLACEHOLDERS = ['[current]', '[target]', '[date]', '[their number]', '[cause 1]', '[cause 2]', '[cause 3]', '[worth-it number]']


// ── Phase Card ──────────────────────────────────────────────────────────────

function PhaseCard({ phase, meta, generatedPhase, onUpdate, onRefine, onReset, refining }) {
  const [collapsed, setCollapsed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [refineInput, setRefineInput] = useState('')
  const [showRefine, setShowRefine] = useState(false)

  const lines = phase?.lines || []
  const text = lines.map(l => {
    if (l.type === 'note') return `[Note: ${l.text}]`
    return l.text
  }).join('\n')

  const spokenLines = lines.filter(l => l.type === 'spoken')
  const wordCount = spokenLines.reduce((sum, l) => sum + (l.text || '').split(/\s+/).filter(Boolean).length, 0)
  const spokenTime = Math.round(wordCount / 130 * 60)

  function startEdit() {
    setDraft(text)
    setEditing(true)
  }

  function saveEdit() {
    const newLines = draft.split('\n').map(line => {
      if (line.startsWith('[Note: ') && line.endsWith(']')) {
        return { type: 'note', text: line.slice(7, -1) }
      }
      return { type: 'spoken', text: line }
    })
    onUpdate({ ...phase, lines: newLines })
    setEditing(false)
  }

  function handleRefine() {
    if (!refineInput.trim()) return
    onRefine(refineInput.trim())
    setRefineInput('')
    setShowRefine(false)
  }

  return (
    <div className="glass-card p-5 mb-4">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold text-gold uppercase tracking-widest">{meta.name}</h3>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{meta.time}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{wordCount}w ~{spokenTime}s</span>
          <span className="text-zinc-500 text-sm">{collapsed ? '▸' : '▾'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="mt-4">
          {editing ? (
            <>
              <textarea
                rows={12}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none"
              />
              <p className="text-zinc-600 text-xs mt-1 mb-3">Wrap coaching notes in [Note: ...] to keep them distinct from spoken lines.</p>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Save</button>
                <button onClick={() => setEditing(false)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className={line.type === 'note'
                    ? 'text-sm leading-relaxed text-zinc-500 italic border-l-2 border-zinc-700 pl-3'
                    : 'text-sm leading-relaxed text-zinc-300'
                  }>
                    {line.text}
                  </div>
                ))}
              </div>

              {showRefine && (
                <div className="mt-4 p-4 rounded-lg border border-gold/20 bg-zinc-900">
                  <Label>What should change?</Label>
                  <TextInput
                    value={refineInput}
                    onChange={setRefineInput}
                    placeholder="e.g. make the frame shorter, soften the gap reflection"
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleRefine} disabled={refining || !refineInput.trim()} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition disabled:opacity-50">
                      {refining ? 'Rewriting...' : 'Refine'}
                    </button>
                    <button onClick={() => { setShowRefine(false); setRefineInput('') }} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                <button onClick={startEdit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Edit</button>
                <button onClick={() => setShowRefine(!showRefine)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Refine with AI</button>
                {generatedPhase && (
                  <button onClick={onReset} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Reset</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}


// ── Objection Block ─────────────────────────────────────────────────────────

function ObjectionBlock({ block, onUpdate, onRefine, onReset, generatedBlock, refining }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [refineInput, setRefineInput] = useState('')
  const [showRefine, setShowRefine] = useState(false)

  const lines = block?.lines || []
  const text = lines.map(l => {
    if (l.type === 'note') return `[Note: ${l.text}]`
    return l.text
  }).join('\n')

  function startEdit() {
    setDraft(text)
    setEditing(true)
  }

  function saveEdit() {
    const newLines = draft.split('\n').map(line => {
      if (line.startsWith('[Note: ') && line.endsWith(']')) {
        return { type: 'note', text: line.slice(7, -1) }
      }
      return { type: 'spoken', text: line }
    })
    onUpdate({ ...block, lines: newLines })
    setEditing(false)
  }

  function handleRefine() {
    if (!refineInput.trim()) return
    onRefine(refineInput.trim())
    setRefineInput('')
    setShowRefine(false)
  }

  return (
    <div className="border border-zinc-800 rounded-lg mb-2">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{block?.label || ''}</span>
        <span className="text-zinc-500 text-sm">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {editing ? (
            <>
              <textarea
                rows={8}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button onClick={saveEdit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Save</button>
                <button onClick={() => setEditing(false)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className={line.type === 'note'
                    ? 'text-sm leading-relaxed text-zinc-500 italic border-l-2 border-zinc-700 pl-3'
                    : 'text-sm leading-relaxed text-zinc-300'
                  }>
                    {line.text}
                  </div>
                ))}
              </div>

              {showRefine && (
                <div className="mt-4 p-4 rounded-lg border border-gold/20 bg-zinc-900">
                  <Label>What should change?</Label>
                  <TextInput value={refineInput} onChange={setRefineInput} placeholder="e.g. make the partner question softer" />
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleRefine} disabled={refining || !refineInput.trim()} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition disabled:opacity-50">
                      {refining ? 'Rewriting...' : 'Refine'}
                    </button>
                    <button onClick={() => { setShowRefine(false); setRefineInput('') }} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={startEdit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Edit</button>
                <button onClick={() => setShowRefine(!showRefine)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Refine with AI</button>
                {generatedBlock && (
                  <button onClick={onReset} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Reset</button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}


// ── Live Mode ───────────────────────────────────────────────────────────────

function LiveMode({ script, onExit }) {
  const [fills, setFills] = useState({})

  function updateFill(placeholder, value) {
    setFills(prev => ({ ...prev, [placeholder]: value }))
  }

  function renderLiveLine(text) {
    const parts = []
    let remaining = text
    let key = 0

    for (const ph of PLACEHOLDERS) {
      while (remaining.includes(ph)) {
        const idx = remaining.indexOf(ph)
        if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
        parts.push(
          <input
            key={key++}
            type="text"
            value={fills[ph] || ''}
            onChange={e => updateFill(ph, e.target.value)}
            placeholder={ph}
            className="inline-block w-32 mx-1 px-2 py-1 bg-zinc-800 border-b-2 border-gold text-gold text-lg font-bold rounded-none focus:outline-none"
          />
        )
        remaining = remaining.slice(idx + ph.length)
      }
    }
    if (remaining) parts.push(<span key={key++}>{remaining}</span>)
    return parts
  }

  const allPhases = PHASE_META.map(m => m.key)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
        <span className="text-xs font-bold text-gold uppercase tracking-widest">Live Mode</span>
        <button onClick={onExit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Exit</button>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-8">
        {allPhases.map(phaseKey => {
          const phase = script[phaseKey]
          if (!phase) return null
          const meta = PHASE_META.find(m => m.key === phaseKey)
          return (
            <div key={phaseKey} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-bold text-gold uppercase tracking-widest">{meta.name}</h2>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{meta.time}</span>
              </div>
              {(phase.lines || []).map((line, i) => (
                <div key={i} className={`mb-3 ${line.type === 'note'
                  ? 'text-base leading-relaxed text-zinc-500 italic border-l-2 border-zinc-700 pl-4'
                  : 'text-lg leading-relaxed text-zinc-200'
                }`}>
                  {line.type === 'note' ? line.text : renderLiveLine(line.text)}
                </div>
              ))}

              {phaseKey === 'phase_6' && script.objections && (
                <div className="mt-6">
                  {OBJECTION_BLOCKS.map(ob => {
                    const block = script.objections[ob.key]
                    if (!block) return null
                    return (
                      <div key={ob.key} className="mb-6 pl-4 border-l-2 border-gold/30">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">If {ob.label}:</h3>
                        {(block.lines || []).map((line, i) => (
                          <div key={i} className={`mb-2 ${line.type === 'note'
                            ? 'text-base leading-relaxed text-zinc-500 italic'
                            : 'text-lg leading-relaxed text-zinc-200'
                          }`}>
                            {line.type === 'note' ? line.text : renderLiveLine(line.text)}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


// ── Main Component ──────────────────────────────────────────────────────────

export default function SalesScriptPage() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Setup fields — ICP Sniper
  const [icpDescription, setIcpDescription] = useState('')
  const [pains, setPains] = useState(['', '', ''])
  const [desiredOutcome, setDesiredOutcome] = useState('')
  const [objections, setObjections] = useState([])
  const [incomeLevel, setIncomeLevel] = useState('')
  const [alreadyTried, setAlreadyTried] = useState('')

  // Setup fields — Distinction Engine
  const [problems, setProblems] = useState(['', '', ''])
  const [engineName, setEngineName] = useState('')
  const [pillars, setPillars] = useState(['', '', ''])
  const [pillarDescriptions, setPillarDescriptions] = useState(['', '', ''])
  const [promise, setPromise] = useState('')

  // Setup fields — Bang Bang Offer
  const [programmeName, setProgrammeName] = useState('')
  const [price, setPrice] = useState('')
  const [paymentPlan, setPaymentPlan] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [programmeLength, setProgrammeLength] = useState('')

  // Setup fields — Member
  const [firstName, setFirstName] = useState('')
  const [niche, setNiche] = useState('')

  // Setup fields — Client results (member-entered)
  const [useOwnStory, setUseOwnStory] = useState(false)
  const [results, setResults] = useState([
    { name: '', started: '', changed: '', now: '' },
  ])

  // State
  const [screen, setScreen] = useState('setup') // setup | script | live
  const [generating, setGenerating] = useState(false)
  const [refiningPhase, setRefiningPhase] = useState(null)
  const [script, setScript] = useState(null)
  const [generatedScript, setGeneratedScript] = useState(null)
  const [prefilled, setPrefilled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [savedScripts, setSavedScripts] = useState([])
  const [activeScriptId, setActiveScriptId] = useState(null)
  const [showSaved, setShowSaved] = useState(false)
  const [gammaDeckPrompt, setGammaDeckPrompt] = useState('')
  const [showGammaPrompt, setShowGammaPrompt] = useState(false)

  const toastRef = useRef(null)

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: client } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
      if (!client) { router.push('/client'); return }
      setClientData(client)

      // Load saved scripts
      const { data: scripts } = await supabase
        .from('sales_scripts')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (scripts) setSavedScripts(scripts)

      setLoading(false)
    }
    init()
  }, [])

  // ── Pull from Motherboard ─────────────────────────────────────────────────

  async function pullFromMotherboard() {
    if (!clientData) return
    const clientId = clientData.id

    // Member profile
    if (clientData.name) setFirstName(clientData.name.split(' ')[0])
    if (clientData.industry) setNiche(clientData.industry)

    // ICP Sniper
    const { data: playbook } = await supabase
      .from('offer_playbooks')
      .select('icp, bang_bang')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (playbook?.icp) {
      const icp = playbook.icp
      if (icp.specific_description) setIcpDescription(icp.specific_description)
      if (icp.pains && Array.isArray(icp.pains)) {
        const p = icp.pains.filter(Boolean)
        setPains([p[0] || '', p[1] || '', p[2] || ''])
      }
      if (icp.dream_outcome) setDesiredOutcome(icp.dream_outcome)
      if (icp.real_objections && Array.isArray(icp.real_objections)) {
        setObjections(icp.real_objections.filter(Boolean))
      }
      if (icp.income_level) setIncomeLevel(icp.income_level)
      if (icp.already_tried && Array.isArray(icp.already_tried)) {
        setAlreadyTried(icp.already_tried.filter(Boolean).join(', '))
      }
    }

    // Bang Bang Offer
    if (playbook?.bang_bang) {
      const bb = playbook.bang_bang
      if (bb.name) setProgrammeName(bb.name)
      if (bb.price) setPrice(bb.price)
      if (bb.staggered_payments && Array.isArray(bb.staggered_payments)) {
        const payments = bb.staggered_payments.filter(p => p.amount)
        if (payments.length > 0) {
          setPaymentPlan(payments.map(p => `${p.month}: ${p.amount}`).join(', '))
        }
      }
      if (bb.stack && Array.isArray(bb.stack)) {
        const items = bb.stack.filter(s => s.component).map(s => s.component)
        if (items.length > 0) setDeliverables(items.join(', '))
      }
      if (bb.phases && Array.isArray(bb.phases)) {
        const durations = bb.phases.filter(p => p.duration).map(p => `${p.name || 'Phase'}: ${p.duration}`)
        if (durations.length > 0) setProgrammeLength(durations.join(', '))
      }
    }

    // Distinction Engine
    const { data: de } = await supabase
      .from('distinction_engine')
      .select('engine_data')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (de?.engine_data) {
      const ed = de.engine_data
      setProblems([ed.problem_1 || '', ed.problem_2 || '', ed.problem_3 || ''])
      if (ed.engine_name) setEngineName(ed.engine_name)
      setPillars([ed.pillar_1 || '', ed.pillar_2 || '', ed.pillar_3 || ''])
      // Use first solution of each pillar as the plain-English description
      setPillarDescriptions([ed.solution_1_1 || '', ed.solution_2_1 || '', ed.solution_3_1 || ''])
      if (ed.promise) setPromise(ed.promise)
    }

    setPrefilled(true)
    showToast('Pulled from your Motherboard data')
  }

  // ── Validation ────────────────────────────────────────────────────────────

  const requiredFieldMap = {
    'ICP Description': icpDescription,
    'Pain 1': pains[0],
    'Desired Outcome': desiredOutcome,
    'Problem 1': problems[0],
    'Engine Name': engineName,
    'Pillar 1': pillars[0],
    'Pillar 2': pillars[1],
    'Pillar 3': pillars[2],
    'Pillar 1 Description': pillarDescriptions[0],
    'Pillar 2 Description': pillarDescriptions[1],
    'Pillar 3 Description': pillarDescriptions[2],
    'Promise': promise,
    'Programme Name': programmeName,
    'Price': price,
    'Deliverables': deliverables,
    'First Name': firstName,
    'Niche': niche,
  }
  const missingFields = Object.entries(requiredFieldMap).filter(([, v]) => !v).map(([k]) => k)
  if (!useOwnStory) {
    if (!results[0]?.name) missingFields.push('Result 1 Name')
    if (!results[0]?.started) missingFields.push('Result 1 Started')
    if (!results[0]?.changed) missingFields.push('Result 1 Changed')
    if (!results[0]?.now) missingFields.push('Result 1 Now')
  }
  const allRequired = missingFields.length === 0

  // ── Generate ──────────────────────────────────────────────────────────────

  async function generateScript() {
    if (!allRequired) return
    setGenerating(true)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales-script-generate',
          data: {
            firstName,
            niche,
            icpDescription,
            pains: pains.filter(Boolean),
            desiredOutcome,
            objections: objections.length > 0 ? objections : [],
            incomeLevel,
            alreadyTried,
            problems: problems.filter(Boolean),
            engineName,
            pillars: pillars.filter(Boolean),
            pillarDescriptions: pillarDescriptions.filter(Boolean),
            promise,
            programmeName,
            price,
            paymentPlan,
            deliverables,
            programmeLength,
            useOwnStory,
            results: useOwnStory ? [] : results.filter(r => r.name || r.started),
          },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Generation failed: ' + result.error)
        setGenerating(false)
        return
      }

      if (result.script) {
        setScript(result.script)
        setGeneratedScript(JSON.parse(JSON.stringify(result.script)))
        setScreen('script')
      } else {
        alert('No script returned. Please try again.')
      }
    } catch (err) {
      alert('Generation failed: ' + (err.message || 'Unknown error'))
    }

    setGenerating(false)
  }

  // ── Refine Phase ──────────────────────────────────────────────────────────

  async function refinePhase(phaseKey, instruction) {
    setRefiningPhase(phaseKey)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales-script-refine',
          data: {
            phaseKey,
            currentLines: script[phaseKey]?.lines || [],
            instruction,
            firstName,
            niche,
            engineName,
            programmeName,
          },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Refine failed: ' + result.error)
        setRefiningPhase(null)
        return
      }

      if (result.lines) {
        setScript(prev => ({ ...prev, [phaseKey]: { ...prev[phaseKey], lines: result.lines } }))
      }
    } catch (err) {
      alert('Refine failed: ' + (err.message || 'Unknown error'))
    }

    setRefiningPhase(null)
  }

  // ── Refine Objection ──────────────────────────────────────────────────────

  async function refineObjection(objKey, instruction) {
    setRefiningPhase('obj_' + objKey)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales-script-refine',
          data: {
            phaseKey: 'objection_' + objKey,
            currentLines: script.objections?.[objKey]?.lines || [],
            instruction,
            firstName,
            niche,
            engineName,
            programmeName,
          },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Refine failed: ' + result.error)
        setRefiningPhase(null)
        return
      }

      if (result.lines) {
        setScript(prev => ({
          ...prev,
          objections: {
            ...prev.objections,
            [objKey]: { ...prev.objections[objKey], lines: result.lines },
          },
        }))
      }
    } catch (err) {
      alert('Refine failed: ' + (err.message || 'Unknown error'))
    }

    setRefiningPhase(null)
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function saveScript() {
    if (!script || !clientData) return

    const version = savedScripts.filter(s => s.programme_name === programmeName).length + 1

    const { data: saved, error } = await supabase
      .from('sales_scripts')
      .insert({
        client_id: clientData.id,
        programme_name: programmeName,
        version,
        generated_json: generatedScript,
        edited_json: script,
      })
      .select()
      .single()

    if (error) {
      alert('Save failed: ' + (error.message || 'Unknown error'))
      return
    }

    if (saved) {
      setSavedScripts(prev => [saved, ...prev])
      setActiveScriptId(saved.id)
      showToast('Script saved (v' + version + ')')
    }
  }

  // ── Update saved ──────────────────────────────────────────────────────────

  async function updateSavedScript() {
    if (!activeScriptId || !script) return

    const { error } = await supabase
      .from('sales_scripts')
      .update({ edited_json: script, updated_at: new Date().toISOString() })
      .eq('id', activeScriptId)

    if (error) {
      alert('Update failed: ' + (error.message || 'Unknown error'))
      return
    }

    setSavedScripts(prev => prev.map(s => s.id === activeScriptId ? { ...s, edited_json: script, updated_at: new Date().toISOString() } : s))
    showToast('Script updated')
  }

  // ── Load saved ────────────────────────────────────────────────────────────

  function loadSavedScript(saved) {
    setScript(saved.edited_json || saved.generated_json)
    setGeneratedScript(saved.generated_json)
    setActiveScriptId(saved.id)
    setProgrammeName(saved.programme_name || '')
    setScreen('script')
    setShowSaved(false)
    showToast('Loaded v' + saved.version)
  }

  // ── Copy all ──────────────────────────────────────────────────────────────

  function copyAll() {
    if (!script) return
    const allPhases = PHASE_META.map(m => m.key)
    let text = ''
    for (const phaseKey of allPhases) {
      const phase = script[phaseKey]
      if (!phase) continue
      const meta = PHASE_META.find(m => m.key === phaseKey)
      text += `\n${meta.name.toUpperCase()} (${meta.time})\n`
      text += (phase.lines || []).map(l => l.type === 'note' ? `[Note: ${l.text}]` : l.text).join('\n')
      text += '\n'

      if (phaseKey === 'phase_6' && script.objections) {
        for (const ob of OBJECTION_BLOCKS) {
          const block = script.objections[ob.key]
          if (!block) continue
          text += `\n  IF ${ob.label.toUpperCase()}:\n`
          text += (block.lines || []).map(l => l.type === 'note' ? `  [Note: ${l.text}]` : `  ${l.text}`).join('\n')
          text += '\n'
        }
      }
    }
    if (navigator.clipboard) navigator.clipboard.writeText(text.trim())
    showToast('Copied to clipboard')
  }

  // ── Download PDF ──────────────────────────────────────────────────────────

  function downloadPDF() {
    if (!script) return
    const allPhases = PHASE_META.map(m => m.key)
    let html = `<html><head><title>Sales Call Script - ${programmeName}</title><style>
      body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #222; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 15px; color: #b8860b; text-transform: uppercase; letter-spacing: 2px; margin-top: 32px; margin-bottom: 8px; }
      h3 { font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; margin-bottom: 6px; }
      .spoken { font-size: 14px; line-height: 1.7; margin-bottom: 6px; }
      .note { font-size: 13px; color: #888; font-style: italic; border-left: 2px solid #ccc; padding-left: 12px; margin-bottom: 6px; }
      .time { font-size: 11px; color: #999; }
    </style></head><body>`
    html += `<h1>Sales Call Script</h1><p style="color:#999;font-size:13px;">${programmeName} | ${new Date().toLocaleDateString('en-GB')}</p>`

    for (const phaseKey of allPhases) {
      const phase = script[phaseKey]
      if (!phase) continue
      const meta = PHASE_META.find(m => m.key === phaseKey)
      html += `<h2>${meta.name} <span class="time">${meta.time}</span></h2>`
      for (const line of (phase.lines || [])) {
        html += line.type === 'note'
          ? `<div class="note">${line.text}</div>`
          : `<div class="spoken">${line.text}</div>`
      }

      if (phaseKey === 'phase_6' && script.objections) {
        for (const ob of OBJECTION_BLOCKS) {
          const block = script.objections[ob.key]
          if (!block) continue
          html += `<h3>If ${ob.label}:</h3>`
          for (const line of (block.lines || [])) {
            html += line.type === 'note'
              ? `<div class="note">${line.text}</div>`
              : `<div class="spoken">${line.text}</div>`
          }
        }
      }
    }

    html += '</body></html>'
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales-script-${programmeName || 'draft'}.html`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded')
  }

  // ── Gamma Deck Prompt ─────────────────────────────────────────────────────

  function buildGammaDeckPrompt() {
    if (!script) return
    let prompt = `Create a presentation deck for a 45-minute sales call. The deck is a visual companion the caller can glance at during the call. Clean, minimal slides. Dark background, gold accent colour. No walls of text.\n\n`
    prompt += `Programme: ${programmeName}\nNiche: ${niche}\nPrice: ${price}\n\n`
    prompt += `SLIDE STRUCTURE:\n\n`
    prompt += `Slide 1 — Title\n"${programmeName}" with tagline: "${promise}"\n\n`
    prompt += `Slide 2 — The Problem\nThree bullet points:\n`
    problems.filter(Boolean).forEach((p, i) => { prompt += `${i + 1}. ${p}\n` })
    prompt += `\nSlide 3 — The Gap\n"You're at [current]. You want [target]. Here's what's in the way."\nLeave [current] and [target] as placeholders.\nList causes:\n`
    pains.filter(Boolean).forEach((p, i) => { prompt += `- ${p}\n` })
    prompt += `\nSlide 4 — The Process\nTitle: "Three things that have to happen"\n`
    pillars.filter(Boolean).forEach((p, i) => {
      prompt += `Step ${i + 1}: ${p}${pillarDescriptions[i] ? ' — ' + pillarDescriptions[i] : ''}\n`
    })
    prompt += `\nSlide 5 — Proof\n`
    const activeResults = useOwnStory ? [{ name: firstName, started: '[your start]', changed: '[what changed]', now: '[where you are now]' }] : results.filter(r => r.name)
    activeResults.forEach(r => {
      prompt += `"${r.name}: Started at ${r.started}. ${r.changed}. Now at ${r.now}."\n`
    })
    prompt += `\nSlide 6 — What You Get\nProgramme name: ${programmeName}\nDeliverables: ${deliverables}\n`
    if (programmeLength) prompt += `Duration: ${programmeLength}\n`
    prompt += `\nSlide 7 — Investment\nPrice: ${price}\n`
    if (paymentPlan) prompt += `Payment plan: ${paymentPlan}\n`
    prompt += `\nSlide 8 — Next Step\n"Ready to start?" with a single call-to-action.\n`
    prompt += `\nIMPORTANT: Keep slides minimal. One idea per slide. Use placeholders [current], [target], [date], [their number] where the caller fills in live data. Do not invent numbers.`

    setGammaDeckPrompt(prompt)
    setShowGammaPrompt(true)
  }

  function copyGammaPrompt() {
    if (navigator.clipboard) navigator.clipboard.writeText(gammaDeckPrompt)
    showToast('Gamma prompt copied')
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  function showToast(msg) {
    if (toastRef.current) {
      toastRef.current.textContent = msg
      toastRef.current.style.opacity = '1'
      toastRef.current.style.transform = 'translateY(0)'
      setTimeout(() => {
        if (toastRef.current) {
          toastRef.current.style.opacity = '0'
          toastRef.current.style.transform = 'translateY(8px)'
        }
      }, 2000)
    }
  }

  // ── Total stats ───────────────────────────────────────────────────────────

  function getTotalStats() {
    if (!script) return { words: 0, time: 0 }
    let totalWords = 0
    for (const m of PHASE_META) {
      const phase = script[m.key]
      if (!phase) continue
      const spoken = (phase.lines || []).filter(l => l.type === 'spoken')
      totalWords += spoken.reduce((sum, l) => sum + (l.text || '').split(/\s+/).filter(Boolean).length, 0)
    }
    if (script.objections) {
      for (const ob of OBJECTION_BLOCKS) {
        const block = script.objections[ob.key]
        if (!block) continue
        const spoken = (block.lines || []).filter(l => l.type === 'spoken')
        totalWords += spoken.reduce((sum, l) => sum + (l.text || '').split(/\s+/).filter(Boolean).length, 0)
      }
    }
    return { words: totalWords, time: Math.round(totalWords / 130) }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-px bg-gold animate-pulse" />
      </div>
    )
  }

  if (screen === 'live' && script) {
    return <LiveMode script={script} onExit={() => setScreen('script')} />
  }

  const stats = getTotalStats()

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {generating && <LoadingOverlay lines={GENERATE_STATUS} />}
      {refiningPhase && <LoadingOverlay lines={REFINE_STATUS} />}

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-gold text-zinc-950 text-xs font-bold uppercase tracking-widest opacity-0 translate-y-2 transition-all pointer-events-none" />

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold text-gold uppercase tracking-widest">Sales Script™</span>
        <div className="w-6" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0 border-r border-white/[0.06] min-h-screen bg-zinc-950`}>
          <div className="p-5 pb-4 border-b border-white/[0.06]">
            <img src="/logo.png" alt="The Syndicate" className="h-12 w-auto logo-glow" />
          </div>
          <nav className="p-4">
            <button onClick={() => router.push('/client')} className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition mb-2">
              ← Dashboard
            </button>
            <div className="px-4 py-3">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Sales Call Script™</span>
              <p className="text-zinc-500 text-xs mt-1">Build your personalised sales call script</p>
            </div>

            {savedScripts.length > 0 && (
              <div className="mt-4 px-4">
                <button onClick={() => setShowSaved(!showSaved)} className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition">
                  {showSaved ? '▾' : '▸'} Saved Scripts ({savedScripts.length})
                </button>
                {showSaved && (
                  <div className="mt-2 space-y-1">
                    {savedScripts.map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadSavedScript(s)}
                        className={`w-full text-left px-3 py-2 rounded text-xs transition ${
                          s.id === activeScriptId ? 'bg-gold/10 text-gold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {s.programme_name || 'Untitled'} v{s.version}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl mx-auto px-5 py-8">

          {/* ── SETUP SCREEN ────────────────────────────────────────────── */}

          {screen === 'setup' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold font-display tracking-tight mb-1">Sales Call Script™</h1>
                <p className="text-zinc-500 text-sm">Build a personalised 45-minute sales call script for your offer.</p>
              </div>

              {/* Pull from Motherboard */}
              <div className="mb-8">
                <button
                  onClick={pullFromMotherboard}
                  disabled={prefilled}
                  className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition border ${
                    prefilled
                      ? 'bg-zinc-900 text-zinc-500 border-zinc-800 cursor-default'
                      : 'bg-gold/10 text-gold border-gold/30 hover:bg-gold/20'
                  }`}
                >
                  {prefilled ? '✓ Data pulled from Motherboard' : 'Pull from Motherboard'}
                </button>
              </div>

              {/* Member */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>About You</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Your name and niche.</p>

                <FieldGroup label="First name" gold source="From profile" missing={!firstName}>
                  <TextInput value={firstName} onChange={setFirstName} placeholder="e.g. Sarah" />
                </FieldGroup>

                <FieldGroup label="Niche / industry" gold source="From profile" missing={!niche}>
                  <TextInput value={niche} onChange={setNiche} placeholder="e.g. Business coaching" />
                </FieldGroup>
              </div>

              {/* ICP Sniper */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>ICP Sniper™</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Who you sell to and what keeps them stuck.</p>

                <FieldGroup label="Who you sell to (one-line)" gold source="From ICP Sniper™" missing={!icpDescription}>
                  <TextInput value={icpDescription} onChange={setIcpDescription} placeholder="e.g. Coaches and consultants doing under 10k/month who want to scale" />
                </FieldGroup>

                <FieldGroup label="Top pains (in their words)" gold source="From ICP Sniper™" missing={!pains[0]}>
                  {pains.map((p, i) => (
                    <div key={i} className="mb-2">
                      <TextInput value={p} onChange={v => setPains(prev => prev.map((x, j) => j === i ? v : x))} placeholder={`Pain ${i + 1}`} />
                    </div>
                  ))}
                </FieldGroup>

                <FieldGroup label="Desired outcome (the promise)" gold source="From Distinction Engine™" missing={!desiredOutcome}>
                  <TextInput value={desiredOutcome} onChange={setDesiredOutcome} placeholder="e.g. Consistent 10k+ months with a business that runs without you" />
                </FieldGroup>

                <FieldGroup label="Common objections / excuses" source="From ICP Sniper™">
                  <TextArea value={objections.join(', ')} onChange={v => setObjections(v.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. I need to think about it, I need to ask my partner, Now isn't the right time" rows={2} />
                </FieldGroup>

                <FieldGroup label="ICP income / revenue level" source="From ICP Sniper™">
                  <TextInput value={incomeLevel} onChange={setIncomeLevel} placeholder="e.g. 3-5k/month" />
                </FieldGroup>

                <FieldGroup label="What they've already tried (the old way)" source="From ICP Sniper™">
                  <TextArea value={alreadyTried} onChange={setAlreadyTried} placeholder="e.g. Posting on social media, free webinars, group programmes that didn't convert" rows={2} />
                </FieldGroup>
              </div>

              {/* Distinction Engine */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Distinction Engine™</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">The three problems your method solves and your pillars.</p>

                <FieldGroup label="Three core problems (why they're stuck)" gold source="From Distinction Engine™" missing={!problems[0]}>
                  {problems.map((p, i) => (
                    <div key={i} className="mb-2">
                      <TextInput value={p} onChange={v => setProblems(prev => prev.map((x, j) => j === i ? v : x))} placeholder={`Problem ${i + 1}`} />
                    </div>
                  ))}
                </FieldGroup>

                <FieldGroup label="Your method name" gold source="From Distinction Engine™" missing={!engineName}>
                  <TextInput value={engineName} onChange={setEngineName} placeholder="e.g. The Revenue Architecture™" />
                </FieldGroup>

                <FieldGroup label="Three pillars (branded names)" gold source="From Distinction Engine™" missing={!pillars[0] || !pillars[1] || !pillars[2]}>
                  {pillars.map((p, i) => (
                    <div key={i} className="mb-2">
                      <TextInput value={p} onChange={v => setPillars(prev => prev.map((x, j) => j === i ? v : x))} placeholder={`Pillar ${i + 1} name`} />
                    </div>
                  ))}
                </FieldGroup>

                <FieldGroup label="What each pillar does (plain English)" gold source="From Distinction Engine™" missing={!pillarDescriptions[0] || !pillarDescriptions[1] || !pillarDescriptions[2]}>
                  {pillarDescriptions.map((p, i) => (
                    <div key={i} className="mb-2">
                      <TextInput value={p} onChange={v => setPillarDescriptions(prev => prev.map((x, j) => j === i ? v : x))} placeholder={`What pillar ${i + 1} does`} />
                    </div>
                  ))}
                </FieldGroup>

                <FieldGroup label="The promise / transformation" gold source="From Distinction Engine™" missing={!promise}>
                  <TextArea value={promise} onChange={setPromise} placeholder="e.g. I help coaches go from inconsistent months to consistent 10k+ in 90 days" rows={2} />
                </FieldGroup>
              </div>

              {/* Bang Bang Offer */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Bang Bang Offer™</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Your programme details for the pitch.</p>

                <FieldGroup label="Programme name" gold source="From Sold Out™" missing={!programmeName}>
                  <TextInput value={programmeName} onChange={setProgrammeName} placeholder="e.g. The Accelerator" />
                </FieldGroup>

                <FieldGroup label="Price" gold source="From Sold Out™" missing={!price}>
                  <TextInput value={price} onChange={setPrice} placeholder="e.g. £2,997" />
                </FieldGroup>

                <FieldGroup label="Payment plan (if any)" source="From Sold Out™">
                  <TextInput value={paymentPlan} onChange={setPaymentPlan} placeholder="e.g. 3 x £1,099" />
                </FieldGroup>

                <FieldGroup label="What they get (deliverables)" gold source="From Sold Out™" missing={!deliverables}>
                  <TextArea value={deliverables} onChange={setDeliverables} placeholder="e.g. 12 weeks 1:1 coaching, weekly calls, Slack access, custom strategy" rows={2} />
                </FieldGroup>

                <FieldGroup label="Programme length" source="From Sold Out™">
                  <TextInput value={programmeLength} onChange={setProgrammeLength} placeholder="e.g. 12 weeks" />
                </FieldGroup>
              </div>

              {/* Client Results */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Proof</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Client results for the process section. Enter at least one.</p>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setUseOwnStory(!useOwnStory)}
                    className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition ${
                      useOwnStory ? 'bg-gold text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Use my own story instead
                  </button>
                </div>

                {!useOwnStory && results.map((r, i) => (
                  <div key={i} className="border border-zinc-800 rounded-lg p-4 mb-3">
                    <Label>Result {i + 1}</Label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <TextInput value={r.name} onChange={v => setResults(prev => prev.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Name or initial" />
                      <TextInput value={r.started} onChange={v => setResults(prev => prev.map((x, j) => j === i ? { ...x, started: v } : x))} placeholder="Where they started" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput value={r.changed} onChange={v => setResults(prev => prev.map((x, j) => j === i ? { ...x, changed: v } : x))} placeholder="What changed" />
                      <TextInput value={r.now} onChange={v => setResults(prev => prev.map((x, j) => j === i ? { ...x, now: v } : x))} placeholder="Where they are now" />
                    </div>
                    {i > 0 && (
                      <button onClick={() => setResults(prev => prev.filter((_, j) => j !== i))} className="text-xs text-red-400 mt-2 hover:text-red-300 transition">Remove</button>
                    )}
                  </div>
                ))}

                {!useOwnStory && results.length < 3 && (
                  <button
                    onClick={() => setResults(prev => [...prev, { name: '', started: '', changed: '', now: '' }])}
                    className="text-xs font-bold text-gold uppercase tracking-widest hover:text-gold-light transition"
                  >
                    + Add another result
                  </button>
                )}

                {useOwnStory && (
                  <p className="text-zinc-500 text-sm">Your own transformation story will be used. The AI will reference your name and niche.</p>
                )}
              </div>

              {/* Missing fields */}
              {missingFields.length > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Missing fields ({missingFields.length})</p>
                  <p className="text-xs text-red-400/70">{missingFields.join(', ')}</p>
                </div>
              )}

              {/* Generate */}
              <button
                onClick={generateScript}
                disabled={!allRequired || generating}
                className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition mb-8 ${
                  allRequired && !generating
                    ? 'bg-gold hover:bg-gold-light text-zinc-950'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {generating ? 'Building your script...' : 'Build My Script'}
              </button>

              <div className="pb-8">
                <button onClick={() => router.push('/client')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                  ← Dashboard
                </button>
              </div>
            </>
          )}

          {/* ── SCRIPT SCREEN ───────────────────────────────────────────── */}

          {screen === 'script' && script && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight mb-1">Your Sales Script</h1>
                    <p className="text-zinc-500 text-sm">{programmeName} | {stats.words} words | ~{stats.time} min spoken</p>
                  </div>
                  <button onClick={() => setScreen('setup')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                    ← Setup
                  </button>
                </div>
              </div>

              {/* Phase cards */}
              {PHASE_META.map(meta => (
                <div key={meta.key}>
                  <PhaseCard
                    phase={script[meta.key]}
                    meta={meta}
                    generatedPhase={generatedScript?.[meta.key]}
                    onUpdate={updated => setScript(prev => ({ ...prev, [meta.key]: updated }))}
                    onRefine={instruction => refinePhase(meta.key, instruction)}
                    onReset={() => setScript(prev => ({ ...prev, [meta.key]: JSON.parse(JSON.stringify(generatedScript[meta.key])) }))}
                    refining={refiningPhase === meta.key}
                  />

                  {/* Objection blocks inside Phase 6 */}
                  {meta.key === 'phase_6' && script.objections && (
                    <div className="ml-4 mb-4">
                      <Label>Objection Handling</Label>
                      {OBJECTION_BLOCKS.map(ob => (
                        <ObjectionBlock
                          key={ob.key}
                          block={script.objections[ob.key] ? { ...script.objections[ob.key], label: ob.label } : { label: ob.label, lines: [] }}
                          generatedBlock={generatedScript?.objections?.[ob.key]}
                          onUpdate={updated => setScript(prev => ({
                            ...prev,
                            objections: { ...prev.objections, [ob.key]: updated },
                          }))}
                          onRefine={instruction => refineObjection(ob.key, instruction)}
                          onReset={() => setScript(prev => ({
                            ...prev,
                            objections: { ...prev.objections, [ob.key]: JSON.parse(JSON.stringify(generatedScript.objections[ob.key])) },
                          }))}
                          refining={refiningPhase === 'obj_' + ob.key}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Export buttons */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Export</GoldLabel>
                <div className="flex gap-2 flex-wrap mt-3">
                  <button onClick={copyAll} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Copy All</button>
                  <button onClick={downloadPDF} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Download</button>
                  <button onClick={activeScriptId ? updateSavedScript : saveScript} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">
                    {activeScriptId ? 'Update Save' : 'Save to My Scripts'}
                  </button>
                  <button onClick={() => setScreen('live')} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Live Mode</button>
                  <button onClick={buildGammaDeckPrompt} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Gamma Deck Prompt</button>
                </div>
              </div>

              {/* Gamma Deck Prompt Modal */}
              {showGammaPrompt && (
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <GoldLabel>Gamma AI Deck Prompt</GoldLabel>
                    <button onClick={() => setShowGammaPrompt(false)} className="text-zinc-500 hover:text-white text-sm transition">✕</button>
                  </div>
                  <p className="text-zinc-500 text-xs mb-3">Copy this prompt and paste it into Gamma AI to generate your sales call picture deck.</p>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-h-64 overflow-y-auto scrollbar-thin mb-3">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap">{gammaDeckPrompt}</pre>
                  </div>
                  <button onClick={copyGammaPrompt} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Copy Prompt</button>
                </div>
              )}

              {/* Regenerate */}
              <div className="glass-card p-6 mb-6">
                <p className="text-zinc-500 text-sm mb-3">Regenerating creates a new version. Your current script is preserved.</p>
                <button
                  onClick={() => { setScreen('setup') }}
                  className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Back to Setup to Regenerate
                </button>
              </div>

              <div className="pb-8">
                <button onClick={() => router.push('/client')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                  ← Dashboard
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

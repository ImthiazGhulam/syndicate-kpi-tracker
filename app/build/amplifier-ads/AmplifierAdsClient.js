'use client'

import { useState, useEffect, useRef } from 'react'
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

function FieldGroup({ label, children, gold }) {
  return (
    <div className="mb-4">
      {gold ? <GoldLabel>{label}</GoldLabel> : <Label>{label}</Label>}
      {children}
    </div>
  )
}

const AI_STATUS_LINES = [
  'Reading your offer data...',
  'Building your ad scripts...',
  'Writing three angles...',
  'Polishing the hooks...',
]

const REFINE_STATUS_LINES = [
  'Rewriting the script...',
  'Applying your instruction...',
  'Polishing...',
]

// ── Variant Card ──────────────────────────────────────────────────────────

function VariantCard({ angle, script, onScriptChange, onRefine, refining }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(script || '')
  const [refineInput, setRefineInput] = useState('')
  const [showRefine, setShowRefine] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { setDraft(script || '') }, [script])

  const words = (script || '').split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const duration = Math.round(wordCount / 2.4)
  const first25 = words.slice(0, 25).join(' ').toLowerCase()
  const hasEarlyCTA = first25.includes('follow')

  function handleCopy() {
    if (script && navigator.clipboard) navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  function handleSaveEdit() {
    onScriptChange(draft)
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gold uppercase tracking-widest">{angle}</h3>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500 uppercase tracking-widest">
          <span>{wordCount} words</span>
          <span>~{duration}s</span>
          <span className={hasEarlyCTA ? 'text-emerald-400' : 'text-red-400'}>
            {hasEarlyCTA ? '✓ CTA in first 25' : '⚠ No early CTA'}
          </span>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            rows={10}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleSaveEdit} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Save</button>
            <button onClick={() => { setDraft(script || ''); setEditing(false) }} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">{script}</div>

          {showRefine && (
            <div className="mt-4 p-4 rounded-lg border border-gold/20 bg-zinc-900">
              <Label>What should change?</Label>
              <TextInput
                value={refineInput}
                onChange={setRefineInput}
                placeholder="e.g. Make the hook punchier, soften the CTA, shorter sentences..."
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
            <button onClick={handleCopy} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={() => setEditing(true)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Edit</button>
            <button onClick={() => setShowRefine(!showRefine)} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">
              Refine with AI
            </button>
          </div>
        </>
      )}
    </div>
  )
}


// ── Main Component ──────────────────────────────────────────────────────────

export default function AmplifierAdsPage() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form fields
  const [icp, setIcp] = useState('')
  const [aspiration, setAspiration] = useState('')
  const [pain, setPain] = useState('')
  const [topic, setTopic] = useState('')
  const [proof1, setProof1] = useState('')
  const [proof2, setProof2] = useState('')
  const [hateDoing, setHateDoing] = useState('')
  const [oldWay, setOldWay] = useState('')
  const [oldWayCost, setOldWayCost] = useState('')
  const [method, setMethod] = useState('')
  const [methodDoes, setMethodDoes] = useState('')

  // State
  const [generating, setGenerating] = useState(false)
  const [refiningIdx, setRefiningIdx] = useState(null)
  const [variants, setVariants] = useState([])
  const [prefilled, setPrefilled] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      setLoading(false)
    }
    init()
  }, [])

  // ── Pull from Motherboard ─────────────────────────────────────────────────

  async function pullFromMotherboard() {
    if (!clientData) return

    const clientId = clientData.id

    // Fetch ICP Sniper data (from offer_playbooks.icp)
    const { data: playbook } = await supabase
      .from('offer_playbooks')
      .select('icp')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (playbook?.icp) {
      const icpData = playbook.icp
      // Call-out keywords: identity_label + specific_description + vertical_niche
      const icpParts = [icpData.identity_label, icpData.specific_description, icpData.vertical_niche].filter(Boolean)
      if (icpParts.length > 0) setIcp(icpParts.join(', '))

      if (icpData.dream_outcome) setAspiration(icpData.dream_outcome)

      // Pain: combine pains array or use cost_of_inaction
      if (icpData.pains && Array.isArray(icpData.pains) && icpData.pains.length > 0) {
        setPain(icpData.pains.filter(Boolean).join('. '))
      } else if (icpData.cost_of_inaction) {
        setPain(icpData.cost_of_inaction)
      }

      // What they hate doing
      if (icpData.already_tried) {
        setHateDoing(Array.isArray(icpData.already_tried) ? icpData.already_tried.filter(Boolean).join(', ') : icpData.already_tried)
      }
    }

    // Fetch Distinction Engine data
    const { data: de } = await supabase
      .from('distinction_engine')
      .select('engine_data')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (de?.engine_data) {
      const ed = de.engine_data
      // Old way: first core problem
      if (ed.problem_1) setOldWay(ed.problem_1)

      // What old way costs: use ICP cost_of_inaction or problem_2
      if (playbook?.icp?.cost_of_inaction) {
        setOldWayCost(playbook.icp.cost_of_inaction)
      } else if (ed.problem_2) {
        setOldWayCost(ed.problem_2)
      }

      // Named method
      if (ed.engine_name) setMethod(ed.engine_name)

      // What the method does: promise
      if (ed.promise) setMethodDoes(ed.promise)
    }

    // Fetch Premium Position for content topic
    const { data: pp } = await supabase
      .from('premium_position')
      .select('brand_star')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (pp?.brand_star) {
      const bs = pp.brand_star
      if (bs.what_you_do) setTopic(bs.what_you_do)
    }

    setPrefilled(true)
    showToast('Pulled from your Motherboard data')
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  const requiredFilled = icp && proof1 && oldWay && method && methodDoes

  async function generateScripts() {
    if (!requiredFilled) return
    setGenerating(true)
    setVariants([])

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'amplifier-ads-generate',
          data: { icp, aspiration, pain, topic, proof1, proof2, hateDoing, oldWay, oldWayCost, method, methodDoes },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Generation failed: ' + result.error)
        setGenerating(false)
        return
      }

      if (result.variants && result.variants.length > 0) {
        setVariants(result.variants)
      } else {
        alert('No scripts returned. Please try again.')
      }
    } catch (err) {
      alert('Generation failed: ' + (err.message || 'Unknown error'))
    }

    setGenerating(false)
  }

  // ── Refine ────────────────────────────────────────────────────────────────

  async function refineScript(idx, instruction) {
    setRefiningIdx(idx)

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'amplifier-ads-refine',
          data: { currentScript: variants[idx].script, instruction },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Refine failed: ' + result.error)
        setRefiningIdx(null)
        return
      }

      if (result.script) {
        setVariants(prev => prev.map((v, i) => i === idx ? { ...v, script: result.script } : v))
      }
    } catch (err) {
      alert('Refine failed: ' + (err.message || 'Unknown error'))
    }

    setRefiningIdx(null)
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

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-px bg-gold animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {generating && <LoadingOverlay lines={AI_STATUS_LINES} />}
      {refiningIdx !== null && <LoadingOverlay lines={REFINE_STATUS_LINES} />}

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-gold text-zinc-950 text-xs font-bold uppercase tracking-widest opacity-0 translate-y-2 transition-all pointer-events-none" />

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold text-gold uppercase tracking-widest">Amplifier Ads™</span>
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
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Amplifier Ads™</span>
              <p className="text-zinc-500 text-xs mt-1">Instagram follow-ad script builder</p>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl mx-auto px-5 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold font-display tracking-tight mb-1">Amplifier Ads™</h1>
            <p className="text-zinc-500 text-sm">Build Instagram follow-ad scripts that get the right strangers onto your page.</p>
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

          {/* ── Form Section 1: ICP Sniper ──────────────────────────────────── */}

          <div className="glass-card p-6 mb-6">
            <GoldLabel>ICP Sniper™</GoldLabel>
            <p className="text-zinc-500 text-xs mb-4">Who the ad calls out and what they care about.</p>

            <FieldGroup label="Call-out keywords" gold>
              <TextInput value={icp} onChange={setIcp} placeholder="e.g. Coaches, consultants, service providers who want more clients" />
            </FieldGroup>

            <FieldGroup label="Aspiration">
              <TextInput value={aspiration} onChange={setAspiration} placeholder="What they want — e.g. A full calendar of premium clients" />
            </FieldGroup>

            <FieldGroup label="Pain">
              <TextInput value={pain} onChange={setPain} placeholder="What keeps stopping them — e.g. Posting daily with no enquiries" />
            </FieldGroup>

            <FieldGroup label="Daily content topic">
              <TextInput value={topic} onChange={setTopic} placeholder="e.g. Business growth for coaches" />
            </FieldGroup>
          </div>

          {/* ── Form Section 2: Proof ──────────────────────────────────────── */}

          <div className="glass-card p-6 mb-6">
            <GoldLabel>Proof</GoldLabel>
            <p className="text-zinc-500 text-xs mb-4">Client results the ad will reference. Numbers and timeframes.</p>

            <FieldGroup label="Client result 1 (required)" gold>
              <TextInput value={proof1} onChange={setProof1} placeholder="e.g. Sarah went from 2 clients to 14 in 90 days" />
            </FieldGroup>

            <FieldGroup label="Client result 2 (optional)">
              <TextInput value={proof2} onChange={setProof2} placeholder="e.g. Marcus hit £12k months within 6 weeks" />
            </FieldGroup>

            <FieldGroup label="Without... (thing their audience hates doing)">
              <TextInput value={hateDoing} onChange={setHateDoing} placeholder="e.g. Without cold DMs, dancing on reels, or posting 3x a day" />
            </FieldGroup>
          </div>

          {/* ── Form Section 3: Distinction Engine ─────────────────────────── */}

          <div className="glass-card p-6 mb-6">
            <GoldLabel>Distinction Engine™</GoldLabel>
            <p className="text-zinc-500 text-xs mb-4">The old way vs your method.</p>

            <FieldGroup label="The old way" gold>
              <TextInput value={oldWay} onChange={setOldWay} placeholder="e.g. Hoping social media posts convert on their own" />
            </FieldGroup>

            <FieldGroup label="What the old way costs them">
              <TextInput value={oldWayCost} onChange={setOldWayCost} placeholder="e.g. Months of effort with nothing to show for it" />
            </FieldGroup>

            <FieldGroup label="Named method" gold>
              <TextInput value={method} onChange={setMethod} placeholder="e.g. The Client Acquisition Engine™" />
            </FieldGroup>

            <FieldGroup label="What the method does" gold>
              <TextInput value={methodDoes} onChange={setMethodDoes} placeholder="e.g. Turns your content into a predictable client pipeline" />
            </FieldGroup>
          </div>

          {/* ── Generate Button ─────────────────────────────────────────────── */}

          <button
            onClick={generateScripts}
            disabled={!requiredFilled || generating}
            className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition mb-8 ${
              requiredFilled && !generating
                ? 'bg-gold hover:bg-gold-light text-zinc-950'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {generating ? 'Generating...' : 'Generate 3 Script Variants'}
          </button>

          {/* ── Variant Cards ──────────────────────────────────────────────── */}

          {variants.length > 0 && (
            <div className="mb-8">
              <GoldLabel>Your scripts</GoldLabel>
              <p className="text-zinc-500 text-xs mb-4">Three angles. Edit, refine, or copy each one.</p>

              {variants.map((v, i) => (
                <VariantCard
                  key={`${v.angle}-${i}`}
                  angle={v.angle}
                  script={v.script}
                  refining={refiningIdx === i}
                  onScriptChange={(newScript) => {
                    setVariants(prev => prev.map((x, j) => j === i ? { ...x, script: newScript } : x))
                  }}
                  onRefine={(instruction) => refineScript(i, instruction)}
                />
              ))}
            </div>
          )}

          {/* ── Footer Checklist ────────────────────────────────────────────── */}

          {variants.length > 0 && (
            <div className="glass-card p-6 mb-8">
              <GoldLabel>Before you go live</GoldLabel>
              <div className="space-y-3 mt-3">
                {[
                  'Review script in the community or weekly call before recording',
                  'Post as reel first, no trending audio, no collabs, wait 15+ minutes',
                  'Set up via Meta Business Suite on desktop, never phone',
                  'Suggested audience: broad within your niche, let Meta optimise',
                  'Minimum £5/day, funded by 10% of last month\'s profit',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-gold text-xs mt-0.5">▸</span>
                    <span className="text-zinc-400 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="pb-8">
            <button onClick={() => router.push('/client')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
              ← Dashboard
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

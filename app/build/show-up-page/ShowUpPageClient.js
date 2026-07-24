'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const BUILD_STATUS_LINES = [
  'Reading your playbook data...',
  'Checking your voice profile...',
  'Auditing for gaps...',
  'Writing your page copy...',
  'Scripting your videos...',
  'Building the testimonial brief...',
  'Running the QA check...',
]

const DELIVERABLE_TABS = [
  { key: 'page_copy', label: 'Page Copy', icon: '📄' },
  { key: 'video_1', label: 'Video 1: Call Briefing', icon: '🎬' },
  { key: 'video_2', label: 'Video 2: Programme', icon: '🎥' },
  { key: 'video_3', label: 'Video 3: Differentiation', icon: '💎' },
  { key: 'video_4', label: 'Video 4: Commitment', icon: '🎯' },
  { key: 'testimonial_brief', label: 'Testimonial Brief', icon: '📨' },
  { key: 'precall_form', label: 'Pre-Call Form', icon: '📋' },
  { key: 'qa_report', label: 'QA Report', icon: '✅' },
]

const CALL_PLATFORMS = ['Zoom', 'Google Meet']
const CALL_TYPES = ['Strategy Call', 'Discovery Call', 'Consultation', 'Breakthrough Session']
const LANGUAGES = ['British English', 'American English']

// ── Sub-components ────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm" />
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm" />
  )
}

function LoadingOverlay({ lines }) {
  const [lineIndex, setLineIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => { setLineIndex(prev => (prev + 1) % lines.length) }, 2500)
    return () => clearInterval(timer)
  }, [lines])
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gold text-sm font-bold uppercase tracking-widest animate-pulse">{lines[lineIndex]}</p>
      </div>
    </div>
  )
}

function SourceCard({ title, icon, status, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const isComplete = status === 'complete'
  return (
    <div className={`glass-card overflow-hidden transition-all ${isComplete ? 'gold-glow-border' : 'border border-amber-500/30'}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isComplete ? 'text-gold' : 'text-amber-400'}`}>
              {isComplete ? 'Complete' : 'Gaps found'}
            </p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/[0.06]">{children}</div>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShowUpPageClient() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Source data
  const [deData, setDeData] = useState(null)
  const [ppData, setPpData] = useState(null)
  const [offerData, setOfferData] = useState(null)

  // Gap answers (written back to source modules)
  const [toneProfile, setToneProfile] = useState({ directness: '', formality: '', profanity: '', phrases_use: '', phrases_avoid: '' })
  const [clientWins, setClientWins] = useState([
    { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' },
    { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' },
  ])
  const [deGaps, setDeGaps] = useState({ anti_polish: '', differentiation_thesis: '' })
  const [offerGaps, setOfferGaps] = useState({})

  // Build gaps
  const [buildGaps, setBuildGaps] = useState({
    call_type: 'Strategy Call', call_length: '30 minutes', call_platform: 'Zoom',
    cancellation_policy: '24 hours notice required', booking_tool: '', guarantee: '', language: 'British English',
  })

  // Output
  const [generatedOutput, setGeneratedOutput] = useState(null)
  const [activeTab, setActiveTab] = useState('page_copy')
  const [generating, setGenerating] = useState(false)
  const [apiError, setApiError] = useState('')
  const [aiGaps, setAiGaps] = useState(null)

  const saveTimerRef = useRef(null)
  const toastRef = useRef(null)
  const toastTimerRef = useRef(null)

  const flash = useCallback((msg = 'Saved') => {
    if (toastRef.current) {
      toastRef.current.textContent = msg
      toastRef.current.style.opacity = '1'
      toastRef.current.style.transform = 'translateY(0)'
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        if (toastRef.current) { toastRef.current.style.opacity = '0'; toastRef.current.style.transform = 'translateY(1rem)' }
      }, 2000)
    }
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: client } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
      if (!client) { router.push('/client'); return }
      setClientData(client)

      // Fetch all source data in parallel
      const [deRes, ppRes, offerRes, recordRes] = await Promise.all([
        supabase.from('distinction_engine').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('premium_position').select('*').eq('client_id', client.id).maybeSingle(),
        supabase.from('offer_playbooks').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('show_up_pages').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      console.log('Show Up sources:', {
        de: deRes.data ? 'found' : 'missing', deEngine: deRes.data?.engine_data ? Object.keys(deRes.data.engine_data) : 'none',
        pp: ppRes.data ? 'found' : 'missing',
        offer: offerRes.data ? 'found' : 'missing', offerBB: offerRes.data?.bang_bang?.name || 'none',
        record: recordRes.data ? 'found' : 'missing',
      })
      if (deRes.data) setDeData(deRes.data)
      if (ppRes.data) setPpData(ppRes.data)
      if (offerRes.data) setOfferData(offerRes.data)

      if (recordRes.data) {
        setRecord(recordRes.data)
        if (recordRes.data.tone_profile && Object.keys(recordRes.data.tone_profile).length) setToneProfile(recordRes.data.tone_profile)
        if (recordRes.data.client_wins?.length) setClientWins(recordRes.data.client_wins)
        if (recordRes.data.build_gaps && Object.keys(recordRes.data.build_gaps).length) setBuildGaps(prev => ({ ...prev, ...recordRes.data.build_gaps }))
        if (recordRes.data.gap_answers && Object.keys(recordRes.data.gap_answers).length) {
          if (recordRes.data.gap_answers.de) setDeGaps(recordRes.data.gap_answers.de)
          if (recordRes.data.gap_answers.offer) setOfferGaps(recordRes.data.gap_answers.offer)
        }
        if (recordRes.data.generated_output && Object.keys(recordRes.data.generated_output).length) setGeneratedOutput(recordRes.data.generated_output)
      }

      // Load tone from Premium Position if it exists there
      if (ppRes.data?.brand_star?.tone) {
        setToneProfile(prev => ({ ...prev, ...ppRes.data.brand_star.tone }))
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  const saveToSupabase = useCallback(async (fields = {}) => {
    if (!clientData) return
    const payload = {
      client_id: clientData.id,
      tone_profile: toneProfile,
      client_wins: clientWins,
      build_gaps: buildGaps,
      gap_answers: { de: deGaps, offer: offerGaps },
      generated_output: generatedOutput || {},
      status: generatedOutput ? 'complete' : 'draft',
      updated_at: new Date().toISOString(),
      ...fields,
    }

    if (record) {
      await supabase.from('show_up_pages').update(payload).eq('id', record.id)
    } else {
      const { data: newRec } = await supabase.from('show_up_pages').insert(payload).select().single()
      if (newRec) setRecord(newRec)
    }
    flash()
  }, [clientData, record, toneProfile, clientWins, buildGaps, deGaps, offerGaps, generatedOutput])

  const debouncedSave = useCallback((fields = {}) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveToSupabase(fields), 800)
  }, [saveToSupabase])

  // ── Write-back tone to Premium Position ───────────────────────────────────

  const writeToneBack = useCallback(async () => {
    if (!ppData || !clientData) return
    const currentStar = ppData.brand_star || {}
    await supabase.from('premium_position').update({
      brand_star: { ...currentStar, tone: toneProfile },
      updated_at: new Date().toISOString(),
    }).eq('client_id', clientData.id)
  }, [ppData, clientData, toneProfile])

  // ── Gap detection ─────────────────────────────────────────────────────────

  const deEngine = deData?.engine_data || {}
  const deComplete = !!(deEngine.problem_1 && deEngine.pillar_1 && deEngine.promise && (deData?.generated_output || deGaps.differentiation_thesis))
  const ppStar = ppData?.brand_star || {}
  const ppHero = ppData?.hero || {}
  const ppRemarkable = ppData?.remarkable || {}
  const ppComplete = !!(ppStar.specific_description && ppStar.refuse && ppRemarkable.differentiator && toneProfile.directness)
  const bb = offerData?.bang_bang || {}
  const comms = offerData?.comms || {}
  const offerComplete = !!(bb.name && bb.phases?.length > 0 && (bb.delivery_model?.length > 0 || comms.calls_1_1))
  const winsComplete = clientWins.filter(w => w.name && w.result_number && w.life_outcome).length >= 2

  // ── Build page ────────────────────────────────────────────────────────────

  const buildPage = async () => {
    setGenerating(true)
    setApiError('')
    setAiGaps(null)

    // Write tone back to Premium Position first
    await writeToneBack()
    await saveToSupabase()

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'show-up-page',
          data: {
            tone_profile: toneProfile,
            distinction_engine: {
              ...deEngine,
              generated_output: deData?.generated_output || '',
              anti_polish: deGaps.anti_polish || '',
              differentiation_thesis: deGaps.differentiation_thesis || deEngine.promise || '',
            },
            premium_position: {
              brand_star: ppStar,
              hero: ppHero,
              remarkable: ppRemarkable,
            },
            sold_out: {
              bang_bang: bb,
              comms: comms,
              icp: offerData?.icp || {},
            },
            client_wins: clientWins.filter(w => w.name && w.result_number),
            build_gaps: buildGaps,
            gap_answers: { de: deGaps, offer: offerGaps },
          },
        }),
      })

      const result = await res.json()
      console.log('Show Up Page result:', JSON.stringify(result).slice(0, 500))

      if (result.error) {
        setApiError(result.error)
      } else if (result.gaps) {
        setAiGaps(result.gaps)
      } else if (result.plan) {
        // Came back as plain text (fell through to default handler) — wrap it
        const output = { page_copy: result.plan }
        setGeneratedOutput(output)
        setActiveTab('page_copy')
        await saveToSupabase({ generated_output: output, status: 'complete' })
      } else if (result.page_copy || result.A || result.video_1 || result.B) {
        // Direct keys or lettered keys
        const output = result.page_copy ? result : {
          page_copy: result.A || '', video_1: result.B || '', video_2: result.C || '',
          video_3: result.D || '', video_4: result.E || '', testimonial_brief: result.F || '',
          precall_form: result.G || '', qa_report: result.H || '',
        }
        setGeneratedOutput(output)
        setActiveTab('page_copy')
        await saveToSupabase({ generated_output: output, status: 'complete' })
      } else {
        // Unknown structure — try to show whatever came back
        const keys = Object.keys(result)
        if (keys.length > 0) {
          // Map whatever keys exist to our tab keys
          const output = {}
          const tabKeys = DELIVERABLE_TABS.map(t => t.key)
          keys.forEach((k, i) => {
            if (tabKeys.includes(k)) output[k] = result[k]
            else if (i < tabKeys.length) output[tabKeys[i]] = result[k]
          })
          if (Object.keys(output).length > 0) {
            setGeneratedOutput(output)
            setActiveTab(Object.keys(output)[0])
            await saveToSupabase({ generated_output: output, status: 'complete' })
          } else {
            setApiError('Unexpected response format. Check console and try again.')
            console.error('Full result:', result)
          }
        } else {
          setApiError('Empty response from AI. Please try again.')
        }
      }
    } catch (err) {
      setApiError('Failed to connect. Please try again.')
    }
    setGenerating(false)
  }

  // ── Copy deliverable ──────────────────────────────────────────────────────

  const copyDeliverable = (key) => {
    if (!generatedOutput?.[key]) return
    navigator.clipboard.writeText(generatedOutput[key])
    flash('Copied!')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  const allSourcesReady = deComplete && ppComplete && offerComplete && winsComplete

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid text-white">
      {generating && <LoadingOverlay lines={BUILD_STATUS_LINES} />}

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 right-6 bg-gold text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest z-50 transition-all duration-300 opacity-0 translate-y-4 pointer-events-none">Saved</div>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.push('/client')} className="text-zinc-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-xs font-display font-bold text-gold uppercase tracking-widest">Show Up Page</span>
        <div className="w-6" />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold tracking-tight mb-1">The Show Up Page Builder</h1>
          <p className="text-zinc-500 text-sm">Generate your complete booking thank-you page from your playbook data.</p>
        </div>

        {apiError && (
          <div className="glass-card p-4 mb-6 border-red-500/30">
            <p className="text-red-400 text-sm">{apiError}</p>
            <button onClick={() => setApiError('')} className="text-red-400 underline text-xs mt-1">Dismiss</button>
          </div>
        )}

        {/* AI Gaps (returned from generation) */}
        {aiGaps && (
          <div className="glass-card p-5 mb-6 border-amber-500/30">
            <GoldLabel>Gaps Found During Build</GoldLabel>
            <p className="text-zinc-400 text-xs mb-3">The AI needs these details before it can build your page. Answer them below, then hit Build again.</p>
            <div className="space-y-3">
              {aiGaps.map((g, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">{g.source} — {g.missing}</p>
                  <p className="text-sm text-zinc-300 mb-2">{g.question}</p>
                  <TextInput
                    value={deGaps[g.missing] || offerGaps[g.missing] || ''}
                    onChange={v => {
                      if (g.source?.toLowerCase().includes('distinction')) setDeGaps(prev => ({ ...prev, [g.missing]: v }))
                      else setOfferGaps(prev => ({ ...prev, [g.missing]: v }))
                      debouncedSave()
                    }}
                    placeholder="Your answer..."
                  />
                </div>
              ))}
            </div>
            <button onClick={buildPage} disabled={generating}
              className="mt-4 w-full px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50">
              Rebuild With Answers
            </button>
          </div>
        )}

        {/* ── STATE 1: Source Cards ─────────────────────────────────────── */}
        {!generatedOutput && (
          <div className="space-y-4 mb-8">
            <GoldLabel>Your Data Sources</GoldLabel>

            {/* Distinction Engine */}
            <SourceCard title="Distinction Engine" icon="⚙️" status={deComplete ? 'complete' : 'gaps'} defaultOpen={!deComplete}>
              <div className="space-y-3 mt-3">
                {deEngine.problem_1 ? (
                  <div className="text-sm text-zinc-300">
                    <p><span className="text-gold font-bold">Problems:</span> {deEngine.problem_1}, {deEngine.problem_2}, {deEngine.problem_3}</p>
                    <p className="mt-1"><span className="text-gold font-bold">Pillars:</span> {deEngine.pillar_1}, {deEngine.pillar_2}, {deEngine.pillar_3}</p>
                    <p className="mt-1"><span className="text-gold font-bold">Promise:</span> {deEngine.promise}</p>
                  </div>
                ) : (
                  <p className="text-amber-400 text-xs">No Distinction Engine data found. Complete the Distinction Engine playbook first, or answer below.</p>
                )}
                <div>
                  <Label>What is the one thing that makes your approach genuinely different?</Label>
                  <TextArea value={deGaps.differentiation_thesis} onChange={v => { setDeGaps(prev => ({ ...prev, differentiation_thesis: v })); debouncedSave() }}
                    placeholder="The real reason your method works when others don't..." rows={2} />
                </div>
                <div>
                  <Label>Your anti-polish line (the raw, honest thing about how you work)</Label>
                  <TextInput value={deGaps.anti_polish} onChange={v => { setDeGaps(prev => ({ ...prev, anti_polish: v })); debouncedSave() }}
                    placeholder="e.g. 'I won't hold your hand, but I won't let you quit either'" />
                </div>
              </div>
            </SourceCard>

            {/* Premium Position */}
            <SourceCard title="Premium Position" icon="👑" status={ppComplete ? 'complete' : 'gaps'} defaultOpen={!ppComplete}>
              <div className="space-y-3 mt-3">
                {ppStar.specific_description ? (
                  <div className="text-sm text-zinc-300">
                    <p><span className="text-gold font-bold">Works with:</span> {ppStar.specific_description}</p>
                    {ppStar.refuse && <p className="mt-1"><span className="text-gold font-bold">Refuses:</span> {ppStar.refuse}</p>}
                    {ppRemarkable.differentiator && <p className="mt-1"><span className="text-gold font-bold">Differentiator:</span> {ppRemarkable.differentiator}</p>}
                  </div>
                ) : (
                  <p className="text-amber-400 text-xs">No Premium Position data found. Complete the playbook first, or answer the tone questions below.</p>
                )}

                <div className="bg-zinc-800/30 rounded-lg p-4 mt-2">
                  <GoldLabel>Your Voice & Tone Profile</GoldLabel>
                  <p className="text-zinc-500 text-xs mb-3">This shapes how every deliverable sounds. Be specific.</p>
                  <div className="space-y-3">
                    <div>
                      <Label>How direct are you? (warm and encouraging, or blunt and straight-talking?)</Label>
                      <TextInput value={toneProfile.directness} onChange={v => { setToneProfile(prev => ({ ...prev, directness: v })); debouncedSave() }}
                        placeholder="e.g. 'Very direct, no sugarcoating, but always warm underneath'" />
                    </div>
                    <div>
                      <Label>Formality level? Would you swear in your content?</Label>
                      <TextInput value={toneProfile.formality} onChange={v => { setToneProfile(prev => ({ ...prev, formality: v })); debouncedSave() }}
                        placeholder="e.g. 'Casual, yes I swear occasionally but not aggressively'" />
                    </div>
                    <div>
                      <Label>Phrases or words you use a lot?</Label>
                      <TextArea value={toneProfile.phrases_use} onChange={v => { setToneProfile(prev => ({ ...prev, phrases_use: v })); debouncedSave() }}
                        placeholder="e.g. 'let's go', 'no fluff', 'the reality is...'" rows={2} />
                    </div>
                    <div>
                      <Label>Phrases you would NEVER use?</Label>
                      <TextArea value={toneProfile.phrases_avoid} onChange={v => { setToneProfile(prev => ({ ...prev, phrases_avoid: v })); debouncedSave() }}
                        placeholder="e.g. 'unlock your potential', 'transform your life', 'synergy'" rows={2} />
                    </div>
                  </div>
                </div>
              </div>
            </SourceCard>

            {/* Sold Out Offer */}
            <SourceCard title="Sold Out Offer" icon="📖" status={offerComplete ? 'complete' : 'gaps'} defaultOpen={!offerComplete}>
              <div className="space-y-3 mt-3">
                {bb.name ? (
                  <div className="text-sm text-zinc-300">
                    <p><span className="text-gold font-bold">Programme:</span> {bb.name}</p>
                    <p className="mt-1"><span className="text-gold font-bold">Promise:</span> {bb.promise}</p>
                    {bb.phases?.length > 0 && <p className="mt-1"><span className="text-gold font-bold">Phases:</span> {bb.phases.map(p => p.name).filter(Boolean).join(', ')}</p>}
                    {bb.delivery_model?.length > 0 && <p className="mt-1"><span className="text-gold font-bold">Delivery:</span> {bb.delivery_model.join(', ')}</p>}
                    {bb.guarantee_type && <p className="mt-1"><span className="text-gold font-bold">Guarantee:</span> {bb.guarantee_type}</p>}
                  </div>
                ) : (
                  <p className="text-amber-400 text-xs">No Sold Out offer data found. Complete the Sold Out Playbook first.</p>
                )}
              </div>
            </SourceCard>

            {/* Client Wins — THE BIG ONE */}
            <SourceCard title="Client Wins & Testimonials" icon="🏆" status={winsComplete ? 'complete' : 'gaps'} defaultOpen={!winsComplete}>
              <div className="space-y-4 mt-3">
                <p className="text-zinc-400 text-xs">You need at least 2 client wins with a name, a number, and a life outcome. These become case studies in your videos and proof on the page.</p>

                {/* Written testimonial collection */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <GoldLabel>Written Testimonials</GoldLabel>
                  <p className="text-zinc-500 text-xs mb-4">Fill in the details for each client win. The more specific, the more powerful.</p>

                  {clientWins.map((win, i) => (
                    <div key={i} className={`${i > 0 ? 'mt-6 pt-6 border-t border-zinc-700/50' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-gold uppercase tracking-widest">Client Win {i + 1}</span>
                        {i >= 2 && (
                          <button onClick={() => { const updated = clientWins.filter((_, j) => j !== i); setClientWins(updated); debouncedSave({ client_wins: updated }) }}
                            className="text-zinc-600 hover:text-red-400 text-xs transition">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Client name or initials</Label>
                          <TextInput value={win.name} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], name: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                            placeholder="e.g. Sarah M." />
                        </div>
                        <div>
                          <Label>The specific result (a number)</Label>
                          <TextInput value={win.result_number} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], result_number: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                            placeholder="e.g. 'Lost 18kg in 4 months' or 'Revenue hit £12k/month'" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Where were they before? (the vivid scene)</Label>
                        <TextArea value={win.before} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], before: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                          placeholder="Paint the picture. Where were they stuck? What did their day look like?" rows={2} />
                      </div>
                      <div className="mt-3">
                        <Label>What had they tried before that failed?</Label>
                        <TextArea value={win.tried_failed} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], tried_failed: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                          placeholder="The things that didn't work and why..." rows={2} />
                      </div>
                      <div className="mt-3">
                        <Label>What was the process actually like working with you?</Label>
                        <TextArea value={win.process} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], process: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                          placeholder="Tailored plans, check-ins, adjustments, access..." rows={2} />
                      </div>
                      <div className="mt-3">
                        <Label>The life outcome (what changed beyond the number)</Label>
                        <TextArea value={win.life_outcome} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], life_outcome: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                          placeholder="Confidence, relationships, energy, career moves..." rows={2} />
                      </div>
                      <div className="mt-3">
                        <Label>Who would they recommend you to?</Label>
                        <TextInput value={win.recommend_to} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], recommend_to: v }; setClientWins(u); debouncedSave({ client_wins: u }) }}
                          placeholder="e.g. 'Anyone who's tried everything and is ready to commit'" />
                      </div>
                    </div>
                  ))}

                  <button onClick={() => { const u = [...clientWins, { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' }]; setClientWins(u); debouncedSave({ client_wins: u }) }}
                    className="mt-4 w-full px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-gold transition border border-dashed border-zinc-700 hover:border-gold/30">
                    + Add Another Win
                  </button>
                </div>

                {/* Video testimonial collection guide */}
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <GoldLabel>Video Testimonial Guide</GoldLabel>
                  <p className="text-zinc-500 text-xs mb-3">Send this to your clients to collect video testimonials. The build will generate a custom brief, but here is the structure they should follow.</p>

                  <div className="space-y-3">
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">What to Say (Beat List)</h4>
                      <ol className="text-sm text-zinc-300 space-y-1.5 list-decimal list-inside">
                        <li>Where you were when you started (be specific, slightly self-deprecating)</li>
                        <li>What you had tried before that didn't work, and how the coach came into the picture</li>
                        <li>What the actual process was like (tailored plans, check-ins, gradual adjustments, access to the coach)</li>
                        <li>Your result with one clear number (revenue, weight, time, whatever the measurable win was)</li>
                        <li>What changed beyond the obvious (confidence, relationships, energy, sleep, identity)</li>
                        <li>Community texture, if real (did you meet people? Was the group valuable? Skip if N/A)</li>
                        <li>Who you would recommend this to (be specific, not "everyone")</li>
                      </ol>
                      <p className="text-zinc-500 text-xs mt-3 italic">Tell them: rough delivery beats polish. 2 to 5 minutes raw. You will trim it.</p>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">How to Film It</h4>
                      <div className="text-sm text-zinc-300 space-y-2">
                        <p><span className="text-gold font-bold">Location:</span> Somewhere quiet with natural light. A tidy room, an office, even a well-lit car. Avoid busy backgrounds, ring lights that flatten the face, and anywhere with echo.</p>
                        <p><span className="text-gold font-bold">Camera:</span> Phone camera is fine. Front-facing camera. Hold the phone at eye level, not chin level. Lean it against something stable or use a simple tripod.</p>
                        <p><span className="text-gold font-bold">Orientation:</span> Landscape (horizontal) for website embeds. Portrait (vertical) if you also want to use it on social.</p>
                        <p><span className="text-gold font-bold">Framing:</span> Head and shoulders. A bit of space above the head. Eyes in the top third. Not too close, not too far.</p>
                        <p><span className="text-gold font-bold">Audio:</span> The most important thing. If possible, use wired earbuds with a mic. If not, be in a quiet room with no echo. Test by recording 10 seconds and playing it back.</p>
                        <p><span className="text-gold font-bold">What to wear:</span> Whatever they would normally wear. This is not a corporate video. Authenticity matters more than production.</p>
                        <p><span className="text-gold font-bold">Length:</span> Aim for 2 to 5 minutes. They should talk like they are telling a mate, not reading a script. You will trim the best 60 to 90 seconds.</p>
                        <p><span className="text-gold font-bold">Delivery:</span> Look at the camera lens, not the screen. Smile at the start. Take a breath before starting. If they mess up, just pause and restart that sentence. Do not start over.</p>
                      </div>
                    </div>

                    <div className="glass-card p-4">
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">Written vs Video</h4>
                      <div className="text-sm text-zinc-300 space-y-2">
                        <p><span className="text-gold font-bold">Video testimonials</span> are more persuasive. They carry tone, emotion, and credibility that text cannot match. Use them in Sections 1 and 5 of the thank-you page.</p>
                        <p><span className="text-gold font-bold">Written testimonials</span> are easier to get and easier to place on the page. Use them in Section 5 (Proof) with a real name or initials, a specific number, and one life outcome sentence.</p>
                        <p><span className="text-gold font-bold">Best approach:</span> Get 2 to 3 video testimonials from your strongest wins. Get 4 to 6 written ones for the page. You only need 3 to 4 written ones on the final page. Choose the ones with the clearest numbers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SourceCard>
          </div>
        )}

        {/* ── STATE 2: Build Gaps ──────────────────────────────────────── */}
        {!generatedOutput && (
          <div className="glass-card p-5 mb-8">
            <GoldLabel>Call & Page Details</GoldLabel>
            <p className="text-zinc-500 text-xs mb-4">These details aren't in your playbooks. Fill them in here.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Call type</Label>
                <select value={buildGaps.call_type} onChange={e => { setBuildGaps(prev => ({ ...prev, call_type: e.target.value })); debouncedSave() }}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold">
                  {CALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Call length</Label>
                <TextInput value={buildGaps.call_length} onChange={v => { setBuildGaps(prev => ({ ...prev, call_length: v })); debouncedSave() }}
                  placeholder="e.g. 30 minutes" />
              </div>
              <div>
                <Label>Call platform</Label>
                <select value={buildGaps.call_platform} onChange={e => { setBuildGaps(prev => ({ ...prev, call_platform: e.target.value })); debouncedSave() }}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold">
                  {CALL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Booking tool</Label>
                <TextInput value={buildGaps.booking_tool} onChange={v => { setBuildGaps(prev => ({ ...prev, booking_tool: v })); debouncedSave() }}
                  placeholder="e.g. Calendly, Cal.com, TidyCal" />
              </div>
              <div>
                <Label>Cancellation policy</Label>
                <TextInput value={buildGaps.cancellation_policy} onChange={v => { setBuildGaps(prev => ({ ...prev, cancellation_policy: v })); debouncedSave() }}
                  placeholder="e.g. 24 hours notice required" />
              </div>
              <div>
                <Label>Guarantee (if any)</Label>
                <TextInput value={buildGaps.guarantee} onChange={v => { setBuildGaps(prev => ({ ...prev, guarantee: v })); debouncedSave() }}
                  placeholder="e.g. Full refund if not satisfied, or leave blank" />
              </div>
              <div>
                <Label>Language</Label>
                <select value={buildGaps.language} onChange={e => { setBuildGaps(prev => ({ ...prev, language: e.target.value })); debouncedSave() }}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Build button */}
        {!generatedOutput && (
          <button onClick={buildPage} disabled={generating}
            className="w-full px-5 py-4 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50">
            {generating ? 'Building...' : 'Build My Show Up Page'}
          </button>
        )}

        {!generatedOutput && !allSourcesReady && (
          <p className="text-zinc-600 text-xs text-center mt-3">Some sources have gaps. The AI will ask for what it needs during the build, or you can fill them in above first.</p>
        )}

        {/* ── STATE 3: Output ─────────────────────────────────────────── */}
        {generatedOutput && (
          <div className="space-y-6">
            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
              {DELIVERABLE_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0 transition border ${
                    activeTab === tab.key ? 'bg-gold/20 text-gold border-gold/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white'
                  }`}>
                  <span>{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.label.split(':')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active deliverable */}
            {(() => {
              const content = generatedOutput[activeTab]
              if (!content) {
                return (
                  <div className="glass-card p-8 text-center">
                    <p className="text-zinc-500 text-sm">This deliverable wasn't generated. Try rebuilding.</p>
                  </div>
                )
              }
              const tab = DELIVERABLE_TABS.find(t => t.key === activeTab)
              const displayContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
              return (
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <span className="text-xs font-bold text-gold uppercase tracking-widest">{tab?.icon} {tab?.label}</span>
                    <button onClick={() => { navigator.clipboard.writeText(displayContent); flash('Copied!') }}
                      className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition">
                      Copy
                    </button>
                  </div>
                  <div className="p-5 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{displayContent}</div>
                </div>
              )
            })()}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setGeneratedOutput(null); setAiGaps(null) }}
                className="px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition border border-zinc-700">
                Edit Inputs
              </button>
              <button onClick={buildPage} disabled={generating}
                className="px-4 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50">
                Rebuild
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

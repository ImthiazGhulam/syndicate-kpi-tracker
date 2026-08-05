'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREENS = [
  { id: 'home', label: 'My Freebies', icon: '📦' },
  { id: 'pain', label: 'Pick the Pain', icon: '🎯' },
  { id: 'fit', label: 'Fit Check', icon: '✅' },
  { id: 'name', label: 'Name + Promise', icon: '✍️' },
  { id: 'format', label: 'Format', icon: '📐' },
  { id: 'method', label: 'The Method', icon: '🔧' },
  { id: 'build', label: 'Build', icon: '🏗️' },
  { id: 'export', label: 'Export + Delivery', icon: '🚀' },
]

const MAGNET_TYPES = [
  { id: 'script_pack', label: 'Script Pack', desc: 'Word-for-word scripts they paste into their business', teaching: 'Copy-first — your audience will paste these straight into their business' },
  { id: 'checklist', label: 'Checklist', desc: 'Step-by-step tick list they print and follow', teaching: 'Print-ready — they\'ll save this as a PDF' },
  { id: 'guide', label: 'Guide', desc: 'A short how-to document with worked examples', teaching: 'Print-ready — they\'ll save this as a PDF' },
  { id: 'template', label: 'Template', desc: 'A fill-in-the-blank framework they complete themselves', teaching: 'Copy-first — your audience will paste these straight into their business' },
  { id: 'tracker', label: 'Tracker', desc: 'A spreadsheet or log to measure progress', teaching: 'Copy-first — your audience will paste these straight into their business' },
  { id: 'video_script', label: 'Video Script', desc: 'A scripted walkthrough with spoken script + on-screen notes', teaching: 'A document is the wrong vehicle for this one — want the video script instead?' },
  { id: 'other', label: 'Other', desc: 'Something else entirely', teaching: '' },
]

const REWRITE_OPTIONS = [
  'Too salesy — soften it',
  'Too formal — loosen it up',
  'Doesn\'t sound like me — plainer',
  'Just try a different angle',
]

const BUILD_LINES = [
  'Reading your playbook data...',
  'Checking your voice profile...',
  'Structuring the document...',
  'Writing the full freebie...',
  'Adding real examples...',
  'Polishing the handover...',
]

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

function OptionButton({ children, sub, selected, onClick, badge }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition border ${selected ? 'bg-gold/10 text-gold border-gold/30' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'}`}>
      <div className="flex items-center justify-between gap-2">
        <span>{children}</span>
        {badge && <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">{badge}</span>}
      </div>
      {sub && <span className="block text-zinc-500 text-xs mt-1 font-normal">{sub}</span>}
    </button>
  )
}

function Btn({ children, onClick, disabled, gold, small }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${small ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-sm'} rounded-lg font-bold uppercase tracking-widest transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${gold ? 'bg-gold hover:bg-gold-light text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
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

function TextInput({ value, onChange, onBlur, placeholder, disabled }) {
  return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} disabled={disabled}
    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm disabled:opacity-50" />
}

function TextArea({ value, onChange, onBlur, placeholder, rows = 3 }) {
  return <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm" />
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="glass-card max-w-[560px] w-full p-7 relative mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-xl text-zinc-600 hover:text-white">x</button>
        <h3 className="text-lg font-bold font-display tracking-tight text-gold mb-3">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function WritingScreen({ lines }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setIdx(p => (p + 1) % lines.length), 2500); return () => clearInterval(t) }, [lines])
  return (
    <div className="text-center py-16">
      <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gold text-sm font-bold uppercase tracking-widest animate-pulse">{lines[idx]}</p>
    </div>
  )
}

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onCancel}>
      <div className="glass-card max-w-sm w-full p-6 mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-zinc-300 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn gold onClick={onConfirm}>Delete</Btn>
        </div>
      </div>
    </div>
  )
}

function renderPiece(text) {
  if (!text) return <span className="text-zinc-500">Nothing generated yet.</span>
  if (text.startsWith('{{ERROR:')) return <span className="text-red-400">{text.replace('{{ERROR:', '').replace('}}', '')}</span>
  return text.split(/(\{\{[^}]+\}\})/).map((part, i) =>
    part.startsWith('{{') ? <span key={i} className="text-gold font-bold text-xs">{part}</span> : part
  )
}

// ── Sidebar Layout ────────────────────────────────────────────────────────────

function SidebarLayout({ screen, magnets, activeMagnet, onNavigate, children, router }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid text-white">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold font-display text-gold uppercase tracking-widest">Lead Magnet Builder</span>
        <div className="w-6" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 left-0 z-30 w-72 h-screen glass-sidebar flex flex-col transition-transform md:transition-none overflow-y-auto`}>
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold font-display text-white tracking-tight">Lead Magnet Builder</h2>
            <p className="text-xs text-zinc-500 mt-1">Build freebies that fill your list</p>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="px-2 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Navigation</p>
            {SCREENS.map(item => {
              const isHome = item.id === 'home'
              const isActive = screen === item.id
              const isDisabled = !isHome && !activeMagnet && screen === 'home'
              return (
                <button key={item.id} onClick={() => { if (!isDisabled) { onNavigate(item.id); setSidebarOpen(false) } }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition mb-0.5 ${
                    isActive ? 'text-gold bg-gold/10 border border-gold/20'
                    : isDisabled ? 'text-zinc-700 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}>
                  <span className="text-sm w-5 text-center">{item.icon}</span>
                  <span className="tracking-wide">{item.label}</span>
                </button>
              )
            })}

            {/* Magnet list */}
            {magnets.length > 0 && (
              <>
                <p className="px-2 pt-5 pb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.25em]">Your Freebies</p>
                {magnets.map(m => (
                  <button key={m.id} onClick={() => { onNavigate('home', m); setSidebarOpen(false) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition mb-0.5 ${
                      activeMagnet?.id === m.id ? 'text-gold bg-gold/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}>
                    <span className="font-bold">{m.name || 'Untitled'}</span>
                    <span className="ml-2">{m.dm_flow_live ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" /> : <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />}</span>
                  </button>
                ))}
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function LeadMagnetClient() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Data sources
  const [magnets, setMagnets] = useState([])
  const [captureLog, setCaptureLog] = useState([])
  const [offerPlaybook, setOfferPlaybook] = useState(null)
  const [distinctionEngine, setDistinctionEngine] = useState(null)
  const [ccProfile, setCcProfile] = useState(null)
  const [premiumPosition, setPremiumPosition] = useState(null)

  // UI state
  const [screen, setScreen] = useState('home')
  const [activeMagnet, setActiveMagnet] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Screen 1 — Pain
  const [painSource, setPainSource] = useState(null)
  const [selectedPain, setSelectedPain] = useState('')
  const [customPain, setCustomPain] = useState('')
  const [groupedQuestions, setGroupedQuestions] = useState([])

  // Screen 2 — Fit check
  const [fitOffer, setFitOffer] = useState('')
  const [fitIcp, setFitIcp] = useState('')

  // Screen 3 — Name + promise + keyword
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [magnetName, setMagnetName] = useState('')
  const [magnetPromise, setMagnetPromise] = useState('')
  const [magnetKeyword, setMagnetKeyword] = useState('')
  const [keywordError, setKeywordError] = useState('')
  const [keywordChecking, setKeywordChecking] = useState(false)

  // Screen 4 — Format
  const [magnetType, setMagnetType] = useState('')
  const [recommendedType, setRecommendedType] = useState('')

  // Screen 5 — Method
  const [methodSteps, setMethodSteps] = useState([{ text: '' }])
  const [stepsEdited, setStepsEdited] = useState(new Set())
  const [stepsAiDrafted, setStepsAiDrafted] = useState(false)

  // Screen 6 — Build
  const [builtDoc, setBuiltDoc] = useState('')
  const [rewriteModal, setRewriteModal] = useState(false)

  // Screen 7 — Export
  const [deliveryLink, setDeliveryLink] = useState('')
  const [dmFlowLive, setDmFlowLive] = useState(false)
  const [ladderNote, setLadderNote] = useState('')
  const [dmFlowSpec, setDmFlowSpec] = useState('')
  const [dmFlowManychat, setDmFlowManychat] = useState('')
  const [generatingDmFlow, setGeneratingDmFlow] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  const saveTimerRef = useRef(null)
  const toastRef = useRef(null)
  const toastTimerRef = useRef(null)

  const flash = useCallback((msg = 'Saved') => {
    if (toastRef.current) {
      toastRef.current.textContent = msg
      toastRef.current.style.opacity = '1'
      toastRef.current.style.transform = 'translateY(0)'
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => { if (toastRef.current) { toastRef.current.style.opacity = '0'; toastRef.current.style.transform = 'translateY(1rem)' } }, 2000)
    }
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: client } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
      if (!client) { router.push('/client'); return }
      setClientData(client)

      const [magnetsRes, logRes, offerRes, deRes, ccRes, ppRes] = await Promise.all([
        supabase.from('lead_magnets').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
        supabase.from('cc_capture_log').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
        supabase.from('offer_playbooks').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('distinction_engine').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('cc_profiles').select('*').eq('client_id', client.id).maybeSingle(),
        supabase.from('premium_position').select('*').eq('client_id', client.id).maybeSingle(),
      ])

      if (magnetsRes.data) setMagnets(magnetsRes.data)
      if (logRes.data) setCaptureLog(logRes.data)
      if (offerRes.data) setOfferPlaybook(offerRes.data)
      if (deRes.data) setDistinctionEngine(deRes.data)
      if (ccRes.data) setCcProfile(ccRes.data)
      if (ppRes.data) setPremiumPosition(ppRes.data)

      // Group question-type moments from capture log
      if (logRes.data) {
        const questions = logRes.data.filter(l => l.type === 'question' && l.line)
        const groups = {}
        questions.forEach(q => {
          const key = q.line.toLowerCase().trim().slice(0, 60)
          if (!groups[key]) groups[key] = { line: q.line, count: 0 }
          groups[key].count++
        })
        const sorted = Object.values(groups).filter(g => g.count >= 2).sort((a, b) => b.count - a.count)
        setGroupedQuestions(sorted)
      }

      setLoading(false)
      } catch (err) {
        console.error('Lead Magnets init error:', err)
        setLoading(false)
      }
    }
    init()
  }, [router])

  // ── Save helpers ──────────────────────────────────────────────────────────

  const saveMagnet = useCallback(async (fields = {}) => {
    if (!clientData || !activeMagnet) return
    const payload = { ...fields, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('lead_magnets').update(payload).eq('id', activeMagnet.id).select().single()
    if (data) {
      setActiveMagnet(data)
      setMagnets(prev => prev.map(m => m.id === data.id ? data : m))
      flash()
    }
    return { data, error }
  }, [clientData, activeMagnet, flash])

  const debouncedSave = useCallback((fields = {}) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveMagnet(fields), 800)
  }, [saveMagnet])

  // ── Voice context builder ─────────────────────────────────────────────────

  const buildVoiceContext = useCallback(() => {
    const ctx = {}
    const tone = premiumPosition?.brand_star?.tone
    if (tone) {
      ctx.voice = {
        directness: tone.directness || '',
        formality: tone.formality || '',
        phrasesUse: tone.phrases_use || '',
        phrasesAvoid: tone.phrases_avoid || '',
      }
    }
    if (ccProfile?.voice_samples) {
      ctx.samples = Array.isArray(ccProfile.voice_samples) ? ccProfile.voice_samples : []
    }
    return Object.keys(ctx).length > 0 ? ctx : undefined
  }, [premiumPosition, ccProfile])

  // ── Generate content helper ───────────────────────────────────────────────

  const generateContent = useCallback(async (prompt, opts = {}) => {
    const { maxTokens = 1500, isRewrite = false, previousDraft = '' } = opts
    const body = { prompt, maxTokens, isRewrite, previousDraft, voiceContext: buildVoiceContext() }
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await res.json()
    if (result.error) throw new Error(result.error)
    return result.content || ''
  }, [buildVoiceContext])

  // ── Navigation ────────────────────────────────────────────────────────────

  const navigateTo = useCallback((target, magnet) => {
    if (magnet) {
      setActiveMagnet(magnet)
      setMagnetName(magnet.name || '')
      setMagnetPromise(magnet.promise || '')
      setMagnetKeyword(magnet.keyword || '')
      setMagnetType(magnet.magnet_type || '')
      setSelectedPain(magnet.problem_line || '')
      setMethodSteps(magnet.method_steps?.length ? magnet.method_steps.map(s => ({ text: s })) : [{ text: '' }])
      setBuiltDoc(magnet.built_doc || '')
      setDeliveryLink(magnet.delivery_link || '')
      setDmFlowLive(magnet.dm_flow_live || false)
      setLadderNote(magnet.ladder_note || '')
      setStepsEdited(new Set())
      setStepsAiDrafted(false)
      setFitOffer('')
      setFitIcp('')
      setKeywordError('')
      setDmFlowSpec('')
      setDmFlowManychat('')
    }
    setScreen(target)
  }, [])

  // ── Create new magnet ─────────────────────────────────────────────────────

  const createMagnet = async () => {
    if (!clientData) { alert('No client data loaded yet'); return }
    const { data, error } = await supabase.from('lead_magnets').insert({
      client_id: clientData.id,
      name: '',
      promise: '',
      keyword: '',
      magnet_type: 'guide',
      problem_line: '',
      method_steps: [],
      dm_flow_live: false,
    }).select().single()
    if (error) {
      console.error('Create magnet error:', error)
      alert('Failed to create freebie: ' + (error.message || JSON.stringify(error)))
      return
    }
    if (data) {
      setMagnets(prev => [data, ...prev])
      setActiveMagnet(data)
      setMagnetName('')
      setMagnetPromise('')
      setMagnetKeyword('')
      setMagnetType('guide')
      setSelectedPain('')
      setCustomPain('')
      setPainSource(null)
      setMethodSteps([{ text: '' }])
      setBuiltDoc('')
      setDeliveryLink('')
      setDmFlowLive(false)
      setLadderNote('')
      setStepsEdited(new Set())
      setStepsAiDrafted(false)
      setFitOffer('')
      setFitIcp('')
      setKeywordError('')
      setDmFlowSpec('')
      setDmFlowManychat('')
      setScreen('pain')
    }
  }

  // ── Delete magnet ─────────────────────────────────────────────────────────

  const deleteMagnet = async (id) => {
    await supabase.from('lead_magnets').delete().eq('id', id)
    setMagnets(prev => prev.filter(m => m.id !== id))
    if (activeMagnet?.id === id) { setActiveMagnet(null); setScreen('home') }
    setDeleteConfirm(null)
    flash('Deleted')
  }

  // ── Keyword validation ────────────────────────────────────────────────────

  const validateKeyword = async (kw) => {
    if (!kw || !clientData) { setKeywordError(''); return }
    setKeywordChecking(true)
    const { data } = await supabase.from('lead_magnets').select('id').eq('client_id', clientData.id).eq('keyword', kw.toLowerCase().trim())
    const conflict = data?.find(r => r.id !== activeMagnet?.id)
    setKeywordError(conflict ? 'This keyword is already used by another freebie' : '')
    setKeywordChecking(false)
  }

  // ── Infer magnet type from promise ────────────────────────────────────────

  const inferType = (promise) => {
    if (!promise) return ''
    const p = promise.toLowerCase()
    if (p.includes('script') || p.includes('word for word') || p.includes('copy') || p.includes('paste')) return 'script_pack'
    if (p.includes('template') || p.includes('fill in') || p.includes('framework') || p.includes('swipe')) return 'template'
    if (p.includes('checklist') || p.includes('check list') || p.includes('tick')) return 'checklist'
    if (p.includes('walkthrough') || p.includes('watch') || p.includes('video') || p.includes('screen')) return 'video_script'
    if (p.includes('tracker') || p.includes('spreadsheet') || p.includes('log')) return 'tracker'
    if (p.includes('guide') || p.includes('how to') || p.includes('step')) return 'guide'
    return 'guide'
  }

  // ── Offer context ─────────────────────────────────────────────────────────

  const offerName = offerPlaybook?.bang_bang?.name || offerPlaybook?.dip?.name || ''
  const icpPainsRaw = offerPlaybook?.icp?.pains
  const icpPains = Array.isArray(icpPainsRaw) ? icpPainsRaw.filter(Boolean).join(', ') : (icpPainsRaw || '')
  const hasOffer = !!(offerPlaybook?.bang_bang?.name || offerPlaybook?.dip?.name)

  // ── Distinction engine data ───────────────────────────────────────────────

  const getEnginePillars = () => {
    if (!distinctionEngine) return []
    const raw = distinctionEngine.engine_data || distinctionEngine
    const pillars = []
    for (let i = 1; i <= 5; i++) {
      const name = raw[`pillar_${i}`]
      const desc = raw[`pillar_${i}_description`] || raw[`pillar_${i}_desc`] || ''
      if (name) pillars.push({ name, desc })
    }
    return pillars
  }

  // ── Playbook context for generation ───────────────────────────────────────

  const buildPlaybookContext = () => {
    const lines = []
    if (offerPlaybook) {
      const bb = offerPlaybook.bang_bang || {}
      if (bb.name) lines.push(`Offer name: ${bb.name}`)
      if (bb.core_promise) lines.push(`Offer promise: ${bb.core_promise}`)
      if (bb.price) lines.push(`Offer price: ${bb.price}`)
      const icp = offerPlaybook.icp || {}
      if (icp.pains) lines.push(`ICP pains: ${icp.pains}`)
      if (icp.dream_outcome) lines.push(`ICP dream outcome: ${icp.dream_outcome}`)
    }
    if (distinctionEngine) {
      const raw = distinctionEngine.engine_data || distinctionEngine
      if (raw.engine_name) lines.push(`Method name: ${raw.engine_name}`)
      if (raw.promise) lines.push(`Method promise: ${raw.promise}`)
      const pillars = getEnginePillars()
      if (pillars.length) lines.push(`Method pillars: ${pillars.map(p => p.name).join(', ')}`)
    }
    if (premiumPosition) {
      const bs = premiumPosition.brand_star || {}
      if (bs.specific_description) lines.push(`Brand position: ${bs.specific_description}`)
    }
    return lines.join('\n')
  }

  // ── Screen 3: Generate name suggestions ───────────────────────────────────

  const generateNameSuggestions = async () => {
    const pain = selectedPain || customPain
    if (!pain) return
    setGenerating(true)
    setNameSuggestions([])
    try {
      const ctx = buildPlaybookContext()
      const prompt = `You are naming a lead magnet / freebie for a coach or service provider.

The freebie solves this pain: "${pain}"

${ctx ? `Context about their business:\n${ctx}\n` : ''}
Generate exactly 3 name + one-line promise combinations. Each one should be a compelling, specific freebie name paired with a promise that tells the reader exactly what they get.

Format your response as exactly 3 blocks, separated by blank lines:
NAME: [freebie name]
PROMISE: [one-line promise]

NAME: [freebie name]
PROMISE: [one-line promise]

NAME: [freebie name]
PROMISE: [one-line promise]

No preamble, no numbering, no commentary.`
      const content = await generateContent(prompt)
      const blocks = content.split(/\n\n+/).filter(b => b.includes('NAME:'))
      const suggestions = blocks.map(b => {
        const nameMatch = b.match(/NAME:\s*(.+)/i)
        const promiseMatch = b.match(/PROMISE:\s*(.+)/i)
        return {
          name: nameMatch ? nameMatch[1].trim() : '',
          promise: promiseMatch ? promiseMatch[1].trim() : '',
        }
      }).filter(s => s.name)
      setNameSuggestions(suggestions)
    } catch (err) {
      console.error('Name generation failed:', err)
    }
    setGenerating(false)
  }

  // ── Screen 5: Generate method steps ───────────────────────────────────────

  const generateMethodSteps = async () => {
    const pain = activeMagnet?.problem_line || selectedPain
    if (!pain) return
    setGenerating(true)
    try {
      const ctx = buildPlaybookContext()
      const prompt = `You are writing the method steps for a lead magnet / freebie.

The freebie solves this pain: "${pain}"
Freebie name: "${magnetName || 'untitled'}"
Promise: "${magnetPromise || ''}"
Format: ${magnetType || 'guide'}

${ctx ? `Business context:\n${ctx}\n` : ''}
Write 3-5 clear method steps. Each step should be one clear sentence describing what the person does or learns. These steps will become sections of the freebie document.

Format as a numbered list, one step per line. No preamble, no commentary.`
      const content = await generateContent(prompt)
      const lines = content.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean)
      const steps = lines.slice(0, 5).map(text => ({ text }))
      if (steps.length > 0) {
        setMethodSteps(steps)
        setStepsAiDrafted(true)
        setStepsEdited(new Set())
      }
    } catch (err) {
      console.error('Method generation failed:', err)
    }
    setGenerating(false)
  }

  // ── Screen 6: Build the document ──────────────────────────────────────────

  const buildDocument = async () => {
    if (!activeMagnet) return
    setGenerating(true)
    try {
      const pain = activeMagnet.problem_line || selectedPain || ''
      const steps = methodSteps.filter(s => s.text.trim()).map(s => s.text)
      const ctx = buildPlaybookContext()
      const isVideo = magnetType === 'video_script'

      // Gather real data for examples
      const captureExamples = captureLog.slice(0, 5).map(c => c.line).filter(Boolean).join('; ')

      // Voice samples for tone
      const voiceSamples = ccProfile?.voice_samples
      const voiceNote = voiceSamples && Array.isArray(voiceSamples) && voiceSamples.length > 0
        ? `\nTHEIR VOICE (match this tone):\n${voiceSamples.slice(0, 3).map(s => `---\n${s}\n---`).join('\n')}`
        : ''

      const prompt = `You are writing a complete, ready-to-send lead magnet document for a coach or service provider.

FREEBIE DETAILS:
Name: "${magnetName}"
Promise: "${magnetPromise}"
Pain it solves: "${pain}"
Format type: ${magnetType}
Method steps: ${steps.join(' | ')}

${ctx ? `THEIR BUSINESS CONTEXT (use for real examples and specifics):\n${ctx}\n` : ''}
${captureExamples ? `REAL MOMENTS FROM THEIR CONTENT LOG (use for authentic examples):\n${captureExamples}\n` : ''}
${voiceNote}

${isVideo ? `SPECIAL INSTRUCTION: This is a VIDEO SCRIPT format. Produce a scripted walkthrough with:
- Spoken script (what they say to camera, word for word)
- [ON SCREEN: what appears on screen at each point]
- Timestamps or section markers
Make it feel like a knowledgeable friend walking someone through it.` : `Write the COMPLETE document. This is the actual freebie the audience receives. Include:
- A clear title and one-line promise at the top
- Each method step as a full section with:
  - The specific template, script, checklist item, or worked example
  - Real numbers and real scenarios (use the business context above)
  - Practical, immediately usable content
- A closing section that bridges to their paid offer

For any detail you genuinely cannot find in the context, write {{PLACEHOLDER}} in caps — for example {{YOUR PROGRAMME NAME}} or {{INSERT YOUR BEST CLIENT RESULT}}. Never invent facts.`}

Write the complete document in markdown. No preamble. No "here is your document". Just the document itself, ready to hand to a stranger.`

      const content = await generateContent(prompt, { maxTokens: 4000 })
      setBuiltDoc(content)
      await saveMagnet({ built_doc: content })
    } catch (err) {
      console.error('Build failed:', err)
      setBuiltDoc('{{ERROR: Generation failed. Please try again.}}')
    }
    setGenerating(false)
  }

  // ── Screen 6: Rewrite ─────────────────────────────────────────────────────

  const rewriteDocument = async (correction) => {
    setRewriteModal(false)
    setGenerating(true)
    try {
      const prompt = `Rewrite this lead magnet document with this correction: "${correction}"

The document is called "${magnetName}" and promises "${magnetPromise}".

Maintain the same structure and sections but rewrite the content with the correction applied. Keep all {{PLACEHOLDER}} markers. Write the complete document — not a summary of changes.`

      const content = await generateContent(prompt, {
        maxTokens: 4000,
        isRewrite: true,
        previousDraft: builtDoc,
      })
      setBuiltDoc(content)
      await saveMagnet({ built_doc: content })
    } catch (err) {
      console.error('Rewrite failed:', err)
    }
    setGenerating(false)
  }

  // ── Screen 7: Generate DM flow ────────────────────────────────────────────

  const generateDmFlow = async () => {
    setGeneratingDmFlow(true)
    try {
      const prompt = `You are writing a DM automation flow spec for delivering a lead magnet.

Freebie name: "${magnetName}"
Keyword trigger: "${magnetKeyword}"
Delivery link: "${deliveryLink || '{{DELIVERY LINK}}'}"
Promise: "${magnetPromise}"

Write TWO versions:

VERSION 1: TOOL-AGNOSTIC FLOW SPEC
Write a clear step-by-step flow that works with any automation tool:
1. Trigger: keyword "${magnetKeyword}" detected in comments, DMs, or story replies
2. Instant reply: deliver the link + promise line
3. 23-hour follow-up: message for non-clickers
4. Tag the contact for future nurture

VERSION 2: MANYCHAT-SPECIFIC RECIPE
Write the same flow as ManyChat-specific instructions:
- Trigger setup (keyword automation)
- Flow builder steps
- Exact message templates for each step
- Tag names to create
- Follow-up sequence timing

Separate the two versions with "---SPLIT---"

No preamble. Start with VERSION 1.`

      const content = await generateContent(prompt, { maxTokens: 2000 })
      const parts = content.split('---SPLIT---')
      setDmFlowSpec(parts[0]?.trim() || content)
      setDmFlowManychat(parts[1]?.trim() || '')
    } catch (err) {
      console.error('DM flow generation failed:', err)
    }
    setGeneratingDmFlow(false)
  }

  // ── Build styled HTML for clipboard ───────────────────────────────────────

  const buildStyledHTML = () => {
    if (!builtDoc) return ''
    const clientName = clientData?.name || premiumPosition?.brand_star?.name || ''
    const lines = builtDoc.split('\n')
    let html = ''
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) { html += '<br/>'; return }
      if (trimmed.startsWith('# ')) html += `<h1 style="font-family:'Georgia',serif;font-size:28px;font-weight:700;color:#1a1a1a;margin:32px 0 16px;line-height:1.3;">${trimmed.slice(2)}</h1>`
      else if (trimmed.startsWith('## ')) html += `<h2 style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#1a1a1a;margin:28px 0 12px;line-height:1.3;">${trimmed.slice(3)}</h2>`
      else if (trimmed.startsWith('### ')) html += `<h3 style="font-family:'Georgia',serif;font-size:18px;font-weight:700;color:#1a1a1a;margin:24px 0 8px;line-height:1.3;">${trimmed.slice(4)}</h3>`
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) html += `<li style="font-family:'Georgia',serif;font-size:16px;color:#333;line-height:1.8;margin-left:24px;">${trimmed.slice(2)}</li>`
      else {
        const rendered = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\{\{([^}]+)\}\}/g, '<span style="color:#C9A84C;font-weight:700;">{{$1}}</span>')
        html += `<p style="font-family:'Georgia',serif;font-size:16px;color:#333;line-height:1.8;margin:8px 0;">${rendered}</p>`
      }
    })

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${magnetName || 'Lead Magnet'}</title>
<style>
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
body { max-width: 720px; margin: 0 auto; padding: 48px 32px; background: #fff; }
</style></head><body>
<div style="text-align:center;margin-bottom:48px;">
<p style="font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#C9A84C;margin-bottom:8px;">${clientName}</p>
<div style="width:48px;height:2px;background:#C9A84C;margin:0 auto;"></div>
</div>
${html}
<div style="text-align:center;margin-top:64px;padding-top:32px;border-top:1px solid #eee;">
<p style="font-family:sans-serif;font-size:11px;color:#999;letter-spacing:0.1em;">&copy; ${new Date().getFullYear()} ${clientName}</p>
</div>
</body></html>`
  }

  // ── Copy helpers ──────────────────────────────────────────────────────────

  const copyPlainText = () => {
    if (!builtDoc) return
    const plain = builtDoc.replace(/#{1,3}\s/g, '').replace(/\*\*/g, '').replace(/\{\{([^}]+)\}\}/g, '[$1]')
    navigator.clipboard.writeText(plain)
    flash('Copied as text')
  }

  const copyAsHTML = () => {
    const html = buildStyledHTML()
    if (!html) return
    navigator.clipboard.writeText(html)
    flash('Copied as HTML')
  }

  // ── Save on screen transitions ────────────────────────────────────────────

  const saveAndNavigate = async (target) => {
    if (activeMagnet) {
      const fields = {}
      if (screen === 'pain') fields.problem_line = selectedPain || customPain
      if (screen === 'name') { fields.name = magnetName; fields.promise = magnetPromise; fields.keyword = magnetKeyword }
      if (screen === 'format') fields.magnet_type = magnetType
      if (screen === 'method') fields.method_steps = methodSteps.filter(s => s.text.trim()).map(s => s.text)
      if (screen === 'build') fields.built_doc = builtDoc
      if (screen === 'export') { fields.delivery_link = deliveryLink; fields.dm_flow_live = dmFlowLive; fields.ladder_note = ladderNote }
      if (Object.keys(fields).length > 0) await saveMagnet(fields)
    }
    setScreen(target)
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-px bg-gold animate-pulse" />
      </div>
    )
  }

  // ── Render screens ────────────────────────────────────────────────────────

  const renderScreen = () => {
    switch (screen) {

      // ═══════════════════════════════════════════════════════════════════════
      // HOME — "My Freebies"
      // ═══════════════════════════════════════════════════════════════════════
      case 'home':
        return (
          <div>
            <button onClick={() => router.push('/client')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition mb-6 block">
              ← Back to Dashboard
            </button>
            <Question>My Freebies</Question>
            <DimLabel>Your lead magnets. Each one earns you followers and fills your list.</DimLabel>

            <div className="mb-6">
              <Btn gold onClick={createMagnet}>+ Build a Freebie</Btn>
            </div>

            {magnets.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="text-zinc-500 text-sm">No freebies yet. Build your first one and start growing your list.</p>
              </div>
            )}

            <div className="space-y-3">
              {magnets.map(m => (
                <div key={m.id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-white truncate">{m.name || 'Untitled freebie'}</h3>
                        {m.dm_flow_live
                          ? <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live</span>
                          : <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Draft</span>
                        }
                      </div>
                      {m.promise && <p className="text-xs text-zinc-400 mb-2">{m.promise}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        {m.keyword && (
                          <span className="text-[10px] font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-gold/20">
                            {m.keyword}
                          </span>
                        )}
                        {m.magnet_type && (
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {MAGNET_TYPES.find(t => t.id === m.magnet_type)?.label || m.magnet_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Btn small gold onClick={() => navigateTo('pain', m)}>Open / Edit</Btn>
                    <Btn small onClick={() => router.push(`/build/content-capture-v2?magnet_id=${m.id}`)}>Write the carousel</Btn>
                    <Btn small onClick={() => {
                      if (m.built_doc) {
                        navigator.clipboard.writeText(m.built_doc)
                        flash('Copied')
                      }
                    }}>Copy doc</Btn>
                    <button onClick={() => setDeleteConfirm(m.id)} className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-red-400 transition px-2 py-1">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <ConfirmDialog
              open={!!deleteConfirm}
              message="Delete this freebie? This cannot be undone."
              onConfirm={() => deleteMagnet(deleteConfirm)}
              onCancel={() => setDeleteConfirm(null)}
            />
          </div>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 1 — Pick the Pain
      // ═══════════════════════════════════════════════════════════════════════
      case 'pain':
        return (
          <div>
            <Question>Pick the pain</Question>
            <DimLabel>The best freebie answers a question your buyers are already asking. Yours are at the top.</DimLabel>

            {/* Source A: Recurring questions from DMs */}
            {groupedQuestions.length > 0 && (
              <div className="mb-6">
                <GoldLabel>Asked in your DMs</GoldLabel>
                <div className="space-y-2">
                  {groupedQuestions.map((q, i) => (
                    <OptionButton key={i} selected={painSource === 'dm' && selectedPain === q.line} onClick={() => { setPainSource('dm'); setSelectedPain(q.line); setCustomPain('') }}
                      badge={`${q.count}x`}>
                      {q.line}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* Source B: ICP pains from offer playbooks */}
            {icpPains && (
              <div className="mb-6">
                <GoldLabel>From your ICP</GoldLabel>
                <div className="space-y-2">
                  {icpPains.split(/[,;\n]/).map(p => p.trim()).filter(Boolean).map((pain, i) => (
                    <OptionButton key={i} selected={painSource === 'icp' && selectedPain === pain} onClick={() => { setPainSource('icp'); setSelectedPain(pain); setCustomPain('') }}>
                      {pain}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* Source C: Free-type */}
            <div className="mb-6">
              <GoldLabel>Or type your own</GoldLabel>
              <TextArea value={customPain} onChange={v => { setCustomPain(v); setPainSource('custom'); setSelectedPain(v) }} placeholder="What question or problem does your audience keep asking about?" rows={2} />
            </div>

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('home')}>Back</Btn>
              <Btn gold disabled={!selectedPain && !customPain} onClick={() => {
                const pain = painSource === 'custom' ? customPain : selectedPain
                setSelectedPain(pain)
                saveMagnet({ problem_line: pain })
                setScreen('fit')
              }}>Next</Btn>
            </div>
          </div>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 2 — Fit Check
      // ═══════════════════════════════════════════════════════════════════════
      case 'fit':
        return (
          <div>
            <Question>Quick fit check</Question>
            <DimLabel>Two honest questions before you go further.</DimLabel>

            {hasOffer && (
              <div className="mb-6">
                <GoldLabel>Does solving this move them toward {offerName}?</GoldLabel>
                <div className="space-y-2">
                  <OptionButton selected={fitOffer === 'yes'} onClick={() => setFitOffer('yes')}>Yes</OptionButton>
                  <OptionButton selected={fitOffer === 'not_really'} onClick={() => setFitOffer('not_really')}>Not really</OptionButton>
                  <OptionButton selected={fitOffer === 'not_sure'} onClick={() => setFitOffer('not_sure')}>Not sure</OptionButton>
                </div>
              </div>
            )}

            <div className="mb-6">
              <GoldLabel>Would your ideal client want this, or would anyone?</GoldLabel>
              <div className="space-y-2">
                <OptionButton selected={fitIcp === 'yes'} onClick={() => setFitIcp('yes')}>Yes — my ideal client specifically</OptionButton>
                <OptionButton selected={fitIcp === 'not_really'} onClick={() => setFitIcp('not_really')}>Not really — pretty broad</OptionButton>
                <OptionButton selected={fitIcp === 'not_sure'} onClick={() => setFitIcp('not_sure')}>Not sure</OptionButton>
              </div>
            </div>

            {(fitOffer === 'not_really' || fitIcp === 'not_really') && (
              <NoteBox gold>This may fill your list with freebie-hunters — fine if reach is the goal.</NoteBox>
            )}

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('pain')}>Back</Btn>
              <Btn gold onClick={() => setScreen('name')}>Next</Btn>
            </div>
          </div>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 3 — Name + Promise + Keyword
      // ═══════════════════════════════════════════════════════════════════════
      case 'name':
        return (
          <div>
            <Question>Name, promise, keyword</Question>
            <DimLabel>What are you calling it, what does it promise, and what word triggers the DM?</DimLabel>

            {/* Generate suggestions */}
            <div className="mb-6">
              <Btn onClick={generateNameSuggestions} disabled={generating}>
                {generating ? 'Generating...' : 'Generate suggestions'}
              </Btn>

              {nameSuggestions.length > 0 && (
                <div className="space-y-2 mt-4">
                  <GoldLabel>Pick one or type your own</GoldLabel>
                  {nameSuggestions.map((s, i) => (
                    <OptionButton key={i} selected={magnetName === s.name && magnetPromise === s.promise}
                      onClick={() => { setMagnetName(s.name); setMagnetPromise(s.promise); const kw = s.name.split(/\s+/).find(w => w.length > 3 && !/^(the|and|for|your|with|how|get|that|this)$/i.test(w)) || ''; setMagnetKeyword(kw.toLowerCase().replace(/[^a-z0-9]/g, '')) }}
                      sub={s.promise}>
                      {s.name}
                    </OptionButton>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <GoldLabel>Name</GoldLabel>
                <TextInput value={magnetName} onChange={setMagnetName} onBlur={() => debouncedSave({ name: magnetName })} placeholder="e.g. The Content Kickstart Pack" />
              </div>
              <div>
                <GoldLabel>Promise (one line)</GoldLabel>
                <TextInput value={magnetPromise} onChange={setMagnetPromise} onBlur={() => debouncedSave({ promise: magnetPromise })} placeholder="e.g. 7 plug-and-play scripts to fill your DMs this week" />
              </div>
              <div>
                <GoldLabel>Keyword (one word)</GoldLabel>
                <TextInput value={magnetKeyword} onChange={v => setMagnetKeyword(v.toLowerCase().replace(/\s/g, ''))}
                  onBlur={() => {
                    validateKeyword(magnetKeyword)
                    if (activeMagnet?.dm_flow_live && magnetKeyword !== activeMagnet.keyword) {
                      setDmFlowLive(false)
                      debouncedSave({ keyword: magnetKeyword, dm_flow_live: false })
                    } else {
                      debouncedSave({ keyword: magnetKeyword })
                    }
                  }}
                  placeholder="e.g. scripts" />
                {keywordChecking && <p className="text-xs text-zinc-500 mt-1">Checking...</p>}
                {keywordError && <p className="text-xs text-red-400 mt-1">{keywordError}</p>}
                {activeMagnet?.dm_flow_live && magnetKeyword !== activeMagnet.keyword && (
                  <NoteBox gold>Changing the keyword on a live freebie will pause the DM flow. You will need to mark it live again after updating your automation.</NoteBox>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('fit')}>Back</Btn>
              <Btn gold disabled={!magnetName || !magnetPromise || !magnetKeyword || !!keywordError} onClick={() => {
                saveMagnet({ name: magnetName, promise: magnetPromise, keyword: magnetKeyword })
                const inferred = inferType(magnetPromise)
                setRecommendedType(inferred)
                if (!magnetType) setMagnetType(inferred)
                setScreen('format')
              }}>Next</Btn>
            </div>
          </div>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 4 — Format
      // ═══════════════════════════════════════════════════════════════════════
      case 'format': {
        const recommended = recommendedType || inferType(magnetPromise)
        const recommendedInfo = MAGNET_TYPES.find(t => t.id === recommended)
        return (
          <div>
            <Question>Pick the format</Question>
            {recommendedInfo && recommendedInfo.teaching && (
              <NoteBox gold>{recommendedInfo.teaching}</NoteBox>
            )}
            <DimLabel>What shape does this freebie take?</DimLabel>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MAGNET_TYPES.map(t => (
                <OptionButton key={t.id} selected={magnetType === t.id} onClick={() => setMagnetType(t.id)}
                  sub={t.desc} badge={t.id === recommended ? 'Recommended' : undefined}>
                  {t.label}
                </OptionButton>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('name')}>Back</Btn>
              <Btn gold disabled={!magnetType} onClick={() => {
                saveMagnet({ magnet_type: magnetType })
                const pillars = getEnginePillars()
                if (pillars.length > 0 && methodSteps.every(s => !s.text.trim())) {
                  setMethodSteps(pillars.slice(0, 5).map(p => ({ text: p.name + (p.desc ? ': ' + p.desc : '') })))
                }
                setScreen('method')
              }}>Next</Btn>
            </div>
          </div>
        )
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 5 — The Method
      // ═══════════════════════════════════════════════════════════════════════
      case 'method': {
        const hasEdited = stepsEdited.size > 0
        return (
          <div>
            <Question>The method</Question>
            <DimLabel>The content pointing at this freebie solves the problem properly. The freebie goes ONE LEVEL DEEPER — the full template, the exact scripts, the worked example.</DimLabel>

            <GoldLabel>3-5 steps</GoldLabel>

            <div className="space-y-2 mb-4">
              {methodSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-zinc-600 mt-3 min-w-[20px]">{i + 1}</span>
                  <div className="flex-1">
                    <TextInput
                      value={step.text}
                      onChange={v => {
                        const updated = [...methodSteps]
                        updated[i] = { text: v }
                        setMethodSteps(updated)
                        setStepsEdited(prev => new Set(prev).add(i))
                      }}
                      onBlur={() => debouncedSave({ method_steps: methodSteps.filter(s => s.text.trim()).map(s => s.text) })}
                      placeholder={`Step ${i + 1}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {i > 0 && (
                      <button onClick={() => {
                        const updated = [...methodSteps]
                        ;[updated[i - 1], updated[i]] = [updated[i], updated[i - 1]]
                        setMethodSteps(updated)
                      }} className="text-zinc-600 hover:text-white text-xs px-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                    )}
                    {i < methodSteps.length - 1 && (
                      <button onClick={() => {
                        const updated = [...methodSteps]
                        ;[updated[i], updated[i + 1]] = [updated[i + 1], updated[i]]
                        setMethodSteps(updated)
                      }} className="text-zinc-600 hover:text-white text-xs px-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    )}
                    {methodSteps.length > 1 && (
                      <button onClick={() => setMethodSteps(methodSteps.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 text-xs px-1">x</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {methodSteps.length < 5 && (
              <GhostBtn onClick={() => setMethodSteps([...methodSteps, { text: '' }])}>+ Add step</GhostBtn>
            )}

            <div className="flex gap-3 mt-4">
              <Btn onClick={generateMethodSteps} disabled={generating}>
                {generating ? 'Generating...' : 'Not sure — draft for me'}
              </Btn>
            </div>

            {stepsAiDrafted && (
              <NoteBox gold>
                <span className="text-gold font-bold">AI-drafted — edit into your own words.</span> The Build button unlocks once you have edited at least one step.
              </NoteBox>
            )}

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('format')}>Back</Btn>
              <Btn gold disabled={methodSteps.filter(s => s.text.trim()).length === 0 || (stepsAiDrafted && !hasEdited)}
                onClick={() => {
                  saveMagnet({ method_steps: methodSteps.filter(s => s.text.trim()).map(s => s.text) })
                  setScreen('build')
                }}>Next</Btn>
            </div>
          </div>
        )
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 6 — Build
      // ═══════════════════════════════════════════════════════════════════════
      case 'build':
        return (
          <div>
            <Question>Build the freebie</Question>
            <DimLabel>Generate the complete document. Edit it, rewrite it, make it yours.</DimLabel>

            {!builtDoc && !generating && (
              <div className="glass-card p-8 text-center mb-6">
                <p className="text-zinc-400 text-sm mb-4">Ready to build the full {MAGNET_TYPES.find(t => t.id === magnetType)?.label || 'document'}.</p>
                <Btn gold onClick={buildDocument}>Build it</Btn>
              </div>
            )}

            {generating && <WritingScreen lines={BUILD_LINES} />}

            {builtDoc && !generating && (
              <div className="glass-card p-5 mb-4">
                <div className="flex justify-between items-baseline mb-3 gap-3 flex-wrap">
                  <h4 className="text-xs font-bold text-gold uppercase tracking-widest">{magnetName || 'Your freebie'}</h4>
                  <span className="text-xs text-zinc-600 uppercase tracking-widest">{MAGNET_TYPES.find(t => t.id === magnetType)?.label}</span>
                </div>
                <textarea
                  rows={20}
                  value={builtDoc}
                  onChange={e => setBuiltDoc(e.target.value)}
                  onBlur={() => debouncedSave({ built_doc: builtDoc })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm resize-none font-mono"
                />

                {builtDoc.includes('{{') && (
                  <NoteBox gold><span className="text-gold font-bold">The gold gaps are yours.</span> Details that could not be found — nothing was made up. Drop the real thing in and it is done.</NoteBox>
                )}

                <div className="flex gap-2 mt-4 flex-wrap">
                  <Btn gold onClick={() => { saveMagnet({ built_doc: builtDoc }); flash('Saved') }}>Save</Btn>
                  <Btn onClick={() => setRewriteModal(true)}>Rewrite</Btn>
                  <Btn onClick={buildDocument}>Regenerate</Btn>
                </div>
              </div>
            )}

            {/* Preview rendered */}
            {builtDoc && !generating && (
              <div className="glass-card p-5 mb-4">
                <GoldLabel>Preview</GoldLabel>
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                  {renderPiece(builtDoc)}
                </div>
              </div>
            )}

            {/* Rewrite modal */}
            <Modal open={rewriteModal} title="How should it change?" onClose={() => setRewriteModal(false)}>
              <div className="space-y-2">
                {REWRITE_OPTIONS.map((opt, i) => (
                  <OptionButton key={i} onClick={() => rewriteDocument(opt)}>{opt}</OptionButton>
                ))}
              </div>
            </Modal>

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('method')}>Back</Btn>
              <Btn gold disabled={!builtDoc} onClick={() => {
                saveMagnet({ built_doc: builtDoc })
                setScreen('export')
              }}>Next</Btn>
            </div>
          </div>
        )

      // ═══════════════════════════════════════════════════════════════════════
      // SCREEN 7 — Export + Delivery
      // ═══════════════════════════════════════════════════════════════════════
      case 'export':
        return (
          <div>
            <Question>Export + Delivery</Question>
            <DimLabel>Get the freebie to your audience and set up the automation.</DimLabel>

            {/* Export actions */}
            <div className="glass-card p-5 mb-6">
              <GoldLabel>Export</GoldLabel>
              <div className="flex gap-2 flex-wrap mt-3">
                <Btn gold onClick={() => setPrintModalOpen(true)}>Print view</Btn>
                <Btn onClick={copyPlainText}>Copy as text</Btn>
                <Btn onClick={copyAsHTML}>Copy as page</Btn>
              </div>
            </div>

            {/* Delivery */}
            <div className="glass-card p-5 mb-6">
              <GoldLabel>Delivery</GoldLabel>
              <p className="text-xs text-zinc-500 mb-3">Where does this live? Paste the link your audience will receive.</p>
              <TextInput value={deliveryLink} onChange={setDeliveryLink} onBlur={() => debouncedSave({ delivery_link: deliveryLink })} placeholder="https://..." />
            </div>

            {/* DM flow */}
            <div className="glass-card p-5 mb-6">
              <GoldLabel>DM Setup</GoldLabel>
              <p className="text-xs text-zinc-500 mb-3">Generate the automation flow for keyword-triggered delivery.</p>

              <Btn onClick={generateDmFlow} disabled={generatingDmFlow}>
                {generatingDmFlow ? 'Generating...' : 'Get my DM setup'}
              </Btn>

              {generatingDmFlow && (
                <div className="mt-4">
                  <div className="w-10 h-px bg-gold animate-pulse" />
                </div>
              )}

              {dmFlowSpec && (
                <div className="mt-4 space-y-4">
                  <div className="glass-card p-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <GoldLabel>Tool-agnostic flow</GoldLabel>
                      <GhostBtn onClick={() => { navigator.clipboard.writeText(dmFlowSpec); flash('Copied') }}>Copy</GhostBtn>
                    </div>
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap">{dmFlowSpec}</div>
                  </div>

                  {dmFlowManychat && (
                    <div className="glass-card p-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <GoldLabel>ManyChat recipe</GoldLabel>
                        <GhostBtn onClick={() => { navigator.clipboard.writeText(dmFlowManychat); flash('Copied') }}>Copy</GhostBtn>
                      </div>
                      <div className="text-sm text-zinc-300 whitespace-pre-wrap">{dmFlowManychat}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mark as live */}
            <div className="glass-card p-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <GoldLabel>Status</GoldLabel>
                  <p className="text-xs text-zinc-500">
                    {dmFlowLive ? 'This freebie is live — the DM flow is active.' : 'Mark as live when your automation is set up.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !dmFlowLive
                    setDmFlowLive(next)
                    saveMagnet({ dm_flow_live: next })
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${dmFlowLive ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${dmFlowLive ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            {/* Ladder note */}
            <div className="glass-card p-5 mb-6">
              <GoldLabel>Ladder note (optional)</GoldLabel>
              <p className="text-xs text-zinc-500 mb-3">Notes on how this freebie connects to your paid offer.</p>
              <TextArea value={ladderNote} onChange={setLadderNote} onBlur={() => debouncedSave({ ladder_note: ladderNote })} placeholder="e.g. This naturally leads into Module 2 of my programme..." rows={3} />
            </div>

            {/* Now push it */}
            <div className="glass-card p-5 text-center">
              <Btn gold onClick={() => router.push(`/build/content-capture-v2?magnet_id=${activeMagnet?.id}`)}>
                Now push it — write the carousel
              </Btn>
            </div>

            <div className="flex gap-3 mt-6">
              <Btn onClick={() => setScreen('build')}>Back</Btn>
              <Btn onClick={() => {
                saveMagnet({ delivery_link: deliveryLink, dm_flow_live: dmFlowLive, ladder_note: ladderNote })
                setScreen('home')
              }}>Done</Btn>
            </div>

            {/* Print modal */}
            {printModalOpen && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setPrintModalOpen(false)}>
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Print Preview</span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        const printWindow = window.open('', '_blank')
                        printWindow.document.write(buildStyledHTML())
                        printWindow.document.close()
                        printWindow.focus()
                        printWindow.print()
                      }} className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded uppercase tracking-widest hover:bg-zinc-800">
                        Save as PDF
                      </button>
                      <button onClick={() => setPrintModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl px-2">x</button>
                    </div>
                  </div>
                  <div className="p-8" style={{ fontFamily: 'Georgia, serif', color: '#333' }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 8 }}>
                        {clientData?.name || premiumPosition?.brand_star?.name || ''}
                      </p>
                      <div style={{ width: 48, height: 2, background: '#C9A84C', margin: '0 auto' }} />
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#333' }}>
                      {builtDoc?.split(/(\{\{[^}]+\}\})/).map((part, i) =>
                        part.startsWith('{{') ? <span key={i} style={{ color: '#C9A84C', fontWeight: 700 }}>{part}</span> : part
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return <div><p className="text-zinc-500">Unknown screen</p></div>
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <SidebarLayout
        screen={screen}
        magnets={magnets}
        activeMagnet={activeMagnet}
        onNavigate={(target, magnet) => {
          if (magnet) navigateTo(target, magnet)
          else saveAndNavigate(target)
        }}
        router={router}
      >
        {renderScreen()}
      </SidebarLayout>

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 right-6 bg-gold text-zinc-950 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg transition-all duration-300 opacity-0 translate-y-4 z-50">
        Saved
      </div>
    </>
  )
}

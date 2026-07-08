'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const COLLAPSE_TYPES = [
  { id: 'prison', label: 'Prison', icon: '🔒' },
  { id: 'divorce-breakup', label: 'Divorce / Breakup', icon: '💔' },
  { id: 'failed-business', label: 'Failed Business', icon: '📉' },
  { id: 'addiction-health', label: 'Addiction / Health', icon: '🩺' },
  { id: 'loss-grief', label: 'Loss / Grief', icon: '🕯️' },
  { id: 'something-else', label: 'Something Else', icon: '✦' },
]

const STAGES = [
  { num: 1, label: 'The Dump', icon: '📥' },
  { num: 2, label: 'Story Map', icon: '🗺️' },
  { num: 3, label: 'The Gaps', icon: '🔍' },
  { num: 4, label: 'The Script', icon: '🎬' },
]

const BEAT_LABELS = {
  opener: 'Cliffhanger',
  receipt_date: 'Receipt (Date)',
  receipt_proof: 'Receipt (Proof)',
  line: 'The Line',
  zero: 'Zero Point',
  graft: 'Graft',
  ally: 'Ally',
  stakes: 'Stakes',
  wins: 'Wins',
  chain: 'Hidden Chain',
  truth: 'Truth',
}

const FILLER_WORDS = ['hard times', 'struggled', 'rock bottom', 'tough time']

const MAP_STATUS_LINES = [
  'Reading your story...',
  'Mapping it against the beats...',
  'Pulling your words out...',
  'Finding what is missing...',
]

const COMPOSE_STATUS_LINES = [
  'Writing your slides from your words...',
  'Placing your motif...',
  'Cutting at the tension points...',
  'Running the read-aloud test...',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}

function TextArea({ value, onChange, onBlur, placeholder, rows = 3 }) {
  return (
    <textarea
      rows={rows}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm"
    />
  )
}

function TextInput({ value, onChange, onBlur, placeholder }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm"
    />
  )
}

function ProgressIndicator({ current, stages }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {stages.map((s, i) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all w-full justify-center ${
            s.num === current ? 'bg-gold/20 text-gold border border-gold/30' :
            s.num < current ? 'bg-zinc-800 text-gold/60' : 'bg-zinc-900 text-zinc-600'
          }`}>
            <span>{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{s.num}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`h-px w-2 flex-shrink-0 ${s.num < current ? 'bg-gold/40' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function LoadingOverlay({ lines }) {
  const [lineIndex, setLineIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex(prev => (prev + 1) % lines.length)
    }, 2500)
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

function QualityChecklist({ slides, caption, motif }) {
  if (!slides || slides.length === 0) return null

  const receiptSlide = slides.find(s => s.n === 2)
  const hasDate = receiptSlide && /\d/.test(receiptSlide.text || '')
  const slide3 = slides.find(s => s.n === 3)
  const slide10 = slides.find(s => s.n === 10)
  const motifIn3 = slide3 && motif && (slide3.text || '').toLowerCase().includes(motif.toLowerCase())
  const motifIn10 = slide10 && motif && (slide10.text || '').toLowerCase().includes(motif.toLowerCase())
  const allText = slides.map(s => (s.text || '').toLowerCase()).join(' ')
  const hasFiller = FILLER_WORDS.some(w => allText.includes(w))
  const captionSingleLine = !caption || !caption.includes('\n')

  const checks = [
    { pass: hasDate, label: 'Receipt slide contains a date' },
    { pass: motifIn3, label: 'Motif appears in slide 3' },
    { pass: motifIn10, label: 'Motif appears in slide 10' },
    { pass: !hasFiller, label: 'No vague filler words' },
    { pass: captionSingleLine, label: 'Caption is a single line' },
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
      <Label>Quality Checklist</Label>
      <div className="space-y-2">
        {checks.map((c, i) => (
          <div key={i} className={`flex items-center gap-2 text-sm ${c.pass ? 'text-emerald-400' : 'text-red-400'}`}>
            <span>{c.pass ? '✓' : '✗'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-xs mt-3 italic">
        Does at least one slide make you uncomfortable to post? If not, the Receipt is too safe.
      </p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ComebackStoryClient() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentStage, setCurrentStage] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Stage 1
  const [collapseType, setCollapseType] = useState('')
  const [dump, setDump] = useState('')

  // Stage 2
  const [storyMap, setStoryMap] = useState(null)
  const [chosenMotif, setChosenMotif] = useState('')
  const [customMotif, setCustomMotif] = useState('')
  const [mappingStory, setMappingStory] = useState(false)

  // Stage 3
  const [gapAnswers, setGapAnswers] = useState({})

  // Stage 4
  const [slides, setSlides] = useState([])
  const [caption, setCaption] = useState('')
  const [composing, setComposing] = useState(false)
  const [status, setStatus] = useState('draft')

  // Record + save
  const [record, setRecord] = useState(null)
  const [allStories, setAllStories] = useState([])
  const [apiError, setApiError] = useState('')

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
        if (toastRef.current) {
          toastRef.current.style.opacity = '0'
          toastRef.current.style.transform = 'translateY(1rem)'
        }
      }, 2000)
    }
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: client } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
      if (!client) { router.push('/client'); return }
      setClientData(client)

      // Fetch all stories for this client
      const { data: stories } = await supabase
        .from('comeback_stories')
        .select('*')
        .eq('client_id', client.id)
        .order('updated_at', { ascending: false })

      if (stories && stories.length > 0) {
        setAllStories(stories)
        loadStory(stories[0])
      }

      setLoading(false)
    }
    init()
  }, [])

  const loadStory = (story) => {
    setRecord(story)
    setCollapseType(story.collapse_type || '')
    setDump(story.dump || '')
    setStoryMap(story.story_map && Object.keys(story.story_map).length > 0 ? story.story_map : null)
    setChosenMotif(story.chosen_motif || '')
    setGapAnswers(story.gap_answers || {})
    setSlides(story.slides && story.slides.length > 0 ? story.slides : [])
    setCaption(story.caption || '')
    setCurrentStage(story.current_stage || 1)
    setStatus(story.status || 'draft')
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  const saveToSupabase = useCallback(async (fields = {}) => {
    if (!clientData) return
    const payload = {
      client_id: clientData.id,
      collapse_type: collapseType,
      dump,
      story_map: storyMap || {},
      chosen_motif: chosenMotif,
      gap_answers: gapAnswers,
      slides,
      caption,
      current_stage: currentStage,
      status,
      updated_at: new Date().toISOString(),
      ...fields,
    }

    if (record) {
      await supabase.from('comeback_stories').update(payload).eq('id', record.id)
    } else {
      const { data: newRec } = await supabase.from('comeback_stories').insert(payload).select().single()
      if (newRec) setRecord(newRec)
    }
    flash()
  }, [clientData, record, collapseType, dump, storyMap, chosenMotif, gapAnswers, slides, caption, currentStage, status])

  const debouncedSave = useCallback((fields = {}) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveToSupabase(fields), 800)
  }, [saveToSupabase])

  // ── Word count ────────────────────────────────────────────────────────────────

  const wordCount = dump.trim() ? dump.trim().split(/\s+/).length : 0

  // ── Stage 2: Map Story ────────────────────────────────────────────────────────

  const mapStory = async () => {
    setMappingStory(true)
    setApiError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comeback-map',
          data: { collapse_type: collapseType, dump },
        }),
      })
      const result = await res.json()
      if (result.error) { setApiError(result.error); setMappingStory(false); return }

      if (result.found && result.motifs) {
        setStoryMap(result)
        setCurrentStage(2)
        saveToSupabase({ story_map: result, current_stage: 2 })
      } else {
        setApiError('Unexpected response format. Please try again.')
      }
    } catch (err) {
      setApiError('Failed to connect. Please try again.')
    }
    setMappingStory(false)
  }

  // ── Stage 4: Compose Slides ───────────────────────────────────────────────────

  const composeSlides = async (rewrite = false) => {
    setComposing(true)
    setApiError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'comeback-compose',
          data: {
            collapse_type: collapseType,
            dump,
            found: storyMap?.found || {},
            gap_answers: gapAnswers,
            chosen_motif: chosenMotif,
            rewrite,
          },
        }),
      })
      const result = await res.json()
      if (result.error) { setApiError(result.error); setComposing(false); return }

      if (result.slides) {
        setSlides(result.slides)
        setCaption(result.caption || '')
        setCurrentStage(4)
        saveToSupabase({ slides: result.slides, caption: result.caption || '', current_stage: 4 })
      } else {
        setApiError('Unexpected response format. Please try again.')
      }
    } catch (err) {
      setApiError('Failed to connect. Please try again.')
    }
    setComposing(false)
  }

  // ── Stage navigation ──────────────────────────────────────────────────────────

  const goToStage = (stage) => {
    setCurrentStage(stage)
    debouncedSave({ current_stage: stage })
  }

  // ── New story ─────────────────────────────────────────────────────────────────

  const startNewStory = () => {
    setRecord(null)
    setCollapseType('')
    setDump('')
    setStoryMap(null)
    setChosenMotif('')
    setCustomMotif('')
    setGapAnswers({})
    setSlides([])
    setCaption('')
    setCurrentStage(1)
    setStatus('draft')
    setApiError('')
  }

  // ── Copy script ───────────────────────────────────────────────────────────────

  const copyScript = () => {
    const text = slides.map(s => `SLIDE ${s.n} — ${s.beat}\n${s.text}\n[Image: ${s.image}]`).join('\n\n') + `\n\nCAPTION: ${caption}`
    navigator.clipboard.writeText(text)
    flash('Copied!')
  }

  // ── Mark complete ─────────────────────────────────────────────────────────────

  const markComplete = () => {
    setStatus('complete')
    saveToSupabase({ status: 'complete' })
    flash('Story saved!')
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  // Determine if gaps stage should be skipped
  const questions = storyMap?.questions || []
  const hasGaps = questions.length > 0
  const effectiveStage = currentStage === 3 && !hasGaps ? 4 : currentStage

  // Active motif
  const activeMotif = chosenMotif === '__custom__' ? customMotif : chosenMotif

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {mappingStory && <LoadingOverlay lines={MAP_STATUS_LINES} />}
      {composing && <LoadingOverlay lines={COMPOSE_STATUS_LINES} />}

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 right-6 bg-gold text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest z-50 transition-all duration-300 opacity-0 translate-y-4 pointer-events-none">Saved</div>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold text-gold uppercase tracking-widest">The Comeback Story</span>
        <div className="w-6" />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-30 w-72 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform lg:transition-none overflow-y-auto`}>
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white tracking-tight">The Comeback Story</h2>
            <p className="text-xs text-zinc-500 mt-1">Carousel Playbook</p>
          </div>

          {/* Story list */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Label>Your Stories</Label>
            {allStories.map(s => (
              <button
                key={s.id}
                onClick={() => { loadStory(s); setSidebarOpen(false) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${record?.id === s.id ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'}`}
              >
                <div className="font-bold text-xs uppercase tracking-widest">{COLLAPSE_TYPES.find(c => c.id === s.collapse_type)?.label || s.collapse_type}</div>
                <div className="text-xs text-zinc-500 mt-1 truncate">{s.dump?.slice(0, 60) || 'Empty draft'}...</div>
                <div className={`text-xs mt-1 ${s.status === 'complete' ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {s.status === 'complete' ? 'Complete' : `Stage ${s.current_stage}`}
                </div>
              </button>
            ))}
            <button
              onClick={() => { startNewStory(); setSidebarOpen(false) }}
              className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-900 border border-dashed border-zinc-700 text-zinc-500 hover:text-gold hover:border-gold/30 transition"
            >
              + New Story
            </button>
          </div>

          {/* Back to dashboard */}
          <div className="p-4 border-t border-zinc-800">
            <button onClick={() => router.push('/client')} className="w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
              ← Dashboard
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 min-h-screen px-4 py-8 lg:px-12 lg:py-10 max-w-3xl mx-auto w-full">
          <ProgressIndicator current={effectiveStage} stages={STAGES} />

          {apiError && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-6 text-red-300 text-sm flex items-start gap-3">
              <span className="text-red-400 mt-0.5">✗</span>
              <div>
                <p>{apiError}</p>
                <button onClick={() => setApiError('')} className="text-red-400 underline text-xs mt-1">Dismiss</button>
              </div>
            </div>
          )}

          {/* ── STAGE 1: THE DUMP ─────────────────────────────────────────────── */}
          {effectiveStage === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">The Dump</h1>
                <p className="text-zinc-500 text-sm">Pick what happened, then tell the story.</p>
              </div>

              <div>
                <GoldLabel>What type of collapse?</GoldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COLLAPSE_TYPES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setCollapseType(t.id); debouncedSave({ collapse_type: t.id }) }}
                      className={`px-4 py-3 rounded-lg text-sm font-bold transition border ${
                        collapseType === t.id
                          ? 'bg-gold/10 text-gold border-gold/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <span className="mr-2">{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>
              </div>

              {collapseType && (
                <div>
                  <GoldLabel>Your Story</GoldLabel>
                  <p className="text-zinc-500 text-xs mb-3">
                    Tell me your story like you'd tell a mate over coffee. What happened, when it fell apart, what you did about it, where you are now. Ramble. Mess beats polished.
                  </p>
                  <TextArea
                    value={dump}
                    onChange={v => { setDump(v); debouncedSave({ dump: v }) }}
                    placeholder="Include rough dates, what you lost, the moment you decided to change, who helped, what you're proud of now, and what people don't see..."
                    rows={10}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-bold ${wordCount >= 100 ? 'text-emerald-400' : wordCount >= 40 ? 'text-gold' : 'text-zinc-600'}`}>
                      {wordCount} words {wordCount < 40 ? '(minimum 40 to continue)' : wordCount < 100 ? '— good, but 100+ is better' : '— solid'}
                    </span>
                  </div>
                </div>
              )}

              {collapseType && wordCount >= 40 && (
                <button
                  onClick={mapStory}
                  disabled={mappingStory}
                  className="w-full px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50"
                >
                  Map My Story
                </button>
              )}
            </div>
          )}

          {/* ── STAGE 2: THE STORY MAP ────────────────────────────────────────── */}
          {effectiveStage === 2 && storyMap && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">The Story Map</h1>
                <p className="text-zinc-500 text-sm">Here is what we found in your story, mapped against the 10 beats.</p>
              </div>

              {/* Beat map */}
              <div className="space-y-3">
                {Object.entries(BEAT_LABELS).map(([key, label]) => {
                  const found = storyMap.found?.[key]
                  return (
                    <div key={key} className={`rounded-lg border p-4 ${found ? 'bg-zinc-900 border-zinc-800' : 'bg-red-950/20 border-red-800/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-widest ${found ? 'text-gold' : 'text-red-400'}`}>{label}</span>
                        {!found && <span className="text-xs text-red-400 font-bold">MISSING</span>}
                      </div>
                      {found && <p className="text-sm text-zinc-300 italic">"{found}"</p>}
                    </div>
                  )
                })}
              </div>

              {/* Motif selection */}
              <div>
                <GoldLabel>Choose Your Motif</GoldLabel>
                <p className="text-zinc-500 text-xs mb-3">This phrase appears at your decision (slide 3) and returns at the end (slide 10). It is your chorus.</p>
                <div className="space-y-2">
                  {(storyMap.motifs || []).map((m, i) => (
                    <button
                      key={i}
                      onClick={() => { setChosenMotif(m); setCustomMotif(''); debouncedSave({ chosen_motif: m }) }}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition border ${
                        chosenMotif === m
                          ? 'bg-gold/10 text-gold border-gold/30'
                          : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      "{m}"
                    </button>
                  ))}
                  <div className={`rounded-lg border transition ${chosenMotif === '__custom__' ? 'border-gold/30 bg-gold/5' : 'border-zinc-800'}`}>
                    <button
                      onClick={() => { setChosenMotif('__custom__'); debouncedSave({ chosen_motif: '__custom__' }) }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold ${chosenMotif === '__custom__' ? 'text-gold' : 'text-zinc-500'}`}
                    >
                      Write your own motif
                    </button>
                    {chosenMotif === '__custom__' && (
                      <div className="px-4 pb-3">
                        <TextInput
                          value={customMotif}
                          onChange={v => { setCustomMotif(v); debouncedSave({ chosen_motif: '__custom__' }) }}
                          placeholder="3-6 words from your story..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => goToStage(1)}
                  className="px-5 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition"
                >
                  ← Back
                </button>
                {(chosenMotif && (chosenMotif !== '__custom__' || customMotif.trim())) && (
                  <button
                    onClick={() => {
                      const finalMotif = chosenMotif === '__custom__' ? customMotif : chosenMotif
                      setChosenMotif(finalMotif)
                      if (hasGaps) {
                        goToStage(3)
                        saveToSupabase({ chosen_motif: finalMotif, current_stage: 3 })
                      } else {
                        setChosenMotif(finalMotif)
                        saveToSupabase({ chosen_motif: finalMotif, current_stage: 4 })
                        composeSlides()
                      }
                    }}
                    className="flex-1 px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition"
                  >
                    {hasGaps ? 'Fill the Gaps' : 'Write My Script'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STAGE 3: THE GAPS ─────────────────────────────────────────────── */}
          {effectiveStage === 3 && hasGaps && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">The Gaps</h1>
                <p className="text-zinc-500 text-sm">A few things are missing. These questions use your own details to jog your memory.</p>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <GoldLabel>{BEAT_LABELS[q.key] || q.key}</GoldLabel>
                    <p className="text-sm text-zinc-300 mb-3">{q.q}</p>
                    <TextArea
                      value={gapAnswers[q.key] || ''}
                      onChange={v => {
                        const updated = { ...gapAnswers, [q.key]: v }
                        setGapAnswers(updated)
                        debouncedSave({ gap_answers: updated })
                      }}
                      placeholder={q.hint || 'Your answer...'}
                      rows={3}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => goToStage(2)}
                  className="px-5 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={() => composeSlides()}
                  className="flex-1 px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition"
                >
                  Write My Script
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 4: THE SCRIPT ───────────────────────────────────────────── */}
          {effectiveStage === 4 && slides.length > 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">The Script</h1>
                <p className="text-zinc-500 text-sm">Your 10-slide carousel, built from your words. Edit anything directly.</p>
              </div>

              <QualityChecklist slides={slides} caption={caption} motif={activeMotif} />

              {/* Slides */}
              <div className="space-y-4">
                {slides.map((slide, i) => (
                  <div key={slide.n} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                      <span className="text-gold font-bold text-sm">{slide.n}</span>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{slide.beat}</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <TextArea
                        value={slide.text}
                        onChange={v => {
                          const updated = slides.map(s => s.n === slide.n ? { ...s, text: v } : s)
                          setSlides(updated)
                          debouncedSave({ slides: updated })
                        }}
                        rows={3}
                      />
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-zinc-600 uppercase tracking-widest mt-1 shrink-0">Image:</span>
                        <TextInput
                          value={slide.image}
                          onChange={v => {
                            const updated = slides.map(s => s.n === slide.n ? { ...s, image: v } : s)
                            setSlides(updated)
                            debouncedSave({ slides: updated })
                          }}
                          placeholder="Image direction..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Caption */}
              <div>
                <GoldLabel>Anthem Caption</GoldLabel>
                <TextInput
                  value={caption}
                  onChange={v => { setCaption(v); debouncedSave({ caption: v }) }}
                  placeholder="Max 8 words, in your voice..."
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => composeSlides(true)}
                  disabled={composing}
                  className="px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition border border-zinc-700 disabled:opacity-50"
                >
                  Rewrite It
                </button>
                <button
                  onClick={copyScript}
                  className="px-4 py-3 rounded-lg bg-zinc-800 text-zinc-300 font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition border border-zinc-700"
                >
                  Copy Script
                </button>
                <button
                  onClick={markComplete}
                  className="px-4 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition col-span-2"
                >
                  {status === 'complete' ? 'Saved ✓' : 'Save Story'}
                </button>
                <button
                  onClick={startNewStory}
                  className="px-4 py-3 rounded-lg text-zinc-500 text-sm uppercase tracking-widest hover:text-white transition col-span-2"
                >
                  Start a New Story
                </button>
              </div>

              {/* Back to gaps or map */}
              <button
                onClick={() => goToStage(hasGaps ? 3 : 2)}
                className="text-zinc-600 text-xs hover:text-zinc-400 transition"
              >
                ← Back to {hasGaps ? 'Gaps' : 'Story Map'}
              </button>
            </div>
          )}

          {/* Stage 4 but no slides yet (came back to stage 4 with no data) */}
          {effectiveStage === 4 && slides.length === 0 && !composing && (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-4">No slides generated yet.</p>
              <button
                onClick={() => composeSlides()}
                className="px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition"
              >
                Write My Script
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

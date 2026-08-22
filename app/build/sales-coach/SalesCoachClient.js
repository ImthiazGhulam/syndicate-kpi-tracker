'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import LoadingOverlay from '../../components/LoadingOverlay'


// ── Sub-components ──────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}

const ANALYSE_STATUS = [
  'Reading your transcript...',
  'Mapping to the 6-phase structure...',
  'Checking what landed...',
  'Spotting missed opportunities...',
  'Building your coaching notes...',
]


// ── Verdict Badge ───────────────────────────────────────────────────────────

function VerdictBadge({ verdict }) {
  const colours = {
    strong: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    okay: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    weak: 'bg-red-500/10 text-red-400 border-red-500/20',
    missing: 'bg-zinc-700/30 text-zinc-500 border-zinc-700',
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${colours[verdict] || colours.okay}`}>
      {verdict}
    </span>
  )
}


// ── Phase Analysis Card ─────────────────────────────────────────────────────

function PhaseAnalysisCard({ phase }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="glass-card p-5 mb-4">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold text-gold uppercase tracking-widest">{phase.name}</h3>
          <VerdictBadge verdict={phase.verdict} />
        </div>
        <span className="text-zinc-500 text-sm">{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          {/* What worked */}
          {phase.worked && phase.worked.length > 0 && (
            <div>
              <Label>What worked</Label>
              <div className="space-y-2">
                {phase.worked.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What didn't work */}
          {phase.didnt_work && phase.didnt_work.length > 0 && (
            <div>
              <Label>What didn't work</Label>
              <div className="space-y-2">
                {phase.didnt_work.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-red-400 text-xs mt-0.5">✕</span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What to improve */}
          {phase.improve && phase.improve.length > 0 && (
            <div>
              <Label>Improve next time</Label>
              <div className="space-y-2">
                {phase.improve.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gold text-xs mt-0.5">▸</span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript excerpt */}
          {phase.excerpt && (
            <div>
              <Label>Key moment from transcript</Label>
              <div className="text-sm text-zinc-500 italic border-l-2 border-zinc-700 pl-3">{phase.excerpt}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ── Main Component ──────────────────────────────────────────────────────────

export default function SalesCoachPage() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Input
  const [transcript, setTranscript] = useState('')
  const [callOutcome, setCallOutcome] = useState('') // closed, lost, follow-up, no-show
  const [callNotes, setCallNotes] = useState('')

  // Saved scripts for comparison
  const [savedScripts, setSavedScripts] = useState([])
  const [selectedScriptId, setSelectedScriptId] = useState('')

  // Analysis
  const [analysing, setAnalysing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [savedAnalyses, setSavedAnalyses] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // UI
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [screen, setScreen] = useState('input') // input | results
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

      // Load saved scripts for comparison
      const { data: scripts } = await supabase
        .from('sales_scripts')
        .select('id, programme_name, version, created_at')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (scripts && scripts.length > 0) {
        setSavedScripts(scripts)
        setSelectedScriptId(scripts[0].id)
      }

      // Load past analyses
      const { data: analyses } = await supabase
        .from('sales_call_reviews')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (analyses) setSavedAnalyses(analyses)

      setLoading(false)
    }
    init()
  }, [])

  // ── Analyse ───────────────────────────────────────────────────────────────

  async function analyseTranscript() {
    if (!transcript.trim()) return
    setAnalysing(true)

    try {
      // Fetch the selected script for comparison if available
      let scriptData = null
      if (selectedScriptId) {
        const { data: s } = await supabase
          .from('sales_scripts')
          .select('edited_json, generated_json, programme_name')
          .eq('id', selectedScriptId)
          .single()
        if (s) scriptData = s
      }

      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sales-coach-analyse',
          data: {
            transcript,
            callOutcome,
            callNotes,
            scriptJson: scriptData?.edited_json || scriptData?.generated_json || null,
            programmeName: scriptData?.programme_name || '',
            firstName: clientData?.name?.split(' ')[0] || '',
            niche: clientData?.industry || '',
          },
        }),
      })
      const result = await res.json()

      if (result.error) {
        alert('Analysis failed: ' + result.error)
        setAnalysing(false)
        return
      }

      if (result.analysis) {
        setAnalysis(result.analysis)
        setScreen('results')

        // Save to database
        const { data: saved } = await supabase
          .from('sales_call_reviews')
          .insert({
            client_id: clientData.id,
            call_outcome: callOutcome,
            call_notes: callNotes,
            analysis_json: result.analysis,
            script_id: selectedScriptId || null,
          })
          .select()
          .single()

        if (saved) {
          setSavedAnalyses(prev => [saved, ...prev])
          showToast('Analysis saved')
        }
      } else {
        alert('No analysis returned. Please try again.')
      }
    } catch (err) {
      alert('Analysis failed: ' + (err.message || 'Unknown error'))
    }

    setAnalysing(false)
  }

  // ── Load past analysis ────────────────────────────────────────────────────

  function loadAnalysis(saved) {
    setAnalysis(saved.analysis_json)
    setCallOutcome(saved.call_outcome || '')
    setCallNotes(saved.call_notes || '')
    setScreen('results')
    setShowHistory(false)
    showToast('Loaded review')
  }

  // ── Copy analysis ─────────────────────────────────────────────────────────

  function copyAnalysis() {
    if (!analysis) return
    let text = ''

    // Overall
    text += `OVERALL SCORE: ${analysis.overall_score}/10\n`
    text += `VERDICT: ${analysis.overall_verdict}\n\n`
    text += `SUMMARY:\n${analysis.summary}\n\n`

    // Phases
    for (const phase of (analysis.phases || [])) {
      text += `${phase.name.toUpperCase()} [${phase.verdict}]\n`
      if (phase.worked?.length) text += `  Worked: ${phase.worked.join('; ')}\n`
      if (phase.didnt_work?.length) text += `  Didn't work: ${phase.didnt_work.join('; ')}\n`
      if (phase.improve?.length) text += `  Improve: ${phase.improve.join('; ')}\n`
      text += '\n'
    }

    // Top 3
    if (analysis.top_3_fixes?.length) {
      text += 'TOP 3 FIXES FOR NEXT CALL:\n'
      analysis.top_3_fixes.forEach((f, i) => { text += `${i + 1}. ${f}\n` })
    }

    if (navigator.clipboard) navigator.clipboard.writeText(text.trim())
    showToast('Copied to clipboard')
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
      {analysing && <LoadingOverlay lines={ANALYSE_STATUS} />}

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-gold text-zinc-950 text-xs font-bold uppercase tracking-widest opacity-0 translate-y-2 transition-all pointer-events-none" />

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <span className="text-xs font-bold text-gold uppercase tracking-widest">Sales Coach™</span>
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
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Sales Coach™</span>
              <p className="text-zinc-500 text-xs mt-1">Upload call transcripts for AI coaching</p>
            </div>

            {savedAnalyses.length > 0 && (
              <div className="mt-4 px-4">
                <button onClick={() => setShowHistory(!showHistory)} className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition">
                  {showHistory ? '▾' : '▸'} Past Reviews ({savedAnalyses.length})
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-1">
                    {savedAnalyses.map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadAnalysis(s)}
                        className="w-full text-left px-3 py-2 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      >
                        <span className={
                          s.call_outcome === 'closed' ? 'text-emerald-400' :
                          s.call_outcome === 'lost' ? 'text-red-400' :
                          s.call_outcome === 'follow-up' ? 'text-amber-400' : 'text-zinc-500'
                        }>●</span>{' '}
                        {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {s.analysis_json?.overall_score ? ` — ${s.analysis_json.overall_score}/10` : ''}
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

          {/* ── INPUT SCREEN ────────────────────────────────────────── */}

          {screen === 'input' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold font-display tracking-tight mb-1">Sales Coach™</h1>
                <p className="text-zinc-500 text-sm">Paste a sales call transcript and get AI coaching on what worked, what didn't, and what to fix next time.</p>
              </div>

              {/* Transcript */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Call Transcript</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Paste the full transcript from your sales call. Include both sides of the conversation.</p>
                <textarea
                  rows={16}
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder={"You: Hey, thanks for jumping on. So the way this works is...\nThem: Yeah, sounds good.\nYou: Cool. So tell me a bit about what you're doing right now..."}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm disabled:opacity-50"
                />
                {transcript && (
                  <p className="text-zinc-600 text-xs mt-2">{transcript.split(/\s+/).filter(Boolean).length} words</p>
                )}
              </div>

              {/* Call outcome */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Call Outcome</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">What happened at the end?</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'closed', label: 'Closed', colour: 'emerald' },
                    { value: 'lost', label: 'Lost', colour: 'red' },
                    { value: 'follow-up', label: 'Follow-up booked', colour: 'amber' },
                    { value: 'no-show', label: 'No-show', colour: 'zinc' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCallOutcome(callOutcome === opt.value ? '' : opt.value)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition border ${
                        callOutcome === opt.value
                          ? `bg-${opt.colour}-500/10 text-${opt.colour}-400 border-${opt.colour}-500/30`
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="glass-card p-6 mb-6">
                <GoldLabel>Your Notes (optional)</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Anything you noticed during or after the call. The AI will factor this in.</p>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="e.g. They seemed keen but went quiet when I mentioned the price. I think I rushed Phase 5."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm"
                />
              </div>

              {/* Script comparison */}
              {savedScripts.length > 0 && (
                <div className="glass-card p-6 mb-6">
                  <GoldLabel>Compare Against Script</GoldLabel>
                  <p className="text-zinc-500 text-xs mb-4">Select one of your saved scripts so the AI can compare what you said vs what you planned.</p>
                  <select
                    value={selectedScriptId}
                    onChange={e => setSelectedScriptId(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm"
                  >
                    <option value="">No script (analyse transcript only)</option>
                    {savedScripts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.programme_name || 'Untitled'} v{s.version} — {new Date(s.created_at).toLocaleDateString('en-GB')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Analyse button */}
              <button
                onClick={analyseTranscript}
                disabled={!transcript.trim() || analysing}
                className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition mb-8 ${
                  transcript.trim() && !analysing
                    ? 'bg-gold hover:bg-gold-light text-zinc-950'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {analysing ? 'Analysing...' : 'Analyse My Call'}
              </button>

              <div className="pb-8">
                <button onClick={() => router.push('/client')} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                  ← Dashboard
                </button>
              </div>
            </>
          )}

          {/* ── RESULTS SCREEN ──────────────────────────────────────── */}

          {screen === 'results' && analysis && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight mb-1">Call Review</h1>
                    <p className="text-zinc-500 text-sm">
                      {callOutcome && (
                        <span className={
                          callOutcome === 'closed' ? 'text-emerald-400' :
                          callOutcome === 'lost' ? 'text-red-400' :
                          callOutcome === 'follow-up' ? 'text-amber-400' : 'text-zinc-500'
                        }>
                          {callOutcome === 'closed' ? 'Closed' : callOutcome === 'lost' ? 'Lost' : callOutcome === 'follow-up' ? 'Follow-up' : 'No-show'}
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => { setScreen('input'); setAnalysis(null); setTranscript(''); setCallOutcome(''); setCallNotes('') }} className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                    ← New Review
                  </button>
                </div>
              </div>

              {/* Overall score */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <GoldLabel>Overall Score</GoldLabel>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold font-display text-gold">{analysis.overall_score}</span>
                    <span className="text-zinc-500 text-sm">/10</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full h-2 bg-zinc-800 rounded-full mb-4">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      analysis.overall_score >= 8 ? 'bg-emerald-400' :
                      analysis.overall_score >= 5 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${(analysis.overall_score / 10) * 100}%` }}
                  />
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Phase-by-phase */}
              <div className="mb-6">
                <GoldLabel>Phase-by-Phase Breakdown</GoldLabel>
                <p className="text-zinc-500 text-xs mb-4">Each phase scored against the 6-phase script structure.</p>

                {(analysis.phases || []).map((phase, i) => (
                  <PhaseAnalysisCard key={i} phase={phase} />
                ))}
              </div>

              {/* Top 3 fixes */}
              {analysis.top_3_fixes && analysis.top_3_fixes.length > 0 && (
                <div className="glass-card p-6 mb-6">
                  <GoldLabel>Top 3 Fixes for Next Call</GoldLabel>
                  <div className="space-y-3 mt-3">
                    {analysis.top_3_fixes.map((fix, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-gold font-bold text-sm mt-0.5">{i + 1}.</span>
                        <span className="text-sm text-zinc-300">{fix}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Script comparison insight */}
              {analysis.script_comparison && (
                <div className="glass-card p-6 mb-6">
                  <GoldLabel>Script vs Reality</GoldLabel>
                  <p className="text-sm text-zinc-300 leading-relaxed">{analysis.script_comparison}</p>
                </div>
              )}

              {/* Exact lines */}
              {analysis.best_line && (
                <div className="glass-card p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Best line on the call</Label>
                      <div className="text-sm text-emerald-400 italic border-l-2 border-emerald-500/30 pl-3">"{analysis.best_line}"</div>
                    </div>
                    {analysis.worst_line && (
                      <div>
                        <Label>Line that cost you</Label>
                        <div className="text-sm text-red-400 italic border-l-2 border-red-500/30 pl-3">"{analysis.worst_line}"</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Export */}
              <div className="glass-card p-6 mb-6">
                <div className="flex gap-2 flex-wrap">
                  <button onClick={copyAnalysis} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-gold hover:bg-gold-light text-zinc-950 transition">Copy Review</button>
                  <button onClick={() => { setScreen('input'); setAnalysis(null); setTranscript(''); setCallOutcome(''); setCallNotes('') }} className="px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-widest bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Review Another Call</button>
                </div>
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

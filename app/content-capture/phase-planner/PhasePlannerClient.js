'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import ExpertOSMark from '../../components/ExpertOSMark'

// ── Constants ──────────────────────────────────────────────────────────────────

const WEEK_TYPES = [
  { id: 'reach', label: 'Reach', icon: '📡', color: 'blue', desc: 'Grow your audience — shareable, bold, wide-net content' },
  { id: 'trust', label: 'Trust', icon: '🤝', color: 'green', desc: 'Build authority — value, storytelling, behind-the-scenes' },
  { id: 'sales', label: 'Sales', icon: '💰', color: 'amber', desc: 'Drive conversion — offers, social proof, urgency, CTAs' },
]

const DURATION_OPTIONS = [4, 6, 8, 12]

const WEEK_TYPE_COLORS = {
  reach: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', dot: 'bg-blue-500' },
  trust: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  sales: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}

function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}

function WeekCard({ week, type, onTypeChange, startDate }) {
  const colors = WEEK_TYPE_COLORS[type] || WEEK_TYPE_COLORS.trust
  const weekType = WEEK_TYPES.find(w => w.id === type)
  const weekStart = new Date(startDate)
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const formatDate = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="text-white text-sm font-bold">Week {week}</span>
        </div>
        <span className="text-zinc-500 text-xs">{formatDate(weekStart)} — {formatDate(weekEnd)}</span>
      </div>
      <div className="flex gap-2">
        {WEEK_TYPES.map(wt => {
          const isActive = type === wt.id
          const wtColors = WEEK_TYPE_COLORS[wt.id]
          return (
            <button
              key={wt.id}
              onClick={() => onTypeChange(week, wt.id)}
              className={`flex-1 py-2 px-2 rounded text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? `${wtColors.bg} ${wtColors.border} ${wtColors.text} border`
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
              }`}
            >
              {wt.icon} {wt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PhaseTimeline({ weeks, startDate }) {
  return (
    <div className="flex gap-1 mb-6">
      {weeks.map((w, i) => {
        const colors = WEEK_TYPE_COLORS[w.type]
        return (
          <div key={i} className="flex-1 group relative">
            <div className={`h-3 rounded-full ${colors.dot} transition-all`} />
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap z-10 pointer-events-none transition">
              W{w.week}: {WEEK_TYPES.find(wt => wt.id === w.type)?.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PhaseSummary({ weeks }) {
  const counts = { reach: 0, trust: 0, sales: 0 }
  weeks.forEach(w => { if (counts[w.type] !== undefined) counts[w.type]++ })
  const total = weeks.length

  return (
    <div className="grid grid-cols-3 gap-3">
      {WEEK_TYPES.map(wt => {
        const count = counts[wt.id]
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const colors = WEEK_TYPE_COLORS[wt.id]
        return (
          <div key={wt.id} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{wt.icon}</span>
              <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{wt.label}</span>
            </div>
            <p className="text-white text-lg font-bold">{count} <span className="text-zinc-500 text-xs">/ {total} weeks</span></p>
            <p className={`text-xs ${colors.text}`}>{pct}%</p>
          </div>
        )
      })}
    </div>
  )
}

function LoadingOverlay({ message }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-5">
          <ExpertOSMark size={40} glow className="os-mark-pulse" />
        </div>
        <p className="text-gold text-sm font-bold uppercase tracking-widest animate-pulse">{message}</p>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PhasePlannerClient() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  // Business context for AI suggestions
  const [brandData, setBrandData] = useState(null)
  const [offerData, setOfferData] = useState(null)
  const [distinctionData, setDistinctionData] = useState(null)

  // Phase data
  const [phases, setPhases] = useState([])
  const [activePhase, setActivePhase] = useState(null)
  const [view, setView] = useState('list') // 'list' | 'create' | 'edit'

  // Create/Edit form
  const [phaseName, setPhaseName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState(6)
  const [weeks, setWeeks] = useState([])
  const [editingId, setEditingId] = useState(null)

  // AI suggestion
  const [aiSuggestion, setAiSuggestion] = useState(null)

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

      // Fetch business context for AI suggestions
      const [ppRes, opRes, deRes] = await Promise.all([
        supabase.from('premium_position').select('brand_star, hero, remarkable').eq('client_id', client.id).maybeSingle(),
        supabase.from('offer_playbooks').select('icp, bang_bang, dip, path_planner').eq('client_id', client.id).maybeSingle(),
        supabase.from('distinction_engine').select('engine_data').eq('client_id', client.id).maybeSingle(),
      ])
      if (ppRes.data) setBrandData(ppRes.data)
      if (opRes.data) setOfferData(opRes.data)
      if (deRes.data) setDistinctionData(deRes.data?.engine_data || deRes.data)

      // Fetch existing phases
      const { data: existingPhases } = await supabase
        .from('content_phases')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (existingPhases) {
        setPhases(existingPhases)
        const active = existingPhases.find(p => p.is_active)
        if (active) setActivePhase(active)
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Business Context Builder ──────────────────────────────────────────────────

  const getBusinessContext = () => {
    const parts = []

    if (brandData?.brand_star) {
      const s = brandData.brand_star
      if (s.what_you_do) parts.push(`What they do: ${s.what_you_do}`)
      if (s.sector) parts.push(`Sector: ${s.sector}`)
      if (s.client_type) parts.push(`Serves: ${s.client_type}`)
    }

    if (brandData?.hero) {
      const h = brandData.hero
      if (h.gift) parts.push(`Their gift/expertise: ${h.gift}`)
    }

    if (brandData?.remarkable) {
      const r = brandData.remarkable
      if (r.mechanism) parts.push(`Unique mechanism: ${r.mechanism}`)
      if (r.differentiator) parts.push(`Key differentiator: ${r.differentiator}`)
    }

    if (distinctionData) {
      const d = distinctionData
      if (d.engine_name) parts.push(`Branded system: ${d.engine_name}`)
      if (d.promise) parts.push(`Distinction promise: ${d.promise}`)
    }

    if (offerData?.icp) {
      const i = offerData.icp
      if (i.specific_description) parts.push(`Ideal client: ${i.specific_description}`)
      if (i.dream_outcome) parts.push(`Client dream outcome: ${i.dream_outcome}`)
    }

    if (offerData?.bang_bang) {
      const b = offerData.bang_bang
      if (b.name) parts.push(`Main offer: ${b.name}`)
      if (b.promise) parts.push(`Offer promise: ${b.promise}`)
      if (b.delivery_model?.length) parts.push(`Delivery: ${b.delivery_model.join(', ')}`)
    }

    if (offerData?.dip) {
      const d = offerData.dip
      if (d.name) parts.push(`Entry offer: ${d.name}`)
    }

    if (offerData?.path_planner) {
      const p = offerData.path_planner
      if (p.total_duration) parts.push(`Programme duration: ${p.total_duration}`)
    }

    return parts.length > 0 ? parts.join('\n') : ''
  }

  // ── Determine business stage ──────────────────────────────────────────────────

  const getBusinessStage = () => {
    const hasOffer = offerData?.bang_bang?.name
    const hasBrand = brandData?.brand_star?.what_you_do
    const hasDistinction = distinctionData?.engine_name
    const hasEntryOffer = offerData?.dip?.name

    if (!hasBrand && !hasOffer) return 'early'
    if (hasBrand && !hasOffer) return 'building'
    if (hasOffer && !hasDistinction && !hasEntryOffer) return 'launching'
    if (hasOffer && hasDistinction) return 'scaling'
    return 'building'
  }

  // ── AI Phase Suggestion ───────────────────────────────────────────────────────

  const suggestPhase = async () => {
    setSuggesting(true)
    setAiSuggestion(null)
    try {
      const businessContext = getBusinessContext()
      const stage = getBusinessStage()

      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'phase-suggestion',
          data: {
            business_context: businessContext,
            business_stage: stage,
            requested_duration: duration,
          },
        }),
      })
      const result = await res.json()
      if (result.plan) {
        try {
          const parsed = JSON.parse(result.plan)
          setAiSuggestion(parsed)
          if (parsed.name) setPhaseName(parsed.name)
          if (parsed.duration) setDuration(parsed.duration)
          if (parsed.weeks) {
            setWeeks(parsed.weeks.map((type, i) => ({ week: i + 1, type })))
          }
        } catch {
          // If JSON parsing fails, just show as text
          setAiSuggestion({ explanation: result.plan })
        }
      }
    } catch (err) {
      console.error('Phase suggestion error:', err)
    }
    setSuggesting(false)
  }

  // ── Week Management ───────────────────────────────────────────────────────────

  const initWeeks = (count) => {
    setWeeks(Array.from({ length: count }, (_, i) => ({ week: i + 1, type: 'trust' })))
  }

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration)
    initWeeks(newDuration)
    setAiSuggestion(null)
  }

  const handleWeekTypeChange = (weekNum, newType) => {
    setWeeks(prev => prev.map(w => w.week === weekNum ? { ...w, type: newType } : w))
  }

  // ── Save Phase ────────────────────────────────────────────────────────────────

  const savePhase = async () => {
    if (!phaseName || !startDate || weeks.length === 0) return
    setSaving(true)

    const payload = {
      client_id: clientData.id,
      name: phaseName,
      start_date: startDate,
      weeks,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    // Deactivate other phases first
    await supabase
      .from('content_phases')
      .update({ is_active: false })
      .eq('client_id', clientData.id)

    if (editingId) {
      await supabase.from('content_phases').update(payload).eq('id', editingId)
    } else {
      const { data: newPhase } = await supabase.from('content_phases').insert(payload).select().single()
      if (newPhase) {
        setPhases(prev => [newPhase, ...prev])
        setActivePhase(newPhase)
      }
    }

    // Refresh phases
    const { data: refreshed } = await supabase
      .from('content_phases')
      .select('*')
      .eq('client_id', clientData.id)
      .order('created_at', { ascending: false })

    if (refreshed) {
      setPhases(refreshed)
      setActivePhase(refreshed.find(p => p.is_active) || null)
    }

    setSaving(false)
    flash('Phase saved')
    setView('list')
    resetForm()
  }

  const resetForm = () => {
    setPhaseName('')
    setStartDate('')
    setDuration(6)
    setWeeks([])
    setEditingId(null)
    setAiSuggestion(null)
  }

  const editPhase = (phase) => {
    setPhaseName(phase.name)
    setStartDate(phase.start_date)
    setDuration(phase.weeks.length)
    setWeeks(phase.weeks)
    setEditingId(phase.id)
    setView('edit')
  }

  const deletePhase = async (id) => {
    await supabase.from('content_phases').delete().eq('id', id)
    setPhases(prev => prev.filter(p => p.id !== id))
    if (activePhase?.id === id) setActivePhase(null)
    flash('Phase deleted')
  }

  const activatePhase = async (id) => {
    await supabase
      .from('content_phases')
      .update({ is_active: false })
      .eq('client_id', clientData.id)

    await supabase
      .from('content_phases')
      .update({ is_active: true })
      .eq('id', id)

    setPhases(prev => prev.map(p => ({ ...p, is_active: p.id === id })))
    setActivePhase(phases.find(p => p.id === id))
    flash('Phase activated')
  }

  // ── Get current week info ─────────────────────────────────────────────────────

  const getCurrentWeekInfo = (phase) => {
    if (!phase) return null
    const today = new Date()
    const start = new Date(phase.start_date)
    const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    const currentWeekNum = Math.floor(diffDays / 7) + 1

    if (currentWeekNum < 1 || currentWeekNum > phase.weeks.length) return null
    const weekData = phase.weeks.find(w => w.week === currentWeekNum)
    return weekData ? { ...weekData, weekNum: currentWeekNum, total: phase.weeks.length } : null
  }

  // ── Start create view ─────────────────────────────────────────────────────────

  const startCreate = () => {
    resetForm()
    const today = new Date()
    // Default to next Monday
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    setStartDate(nextMonday.toISOString().split('T')[0])
    initWeeks(6)
    setView('create')
  }

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Render: List View ─────────────────────────────────────────────────────────

  const renderListView = () => {
    const currentWeek = activePhase ? getCurrentWeekInfo(activePhase) : null

    return (
      <div className="space-y-8">
        {/* Active Phase Banner */}
        {activePhase && currentWeek && (
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">Active Phase</span>
              <span className="text-zinc-500 text-xs">Week {currentWeek.weekNum} of {currentWeek.total}</span>
            </div>
            <div className="p-5">
              <h3 className="text-white font-bold text-lg mb-3">{activePhase.name}</h3>
              <PhaseTimeline weeks={activePhase.weeks} startDate={activePhase.start_date} />
              <div className="mt-4">
                {(() => {
                  const colors = WEEK_TYPE_COLORS[currentWeek.type]
                  const weekType = WEEK_TYPES.find(w => w.id === currentWeek.type)
                  return (
                    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{weekType?.icon}</span>
                        <span className={`text-sm font-bold uppercase tracking-widest ${colors.text}`}>This Week: {weekType?.label}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">{weekType?.desc}</p>
                    </div>
                  )
                })()}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => router.push('/content-capture')}
                  className="flex-1 py-3 rounded font-bold text-sm uppercase tracking-widest bg-gold text-black hover:bg-gold/90 transition"
                >
                  Create Content for This Week
                </button>
                <button
                  onClick={() => editPhase(activePhase)}
                  className="px-4 py-3 rounded text-sm font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No active phase */}
        {!activePhase && (
          <div className="glass-card p-8 text-center">
            <p className="text-zinc-400 text-sm mb-4">No active phase. Create a content phase to plan your strategy across multiple weeks.</p>
          </div>
        )}

        {/* Create button */}
        <button
          onClick={startCreate}
          className="w-full py-4 rounded font-bold text-sm uppercase tracking-widest bg-gold text-black hover:bg-gold/90 transition"
        >
          + New Phase
        </button>

        {/* Past phases */}
        {phases.filter(p => !p.is_active).length > 0 && (
          <div>
            <Label>Previous Phases</Label>
            <div className="space-y-3">
              {phases.filter(p => !p.is_active).map(phase => (
                <div key={phase.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm">{phase.name}</h4>
                    <span className="text-zinc-600 text-xs">{phase.weeks.length} weeks</span>
                  </div>
                  <PhaseTimeline weeks={phase.weeks} startDate={phase.start_date} />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => activatePhase(phase.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-gold/10 border border-gold/30 rounded text-gold hover:bg-gold/20 transition"
                    >
                      Reactivate
                    </button>
                    <button
                      onClick={() => editPhase(phase)}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePhase(phase.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 border border-zinc-700 rounded text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Render: Create/Edit View ──────────────────────────────────────────────────

  const renderCreateView = () => {
    const isEdit = view === 'edit'

    return (
      <div className="space-y-8">
        {/* Phase Name */}
        <div>
          <GoldLabel>Phase Name</GoldLabel>
          <input
            type="text"
            value={phaseName}
            onChange={e => setPhaseName(e.target.value)}
            placeholder="e.g. Q3 Launch Push, Summer Nurture, Authority Build..."
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm"
          />
        </div>

        {/* Start Date */}
        <div>
          <GoldLabel>Start Date</GoldLabel>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm"
          />
        </div>

        {/* Duration */}
        <div>
          <GoldLabel>Phase Duration</GoldLabel>
          <div className="flex gap-3">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={`flex-1 py-3 rounded text-sm font-bold uppercase tracking-widest transition border ${
                  duration === d
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {d} weeks
              </button>
            ))}
          </div>
        </div>

        {/* AI Suggestion Button */}
        <div className="border-t border-zinc-800 pt-6">
          <button
            onClick={suggestPhase}
            disabled={suggesting}
            className="w-full py-4 rounded font-bold text-sm uppercase tracking-widest border border-gold/30 text-gold hover:bg-gold/10 transition disabled:opacity-50"
          >
            {suggesting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                Analysing your business and suggesting a phase...
              </span>
            ) : '⚡ Suggest Phase Based on My Business Stage'}
          </button>

          {aiSuggestion?.explanation && (
            <div className="mt-4 p-4 bg-zinc-800/50 border border-gold/20 rounded-lg">
              <Label>AI Recommendation</Label>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{aiSuggestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Week Type Legend */}
        {weeks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <GoldLabel>Week Types</GoldLabel>
              <span className="text-zinc-600 text-xs">Tap each week to change its type</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {WEEK_TYPES.map(wt => {
                const colors = WEEK_TYPE_COLORS[wt.id]
                return (
                  <div key={wt.id} className={`p-3 rounded border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{wt.icon}</span>
                      <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>{wt.label}</span>
                    </div>
                    <p className="text-zinc-500 text-xs leading-snug">{wt.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Visual Timeline */}
        {weeks.length > 0 && (
          <>
            <PhaseTimeline weeks={weeks} startDate={startDate || new Date().toISOString().split('T')[0]} />
            <PhaseSummary weeks={weeks} />
          </>
        )}

        {/* Week Cards */}
        {weeks.length > 0 && (
          <div>
            <GoldLabel>Plan Each Week</GoldLabel>
            <div className="space-y-3">
              {weeks.map(w => (
                <WeekCard
                  key={w.week}
                  week={w.week}
                  type={w.type}
                  onTypeChange={handleWeekTypeChange}
                  startDate={startDate || new Date().toISOString().split('T')[0]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={() => { setView('list'); resetForm() }}
            className="flex-1 py-3 rounded text-sm font-semibold text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={savePhase}
            disabled={!phaseName || !startDate || weeks.length === 0 || saving}
            className={`flex-1 py-3 rounded font-bold text-sm uppercase tracking-widest transition ${
              phaseName && startDate && weeks.length > 0 && !saving
                ? 'bg-gold text-black hover:bg-gold/90'
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Phase' : 'Save Phase'}
          </button>
        </div>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {suggesting && <LoadingOverlay message="Analysing your business stage..." />}

      <main className="flex-1 bg-grid">
        <div className="max-w-2xl mx-auto p-6 lg:p-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/content-capture')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm mb-4"
            >
              ← Back to Content Capture
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h1 className="text-2xl font-bold font-display text-white">Phase Planner</h1>
                <p className="text-zinc-500 text-sm">Plan your content strategy across multiple weeks</p>
              </div>
            </div>
          </div>

          {view === 'list' ? renderListView() : renderCreateView()}
        </div>
      </main>

      {/* Toast */}
      <div ref={toastRef} className="fixed bottom-6 right-6 bg-gold text-black px-4 py-2 rounded-lg font-bold text-sm opacity-0 translate-y-4 transition-all pointer-events-none z-50">
        Saved
      </div>
    </div>
  )
}

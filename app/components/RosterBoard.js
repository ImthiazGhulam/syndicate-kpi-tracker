'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  ROSTER_TRADEMARK, ROSTER_COLUMNS, TERMINAL_STATUSES, TOUCHABLE_STATUSES,
  HEALTH_COLORS, HEALTH_TEXT, DEFAULT_CADENCE_DAYS, DEFAULT_RED_DAYS,
  ONBOARDING_PROMPTS, CHURN_REASONS, RESIGN_STAGES, MAX_SNOOZES,
  RESIGN_SCRIPT_STAGES, DRAFT_MAX_WORDS,
} from '../../lib/roster-constants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

// ── Phone validation ────────────────────────────────────────────────────────
function isValidE164(phone) {
  return /^\+[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''))
}
function cleanPhone(phone) {
  return phone.replace(/[\s\-()]/g, '')
}

export default function RosterBoard({ clientData, authUser }) {
  const coachId = authUser?.id  // auth.users UUID — matches RLS auth.uid()
  const coachClientId = clientData?.id  // clients table UUID — for voice profile lookups

  // ── State ─────────────────────────────────────────────────────────────────
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDrawer, setActiveDrawer] = useState(null) // roster_client object
  const [drawerTab, setDrawerTab] = useState('life-notes')
  const [lifeNotes, setLifeNotes] = useState([])
  const [touches, setTouches] = useState([])
  const [wins, setWins] = useState([])
  const [resignEvents, setResignEvents] = useState([])

  // Onboarding form
  const [showOnboarding, setShowOnboarding] = useState(null) // roster client id
  const [onboardingValues, setOnboardingValues] = useState({})
  const [phoneError, setPhoneError] = useState('')

  // Add card
  const [addingCol, setAddingCol] = useState(null)
  const [newName, setNewName] = useState('')

  // Draft
  const [draft, setDraft] = useState(null) // { message, life_note_id }
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftEdited, setDraftEdited] = useState('')
  const [excludeNoteId, setExcludeNoteId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)
  const toastRef = useRef(null)
  const showToast = (msg) => {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(null), 2000)
  }

  // Drag
  const [dragClient, setDragClient] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const [animatingId, setAnimatingId] = useState(null)

  // Churn modal
  const [churnModal, setChurnModal] = useState(null) // { clientId, eventId }
  const [churnReason, setChurnReason] = useState('')
  const [churnReasonText, setChurnReasonText] = useState('')

  // Resign modal
  const [resignModal, setResignModal] = useState(null) // { clientId, eventId }
  const [newTermEnd, setNewTermEnd] = useState('')

  // Win stack
  const [winStackHtml, setWinStackHtml] = useState(null)

  // Resign script
  const [resignScript, setResignScript] = useState(null)
  const [scriptLoading, setScriptLoading] = useState(false)

  // New note / win
  const [newNote, setNewNote] = useState('')
  const [newWin, setNewWin] = useState('')

  // Mobile stage
  const [mobileStage, setMobileStage] = useState('active')

  // ── Load roster clients ───────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    if (!coachId) return
    const { data } = await supabase
      .from('roster_clients')
      .select('*')
      .eq('coach_id', coachId)
      .order('updated_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }, [coachId])

  useEffect(() => { loadClients() }, [loadClients])

  // ── Load drawer data ──────────────────────────────────────────────────────
  const openDrawer = async (client) => {
    setActiveDrawer(client)
    setDrawerTab('life-notes')
    setDraft(null)
    setDraftEdited('')
    setExcludeNoteId(null)
    setWinStackHtml(null)
    setResignScript(null)
    const [notesRes, touchesRes, winsRes, eventsRes] = await Promise.all([
      supabase.from('life_notes').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
      supabase.from('touches').select('*').eq('client_id', client.id).order('sent_at', { ascending: false }).limit(20),
      supabase.from('wins').select('*').eq('client_id', client.id).order('win_date', { ascending: false }),
      supabase.from('resign_events').select('*').eq('client_id', client.id).order('due_at', { ascending: true }),
    ])
    setLifeNotes(notesRes.data || [])
    setTouches(touchesRes.data || [])
    setWins(winsRes.data || [])
    setResignEvents(eventsRes.data || [])
  }

  const closeDrawer = () => {
    setActiveDrawer(null)
    setDraft(null)
  }

  // ── Add client ────────────────────────────────────────────────────────────
  const addClient = async (status) => {
    if (!newName.trim() || !coachId) return
    const { data } = await supabase
      .from('roster_clients')
      .insert({ coach_id: coachId, name: newName.trim(), status })
      .select()
      .single()
    if (data) {
      setClients(prev => [data, ...prev])
      setNewName('')
      setAddingCol(null)
      showToast('Client added')
      if (status === 'onboarding') {
        setShowOnboarding(data.id)
        setOnboardingValues({})
      }
    }
  }

  // ── Move client ───────────────────────────────────────────────────────────
  const moveClient = async (clientId, newStatus) => {
    // Terminal statuses need special handling
    if (newStatus === 'churned') return
    if (newStatus === 'resigned') return

    setAnimatingId(clientId)
    await new Promise(r => setTimeout(r, 300))
    const { data } = await supabase
      .from('roster_clients')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select()
      .single()
    if (data) {
      setClients(prev => prev.map(c => c.id === clientId ? data : c))
    }
    setAnimatingId(null)
  }

  // ── Drag handlers (match Hot List) ────────────────────────────────────────
  const handleDragStart = (e, client) => {
    setDragClient(client)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, stageId) => {
    e.preventDefault()
    setDragOverCol(stageId)
  }
  const handleDragLeave = () => setDragOverCol(null)
  const handleDrop = (e, stageId) => {
    e.preventDefault()
    setDragOverCol(null)
    if (dragClient && dragClient.status !== stageId) {
      moveClient(dragClient.id, stageId)
    }
    setDragClient(null)
  }
  const handleDragEnd = () => { setDragClient(null); setDragOverCol(null) }

  // ── Onboarding form ──────────────────────────────────────────────────────
  const saveOnboarding = async (clientId) => {
    const notes = []
    let phone = null

    for (const prompt of ONBOARDING_PROMPTS) {
      const val = (onboardingValues[prompt.key] || '').trim()
      if (!val) continue

      if (prompt.isPhone) {
        const cleaned = cleanPhone(val)
        if (!isValidE164(cleaned)) {
          setPhoneError('Enter a valid number with country code, e.g. +447700900000')
          return
        }
        phone = cleaned
        setPhoneError('')
        continue
      }

      notes.push({ client_id: clientId, note: `${prompt.label}: ${val}`, source: 'onboarding' })
    }

    // Save phone
    if (phone) {
      await supabase.from('roster_clients').update({ phone_e164: phone, updated_at: new Date().toISOString() }).eq('id', clientId)
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, phone_e164: phone } : c))
    }

    // Save life notes
    if (notes.length > 0) {
      await supabase.from('life_notes').insert(notes)
    }

    // Auto-advance to active if ≥3 notes
    const { count } = await supabase
      .from('life_notes')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
    if (count >= 3) {
      await supabase.from('roster_clients').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', clientId)
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: 'active' } : c))
    }

    setShowOnboarding(null)
    setOnboardingValues({})
    showToast(`Life Notes saved${count >= 3 ? ' — moved to Active' : ''}`)
    loadClients()
  }

  // ── Life note CRUD ────────────────────────────────────────────────────────
  const addNote = async () => {
    if (!newNote.trim() || !activeDrawer) return
    const { data } = await supabase
      .from('life_notes')
      .insert({ client_id: activeDrawer.id, note: newNote.trim(), source: 'manual' })
      .select()
      .single()
    if (data) {
      setLifeNotes(prev => [data, ...prev])
      setNewNote('')
      showToast('Note added')
      // Check auto-advance
      const client = clients.find(c => c.id === activeDrawer.id)
      if (client?.status === 'onboarding') {
        const total = lifeNotes.length + 1
        if (total >= 3) {
          await supabase.from('roster_clients').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', activeDrawer.id)
          loadClients()
        }
      }
    }
  }

  const deleteNote = async (noteId) => {
    await supabase.from('life_notes').delete().eq('id', noteId)
    setLifeNotes(prev => prev.filter(n => n.id !== noteId))
    showToast('Note deleted')
  }

  // ── Wins CRUD ─────────────────────────────────────────────────────────────
  const addWin = async () => {
    if (!newWin.trim() || !activeDrawer) return
    const { data } = await supabase
      .from('wins')
      .insert({ client_id: activeDrawer.id, text: newWin.trim(), source: 'manual' })
      .select()
      .single()
    if (data) {
      setWins(prev => [data, ...prev])
      setNewWin('')
      showToast('Win logged')
    }
  }

  const toggleProof = async (winId, current) => {
    await supabase.from('wins').update({ use_as_proof: !current }).eq('id', winId)
    setWins(prev => prev.map(w => w.id === winId ? { ...w, use_as_proof: !current } : w))
  }

  // ── Touch logging ─────────────────────────────────────────────────────────
  const logTouch = async (type, channel, messageText, aiDrafted, lifeNoteId) => {
    if (!activeDrawer) return
    const touch = {
      client_id: activeDrawer.id,
      type,
      channel,
      message_text: messageText || null,
      ai_drafted: aiDrafted || false,
      life_note_id: lifeNoteId || null,
    }
    const { data } = await supabase.from('touches').insert(touch).select().single()
    if (data) setTouches(prev => [data, ...prev])

    // If personal touch, reset health + clock
    if (type === 'personal') {
      const now = new Date().toISOString()
      const update = { last_personal_touch_at: now, health: 'green', updated_at: now }
      const client = clients.find(c => c.id === activeDrawer.id)
      if (client?.status === 'at_risk') update.status = 'active'

      await supabase.from('roster_clients').update(update).eq('id', activeDrawer.id)
      setClients(prev => prev.map(c => c.id === activeDrawer.id ? { ...c, ...update } : c))
      setActiveDrawer(prev => prev ? { ...prev, ...update } : prev)
      showToast('Personal touch logged — clock reset')
    } else {
      const now = new Date().toISOString()
      await supabase.from('roster_clients').update({ last_work_contact_at: now, updated_at: now }).eq('id', activeDrawer.id)
      showToast('Work contact logged')
    }
  }

  // ── AI Draft ──────────────────────────────────────────────────────────────
  const generateDraft = async () => {
    if (!activeDrawer || !coachClientId) return
    setDraftLoading(true)
    try {
      const res = await fetch('/api/roster/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterId: activeDrawer.id, coachClientId, excludeNoteId }),
      })
      const data = await res.json()
      if (res.ok) {
        setDraft(data)
        setDraftEdited(data.message || '')
      } else {
        showToast(data.error || 'Draft failed')
      }
    } catch {
      showToast('Failed to generate draft')
    }
    setDraftLoading(false)
  }

  const regenerateDraft = async () => {
    if (draft?.life_note_id) setExcludeNoteId(draft.life_note_id)
    await generateDraft()
  }

  const sendWhatsApp = async () => {
    if (!activeDrawer || !draftEdited) return
    const phone = activeDrawer.phone_e164
    const encoded = encodeURIComponent(draftEdited)

    if (phone) {
      window.open(`https://wa.me/${phone.replace('+', '')}?text=${encoded}`, '_blank')
    } else {
      await navigator.clipboard.writeText(draftEdited)
      showToast('Message copied')
    }

    await logTouch('personal', phone ? 'whatsapp' : 'other', draftEdited, true, draft?.life_note_id)
    setDraft(null)
    setDraftEdited('')
  }

  const logManualTouch = async () => {
    await logTouch('personal', 'other', null, false, null)
    setDraft(null)
  }

  const logWorkContact = async () => {
    await logTouch('work', 'other', null, false, null)
  }

  // ── Resign runway ─────────────────────────────────────────────────────────
  const completeResignStage = async (eventId) => {
    await supabase.from('resign_events').update({ completed_at: new Date().toISOString() }).eq('id', eventId)
    setResignEvents(prev => prev.map(e => e.id === eventId ? { ...e, completed_at: new Date().toISOString() } : e))
    showToast('Stage completed')
  }

  const handleResigned = async (clientId, eventId) => {
    if (!newTermEnd) { showToast('Enter the new term end date'); return }
    await supabase.from('resign_events').update({
      completed_at: new Date().toISOString(),
      outcome: 'resigned',
      new_term_end_date: newTermEnd,
    }).eq('id', eventId)
    await supabase.from('roster_clients').update({
      status: 'active',
      term_end_date: newTermEnd,
      health: 'green',
      updated_at: new Date().toISOString(),
    }).eq('id', clientId)
    setResignModal(null)
    setNewTermEnd('')
    showToast('Client resigned — back to Active')
    loadClients()
  }

  const handleChurned = async (clientId, eventId) => {
    if (!churnReason) { showToast('Select a churn reason'); return }
    await supabase.from('resign_events').update({
      completed_at: new Date().toISOString(),
      outcome: 'churned',
      churn_reason: churnReasonText || churnReason,
    }).eq('id', eventId)
    await supabase.from('roster_clients').update({
      status: 'churned',
      updated_at: new Date().toISOString(),
    }).eq('id', clientId)
    setChurnModal(null)
    setChurnReason('')
    setChurnReasonText('')
    showToast('Client churned — archived')
    loadClients()
  }

  const snoozeOutcome = async (eventId) => {
    const event = resignEvents.find(e => e.id === eventId)
    if (!event || event.snooze_count >= MAX_SNOOZES) {
      showToast('Max snoozes reached — choose an outcome')
      return
    }
    const newDue = new Date(event.due_at)
    newDue.setDate(newDue.getDate() + 3)
    await supabase.from('resign_events').update({
      due_at: newDue.toISOString().slice(0, 10),
      snooze_count: event.snooze_count + 1,
    }).eq('id', eventId)
    setResignEvents(prev => prev.map(e => e.id === eventId ? { ...e, due_at: newDue.toISOString().slice(0, 10), snooze_count: e.snooze_count + 1 } : e))
    showToast(`Snoozed 3 days (${event.snooze_count + 1}/${MAX_SNOOZES})`)
  }

  // ── Win Stack ─────────────────────────────────────────────────────────────
  const loadWinStack = async () => {
    if (!activeDrawer) return
    try {
      const res = await fetch('/api/roster/win-stack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterId: activeDrawer.id }),
      })
      const html = await res.text()
      setWinStackHtml(html)
    } catch {
      showToast('Failed to load Win Stack')
    }
  }

  // ── Resign script generation ──────────────────────────────────────────────
  const generateResignScript = async () => {
    if (!activeDrawer || !coachClientId) return
    setScriptLoading(true)
    try {
      const res = await fetch('/api/roster/resign-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rosterId: activeDrawer.id, coachClientId }),
      })
      const data = await res.json()
      if (res.ok && data.stages) {
        setResignScript(data.stages)
      } else {
        showToast(data.error || 'Failed to generate script')
        // Fallback to static stages
        setResignScript(RESIGN_SCRIPT_STAGES.map(s => ({ step: s.step, label: s.label, content: s.instruction })))
      }
    } catch {
      showToast('Failed to generate script')
    }
    setScriptLoading(false)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const daysSinceTouch = (client) => {
    const anchor = client.last_personal_touch_at || client.start_date
    if (!anchor) return 0
    return Math.floor((new Date() - new Date(anchor)) / (1000 * 60 * 60 * 24))
  }

  const nextTouchIn = (client) => {
    const days = daysSinceTouch(client)
    return Math.max(0, client.cadence_days - days)
  }

  const getColumnClients = (colId) => {
    if (colId === 'resigned') return clients.filter(c => TERMINAL_STATUSES.includes(c.status))
    return clients.filter(c => c.status === colId)
  }

  const atRiskReason = (client) => {
    const days = daysSinceTouch(client)
    if (days >= client.red_days) return `No personal touch in ${days} days.`
    if (days >= client.cadence_days) return `Touch due — ${days} days since last contact.`
    return 'Flagged at risk.'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500 text-sm">Loading {ROSTER_TRADEMARK}...</div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg tracking-widest text-gold uppercase">{ROSTER_TRADEMARK}</h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${HEALTH_COLORS.green}`} /> {clients.filter(c => c.health === 'green' && !TERMINAL_STATUSES.includes(c.status)).length} green</span>
          <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${HEALTH_COLORS.amber}`} /> {clients.filter(c => c.health === 'amber').length} amber</span>
          <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${HEALTH_COLORS.red}`} /> {clients.filter(c => c.health === 'red').length} red</span>
        </div>
      </div>

      {/* Desktop Kanban */}
      <div className="hidden sm:grid gap-2" style={{ gridTemplateColumns: `repeat(${ROSTER_COLUMNS.length}, minmax(0, 1fr))` }}>
        {ROSTER_COLUMNS.map((col) => {
          const colClients = getColumnClients(col.id)
          const isDragOver = dragOverCol === col.id && dragClient?.status !== col.id
          return (
            <div key={col.id} className="min-w-0">
              {/* Column header */}
              <div className={`rounded-t-lg border-t-2 ${col.color} px-3 py-2.5 bg-zinc-900`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{colClients.length}</span>
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`bg-zinc-900/50 border border-t-0 border-zinc-800 rounded-b-lg p-2 min-h-[200px] space-y-2 transition-colors ${isDragOver ? 'bg-gold/[0.06] border-gold/30' : ''}`}
                onDragOver={e => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.id)}
              >
                {colClients.map(client => (
                  <div key={client.id}
                    draggable
                    onDragStart={e => handleDragStart(e, client)}
                    onDragEnd={handleDragEnd}
                    className={`bg-zinc-800 border border-zinc-700 rounded-lg p-3 group cursor-grab active:cursor-grabbing hover:border-zinc-600 select-none card-lift transition-all duration-300 ${animatingId === client.id ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100'}`}
                    onClick={() => openDrawer(client)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${HEALTH_COLORS[client.health]}`} />
                          <p className="text-sm font-semibold text-white leading-tight truncate">{client.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status-specific content */}
                    {client.status === 'onboarding' && (
                      <button onClick={(e) => { e.stopPropagation(); setShowOnboarding(client.id); setOnboardingValues({}) }}
                        className="mt-2 w-full py-1.5 text-[10px] font-semibold text-gold bg-gold/10 hover:bg-gold/20 rounded transition uppercase tracking-wider">
                        Fill Life Notes
                      </button>
                    )}

                    {(client.status === 'active' || client.status === 'at_risk') && (
                      <div className="mt-1.5">
                        <p className={`text-[10px] font-mono ${HEALTH_TEXT[client.health]}`}>
                          {daysSinceTouch(client)}d since touch {client.health !== 'green' && '·'} {client.health === 'amber' && 'Due now'}{client.health === 'red' && 'OVERDUE'}
                        </p>
                        {client.health === 'green' && (
                          <p className="text-[10px] text-zinc-600 font-mono">Next in {nextTouchIn(client)}d</p>
                        )}
                      </div>
                    )}

                    {client.status === 'at_risk' && (
                      <p className="text-[10px] text-amber-400 mt-1">{atRiskReason(client)}</p>
                    )}

                    {client.status === 'resign_window' && client.term_end_date && (
                      <p className="text-[10px] text-red-400 font-mono mt-1.5">
                        Term ends {new Date(client.term_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}

                    {TERMINAL_STATUSES.includes(client.status) && (
                      <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider">{client.status}</p>
                    )}
                  </div>
                ))}

                {/* Add card (not on terminal column) */}
                {col.id !== 'resigned' && (
                  <>
                    {addingCol === col.id ? (
                      <div className="space-y-2">
                        <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) addClient(col.id); if (e.key === 'Escape') { setAddingCol(null); setNewName('') } }}
                          placeholder="Client name..."
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition" />
                        <div className="flex gap-1.5">
                          <button onClick={() => addClient(col.id)}
                            className="flex-1 py-1.5 bg-gold hover:bg-gold-light text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded transition">
                            Add
                          </button>
                          <button onClick={() => { setAddingCol(null); setNewName('') }}
                            className="px-3 py-1.5 border border-zinc-700 text-zinc-500 text-[10px] uppercase tracking-widest rounded transition">
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setAddingCol(col.id); setNewName('') }}
                        className="w-full py-2 text-[10px] font-semibold text-zinc-600 hover:text-gold active:text-gold uppercase tracking-widest transition text-center rounded hover:bg-zinc-800/60">
                        + Add client
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: one stage at a time */}
      <div className="sm:hidden">
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {ROSTER_COLUMNS.map(col => (
            <button key={col.id} onClick={() => setMobileStage(col.id)}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-full whitespace-nowrap transition ${mobileStage === col.id ? 'bg-gold text-zinc-950' : 'bg-zinc-800 text-zinc-500'}`}>
              {col.label} ({getColumnClients(col.id).length})
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {getColumnClients(mobileStage).map(client => (
            <div key={client.id} onClick={() => openDrawer(client)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 card-lift">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${HEALTH_COLORS[client.health]}`} />
                <p className="text-sm font-semibold text-white">{client.name}</p>
                {(client.status === 'active' || client.status === 'at_risk') && (
                  <span className={`text-[10px] font-mono ml-auto ${HEALTH_TEXT[client.health]}`}>{daysSinceTouch(client)}d</span>
                )}
              </div>
            </div>
          ))}
          {mobileStage !== 'resigned' && (
            <button onClick={() => { setAddingCol(mobileStage); setNewName('') }}
              className="w-full py-2 text-[10px] font-semibold text-zinc-600 hover:text-gold uppercase tracking-widest transition text-center rounded hover:bg-zinc-800/60">
              + Add client
            </button>
          )}
        </div>
      </div>

      {/* ── Onboarding Modal ──────────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowOnboarding(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm tracking-widest text-gold uppercase">Life Notes — Onboarding</h3>
            {ONBOARDING_PROMPTS.map(prompt => (
              <div key={prompt.key}>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{prompt.label}</label>
                <input
                  value={onboardingValues[prompt.key] || ''}
                  onChange={e => setOnboardingValues(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                  placeholder={prompt.placeholder}
                  className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition"
                />
                {prompt.isPhone && phoneError && <p className="text-[10px] text-red-400 mt-1">{phoneError}</p>}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => saveOnboarding(showOnboarding)}
                className="flex-1 py-2 bg-gold hover:bg-gold-light text-zinc-950 font-bold text-xs uppercase tracking-widest rounded transition">
                Save Notes
              </button>
              <button onClick={() => setShowOnboarding(null)}
                className="px-4 py-2 border border-zinc-700 text-zinc-500 text-xs uppercase tracking-widest rounded transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Drawer ─────────────────────────────────────────────────── */}
      {activeDrawer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={closeDrawer}>
          <div className="bg-zinc-900 border-l border-zinc-700 w-full max-w-lg h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-5 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${HEALTH_COLORS[activeDrawer.health]}`} />
                  <h3 className="text-lg font-semibold text-white">{activeDrawer.name}</h3>
                </div>
                <button onClick={closeDrawer} className="text-zinc-600 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                <span>{activeDrawer.status}</span>
                <span>·</span>
                <span>{daysSinceTouch(activeDrawer)}d since touch</span>
                {activeDrawer.term_end_date && <>
                  <span>·</span>
                  <span>Term ends {new Date(activeDrawer.term_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </>}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-3 overflow-x-auto">
                {['life-notes', 'touches', 'wins', 'draft', ...(activeDrawer.status === 'resign_window' ? ['runway'] : [])].map(tab => (
                  <button key={tab} onClick={() => {
                    setDrawerTab(tab)
                    if (tab === 'draft' && !draft && !draftLoading) generateDraft()
                  }}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded whitespace-nowrap transition ${drawerTab === tab ? 'bg-gold/20 text-gold' : 'text-zinc-600 hover:text-zinc-400'}`}>
                    {tab === 'life-notes' ? 'Life Notes' : tab === 'draft' ? 'Draft Message' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer content */}
            <div className="px-5 py-4 space-y-4">
              {/* ── Life Notes tab ──────────────────────────────────────── */}
              {drawerTab === 'life-notes' && (
                <>
                  <div className="flex gap-2">
                    <input value={newNote} onChange={e => setNewNote(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addNote() }}
                      placeholder="Add a life note..."
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold transition" />
                    <button onClick={addNote} className="px-3 py-2 bg-gold hover:bg-gold-light text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded transition">Add</button>
                  </div>
                  {lifeNotes.length === 0 && <p className="text-zinc-600 text-sm">No life notes yet.</p>}
                  {lifeNotes.map(note => (
                    <div key={note.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-zinc-300 flex-1">{note.note}</p>
                        <button onClick={() => deleteNote(note.id)} className="text-zinc-700 hover:text-red-400 transition opacity-0 group-hover:opacity-100 p-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">{note.source} · {new Date(note.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  ))}

                  {/* Phone number field */}
                  <div className="border-t border-zinc-800 pt-4 mt-4">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">WhatsApp Number</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={activeDrawer.phone_e164 || ''}
                        onChange={e => setActiveDrawer(prev => ({ ...prev, phone_e164: e.target.value }))}
                        placeholder="+447700900000"
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold transition font-mono" />
                      <button onClick={async () => {
                        const phone = cleanPhone(activeDrawer.phone_e164 || '')
                        if (!phone) {
                          await supabase.from('roster_clients').update({ phone_e164: null, updated_at: new Date().toISOString() }).eq('id', activeDrawer.id)
                          setClients(prev => prev.map(c => c.id === activeDrawer.id ? { ...c, phone_e164: null } : c))
                          showToast('Phone cleared')
                          return
                        }
                        if (!isValidE164(phone)) { showToast('Invalid E.164 number'); return }
                        await supabase.from('roster_clients').update({ phone_e164: phone, updated_at: new Date().toISOString() }).eq('id', activeDrawer.id)
                        setClients(prev => prev.map(c => c.id === activeDrawer.id ? { ...c, phone_e164: phone } : c))
                        showToast('Phone saved')
                      }} className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:border-gold text-zinc-400 hover:text-gold text-[10px] uppercase tracking-widest rounded transition font-semibold">
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Term end date */}
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Term End Date</label>
                    <div className="flex gap-2 mt-1">
                      <input type="date"
                        value={activeDrawer.term_end_date || ''}
                        onChange={e => setActiveDrawer(prev => ({ ...prev, term_end_date: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold transition font-mono" />
                      <button onClick={async () => {
                        const val = activeDrawer.term_end_date || null
                        await supabase.from('roster_clients').update({ term_end_date: val, updated_at: new Date().toISOString() }).eq('id', activeDrawer.id)
                        setClients(prev => prev.map(c => c.id === activeDrawer.id ? { ...c, term_end_date: val } : c))
                        showToast(val ? 'Term end date saved' : 'Set to rolling/monthly')
                      }} className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:border-gold text-zinc-400 hover:text-gold text-[10px] uppercase tracking-widest rounded transition font-semibold">
                        Save
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">Leave empty for rolling/monthly clients.</p>
                  </div>
                </>
              )}

              {/* ── Touches tab ─────────────────────────────────────────── */}
              {drawerTab === 'touches' && (
                <>
                  <div className="flex gap-2">
                    <button onClick={logManualTouch}
                      className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider rounded hover:bg-emerald-500/20 transition">
                      I touched them myself
                    </button>
                    <button onClick={logWorkContact}
                      className="py-2 px-3 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-semibold uppercase tracking-wider rounded hover:border-zinc-600 transition">
                      Log work contact
                    </button>
                  </div>
                  {touches.length === 0 && <p className="text-zinc-600 text-sm">No touches logged yet.</p>}
                  {touches.map(touch => (
                    <div key={touch.id} className={`bg-zinc-800 border rounded-lg p-3 ${touch.type === 'personal' ? 'border-emerald-500/20' : 'border-zinc-700'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${touch.type === 'personal' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">{touch.type} · {touch.channel}</span>
                        {touch.ai_drafted && <span className="text-[10px] text-violet-400 font-mono">AI</span>}
                        <span className="text-[10px] text-zinc-600 font-mono ml-auto">{new Date(touch.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {touch.message_text && <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3">{touch.message_text}</p>}
                    </div>
                  ))}
                </>
              )}

              {/* ── Wins tab ────────────────────────────────────────────── */}
              {drawerTab === 'wins' && (
                <>
                  <div className="flex gap-2">
                    <input value={newWin} onChange={e => setNewWin(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addWin() }}
                      placeholder="Log a win..."
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold transition" />
                    <button onClick={addWin} className="px-3 py-2 bg-gold hover:bg-gold-light text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded transition">Add</button>
                  </div>
                  {/* Filter: show proof only */}
                  {wins.length === 0 && <p className="text-zinc-600 text-sm">No wins logged yet.</p>}
                  {wins.map(win => (
                    <div key={win.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-zinc-300 flex-1">{win.text}</p>
                        <button onClick={() => toggleProof(win.id, win.use_as_proof)}
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded transition ${win.use_as_proof ? 'bg-gold/20 text-gold' : 'bg-zinc-700 text-zinc-500 hover:text-gold'}`}>
                          {win.use_as_proof ? 'Proof ✓' : 'Use as proof'}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1 font-mono">{win.source} · {new Date(win.win_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  ))}
                </>
              )}

              {/* ── Draft Message tab ───────────────────────────────────── */}
              {drawerTab === 'draft' && (
                <>
                  {draftLoading && (
                    <div className="flex items-center gap-2 py-8 justify-center">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      <span className="text-sm text-zinc-500">Drafting message...</span>
                    </div>
                  )}
                  {draft && !draftLoading && (
                    <div className="space-y-3">
                      <textarea
                        value={draftEdited}
                        onChange={e => setDraftEdited(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold transition resize-none" />
                      <div className="flex items-center gap-2">
                        <button onClick={sendWhatsApp}
                          className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded hover:bg-emerald-500/30 transition">
                          {activeDrawer.phone_e164 ? 'Send on WhatsApp' : 'Copy message'}
                        </button>
                        <button onClick={regenerateDraft}
                          className="py-2 px-3 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] uppercase tracking-widest rounded hover:border-gold hover:text-gold transition font-semibold">
                          Regenerate
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={logManualTouch}
                          className="flex-1 py-1.5 text-[10px] font-semibold text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition uppercase tracking-wider text-center">
                          I touched them myself
                        </button>
                        <button onClick={logWorkContact}
                          className="py-1.5 px-3 text-[10px] font-semibold text-zinc-600 hover:text-zinc-400 rounded transition uppercase tracking-wider">
                          Log work contact
                        </button>
                      </div>
                    </div>
                  )}
                  {!draft && !draftLoading && (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-sm mb-3">Generate a personal message for {activeDrawer.name}</p>
                      <button onClick={generateDraft}
                        className="px-4 py-2 bg-gold hover:bg-gold-light text-zinc-950 font-bold text-xs uppercase tracking-widest rounded transition">
                        Generate Draft
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Runway tab ──────────────────────────────────────────── */}
              {drawerTab === 'runway' && (
                <>
                  <h4 className="text-xs font-display text-gold uppercase tracking-widest">Resign Runway</h4>
                  {resignEvents.length === 0 && <p className="text-zinc-600 text-sm">No resign events scheduled.</p>}
                  {resignEvents.map(event => {
                    const stage = RESIGN_STAGES.find(s => s.id === event.stage)
                    const isOverdue = !event.completed_at && new Date(event.due_at) < new Date()
                    const isComplete = !!event.completed_at
                    return (
                      <div key={event.id} className={`bg-zinc-800 border rounded-lg p-3 ${isOverdue ? 'border-red-500/40' : isComplete ? 'border-emerald-500/30' : 'border-zinc-700'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isComplete ? 'text-emerald-400' : isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
                              {isComplete ? '✓' : isOverdue ? '!' : '○'}
                            </span>
                            <span className="text-sm text-white font-semibold">{stage?.label || event.stage}</span>
                          </div>
                          <span className={`text-[10px] font-mono ${isOverdue ? 'text-red-400' : 'text-zinc-600'}`}>
                            {isComplete ? 'Done' : `Due ${new Date(event.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">{stage?.description}</p>

                        {!isComplete && (
                          <div className="flex gap-2 mt-2">
                            {event.stage === 'call_outcome' ? (
                              <>
                                <button onClick={() => { setResignModal({ clientId: activeDrawer.id, eventId: event.id }); setNewTermEnd('') }}
                                  className="flex-1 py-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition uppercase tracking-wider">
                                  Resigned
                                </button>
                                <button onClick={() => { setChurnModal({ clientId: activeDrawer.id, eventId: event.id }); setChurnReason(''); setChurnReasonText('') }}
                                  className="flex-1 py-1.5 text-[10px] font-semibold text-red-400 bg-red-500/10 rounded hover:bg-red-500/20 transition uppercase tracking-wider">
                                  Churned
                                </button>
                                <button onClick={() => snoozeOutcome(event.id)}
                                  className="py-1.5 px-2 text-[10px] font-semibold text-zinc-500 bg-zinc-700 rounded hover:bg-zinc-600 transition uppercase tracking-wider"
                                  title={`Snooze 3 days (${event.snooze_count}/${MAX_SNOOZES} used)`}>
                                  Snooze
                                </button>
                              </>
                            ) : event.stage === 't30_win_stack' ? (
                              <div className="flex gap-2 w-full">
                                <button onClick={() => { loadWinStack(); setDrawerTab('win-stack-preview') }}
                                  className="flex-1 py-1.5 text-[10px] font-semibold text-gold bg-gold/10 rounded hover:bg-gold/20 transition uppercase tracking-wider">
                                  View Win Stack
                                </button>
                                <button onClick={() => completeResignStage(event.id)}
                                  className="py-1.5 px-3 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition uppercase tracking-wider">
                                  ✓ Done
                                </button>
                              </div>
                            ) : event.stage === 't14_script' ? (
                              <div className="flex gap-2 w-full">
                                <button onClick={() => { generateResignScript(); setDrawerTab('resign-script') }}
                                  className="flex-1 py-1.5 text-[10px] font-semibold text-gold bg-gold/10 rounded hover:bg-gold/20 transition uppercase tracking-wider">
                                  Generate Script
                                </button>
                                <button onClick={() => completeResignStage(event.id)}
                                  className="py-1.5 px-3 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition uppercase tracking-wider">
                                  ✓ Done
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => completeResignStage(event.id)}
                                className="flex-1 py-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 rounded hover:bg-emerald-500/20 transition uppercase tracking-wider">
                                ✓ Complete
                              </button>
                            )}
                          </div>
                        )}

                        {event.outcome && (
                          <p className="text-[10px] font-mono mt-1 text-zinc-500">
                            Outcome: {event.outcome}{event.churn_reason ? ` — ${event.churn_reason}` : ''}{event.new_term_end_date ? ` — new term: ${event.new_term_end_date}` : ''}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </>
              )}

              {/* ── Win Stack Preview ───────────────────────────────────── */}
              {drawerTab === 'win-stack-preview' && winStackHtml && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setDrawerTab('runway')} className="text-[10px] text-zinc-500 hover:text-gold uppercase tracking-wider transition">← Back to Runway</button>
                    <button onClick={() => {
                      const win = window.open('', '_blank')
                      win.document.write(winStackHtml)
                      win.document.close()
                      setTimeout(() => win.print(), 500)
                    }} className="px-3 py-1.5 bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold uppercase tracking-wider rounded hover:bg-gold/20 transition">
                      Print / Save PDF
                    </button>
                  </div>
                  <iframe srcDoc={winStackHtml} className="w-full h-[500px] rounded-lg border border-zinc-700" title="Win Stack Preview" />
                </div>
              )}

              {/* ── Resign Script ───────────────────────────────────────── */}
              {drawerTab === 'resign-script' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setDrawerTab('runway')} className="text-[10px] text-zinc-500 hover:text-gold uppercase tracking-wider transition">← Back to Runway</button>
                  </div>
                  {scriptLoading && (
                    <div className="flex items-center gap-2 py-8 justify-center">
                      <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                      <span className="text-sm text-zinc-500">Generating script...</span>
                    </div>
                  )}
                  {resignScript && !scriptLoading && (
                    <div className="space-y-3">
                      {resignScript.map(stage => (
                        <div key={stage.step} className="bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-mono text-gold">{stage.step}.</span>
                            <span className="text-xs font-semibold text-white uppercase tracking-wider">{stage.label}</span>
                          </div>
                          <textarea
                            defaultValue={stage.content}
                            rows={3}
                            className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-gold transition resize-none" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Resign Modal ──────────────────────────────────────────────────── */}
      {resignModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setResignModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm tracking-widest text-emerald-400 uppercase">Client Resigned</h3>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">New Term End Date</label>
              <input type="date" value={newTermEnd} onChange={e => setNewTermEnd(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold transition font-mono" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleResigned(resignModal.clientId, resignModal.eventId)}
                className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded transition">
                Confirm
              </button>
              <button onClick={() => setResignModal(null)}
                className="px-4 py-2 border border-zinc-700 text-zinc-500 text-xs uppercase tracking-widest rounded transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Churn Modal ───────────────────────────────────────────────────── */}
      {churnModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setChurnModal(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-sm tracking-widest text-red-400 uppercase">Client Churned</h3>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Reason</label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CHURN_REASONS.map(r => (
                  <button key={r.value} onClick={() => setChurnReason(r.value)}
                    className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded transition ${churnReason === r.value ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Details (optional)</label>
              <textarea value={churnReasonText} onChange={e => setChurnReasonText(e.target.value)}
                rows={2} placeholder="Any extra context..."
                className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold transition resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleChurned(churnModal.clientId, churnModal.eventId)}
                className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-widest rounded transition">
                Confirm Churn
              </button>
              <button onClick={() => setChurnModal(null)}
                className="px-4 py-2 border border-zinc-700 text-zinc-500 text-xs uppercase tracking-widest rounded transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-zinc-800 border border-gold/30 text-gold px-4 py-2.5 rounded-lg shadow-glow-gold text-sm font-semibold toast-in">
          {toast}
        </div>
      )}
    </div>
  )
}

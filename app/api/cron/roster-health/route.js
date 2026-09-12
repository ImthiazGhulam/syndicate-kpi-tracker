import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TOUCHABLE_STATUSES, WINS_STALE_DAYS, RESIGN_RUNWAY_DAYS, RESIGN_STAGES } from '../../../../lib/roster-constants'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Service-role client — bypasses RLS. Every query is explicitly scoped by client_id / coach_id.
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export async function GET() {
  const supabase = getSupabase()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  let updated = 0
  let resignWindowCreated = 0

  try {
    // ── 1. Touch engine: recalculate health for touchable clients ──────────
    const { data: clients } = await supabase
      .from('roster_clients')
      .select('id, coach_id, status, cadence_days, red_days, last_personal_touch_at, start_date, health')
      .in('status', TOUCHABLE_STATUSES)

    if (clients && clients.length > 0) {
      for (const client of clients) {
        const anchor = client.last_personal_touch_at
          ? new Date(client.last_personal_touch_at)
          : new Date(client.start_date)
        const daysSince = Math.floor((now - anchor) / (1000 * 60 * 60 * 24))

        let newHealth = 'green'
        let newStatus = client.status
        let reason = null

        if (daysSince >= client.red_days) {
          newHealth = 'red'
        } else if (daysSince >= client.cadence_days) {
          newHealth = 'amber'
        }

        // Check wins staleness (no win in 30 days + amber touch → at_risk)
        if (newHealth === 'amber') {
          const thirtyDaysAgo = new Date(now)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - WINS_STALE_DAYS)
          const { count } = await supabase
            .from('wins')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id)
            .gte('win_date', thirtyDaysAgo.toISOString().slice(0, 10))

          if (count === 0) {
            newHealth = 'red'
            reason = `Quiet ${daysSince} days, no win logged in ${WINS_STALE_DAYS}+ days.`
          }
        }

        // Red health → at_risk (unless already in at_risk or onboarding)
        if (newHealth === 'red' && client.status === 'active') {
          newStatus = 'at_risk'
          if (!reason) reason = `No personal touch in ${daysSince} days.`
        }

        // Only update if something changed
        if (newHealth !== client.health || newStatus !== client.status) {
          const update = { health: newHealth, updated_at: now.toISOString() }
          if (newStatus !== client.status) update.status = newStatus
          await supabase
            .from('roster_clients')
            .update(update)
            .eq('id', client.id)
          updated++
        }
      }
    }

    // ── 2. Resign window trigger: term_end_date within 45 days ─────────────
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() + RESIGN_RUNWAY_DAYS)
    const cutoffDate = cutoff.toISOString().slice(0, 10)

    const { data: termClients } = await supabase
      .from('roster_clients')
      .select('id, coach_id, term_end_date')
      .not('term_end_date', 'is', null)
      .lte('term_end_date', cutoffDate)
      .not('status', 'in', '("resign_window","resigned","churned")')

    if (termClients && termClients.length > 0) {
      for (const client of termClients) {
        const termEnd = new Date(client.term_end_date)

        // Create the four resign_events rows
        const events = RESIGN_STAGES.map(stage => {
          const dueDate = new Date(termEnd)
          dueDate.setDate(dueDate.getDate() - stage.offsetDays)
          // If due date is in the past, set to today
          const due = dueDate < now ? today : dueDate.toISOString().slice(0, 10)
          return {
            client_id: client.id,
            stage: stage.id,
            due_at: due,
          }
        })

        await supabase.from('resign_events').insert(events)
        await supabase
          .from('roster_clients')
          .update({ status: 'resign_window', updated_at: now.toISOString() })
          .eq('id', client.id)

        resignWindowCreated++
      }
    }

    return NextResponse.json({
      ok: true,
      healthUpdated: updated,
      resignWindowCreated,
      processedAt: now.toISOString(),
    })
  } catch (err) {
    console.error('Roster cron error:', err)
    return NextResponse.json({ error: 'Internal error', detail: err.message }, { status: 500 })
  }
}

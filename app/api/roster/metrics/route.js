import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const coachId = searchParams.get('coachId')
  if (!coachId) return NextResponse.json({ error: 'Missing coachId' }, { status: 400 })

  const supabase = getSupabase()

  const [activeRes, atRiskRes, resignedRes, churnedRes, churnReasonsRes] = await Promise.all([
    supabase.from('roster_clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'active'),
    supabase.from('roster_clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'at_risk'),
    supabase.from('roster_clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'resigned'),
    supabase.from('roster_clients').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('status', 'churned'),
    // Churn reasons in last 90 days
    supabase.from('resign_events')
      .select('churn_reason, roster_clients!inner(coach_id)')
      .eq('roster_clients.coach_id', coachId)
      .eq('outcome', 'churned')
      .gte('completed_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const resigned = resignedRes.count || 0
  const churned = churnedRes.count || 0
  const total = resigned + churned
  const resignRate = total > 0 ? Math.round((resigned / total) * 100) : 0

  // Churn reasons breakdown
  const reasons = {}
  if (churnReasonsRes.data) {
    for (const ev of churnReasonsRes.data) {
      const r = ev.churn_reason || 'unknown'
      reasons[r] = (reasons[r] || 0) + 1
    }
  }

  return NextResponse.json({
    active: activeRes.count || 0,
    at_risk: atRiskRes.count || 0,
    resigned,
    churned,
    resign_rate_90d: resignRate,
    churn_reasons_90d: reasons,
  })
}

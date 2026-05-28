import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('No Supabase key found')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key)
}

export async function POST(req) {
  try {
    const { clientId, adminEmail } = await req.json()
    if (!clientId || !adminEmail) {
      return NextResponse.json({ error: 'Missing clientId or adminEmail' }, { status: 400 })
    }

    if (adminEmail !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = getSupabase()

    // Call the database function — runs with SECURITY DEFINER, bypasses RLS
    const { error } = await supabase.rpc('delete_client_cascade', { target_client_id: clientId })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verify
    const { data: stillExists } = await supabase.from('clients').select('id').eq('id', clientId).maybeSingle()
    if (stillExists) {
      return NextResponse.json({ error: 'Delete failed — client still exists' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

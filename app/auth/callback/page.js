'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    let redirected = false

    const redirect = (session) => {
      if (redirected) return
      redirected = true
      setStatus('Welcome back!')
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
      router.push(session.user.email === adminEmail ? '/admin' : '/client')
    }

    // Listen for auth events — skip INITIAL_SESSION (may carry stale session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && session) redirect(session)
    })

    // Fallback: after 3s, check session directly (handles edge cases)
    const timeout = setTimeout(async () => {
      if (redirected) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { redirect(session); return }
      setStatus('Sign in failed — redirecting to login...')
      setTimeout(() => router.push('/login'), 1500)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-500 text-lg font-medium animate-pulse">{status}</div>
    </div>
  )
}

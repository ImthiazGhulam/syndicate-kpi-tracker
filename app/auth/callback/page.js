'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    const handleCallback = async () => {
      // PKCE flow: magic link sends ?code= parameter
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        setStatus('Verifying...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Auth error:', error.message)
          setStatus('Sign in failed — requesting a new link...')
          // Wait then redirect
          setTimeout(() => router.push('/login'), 2500)
          return
        }
        if (data.session) {
          setStatus('Welcome back!')
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
          router.push(data.session.user.email === adminEmail ? '/admin' : '/client')
          return
        }
      }

      // Fallback: check if session exists (hash fragment or already signed in)
      await new Promise(r => setTimeout(r, 1000))
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        router.push(session.user.email === adminEmail ? '/admin' : '/client')
        return
      }

      // Nothing worked
      setStatus('Sign in failed — please request a new magic link')
      setTimeout(() => router.push('/login'), 2500)
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-500 text-lg font-medium animate-pulse">{status}</div>
    </div>
  )
}

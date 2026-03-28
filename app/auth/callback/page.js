'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (session) {
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        if (session.user.email === adminEmail) {
          router.push('/admin')
        } else {
          router.push('/client')
        }
      } else {
        router.push('/login?error=auth_failed')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-500 text-lg font-medium animate-pulse">Signing you in...</div>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Hybrid storage: PKCE code_verifier in cookies (shared across tabs/webviews),
// everything else in localStorage (more space for session tokens).
// This fixes magic links opening in a different tab/browser than where they were requested.
const isBrowser = typeof window !== 'undefined'

const hybridStorage = {
  getItem: (key) => {
    if (!isBrowser) return null
    if (key.includes('code-verifier')) {
      const match = document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)'))
      return match ? decodeURIComponent(match[2]) : null
    }
    return localStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (!isBrowser) return
    if (key.includes('code-verifier')) {
      document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + ';path=/;max-age=3600;SameSite=Lax'
      return
    }
    localStorage.setItem(key, value)
  },
  removeItem: (key) => {
    if (!isBrowser) return
    if (key.includes('code-verifier')) {
      document.cookie = encodeURIComponent(key) + '=;path=/;max-age=0'
      return
    }
    localStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: hybridStorage, flowType: 'pkce' },
})

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function saveProfiles(profiles) {
  let saved = 0
  for (const profile of profiles) {
    const handle = (profile.username || '').replace('@', '').toLowerCase()
    if (!handle) continue

    await supabase.from('competitors').upsert({
      instagram_handle: handle,
      name: profile.fullName || profile.username || handle,
      followers: profile.followersCount || 0,
      following: profile.followsCount || profile.followingCount || 0,
      bio: profile.biography || '',
      profile_pic_url: profile.profilePicUrl || profile.profilePicUrlHD || '',
      is_verified: profile.verified || false,
      category: profile.businessCategoryName || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'instagram_handle' })

    saved++
  }
  return saved
}

export async function POST(request) {
  try {
    const body = await request.json()

    // Case 1: Apify webhook notification — has resource.defaultDatasetId
    if (body.resource && body.resource.defaultDatasetId) {
      const datasetId = body.resource.defaultDatasetId
      const apiToken = body.resource.actorTaskId ? null : null // We'll use public dataset URL

      // Fetch the dataset from Apify
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`
      const res = await fetch(datasetUrl)
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch Apify dataset', status: res.status }, { status: 500 })
      }
      const profiles = await res.json()
      const saved = await saveProfiles(Array.isArray(profiles) ? profiles : [profiles])
      return NextResponse.json({ success: true, source: 'apify_webhook', profiles: saved })
    }

    // Case 2: Direct array of profiles
    if (Array.isArray(body)) {
      const saved = await saveProfiles(body)
      return NextResponse.json({ success: true, source: 'direct_array', profiles: saved })
    }

    // Case 3: Single profile object with username
    if (body.username) {
      const saved = await saveProfiles([body])
      return NextResponse.json({ success: true, source: 'single_profile', profiles: saved })
    }

    return NextResponse.json({ error: 'Unrecognised data format', received: Object.keys(body) }, { status: 400 })
  } catch (err) {
    console.error('Scraper webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Scraper webhook active. Send POST with Apify data.' })
}

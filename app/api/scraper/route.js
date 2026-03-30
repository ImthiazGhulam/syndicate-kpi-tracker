import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role key for API routes (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()

    // Apify sends an array of profile results
    const profiles = Array.isArray(body) ? body : [body]

    for (const profile of profiles) {
      if (!profile.username) continue

      const handle = profile.username.replace('@', '').toLowerCase()

      // Upsert competitor profile
      const { data: competitor } = await supabase.from('competitors').upsert({
        instagram_handle: handle,
        name: profile.fullName || profile.username || handle,
        followers: profile.followersCount || profile.followers || 0,
        following: profile.followingCount || profile.following || 0,
        bio: profile.biography || profile.bio || '',
        profile_pic_url: profile.profilePicUrl || profile.profilePicUrlHD || '',
        is_verified: profile.verified || profile.isVerified || false,
        category: profile.category || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'instagram_handle' }).select().single()

      if (!competitor) continue

      // Insert posts if available
      const posts = profile.latestPosts || profile.posts || profile.recentPosts || []
      for (const post of posts) {
        const igId = post.id || post.shortCode || post.url
        if (!igId) continue

        await supabase.from('competitor_posts').upsert({
          competitor_id: competitor.id,
          instagram_id: String(igId),
          post_url: post.url || (post.shortCode ? `https://instagram.com/p/${post.shortCode}` : ''),
          post_type: post.type || (post.videoUrl ? 'video' : post.carouselMediaCount ? 'carousel' : 'image'),
          caption: post.caption || post.text || '',
          likes: post.likesCount || post.likes || 0,
          comments: post.commentsCount || post.comments || 0,
          shares: post.sharesCount || post.shares || 0,
          saves: post.savesCount || post.saves || 0,
          views: post.videoViewCount || post.videoPlayCount || post.views || 0,
          posted_at: post.timestamp || post.takenAt || post.postedAt || null,
          hashtags: post.hashtags || (post.caption ? post.caption.match(/#\w+/g) : null) || [],
          thumbnail_url: post.displayUrl || post.thumbnailUrl || post.imageUrl || '',
        }, { onConflict: 'instagram_id' })
      }
    }

    return NextResponse.json({ success: true, profiles: profiles.length })
  } catch (err) {
    console.error('Scraper webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ status: 'Scraper webhook active. Send POST with Apify data.' })
}

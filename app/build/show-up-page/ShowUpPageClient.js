'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const BUILD_STATUS_LINES = [
  'Reading your playbook data...',
  'Checking your voice profile...',
  'Auditing for gaps...',
  'Writing your page copy...',
  'Scripting your videos...',
  'Building the testimonial brief...',
  'Running the QA check...',
]

const DELIVERABLE_TABS = [
  { key: 'preview', label: 'Live Preview', icon: '👁️' },
  { key: 'page_copy', label: 'Page Copy', icon: '📄' },
  { key: 'code', label: 'HTML Code', icon: '</>' },
  { key: 'video_1', label: 'Video 1: Briefing', icon: '🎬' },
  { key: 'video_2', label: 'Video 2: Programme', icon: '🎥' },
  { key: 'video_3', label: 'Video 3: Story', icon: '💎' },
  { key: 'video_4', label: 'Video 4: Filter', icon: '🎯' },
  { key: 'testimonial_brief', label: 'Testimonial Brief', icon: '📨' },
  { key: 'qa_report', label: 'QA Report', icon: '✅' },
]

const GOOGLE_FONTS = [
  { group: 'Bold / Condensed', fonts: ['Oswald', 'Bebas Neue', 'Barlow Condensed', 'Fjalla One', 'Teko'] },
  { group: 'Clean / Modern', fonts: ['Manrope', 'Inter', 'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Space Grotesk'] },
  { group: 'Editorial / Serif', fonts: ['Playfair Display', 'Cormorant Garamond', 'Libre Baskerville', 'Source Serif 4', 'Lora'] },
  { group: 'Display', fonts: ['Orbitron', 'Montserrat', 'Raleway', 'Poppins', 'Sora'] },
]

const DEFAULT_STYLES = {
  bg: '#ffffff', panelBg: '#f8f8f8', accent: '#C9A84C',
  headingColor: '#1a1a1a', subheadingColor: '#C9A84C', bodyColor: '#444444',
  headingFont: 'Manrope', subheadingFont: 'Manrope', bodyFont: 'Manrope',
}

const CALL_PLATFORMS = ['Zoom', 'Google Meet']
const CALL_TYPES = ['Strategy Call', 'Discovery Call', 'Consultation', 'Breakthrough Session']
const LANGUAGES = ['British English', 'American English']

// ── Sub-components ────────────────────────────────────────────────────────────

function GoldLabel({ children }) {
  return <label className="block text-xs font-bold text-gold uppercase tracking-widest mb-2">{children}</label>
}
function Label({ children }) {
  return <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{children}</label>
}
function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition resize-none text-sm" />
}
function TextInput({ value, onChange, placeholder }) {
  return <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition text-sm" />
}

function ImageUpload({ value, onChange, label, clientId }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const upload = async (file) => {
    if (!file || !clientId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { data, error } = await supabase.storage.from('page-images').upload(path, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('page-images').getPublicUrl(data.path)
      onChange(urlData.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div className="mb-2">
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className="w-full h-20 object-cover rounded border border-zinc-700" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded">
            <button onClick={() => inputRef.current?.click()} className="text-[9px] font-bold uppercase tracking-wider text-white bg-zinc-700 px-2 py-1 rounded hover:bg-zinc-600 transition">Replace</button>
            <button onClick={() => onChange('')} className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-zinc-700 px-2 py-1 rounded hover:bg-zinc-600 transition">Remove</button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full py-3 rounded border border-dashed border-zinc-700 hover:border-gold/30 text-zinc-600 hover:text-gold text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? (
            <><div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /> Uploading...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {label || 'Upload Photo'}</>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]) }} />
    </div>
  )
}

function VideoPreview({ url, label }) {
  if (!url) return (
    <div className="w-full rounded border border-dashed border-zinc-700 bg-zinc-800/50 flex items-center justify-center py-6">
      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">{label || 'No video'}</span>
    </div>
  )

  let embedUrl = url
  if (url.includes('youtube.com/watch')) embedUrl = url.replace('watch?v=', 'embed/')
  else if (url.includes('youtu.be/')) embedUrl = 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0]
  else if (url.includes('vimeo.com/')) embedUrl = 'https://player.vimeo.com/video/' + url.split('vimeo.com/')[1].split('?')[0]
  else if (url.includes('loom.com/share/')) embedUrl = url.replace('/share/', '/embed/')

  return (
    <div className="w-full rounded overflow-hidden border border-zinc-700" style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
        allowFullScreen allow="autoplay; fullscreen; picture-in-picture" title={label || 'Video'} />
    </div>
  )
}

function LoadingOverlay({ lines }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setIdx(p => (p + 1) % lines.length), 2500); return () => clearInterval(t) }, [lines])
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gold text-sm font-bold uppercase tracking-widest animate-pulse">{lines[idx]}</p>
      </div>
    </div>
  )
}

function SourceCard({ title, icon, status, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`glass-card overflow-hidden transition-all ${status === 'complete' ? 'gold-glow-border' : 'border border-amber-500/30'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${status === 'complete' ? 'text-gold' : 'text-amber-400'}`}>{status === 'complete' ? 'Complete' : 'Gaps found'}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-white/[0.06]">{children}</div>}
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  const [hex, setHex] = useState(value)
  useEffect(() => setHex(value), [value])
  const handleHex = (v) => { setHex(v); if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v) }
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={e => { onChange(e.target.value); setHex(e.target.value) }} className="w-10 h-10 rounded border border-zinc-700 bg-zinc-800 cursor-pointer" />
        <input type="text" value={hex} onChange={e => handleHex(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-gold" />
      </div>
    </div>
  )
}

function FontSelect({ label, value, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold">
        {GOOGLE_FONTS.map(g => (
          <optgroup key={g.group} label={g.group}>
            {g.fonts.map(f => <option key={f} value={f}>{f}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

function contrastRatio(hex1, hex2) {
  const lum = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const sRGB = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * sRGB(r) + 0.7152 * sRGB(g) + 0.0722 * sRGB(b)
  }
  const l1 = lum(hex1), l2 = lum(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// ── Page Template Builder ─────────────────────────────────────────────────────

function buildPageHTML(output, styles, videoUrls, clientName) {
  const s = { ...DEFAULT_STYLES, ...styles }
  const vids = videoUrls || {}
  const allFonts = [...new Set([s.headingFont, s.subheadingFont, s.bodyFont])].join('&family=').replace(/ /g, '+')

  const embedVideo = (url, fallbackLabel) => {
    if (!url) return `<div style="background:${s.panelBg};border:2px dashed rgba(255,255,255,0.1);border-radius:12px;padding:60px 24px;text-align:center;margin:24px 0;"><p style="color:rgba(255,255,255,0.3);font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">${fallbackLabel}</p></div>`
    let embedUrl = url
    if (url.includes('youtube.com/watch')) embedUrl = url.replace('watch?v=', 'embed/')
    else if (url.includes('youtu.be/')) embedUrl = 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0]
    else if (url.includes('vimeo.com/')) embedUrl = 'https://player.vimeo.com/video/' + url.split('vimeo.com/')[1].split('?')[0]
    else if (url.includes('loom.com/share/')) embedUrl = url.replace('/share/', '/embed/')
    return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:24px 0;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`
  }

  const str = (v) => typeof v === 'string' ? v : (v ? JSON.stringify(v, null, 2) : '')
  const s1 = str(output?.section_1_hero)
  const s2 = str(output?.section_2_reminder)
  const s3 = str(output?.section_3_expect)

  const transformations = Array.isArray(output?.section_4_transformations) ? output.section_4_transformations : []
  const caseStudies = Array.isArray(output?.section_5_casestudies) ? output.section_5_casestudies : []
  const s6 = str(output?.section_6_testimonials_header)
  const writtenTestimonials = Array.isArray(output?.section_7_testimonials) ? output.section_7_testimonials : []

  const transformGrid = transformations.map(t => `
    <div style="text-align:center;">
      <div style="background:${s.panelBg};border-radius:16px;height:280px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;overflow:hidden;">
        <span style="color:${s.bodyColor}40;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Photo</span>
      </div>
      <p style="font-family:var(--heading-font);color:${s.headingColor};font-weight:700;font-size:16px;">${t.name || ''}</p>
      <p style="font-family:var(--body-font);color:${s.bodyColor};font-size:14px;margin-top:4px;line-height:1.6;">${t.context_line || ''}</p>
    </div>`).join('')

  const caseStudyBlocks = caseStudies.map((cs, idx) => {
    const narrative = cs.narrative || [cs.situation, cs.intervention, cs.result_number, cs.life_outcome].filter(Boolean).join(' ')
    const heading = cs.pillar_name || cs.name || ''
    return `
    <div style="display:flex;gap:48px;flex-wrap:wrap;margin-bottom:64px;align-items:center;${idx % 2 === 1 ? 'flex-direction:row-reverse;' : ''}">
      <div style="flex:1;min-width:280px;">
        <div style="background:${s.panelBg};border-radius:16px;height:360px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
          <span style="color:${s.bodyColor}30;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Photo</span>
        </div>
      </div>
      <div style="flex:1;min-width:280px;">
        <h3 style="font-family:var(--heading-font);color:${s.headingColor};font-size:22px;font-weight:700;margin-bottom:16px;">${heading}</h3>
        <p style="font-family:var(--body-font);color:${s.bodyColor};font-size:15px;line-height:1.9;">${narrative}</p>
      </div>
    </div>`
  }).join('')

  const testimonialCards = writtenTestimonials.map(t => `
    <div style="background:${s.panelBg};border-radius:16px;padding:32px;">
      <p style="font-family:var(--body-font);color:${s.bodyColor};font-size:16px;line-height:1.8;font-style:italic;margin-bottom:24px;">"${t.quote || ''}"</p>
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:48px;height:48px;border-radius:50%;background:${s.accent};display:flex;align-items:center;justify-content:center;">
          <span style="color:${s.bg};font-weight:800;font-size:18px;">${(t.name || '?')[0]}</span>
        </div>
        <div>
          <p style="font-family:var(--heading-font);color:${s.headingColor};font-weight:700;font-size:15px;">${t.name || ''}</p>
          ${t.number ? `<p style="font-family:var(--body-font);color:${s.accent};font-size:13px;font-weight:600;">${t.number}</p>` : ''}
        </div>
      </div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${clientName || 'Your Call is Booked'}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=${allFonts}:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--bg:${s.bg};--panel:${s.panelBg};--accent:${s.accent};--heading:${s.headingColor};--subheading:${s.subheadingColor};--body:${s.bodyColor};--heading-font:'${s.headingFont}',sans-serif;--subheading-font:'${s.subheadingFont}',sans-serif;--body-font:'${s.bodyFont}',sans-serif;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:var(--body-font);background:var(--bg);color:var(--body);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}
::selection{background:${s.accent}30;}
a{color:var(--accent);text-decoration:none;}
a:hover{opacity:0.85;}
.container{max-width:880px;margin:0 auto;padding:0 32px;}
.section{padding:80px 0;}
.section+.section{border-top:1px solid ${s.headingColor}0a;}
h1{font-family:var(--heading-font);color:var(--heading);font-size:clamp(32px,5vw,52px);font-weight:800;line-height:1.15;letter-spacing:-0.03em;}
h2{font-family:var(--heading-font);color:var(--heading);font-size:clamp(24px,3.5vw,36px);font-weight:800;line-height:1.2;letter-spacing:-0.02em;margin-bottom:24px;}
h3{font-family:var(--heading-font);color:var(--heading);font-size:20px;font-weight:700;margin-bottom:16px;}
p,li{font-family:var(--body-font);color:var(--body);font-size:16px;line-height:1.8;}
.label{font-family:var(--subheading-font);color:var(--subheading);font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;}
.hero{padding:100px 0 80px;text-align:center;}
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.video-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:16px;margin:32px 0;box-shadow:0 20px 60px ${s.headingColor}10;}
.video-wrap iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
.video-placeholder{background:${s.panelBg};border-radius:16px;padding:80px 24px;text-align:center;margin:32px 0;}
.video-placeholder span{color:${s.bodyColor}40;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}
.reminder-box{background:${s.panelBg};border-radius:16px;padding:40px;margin-top:24px;}
.reminder-box ul{list-style:none;padding:0;margin:20px 0 0;}
.reminder-box li{padding:14px 0;border-bottom:1px solid ${s.headingColor}08;display:flex;align-items:flex-start;gap:14px;font-size:15px;}
.reminder-box li:last-child{border-bottom:none;}
.reminder-box li::before{content:'\\2713';color:${s.accent};font-weight:700;font-size:16px;flex-shrink:0;margin-top:2px;}
.subsection{margin-top:56px;padding-top:56px;border-top:1px solid ${s.headingColor}08;}
@media(max-width:768px){.container{padding:0 20px;}.section{padding:56px 0;}.hero{padding:64px 0 48px;}.grid-2{grid-template-columns:1fr;}.grid-3{grid-template-columns:1fr;}.grid-4{grid-template-columns:repeat(2,1fr);}}
@media(max-width:480px){.grid-4{grid-template-columns:1fr;}}
</style>
</head>
<body>

<!-- SECTION 1: HERO / CONFIRMATION -->
<div class="hero">
<div class="container">
${s1.split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => i === 0 ? `<h1>${l}</h1>` : `<p style="margin-top:20px;font-size:18px;max-width:620px;margin-left:auto;margin-right:auto;color:${s.bodyColor};">${l}</p>`).join('')}
</div>
</div>

<!-- SECTION 2: IMPORTANT REMINDER -->
<div class="section"><div class="container">
<h2>Important Reminder</h2>
<div class="reminder-box">
${s2.split('\n').filter(l => l.trim() && !l.trim().startsWith('- ') && !l.trim().startsWith('* ')).map(l => `<p style="margin-bottom:12px;font-size:15px;">${l.trim()}</p>`).join('')}
<ul>
${s2.split('\n').filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* ')).map(l => `<li>${l.trim().replace(/^[-*]\s*/, '')}</li>`).join('')}
</ul>
</div>
</div></div>

<!-- SECTION 3: WHAT TO EXPECT -->
<div class="section"><div class="container">
<h2>What to Expect</h2>
${s3.split('\n').filter(Boolean).map(l => {
    const trimmed = l.trim()
    if (trimmed.startsWith('##') || trimmed.startsWith('**')) return `<h3 style="margin-top:32px;margin-bottom:12px;">${trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '')}</h3>`
    return `<p style="margin-bottom:16px;font-size:16px;line-height:1.8;">${trimmed}</p>`
  }).join('')}
</div></div>

<!-- SECTION 4: TRANSFORMATIONS -->
<div class="section"><div class="container">
<div style="text-align:center;margin-bottom:48px;">
<p class="label">Real Results</p>
<h2>Life-Changing Transformations</h2>
</div>
<div class="grid-4">${transformGrid || `<div style="grid-column:1/-1;text-align:center;padding:60px;"><span style="color:${s.bodyColor}30;font-size:14px;">Add transformation photos</span></div>`}</div>
</div></div>

<!-- SECTION 5: HOW DOES IT WORK -->
<div class="section"><div class="container">
<div style="text-align:center;margin-bottom:56px;">
<p class="label">The Method</p>
<h2>How Does It Work?</h2>
</div>
${caseStudyBlocks || `<div style="text-align:center;padding:60px;"><span style="color:${s.bodyColor}30;font-size:14px;">Case studies will appear here</span></div>`}
</div></div>

<!-- SECTION 6-7: TESTIMONIALS -->
<div class="section"><div class="container">
<div style="text-align:center;margin-bottom:48px;">
<h2>${str(output?.section_6_testimonials_header) || "Here's What Our Members Think"}</h2>
</div>
<div class="grid-3">${testimonialCards || `<div style="grid-column:1/-1;text-align:center;padding:60px;"><span style="color:${s.bodyColor}30;font-size:14px;">Testimonials will appear here</span></div>`}</div>
</div></div>

<!-- SECTION 8: FOOTER -->
<footer style="padding:56px 32px;text-align:center;border-top:1px solid ${s.headingColor}0a;">
<p style="font-family:var(--body-font);font-size:12px;color:${s.bodyColor}80;letter-spacing:0.05em;">&copy; ${new Date().getFullYear()} ${clientName || ''} &middot; All Rights Reserved</p>
</footer>

</body>
</html>`
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ShowUpPageClient() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [record, setRecord] = useState(null)
  const [currentState, setCurrentState] = useState(1) // 1=sources, 2=build gaps, 3=output, 4=page builder

  // Source data
  const [deData, setDeData] = useState(null)
  const [ppData, setPpData] = useState(null)
  const [offerData, setOfferData] = useState(null)

  // Gap answers
  const [toneProfile, setToneProfile] = useState({ directness: '', formality: '', phrases_use: '', phrases_avoid: '' })
  const [clientWins, setClientWins] = useState([
    { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' },
    { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' },
  ])
  const [deGaps, setDeGaps] = useState({ anti_polish: '', differentiation_thesis: '' })
  const [offerGaps, setOfferGaps] = useState({})

  // Build gaps
  const [buildGaps, setBuildGaps] = useState({
    call_type: 'Strategy Call', call_length: '30 minutes', call_platform: 'Zoom',
    cancellation_policy: '24 hours notice required', booking_tool: '', guarantee: '', language: 'British English',
  })

  // Output
  const [generatedOutput, setGeneratedOutput] = useState(null)
  const [activeTab, setActiveTab] = useState('preview')
  const [generating, setGenerating] = useState(false)
  const [apiError, setApiError] = useState('')
  const [aiGaps, setAiGaps] = useState(null)

  // State 4: Page builder
  const [styles, setStyles] = useState({ ...DEFAULT_STYLES })
  const [videoUrls, setVideoUrls] = useState({ video_1: '', video_2: '', video_3: '', video_4: '', testimonial_1: '', testimonial_2: '' })
  const [viewportMode, setViewportMode] = useState('desktop')
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [pageHTML, setPageHTML] = useState('')
  const [generatingHTML, setGeneratingHTML] = useState(false)
  const [images, setImages] = useState({
    logo: '',
    transformations: ['', '', ''],
    case_studies: ['', '', ''],
    testimonial_photos: [],
  })

  const saveTimerRef = useRef(null)
  const toastRef = useRef(null)
  const toastTimerRef = useRef(null)

  const flash = useCallback((msg = 'Saved') => {
    if (toastRef.current) {
      toastRef.current.textContent = msg
      toastRef.current.style.opacity = '1'
      toastRef.current.style.transform = 'translateY(0)'
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => { if (toastRef.current) { toastRef.current.style.opacity = '0'; toastRef.current.style.transform = 'translateY(1rem)' } }, 2000)
    }
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: client } = await supabase.from('clients').select('*').eq('email', session.user.email).single()
      if (!client) { router.push('/client'); return }
      setClientData(client)

      const [deRes, ppRes, offerRes, recordRes] = await Promise.all([
        supabase.from('distinction_engine').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('premium_position').select('*').eq('client_id', client.id).maybeSingle(),
        supabase.from('offer_playbooks').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('show_up_pages').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      if (deRes.data) setDeData(deRes.data)
      if (ppRes.data) setPpData(ppRes.data)
      if (offerRes.data) setOfferData(offerRes.data)

      if (recordRes.data) {
        setRecord(recordRes.data)
        if (recordRes.data.tone_profile && Object.keys(recordRes.data.tone_profile).length) setToneProfile(recordRes.data.tone_profile)
        if (recordRes.data.client_wins?.length) setClientWins(recordRes.data.client_wins)
        if (recordRes.data.build_gaps && Object.keys(recordRes.data.build_gaps).length) setBuildGaps(prev => ({ ...prev, ...recordRes.data.build_gaps }))
        if (recordRes.data.gap_answers?.de) setDeGaps(recordRes.data.gap_answers.de)
        if (recordRes.data.gap_answers?.offer) setOfferGaps(recordRes.data.gap_answers.offer)
        if (recordRes.data.generated_output && Object.keys(recordRes.data.generated_output).length) {
          setGeneratedOutput(recordRes.data.generated_output)
          setCurrentState(4)
        }
        if (recordRes.data.style_config) setStyles(prev => ({ ...prev, ...recordRes.data.style_config }))
        if (recordRes.data.video_urls) setVideoUrls(prev => ({ ...prev, ...recordRes.data.video_urls }))
        if (recordRes.data.page_html) setPageHTML(recordRes.data.page_html)
        if (recordRes.data.images) setImages(prev => ({ ...prev, ...recordRes.data.images }))
      }

      if (ppRes.data?.brand_star?.tone) setToneProfile(prev => ({ ...prev, ...ppRes.data.brand_star.tone }))
      setLoading(false)
    }
    init()
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  const saveToSupabase = useCallback(async (fields = {}) => {
    if (!clientData) return
    const payload = {
      client_id: clientData.id, tone_profile: toneProfile, client_wins: clientWins,
      build_gaps: buildGaps, gap_answers: { de: deGaps, offer: offerGaps },
      generated_output: generatedOutput || {}, style_config: styles, video_urls: videoUrls, page_html: pageHTML || '', images: images,
      status: generatedOutput ? 'complete' : 'draft', updated_at: new Date().toISOString(), ...fields,
    }
    if (record) { await supabase.from('show_up_pages').update(payload).eq('id', record.id) }
    else { const { data: n } = await supabase.from('show_up_pages').insert(payload).select().single(); if (n) setRecord(n) }
    flash()
  }, [clientData, record, toneProfile, clientWins, buildGaps, deGaps, offerGaps, generatedOutput, styles, videoUrls, images])

  const debouncedSave = useCallback((f = {}) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveToSupabase(f), 800)
  }, [saveToSupabase])

  const writeToneBack = useCallback(async () => {
    if (!ppData || !clientData) return
    await supabase.from('premium_position').update({ brand_star: { ...(ppData.brand_star || {}), tone: toneProfile }, updated_at: new Date().toISOString() }).eq('client_id', clientData.id)
  }, [ppData, clientData, toneProfile])

  // ── Gap detection ─────────────────────────────────────────────────────────

  const deEngine = deData?.engine_data || {}
  const deComplete = !!(deEngine.problem_1 && deEngine.pillar_1 && deEngine.promise && (deData?.generated_output || deGaps.differentiation_thesis))
  const ppStar = ppData?.brand_star || {}
  const ppHero = ppData?.hero || {}
  const ppRemarkable = ppData?.remarkable || {}
  const ppComplete = !!(ppStar.specific_description && ppStar.refuse && ppRemarkable.differentiator && toneProfile.directness)
  const bb = offerData?.bang_bang || {}
  const comms = offerData?.comms || {}
  const offerComplete = !!(bb.name && bb.phases?.length > 0 && (bb.delivery_model?.length > 0 || comms.calls_1_1))
  const winsComplete = clientWins.filter(w => w.name && w.result_number && w.life_outcome).length >= 2

  // ── Build page ────────────────────────────────────────────────────────────

  const buildPage = async () => {
    setGenerating(true); setApiError(''); setAiGaps(null)
    await writeToneBack(); await saveToSupabase()
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'show-up-page', data: {
          tone_profile: toneProfile,
          distinction_engine: { ...deEngine, generated_output: deData?.generated_output || '', anti_polish: deGaps.anti_polish || '', differentiation_thesis: deGaps.differentiation_thesis || deEngine.promise || '' },
          premium_position: { brand_star: ppStar, hero: ppHero, remarkable: ppRemarkable },
          sold_out: { bang_bang: bb, comms, icp: offerData?.icp || {} },
          client_wins: clientWins.filter(w => w.name && w.result_number),
          build_gaps: buildGaps, gap_answers: { de: deGaps, offer: offerGaps },
        }}),
      })
      const result = await res.json()
      console.log('Show Up raw result keys:', Object.keys(result))
      console.log('Show Up raw result preview:', JSON.stringify(result).slice(0, 800))

      if (result.error) { setApiError(result.error) }
      else if (result.gaps) { setAiGaps(result.gaps) }
      else if (result.plan && typeof result.plan === 'string') {
        // Fell through to default text handler — try to parse it as JSON
        try {
          const cleaned = result.plan.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned)
          console.log('Parsed from plan text, keys:', Object.keys(parsed))
          setGeneratedOutput(parsed)
          setCurrentState(4)
          await saveToSupabase({ generated_output: parsed, status: 'complete' })
          generatePageHTML(parsed)
        } catch (e) {
          // Plain text — put it all in section_1_hero
          const output = { section_1_hero: result.plan, video_1: '', video_2: '', video_3: '', video_4: '', testimonial_brief: '', qa_report: '' }
          setGeneratedOutput(output)
          setCurrentState(4)
          await saveToSupabase({ generated_output: output, status: 'complete' })
          generatePageHTML(output)
        }
      } else {
        // Direct JSON response — normalise if needed
        const output = result.section_1_hero ? result : { ...result }
        console.log('Direct JSON output keys:', Object.keys(output))
        setGeneratedOutput(output)
        setCurrentState(4)
        await saveToSupabase({ generated_output: output, status: 'complete' })
        generatePageHTML(output)
      }
    } catch (err) { setApiError('Failed to connect. Please try again.') }
    setGenerating(false)
  }

  // ── Generate HTML page (second AI call) ───────────────────────────────────

  const generatePageHTML = async (output) => {
    const contentToUse = output || generatedOutput
    if (!contentToUse) return
    setGeneratingHTML(true)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'show-up-page-html', data: {
          generated_output: contentToUse,
          styles, video_urls: videoUrls, images,
          client_name: ppStar.name || clientData?.name || '',
        }}),
      })
      const result = await res.json()
      if (result.html) {
        setPageHTML(result.html)
        await saveToSupabase({ page_html: result.html })
      } else if (result.plan) {
        // Fell through — the plan IS the HTML
        const html = result.plan.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim()
        setPageHTML(html)
        await saveToSupabase({ page_html: html })
      } else if (result.error) {
        setApiError('HTML generation failed: ' + result.error)
      }
    } catch (err) { setApiError('Failed to generate page. Try again.') }
    setGeneratingHTML(false)
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  // Inject live images and videos into the HTML without regenerating
  const injectMedia = (html) => {
    if (!html) return html
    let result = html

    // Inject video embeds — find placeholder divs and replace with iframes
    const videoMap = {
      'Video 1': videoUrls.video_1, 'Call Briefing': videoUrls.video_1,
      'Video 2': videoUrls.video_2, 'Programme': videoUrls.video_2,
      'Video 3': videoUrls.video_3, 'Differentiation': videoUrls.video_3,
      'Video 4': videoUrls.video_4, 'Commitment': videoUrls.video_4,
      'Testimonial Video 1': videoUrls.testimonial_1, 'Testimonial 1': videoUrls.testimonial_1,
      'Testimonial Video 2': videoUrls.testimonial_2, 'Testimonial 2': videoUrls.testimonial_2,
    }
    for (const [label, url] of Object.entries(videoMap)) {
      if (!url) continue
      let embedUrl = url
      if (url.includes('youtube.com/watch')) embedUrl = url.replace('watch?v=', 'embed/')
      else if (url.includes('youtu.be/')) embedUrl = 'https://www.youtube.com/embed/' + url.split('youtu.be/')[1].split('?')[0]
      else if (url.includes('vimeo.com/')) embedUrl = 'https://player.vimeo.com/video/' + url.split('vimeo.com/')[1].split('?')[0]
      else if (url.includes('loom.com/share/')) embedUrl = url.replace('/share/', '/embed/')
      // Replace placeholder divs that mention this label
      const placeholderRegex = new RegExp(`<div[^>]*>[^<]*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</div>`, 'gi')
      const iframe = `<div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`
      result = result.replace(placeholderRegex, iframe)
    }

    // Inject transformation images
    const transformUrls = (images.transformations || []).filter(Boolean)
    if (transformUrls.length > 0) {
      // Find photo placeholder divs and replace them one by one
      let tIdx = 0
      result = result.replace(/<div[^>]*>([^<]*Photo[^<]*)<\/div>/gi, (match) => {
        // Only replace in the transformations section area (first batch of placeholders)
        if (tIdx < transformUrls.length) {
          const url = transformUrls[tIdx++]
          return `<img src="${url}" alt="Transformation" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
        }
        return match
      })
    }

    // Inject case study images
    const caseUrls = (images.case_studies || []).filter(Boolean)
    if (caseUrls.length > 0) {
      let cIdx = 0
      // Case study photo placeholders appear after transformation ones
      result = result.replace(/<div[^>]*>([^<]*Photo[^<]*)<\/div>/gi, (match) => {
        if (cIdx < caseUrls.length) {
          const url = caseUrls[cIdx++]
          return `<img src="${url}" alt="Case study" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
        }
        return match
      })
    }

    // Inject logo
    if (images.logo) {
      result = result.replace(/(<footer[\s\S]*?)(<div[^>]*>Logo<\/div>|Logo placeholder)/i, `$1<img src="${images.logo}" alt="Logo" style="max-height:48px;width:auto;" />`)
    }

    // Update CSS variables for live style changes
    result = result.replace(/--bg:[^;]+;/, `--bg:${styles.bg};`)
    result = result.replace(/--panel-bg:[^;]+;/, `--panel-bg:${styles.panelBg};`)
    result = result.replace(/--accent:[^;]+;/, `--accent:${styles.accent};`)
    result = result.replace(/--heading-color:[^;]+;/, `--heading-color:${styles.headingColor};`)
    result = result.replace(/--subheading-color:[^;]+;/, `--subheading-color:${styles.subheadingColor};`)
    result = result.replace(/--body-color:[^;]+;/, `--body-color:${styles.bodyColor};`)
    result = result.replace(/--heading-font:[^;]+;/, `--heading-font:'${styles.headingFont}',sans-serif;`)
    result = result.replace(/--body-font:[^;]+;/, `--body-font:'${styles.bodyFont}',sans-serif;`)

    return result
  }

  const getFullHTML = () => injectMedia(pageHTML) || buildPageHTML(generatedOutput, styles, videoUrls, ppStar.name || clientData?.name || '')

  const downloadHTML = () => {
    const html = getFullHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'show-up-page.html'; a.click()
    URL.revokeObjectURL(url)
    flash('Downloaded!')
  }

  // ── Contrast warnings ─────────────────────────────────────────────────────

  const headingContrast = contrastRatio(styles.headingColor, styles.bg)
  const bodyContrast = contrastRatio(styles.bodyColor, styles.bg)
  const subContrast = contrastRatio(styles.subheadingColor, styles.bg)

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid text-white">
      {(generating || (generatingHTML && currentState < 4)) && <LoadingOverlay lines={BUILD_STATUS_LINES} />}
      <div ref={toastRef} className="fixed bottom-6 right-6 bg-gold text-zinc-950 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest z-50 transition-all duration-300 opacity-0 translate-y-4 pointer-events-none">Saved</div>

      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <button onClick={() => router.push('/client')} className="text-zinc-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
        <span className="text-xs font-display font-bold text-gold uppercase tracking-widest">Show Up Page Builder</span>
        <div className="w-6" />
      </div>

      {/* States 1-3: Input flow */}
      {currentState < 4 && (
        <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold tracking-tight mb-1">The Show Up Page Builder</h1>
            <p className="text-zinc-500 text-sm">Generate your complete booking thank-you page from your playbook data.</p>
          </div>

          {apiError && <div className="glass-card p-4 mb-6 border-red-500/30"><p className="text-red-400 text-sm">{apiError}</p><button onClick={() => setApiError('')} className="text-red-400 underline text-xs mt-1">Dismiss</button></div>}

          {aiGaps && (
            <div className="glass-card p-5 mb-6 border-amber-500/30">
              <GoldLabel>Gaps Found During Build</GoldLabel>
              <div className="space-y-3">{aiGaps.map((g, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">{g.source}</p>
                  <p className="text-sm text-zinc-300 mb-2">{g.question}</p>
                  <TextInput value={deGaps[g.missing] || offerGaps[g.missing] || ''} onChange={v => { if (g.source?.toLowerCase().includes('distinction')) setDeGaps(p => ({ ...p, [g.missing]: v })); else setOfferGaps(p => ({ ...p, [g.missing]: v })); debouncedSave() }} placeholder="Your answer..." />
                </div>
              ))}</div>
              <button onClick={buildPage} disabled={generating} className="mt-4 w-full px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50">Rebuild</button>
            </div>
          )}

          {/* Source Cards */}
          <div className="space-y-4 mb-8">
            <GoldLabel>Your Data Sources</GoldLabel>

            <SourceCard title="Distinction Engine" icon="⚙️" status={deComplete ? 'complete' : 'gaps'} defaultOpen={!deComplete}>
              <div className="space-y-3 mt-3">
                {deEngine.problem_1 && <div className="text-sm text-zinc-300"><p><span className="text-gold font-bold">Problems:</span> {deEngine.problem_1}, {deEngine.problem_2}, {deEngine.problem_3}</p><p className="mt-1"><span className="text-gold font-bold">Pillars:</span> {deEngine.pillar_1}, {deEngine.pillar_2}, {deEngine.pillar_3}</p><p className="mt-1"><span className="text-gold font-bold">Promise:</span> {deEngine.promise}</p></div>}
                {!deEngine.problem_1 && <p className="text-amber-400 text-xs">No Distinction Engine data. Complete it first or answer below.</p>}
                <div><Label>What makes your approach genuinely different?</Label><TextArea value={deGaps.differentiation_thesis} onChange={v => { setDeGaps(p => ({ ...p, differentiation_thesis: v })); debouncedSave() }} placeholder="The real reason your method works..." rows={2} /></div>
                <div><Label>Your anti-polish line</Label><TextInput value={deGaps.anti_polish} onChange={v => { setDeGaps(p => ({ ...p, anti_polish: v })); debouncedSave() }} placeholder="e.g. 'I won't hold your hand, but I won't let you quit either'" /></div>
              </div>
            </SourceCard>

            <SourceCard title="Premium Position" icon="👑" status={ppComplete ? 'complete' : 'gaps'} defaultOpen={!ppComplete}>
              <div className="space-y-3 mt-3">
                {ppStar.specific_description && <div className="text-sm text-zinc-300"><p><span className="text-gold font-bold">Works with:</span> {ppStar.specific_description}</p>{ppStar.refuse && <p className="mt-1"><span className="text-gold font-bold">Refuses:</span> {ppStar.refuse}</p>}</div>}
                <div className="bg-zinc-800/30 rounded-lg p-4"><GoldLabel>Voice & Tone</GoldLabel>
                  <div className="space-y-3">
                    <div><Label>How direct are you?</Label><TextInput value={toneProfile.directness} onChange={v => { setToneProfile(p => ({ ...p, directness: v })); debouncedSave() }} placeholder="e.g. Very direct but warm underneath" /></div>
                    <div><Label>Formality? Profanity?</Label><TextInput value={toneProfile.formality} onChange={v => { setToneProfile(p => ({ ...p, formality: v })); debouncedSave() }} placeholder="e.g. Casual, occasional swearing" /></div>
                    <div><Label>Phrases you use</Label><TextArea value={toneProfile.phrases_use} onChange={v => { setToneProfile(p => ({ ...p, phrases_use: v })); debouncedSave() }} placeholder="e.g. 'let's go', 'no fluff'" rows={2} /></div>
                    <div><Label>Phrases you'd never use</Label><TextArea value={toneProfile.phrases_avoid} onChange={v => { setToneProfile(p => ({ ...p, phrases_avoid: v })); debouncedSave() }} placeholder="e.g. 'unlock your potential'" rows={2} /></div>
                  </div>
                </div>
              </div>
            </SourceCard>

            <SourceCard title="Sold Out Offer" icon="📖" status={offerComplete ? 'complete' : 'gaps'} defaultOpen={!offerComplete}>
              <div className="mt-3">{bb.name ? <div className="text-sm text-zinc-300"><p><span className="text-gold font-bold">Programme:</span> {bb.name}</p><p className="mt-1"><span className="text-gold font-bold">Promise:</span> {bb.promise}</p></div> : <p className="text-amber-400 text-xs">No Sold Out data. Complete the playbook first.</p>}</div>
            </SourceCard>

            <SourceCard title="Client Wins" icon="🏆" status={winsComplete ? 'complete' : 'gaps'} defaultOpen={!winsComplete}>
              <div className="space-y-4 mt-3">
                <p className="text-zinc-400 text-xs">At least 2 wins with name, number, and life outcome.</p>
                {clientWins.map((win, i) => (
                  <div key={i} className={i > 0 ? 'pt-4 border-t border-zinc-700/50' : ''}>
                    <span className="text-xs font-bold text-gold uppercase tracking-widest">Win {i + 1}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div><Label>Name / initials</Label><TextInput value={win.name} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], name: v }; setClientWins(u); debouncedSave({ client_wins: u }) }} /></div>
                      <div><Label>Result (a number)</Label><TextInput value={win.result_number} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], result_number: v }; setClientWins(u); debouncedSave({ client_wins: u }) }} /></div>
                    </div>
                    <div className="mt-2"><Label>Before (the scene)</Label><TextArea value={win.before} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], before: v }; setClientWins(u); debouncedSave({ client_wins: u }) }} rows={2} /></div>
                    <div className="mt-2"><Label>What failed before</Label><TextArea value={win.tried_failed} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], tried_failed: v }; setClientWins(u); debouncedSave({ client_wins: u }) }} rows={2} /></div>
                    <div className="mt-2"><Label>Life outcome</Label><TextArea value={win.life_outcome} onChange={v => { const u = [...clientWins]; u[i] = { ...u[i], life_outcome: v }; setClientWins(u); debouncedSave({ client_wins: u }) }} rows={2} /></div>
                  </div>
                ))}
                <button onClick={() => { const u = [...clientWins, { name: '', before: '', tried_failed: '', process: '', result_number: '', life_outcome: '', recommend_to: '', type: 'written' }]; setClientWins(u); debouncedSave({ client_wins: u }) }} className="w-full px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-gold border border-dashed border-zinc-700 hover:border-gold/30 transition">+ Add Win</button>
              </div>
            </SourceCard>
          </div>

          {/* Build gaps */}
          <div className="glass-card p-5 mb-8">
            <GoldLabel>Call & Page Details</GoldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Call type</Label><select value={buildGaps.call_type} onChange={e => { setBuildGaps(p => ({ ...p, call_type: e.target.value })); debouncedSave() }} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold">{CALL_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><Label>Call length</Label><TextInput value={buildGaps.call_length} onChange={v => { setBuildGaps(p => ({ ...p, call_length: v })); debouncedSave() }} placeholder="30 minutes" /></div>
              <div><Label>Platform</Label><select value={buildGaps.call_platform} onChange={e => { setBuildGaps(p => ({ ...p, call_platform: e.target.value })); debouncedSave() }} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold">{CALL_PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></div>
              <div><Label>Booking tool</Label><TextInput value={buildGaps.booking_tool} onChange={v => { setBuildGaps(p => ({ ...p, booking_tool: v })); debouncedSave() }} placeholder="Calendly" /></div>
              <div><Label>Cancellation policy</Label><TextInput value={buildGaps.cancellation_policy} onChange={v => { setBuildGaps(p => ({ ...p, cancellation_policy: v })); debouncedSave() }} placeholder="24 hours notice" /></div>
              <div><Label>Guarantee</Label><TextInput value={buildGaps.guarantee} onChange={v => { setBuildGaps(p => ({ ...p, guarantee: v })); debouncedSave() }} placeholder="Optional" /></div>
              <div><Label>Language</Label><select value={buildGaps.language} onChange={e => { setBuildGaps(p => ({ ...p, language: e.target.value })); debouncedSave() }} className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gold">{LANGUAGES.map(l => <option key={l}>{l}</option>)}</select></div>
            </div>
          </div>

          <button onClick={buildPage} disabled={generating} className="w-full px-5 py-4 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-sm uppercase tracking-widest transition disabled:opacity-50">{generating ? 'Building...' : 'Build My Show Up Page'}</button>
        </div>
      )}

      {/* State 4: Page Builder */}
      {currentState === 4 && generatedOutput && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] lg:h-screen overflow-hidden">
          {/* Controls sidebar */}
          <div className={`${showStylePanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:static top-0 left-0 z-30 w-80 h-full glass-sidebar flex flex-col overflow-y-auto transition-transform lg:transition-none`}>
            <div className="p-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest">Page Builder</h2>
            </div>

            {/* Viewport toggle */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex gap-2">
              <button onClick={() => setViewportMode('desktop')} className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition ${viewportMode === 'desktop' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>Desktop</button>
              <button onClick={() => setViewportMode('mobile')} className={`flex-1 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition ${viewportMode === 'mobile' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>Mobile</button>
            </div>

            {/* Tabs */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex gap-1 overflow-x-auto scrollbar-none">
              {DELIVERABLE_TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-2.5 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 transition border flex items-center gap-1 ${activeTab === t.key ? 'bg-gold/20 text-gold border-gold/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}><span>{t.icon}</span><span>{t.label}</span></button>
              ))}
            </div>

            {/* Style controls */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
              <GoldLabel>Colours</GoldLabel>
              <ColorPicker label="Page Background" value={styles.bg} onChange={v => { setStyles(p => ({ ...p, bg: v })); debouncedSave() }} />
              <ColorPicker label="Panel Background" value={styles.panelBg} onChange={v => { setStyles(p => ({ ...p, panelBg: v })); debouncedSave() }} />
              <ColorPicker label="Accent" value={styles.accent} onChange={v => { setStyles(p => ({ ...p, accent: v })); debouncedSave() }} />
              <ColorPicker label="Heading" value={styles.headingColor} onChange={v => { setStyles(p => ({ ...p, headingColor: v })); debouncedSave() }} />
              <ColorPicker label="Subheading" value={styles.subheadingColor} onChange={v => { setStyles(p => ({ ...p, subheadingColor: v })); debouncedSave() }} />
              <ColorPicker label="Body Text" value={styles.bodyColor} onChange={v => { setStyles(p => ({ ...p, bodyColor: v })); debouncedSave() }} />

              {/* Contrast warnings */}
              {headingContrast < 4.5 && <p className="text-red-400 text-[10px] font-bold">Warning: Heading contrast too low ({headingContrast.toFixed(1)}:1)</p>}
              {bodyContrast < 4.5 && <p className="text-red-400 text-[10px] font-bold">Warning: Body text contrast too low ({bodyContrast.toFixed(1)}:1)</p>}
              {subContrast < 3 && <p className="text-amber-400 text-[10px] font-bold">Warning: Subheading contrast low ({subContrast.toFixed(1)}:1)</p>}

              <div className="pt-2"><GoldLabel>Fonts</GoldLabel></div>
              <FontSelect label="Headings" value={styles.headingFont} onChange={v => { setStyles(p => ({ ...p, headingFont: v })); debouncedSave() }} />
              <FontSelect label="Subheadings" value={styles.subheadingFont} onChange={v => { setStyles(p => ({ ...p, subheadingFont: v })); debouncedSave() }} />
              <FontSelect label="Body" value={styles.bodyFont} onChange={v => { setStyles(p => ({ ...p, bodyFont: v })); debouncedSave() }} />

              <div className="pt-2"><GoldLabel>Videos</GoldLabel></div>
              {[['video_1', 'Hero: Call Briefing'], ['video_2', 'Programme Overview'], ['video_3', 'Differentiation Story'], ['video_4', 'Commitment Filter'], ['testimonial_1', 'Testimonial Video 1'], ['testimonial_2', 'Testimonial Video 2']].map(([k, l]) => (
                <div key={k} className="mb-3">
                  <Label>{l}</Label>
                  <TextInput value={videoUrls[k]} onChange={v => { setVideoUrls(p => ({ ...p, [k]: v })); debouncedSave() }} placeholder="YouTube, Vimeo, or Loom URL" />
                  {videoUrls[k] && <div className="mt-2"><VideoPreview url={videoUrls[k]} label={l} /></div>}
                </div>
              ))}

              <div className="pt-2"><GoldLabel>Logo</GoldLabel></div>
              <ImageUpload value={images.logo} clientId={clientData?.id} onChange={v => { setImages(p => ({ ...p, logo: v })); debouncedSave() }} label="Upload Logo" />

              <div className="pt-2"><GoldLabel>Transformation Photos ({images.transformations.length})</GoldLabel></div>
              <p className="text-zinc-600 text-[10px] mb-2">Before/after or progress photos for the grid.</p>
              <div className="grid grid-cols-3 gap-1">
                {images.transformations.map((url, i) => (
                  <div key={i} className="relative">
                    <ImageUpload value={url} clientId={clientData?.id} label={`${i + 1}`}
                      onChange={v => { const u = [...images.transformations]; u[i] = v; setImages(p => ({ ...p, transformations: u })); debouncedSave() }} />
                    {images.transformations.length > 1 && (
                      <button onClick={() => { const u = images.transformations.filter((_, j) => j !== i); setImages(p => ({ ...p, transformations: u })); debouncedSave() }}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-900/80 text-red-300 rounded-full text-[10px] flex items-center justify-center hover:bg-red-800 transition z-10">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => { setImages(p => ({ ...p, transformations: [...p.transformations, ''] })); debouncedSave() }}
                className="w-full mt-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-gold border border-dashed border-zinc-700 hover:border-gold/30 rounded transition">+ Add Photo</button>

              <div className="pt-2"><GoldLabel>Case Study Photos ({images.case_studies.length})</GoldLabel></div>
              <p className="text-zinc-600 text-[10px] mb-2">One photo per case study / pillar.</p>
              {images.case_studies.map((url, i) => (
                <div key={i} className="relative">
                  <ImageUpload value={url} clientId={clientData?.id} label={`Pillar ${i + 1}`}
                    onChange={v => { const u = [...images.case_studies]; u[i] = v; setImages(p => ({ ...p, case_studies: u })); debouncedSave() }} />
                  {images.case_studies.length > 1 && (
                    <button onClick={() => { const u = images.case_studies.filter((_, j) => j !== i); setImages(p => ({ ...p, case_studies: u })); debouncedSave() }}
                      className="absolute top-0 right-0 w-5 h-5 bg-red-900/80 text-red-300 rounded-full text-[10px] flex items-center justify-center hover:bg-red-800 transition z-10">✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => { setImages(p => ({ ...p, case_studies: [...p.case_studies, ''] })); debouncedSave() }}
                className="w-full mt-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-gold border border-dashed border-zinc-700 hover:border-gold/30 rounded transition">+ Add Photo</button>

              <div className="pt-2"><GoldLabel>Written Testimonials + Photos</GoldLabel></div>
              <p className="text-zinc-600 text-[10px] mb-2">Upload the photo that matches each testimonial.</p>
              {(() => {
                const testimonials = Array.isArray(generatedOutput?.section_6_testimonials) ? generatedOutput.section_6_testimonials : []
                // Ensure we have enough photo slots for all testimonials
                const photos = images.testimonial_photos || []
                while (photos.length < testimonials.length) photos.push('')
                return testimonials.length > 0 ? testimonials.map((t, i) => (
                  <div key={i} className="mb-3 bg-zinc-800/30 rounded-lg p-3">
                    <div className="flex gap-3">
                      <div className="w-16 flex-shrink-0">
                        <ImageUpload value={photos[i] || ''} clientId={clientData?.id} label="Photo"
                          onChange={v => { const u = [...photos]; u[i] = v; setImages(p => ({ ...p, testimonial_photos: u })); debouncedSave() }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gold">{t.name || `Testimonial ${i + 1}`}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-3">{typeof t.quote === 'string' ? t.quote.slice(0, 120) + '...' : ''}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-zinc-600 text-[10px]">Build the page first to see testimonials here.</p>
                )
              })()}
            </div>

            {/* Export */}
            <div className="p-4 border-t border-white/[0.06] space-y-2">
              <button onClick={downloadHTML} className="w-full px-4 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-[10px] uppercase tracking-widest transition">Download HTML</button>
              <button onClick={() => { navigator.clipboard.writeText(getFullHTML()); flash('HTML Copied!') }} className="w-full px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 transition">Copy Code</button>
              <button onClick={() => { setCurrentState(1); setGeneratedOutput(null) }} className="w-full px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-white transition">← Edit Inputs & Rebuild</button>
              <button onClick={() => router.push('/client')} className="w-full px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">← Dashboard</button>
            </div>
          </div>

          {/* Mobile toggle for style panel */}
          <button onClick={() => setShowStylePanel(!showStylePanel)} className="lg:hidden fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-gold text-zinc-950 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          </button>
          {showStylePanel && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowStylePanel(false)} />}

          {/* Preview / Content area */}
          <div className="flex-1 flex flex-col min-w-0 bg-zinc-900/50">
            {/* Tab content for non-preview tabs */}
            {/* Page Copy tab — all 8 sections with individual copy buttons */}
            {activeTab === 'page_copy' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                  {[
                    { key: 'section_1_hero', label: 'Hero / Confirmation', icon: '🏆' },
                    { key: 'section_2_reminder', label: 'Important Reminder', icon: '⚠️' },
                    { key: 'section_2_expect_intro', label: 'What to Expect Intro', icon: '📺' },
                    { key: 'section_2_card_1_title', label: 'Programme Card Title', icon: '🎯' },
                    { key: 'section_2_card_1_text', label: 'Programme Card Text', icon: '🎯' },
                    { key: 'section_2_card_2_title', label: "I'll Have Your Back Title", icon: '🤝' },
                    { key: 'section_2_card_2_text', label: "I'll Have Your Back Text", icon: '🤝' },
                    { key: 'section_2_card_3_title', label: 'Commitment Title', icon: '💪' },
                    { key: 'section_2_card_3_text', label: 'Commitment Text', icon: '💪' },
                    { key: 'section_4_casestudies', label: 'Case Studies', icon: '📖' },
                    { key: 'section_5_video_testimonials_heading', label: 'Video Testimonials Heading', icon: '🎥' },
                    { key: 'section_6_testimonials', label: 'Written Testimonials', icon: '💬' },
                  ].map(sec => {
                    const raw = generatedOutput?.[sec.key]
                    const display = !raw ? 'Not generated' : typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)
                    return (
                      <details key={sec.key} className="glass-card overflow-hidden group" open>
                        <summary className="flex items-center justify-between px-5 py-3 cursor-pointer border-b border-white/[0.06] list-none">
                          <span className="text-xs font-bold text-gold uppercase tracking-widest">{sec.icon} {sec.label}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={e => { e.preventDefault(); navigator.clipboard.writeText(display); flash('Copied!') }}
                              className="px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition">Copy</button>
                            <svg className="w-4 h-4 text-zinc-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </summary>
                        <div className="p-5 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{display}</div>
                      </details>
                    )
                  })}
                  {/* Copy all sections at once */}
                  <button onClick={() => {
                    const allCopy = ['section_1_hero', 'section_2_reminder', 'section_2_expect_intro', 'section_2_card_1_title', 'section_2_card_1_text', 'section_2_card_2_title', 'section_2_card_2_text', 'section_2_card_3_title', 'section_2_card_3_text', 'section_4_casestudies', 'section_5_video_testimonials_heading', 'section_6_testimonials']
                      .map(k => {
                        const v = generatedOutput?.[k]
                        const label = k.replace('section_', 'SECTION ').replace(/_/g, ' ').toUpperCase()
                        const text = typeof v === 'string' ? v : v ? JSON.stringify(v, null, 2) : ''
                        return `--- ${label} ---\n${text}`
                      }).join('\n\n')
                    navigator.clipboard.writeText(allCopy)
                    flash('All copy copied!')
                  }} className="w-full px-4 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-[10px] uppercase tracking-widest transition">
                    Copy All Page Copy
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'preview' && activeTab !== 'code' && activeTab !== 'page_copy' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  {(() => {
                    const content = generatedOutput[activeTab]
                    const tab = DELIVERABLE_TABS.find(t => t.key === activeTab)
                    const display = typeof content === 'string' ? content : content ? JSON.stringify(content, null, 2) : 'Not generated. Try rebuilding.'
                    return (
                      <div className="glass-card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                          <span className="text-xs font-bold text-gold uppercase tracking-widest">{tab?.icon} {tab?.label}</span>
                          <button onClick={() => { navigator.clipboard.writeText(display); flash('Copied!') }} className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition">Copy</button>
                        </div>
                        <div className="p-5 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{display}</div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Code tab */}
            {activeTab === 'code' && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                    <span className="text-xs font-bold text-gold uppercase tracking-widest">{'</>'} HTML Code</span>
                    <button onClick={() => { navigator.clipboard.writeText(getFullHTML()); flash('HTML Copied!') }} className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition">Copy</button>
                  </div>
                  <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
                    <pre className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-all">{getFullHTML()}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Live preview */}
            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col items-center p-4 overflow-y-auto bg-[repeating-conic-gradient(rgba(255,255,255,0.03)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
                {generatingHTML && (
                  <div className="flex items-center gap-3 mb-4 px-4 py-3 glass-card">
                    <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-gold text-xs font-bold uppercase tracking-widest animate-pulse">Building your page...</span>
                  </div>
                )}
                {!pageHTML && !generatingHTML && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <p className="text-zinc-500 text-sm">No page generated yet.</p>
                    <button onClick={() => generatePageHTML()} disabled={generatingHTML || !generatedOutput}
                      className="px-5 py-3 rounded-lg bg-gold hover:bg-gold-light text-zinc-950 font-bold text-xs uppercase tracking-widest transition disabled:opacity-50">
                      Generate Page
                    </button>
                  </div>
                )}
                {pageHTML && (
                  <>
                    <div className="rounded-lg overflow-hidden shadow-2xl border border-white/[0.06] transition-all duration-300 flex-1" style={{ width: viewportMode === 'mobile' ? '375px' : '100%', maxWidth: '1280px', height: viewportMode === 'mobile' ? 'calc(100vh - 160px)' : 'calc(100vh - 120px)' }}>
                      <iframe key={JSON.stringify(videoUrls) + JSON.stringify(images.transformations?.filter(Boolean).length) + JSON.stringify(images.case_studies?.filter(Boolean).length) + JSON.stringify(images.logo) + styles.bg + styles.accent + styles.headingFont}
                        srcDoc={getFullHTML()} title="Show Up Page Preview" className="w-full h-full border-0" sandbox="allow-same-origin allow-scripts" />
                    </div>
                    <button onClick={() => generatePageHTML()} disabled={generatingHTML}
                      className="mt-3 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-wider text-zinc-400 border border-zinc-700 hover:text-gold hover:border-gold/30 transition disabled:opacity-50">
                      {generatingHTML ? 'Regenerating...' : 'Regenerate Page with Current Settings'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

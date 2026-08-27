// Monthly Review — shared constants used by client and admin pages

export const MONTHLY_METRICS = [
  { group: 'audience', items: [
    { key: 'new_followers', label: 'Net Followers', autoFill: 'daily_kpis', dkpiKey: 'new_followers' },
    { key: 'short_form_posted', label: 'Short-Form Posted', autoFill: 'daily_kpis', dkpiKey: 'content_posted' },
    { key: 'lead_magnet_downloads', label: 'Lead Magnet Downloads' },
    { key: 'link_in_bio_clicks', label: 'Link in Bio Clicks' },
    { key: 'email_list_size', label: 'Email List Size' },
    { key: 'emails_sent', label: 'Emails Sent' },
    { key: 'long_form_posted', label: 'Long-Form Posted' },
    { key: 'total_watch_time', label: 'Total Watch Time (hrs)', step: '0.01' },
  ]},
  { group: 'pipeline', items: [
    { key: 'dms_sent', label: 'DMs Sent', autoFill: 'composite' },
    { key: 'offers_made', label: 'Offers Made', autoFill: 'daily_kpis', dkpiKey: 'offers' },
    { key: 'offer_docs_sent', label: 'Offer Docs Sent', autoFill: 'composite' },
    { key: 'calls_booked', label: 'Calls Booked', autoFill: 'composite' },
    { key: 'calls_shown', label: 'Calls Shown', autoFill: 'daily_kpis', dkpiKey: 'calls_taken' },
    { key: 'calls_closed', label: 'Calls Closed', autoFill: 'daily_kpis', dkpiKey: 'closed' },
    { key: 'offer_docs_sent', label: 'Offer Docs Sent', autoFill: 'activity_log' },
    { key: 'sales_from_dip', label: 'Sales from Dip Offer', autoFill: 'activity_log' },
    { key: 'sales_from_bang_bang', label: 'Sales from Bang Bang Offer', autoFill: 'activity_log' },
  ]},
  { group: 'retention', items: [
    { key: 'members_start', label: 'Members at Start of Month' },
    { key: 'members_lost', label: 'Members Lost This Month' },
    { key: 'churn_rate', label: 'Churn Rate (%)', step: '0.1', autoCalc: true },
    { key: 'members_current', label: 'Current Total Members' },
    { key: 'new_members', label: 'New Members', autoCalc: true },
    { key: 'members_resigned', label: 'Re-signed Members' },
  ]},
  { group: 'financials', items: [
    { key: 'cash_collected', label: 'Cash Collected (£)', autoFill: 'composite', step: '0.01' },
    { key: 'cash_contracted', label: 'Cash Contracted (£)', autoFill: 'composite', step: '0.01' },
    { key: 'money_in', label: 'Money In (£)', step: '0.01' },
    { key: 'money_out', label: 'Money Out (£)', step: '0.01' },
    { key: 'personal_pay', label: 'Personal Pay (£)', step: '0.01' },
    { key: 'profit', label: 'Profit (£)', step: '0.01', autoCalc: true },
  ]},
]

export const MONTHLY_METRIC_GROUPS = [
  { id: 'audience', label: 'Audience & Content', icon: '📡', color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/5' },
  { id: 'pipeline', label: 'Sales Pipeline', icon: '🎯', color: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-500/5' },
  { id: 'retention', label: 'Retention & Growth', icon: '🔄', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  { id: 'financials', label: 'Financials', icon: '💰', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
]

export const CHART_COLORS = [
  '#d4a843', // gold
  '#34d399', // emerald
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f59e0b', // amber
  '#f472b6', // pink
  '#38bdf8', // sky
  '#c084fc', // purple
  '#fb923c', // orange
  '#2dd4bf', // teal
  '#e879f9', // fuchsia
  '#fbbf24', // yellow
  '#818cf8', // indigo
  '#f87171', // red
  '#4ade80', // green
  '#22d3ee', // cyan
  '#fb7185', // rose
  '#a3e635', // lime
  '#94a3b8', // slate
  '#e2e8f0', // gray
]

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const ALL_METRIC_KEYS = MONTHLY_METRICS.flatMap(g => g.items.map(i => i.key))

export function getMetricByKey(key) {
  for (const g of MONTHLY_METRICS) {
    const item = g.items.find(i => i.key === key)
    if (item) return { ...item, group: g.group }
  }
  return null
}

export function getMetricColor(key) {
  const idx = ALL_METRIC_KEYS.indexOf(key)
  return CHART_COLORS[idx % CHART_COLORS.length]
}

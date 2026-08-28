// Monthly Review — shared constants used by client and admin pages

export const MONTHLY_METRICS = [
  { group: 'audience', items: [
    { key: 'new_followers', label: 'Net Followers', hint: 'How many new followers you gained this month (minus unfollows)', autoFill: 'daily_kpis', dkpiKey: 'new_followers' },
    { key: 'short_form_posted', label: 'Short-Form Posted', hint: 'Total reels, TikToks, or shorts you posted', autoFill: 'daily_kpis', dkpiKey: 'content_posted' },
    { key: 'lead_magnet_downloads', label: 'Lead Magnet Downloads', hint: 'How many people downloaded your freebie this month' },
    { key: 'link_in_bio_clicks', label: 'Link in Bio Clicks', hint: 'Total clicks on your bio link (check your link tool analytics)' },
    { key: 'email_list_size', label: 'Email List Size', hint: 'Your total email subscribers at the end of this month' },
    { key: 'emails_sent', label: 'Emails Sent', hint: 'Number of emails or newsletters you sent out this month' },
    { key: 'long_form_posted', label: 'Long-Form Posted', hint: 'Blog posts, YouTube videos, podcasts, or carousels' },
    { key: 'total_watch_time', label: 'Total Watch Time (hrs)', hint: 'Combined watch time across your video content', step: '0.01' },
  ]},
  { group: 'pipeline', items: [
    { key: 'dms_sent', label: 'DMs Sent', hint: 'First DMs sent to new leads (pulled from your Hot List)', autoFill: 'activity_log' },
    { key: 'offer_docs_sent', label: 'Offer Docs Sent', hint: 'Sales docs sent for your dip offer (pulled from Hot List)', autoFill: 'activity_log' },
    { key: 'calls_booked', label: 'Calls Booked', hint: 'Sales calls booked this month (pulled from Hot List)', autoFill: 'activity_log' },
    { key: 'calls_shown', label: 'Calls Shown', hint: 'How many booked calls actually showed up', autoFill: 'daily_kpis', dkpiKey: 'calls_taken' },
    { key: 'calls_closed', label: 'Calls Closed', hint: 'Deals closed this month (pulled from Hot List)', autoFill: 'activity_log' },
    { key: 'sales_from_dip', label: 'Sales from Dip Offer', hint: 'Clients who bought your micro offer (pulled from Hot List)', autoFill: 'activity_log' },
    { key: 'sales_from_bang_bang', label: 'Sales from Bang Bang Offer', hint: 'Clients who bought your main offer (pulled from Hot List)', autoFill: 'activity_log' },
  ]},
  { group: 'retention', items: [
    { key: 'members_start', label: 'Members at Start of Month', hint: 'How many active clients or members you had on day 1 of this month' },
    { key: 'members_lost', label: 'Members Lost This Month', hint: 'Clients who cancelled or didn\'t renew this month' },
    { key: 'churn_rate', label: 'Churn Rate (%)', hint: 'Percentage of members lost vs start (auto-calculated)', step: '0.1', autoCalc: true },
    { key: 'members_current', label: 'Current Total Members', hint: 'Your total active clients or members right now' },
    { key: 'new_members', label: 'New Members', hint: 'New clients signed this month (pulled from Hot List deals)', autoFill: 'activity_log' },
    { key: 'members_resigned', label: 'Re-signed Members', hint: 'Existing clients who renewed or extended their contract' },
  ]},
  { group: 'financials', items: [
    { key: 'revenue', label: 'Revenue (£)', hint: 'Total money earned this month (invoiced or received)', step: '0.01' },
    { key: 'revenue_target', label: 'Target for Next Month (£)', hint: 'Your revenue goal for next month', step: '0.01' },
    { key: 'cash_collected', label: 'New Cash Collected (£)', hint: 'Cash actually received from new deals this month (pulled from Hot List)', autoFill: 'activity_log', step: '0.01' },
    { key: 'cash_contracted', label: 'New Cash Contracted (£)', hint: 'Total deal value signed including future payments (pulled from Hot List)', autoFill: 'activity_log', step: '0.01' },
    { key: 'monthly_recurring_revenue', label: 'Monthly Recurring Revenue (£)', hint: 'Predictable income from subscriptions or retainers each month', step: '0.01' },
    { key: 'money_in', label: 'Money In (£)', hint: 'All money that hit your account this month (including recurring)', step: '0.01' },
    { key: 'money_out', label: 'Money Out (£)', hint: 'All business expenses this month (tools, ads, team, rent etc.)', step: '0.01' },
    { key: 'ad_spend', label: 'Ad Spend (£)', hint: 'Total spent on paid ads (Meta, Google, TikTok etc.)', step: '0.01' },
    { key: 'personal_pay', label: 'Personal Pay (£)', hint: 'What you paid yourself from the business this month', step: '0.01' },
    { key: 'profit', label: 'Profit (£)', hint: 'Money In minus Money Out (auto-calculated)', step: '0.01', autoCalc: true },
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

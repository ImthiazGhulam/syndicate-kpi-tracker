'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MONTHLY_METRICS, MONTH_NAMES, ALL_METRIC_KEYS, getMetricByKey, getMetricColor } from '../../lib/monthly-constants'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((entry, i) => {
        const metric = getMetricByKey(entry.dataKey)
        return (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-300">{metric?.label || entry.dataKey}:</span>
            <span className="text-xs font-bold text-white">{formatValue(entry.value, entry.dataKey)}</span>
          </div>
        )
      })}
    </div>
  )
}

function formatValue(val, key) {
  if (val === null || val === undefined) return '—'
  const metric = getMetricByKey(key)
  if (metric?.step === '0.01') return `£${Number(val).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return Number(val).toLocaleString('en-GB')
}

export default function MonthlyMetricsChart({ allReviews, activeMetrics, onToggleMetric, height = 320 }) {
  const [hoveredMetric, setHoveredMetric] = useState(null)

  if (!allReviews || allReviews.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center mb-6">
        <p className="text-zinc-500 text-sm">Complete your first monthly review to see trends here.</p>
      </div>
    )
  }

  const sorted = [...allReviews].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)

  const chartData = sorted.map(r => {
    const point = { name: `${MONTH_NAMES[r.month]} ${String(r.year).slice(2)}` }
    ALL_METRIC_KEYS.forEach(key => {
      const val = r[key]
      point[key] = val !== null && val !== undefined ? Number(val) : null
    })
    return point
  })

  const hasAnyActive = activeMetrics && activeMetrics.length > 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
      {hasAnyActive && (
        <div className="mb-4" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.5)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={{ stroke: '#3f3f46' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeMetrics.map(key => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getMetricColor(key)}
                  strokeWidth={hoveredMetric === key ? 3 : 2}
                  dot={{ r: 3, fill: getMetricColor(key), strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: getMetricColor(key), stroke: '#18181b', strokeWidth: 2 }}
                  connectNulls
                  opacity={hoveredMetric && hoveredMetric !== key ? 0.25 : 1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hasAnyActive && (
        <div className="flex items-center justify-center py-12 mb-4">
          <p className="text-zinc-600 text-sm">Tap a metric below to add it to the chart.</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {MONTHLY_METRICS.map(group =>
          group.items.map(metric => {
            const isActive = activeMetrics?.includes(metric.key)
            const color = getMetricColor(metric.key)
            const hasData = sorted.some(r => r[metric.key] !== null && r[metric.key] !== undefined && r[metric.key] !== 0)
            return (
              <button
                key={metric.key}
                onClick={() => onToggleMetric(metric.key)}
                onMouseEnter={() => isActive && setHoveredMetric(metric.key)}
                onMouseLeave={() => setHoveredMetric(null)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  isActive
                    ? 'text-white border-opacity-60'
                    : hasData
                      ? 'text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                      : 'text-zinc-700 border-zinc-800 hover:border-zinc-700 hover:text-zinc-500'
                }`}
                style={isActive ? { borderColor: color, backgroundColor: `${color}15`, color } : {}}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: isActive ? color : 'transparent' }} />
                {metric.label}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

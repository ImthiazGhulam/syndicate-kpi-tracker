'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MONTHLY_METRICS, MONTH_NAMES, ALL_METRIC_KEYS, getMetricByKey, getMetricColor } from '../../lib/monthly-constants'

function CustomTooltip({ active, payload, label, rawData, monthIndex }) {
  if (!active || !payload || !payload.length) return null
  const raw = rawData && monthIndex !== undefined ? rawData[monthIndex] : null
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((entry, i) => {
        const metric = getMetricByKey(entry.dataKey)
        const actualVal = raw ? raw[entry.dataKey] : entry.value
        return (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-zinc-300">{metric?.label || entry.dataKey}:</span>
            <span className="text-xs font-bold text-white">{formatValue(actualVal, entry.dataKey)}</span>
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

  // Compute min/max per active metric for normalization
  const ranges = {}
  if (activeMetrics) {
    activeMetrics.forEach(key => {
      let min = Infinity, max = -Infinity
      sorted.forEach(r => {
        const v = r[key]
        if (v !== null && v !== undefined) {
          const n = Number(v)
          if (n < min) min = n
          if (n > max) max = n
        }
      })
      ranges[key] = { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max }
    })
  }

  // Normalize: scale each metric to 0-100 based on its own range
  const chartData = sorted.map((r, idx) => {
    const point = { name: `${MONTH_NAMES[r.month]} ${String(r.year).slice(2)}`, _idx: idx }
    if (activeMetrics) {
      activeMetrics.forEach(key => {
        const val = r[key]
        if (val === null || val === undefined) { point[key] = null; return }
        const { min, max } = ranges[key]
        point[key] = max === min ? 50 : ((Number(val) - min) / (max - min)) * 100
      })
    }
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
                tick={false}
                axisLine={false}
                tickLine={false}
                width={8}
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  const idx = payload[0]?.payload?._idx
                  const raw = idx !== undefined ? sorted[idx] : null
                  return (
                    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
                      {payload.map((entry, i) => {
                        const metric = getMetricByKey(entry.dataKey)
                        const actualVal = raw ? raw[entry.dataKey] : null
                        return (
                          <div key={i} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-zinc-300">{metric?.label || entry.dataKey}:</span>
                            <span className="text-xs font-bold text-white">{formatValue(actualVal, entry.dataKey)}</span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }}
              />
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

      {/* Active metric legends with actual values for latest month */}
      {hasAnyActive && sorted.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-zinc-800">
          {activeMetrics.map(key => {
            const metric = getMetricByKey(key)
            const latest = sorted[sorted.length - 1]
            const val = latest[key]
            return (
              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getMetricColor(key) }} />
                <span className="text-[10px] text-zinc-400">{metric?.label}:</span>
                <span className="text-[10px] font-bold text-white">{formatValue(val, key)}</span>
              </div>
            )
          })}
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

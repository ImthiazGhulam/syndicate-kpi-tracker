'use client'

import { useState, useEffect } from 'react'

export default function LoadingOverlay({ lines, message }) {
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    if (!lines || lines.length === 0) return
    const timer = setInterval(() => {
      setLineIndex(prev => (prev + 1) % lines.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [lines])

  const displayText = message || (lines && lines[lineIndex]) || ''

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <svg className="loading-ring-svg" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" stroke="rgba(201,168,76,0.12)" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="28" stroke="url(#ring-grad)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="130 46" />
            <defs>
              <linearGradient id="ring-grad" x1="0" y1="0" x2="64" y2="64">
                <stop offset="0%" stopColor="#C9A84C" />
                <stop offset="100%" stopColor="rgba(201,168,76,0.15)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="text-gold text-sm font-bold uppercase tracking-widest loading-text">{displayText}</p>
      </div>
    </div>
  )
}

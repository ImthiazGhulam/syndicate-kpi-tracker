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
          <div className="loading-logo-container">
            <img src="/logo.png" alt="The Syndicate" className="h-16 w-auto loading-logo" />
            <div className="loading-ring" />
          </div>
        </div>
        <p className="text-gold text-sm font-bold uppercase tracking-widest loading-text">{displayText}</p>
      </div>
    </div>
  )
}

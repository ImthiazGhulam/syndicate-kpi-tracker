'use client'
import { useState } from 'react'

export default function ImportPage() {
  const [json, setJson] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    setResult(null)
    try {
      const data = JSON.parse(json)
      const res = await fetch('/api/scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const r = await res.json()
      setResult(r)
    } catch (e) {
      setResult({ error: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 max-w-2xl mx-auto">
      <h1 className="text-white text-xl font-bold mb-4">Import Scraped Data</h1>
      <p className="text-zinc-500 text-sm mb-4">Paste the JSON from Apify Dataset export below and click Import.</p>
      <textarea
        value={json}
        onChange={e => setJson(e.target.value)}
        rows={15}
        placeholder='Paste JSON array here...'
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-600 text-sm font-mono resize-y"
      />
      <button onClick={handleImport} disabled={loading || !json.trim()}
        className="mt-4 px-6 py-3 bg-gold hover:bg-gold-light disabled:opacity-40 text-zinc-950 font-bold text-sm uppercase tracking-widest rounded transition">
        {loading ? 'Importing...' : 'Import Data'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}

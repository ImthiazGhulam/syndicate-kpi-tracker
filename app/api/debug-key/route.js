import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY || ''
  return NextResponse.json({
    exists: !!key,
    length: key.length,
    prefix: key.slice(0, 10),
    suffix: key.slice(-4),
    hasSpaces: key !== key.trim(),
    hasNewlines: key.includes('\n') || key.includes('\r'),
  })
}

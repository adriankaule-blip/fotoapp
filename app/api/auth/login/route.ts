import { NextRequest, NextResponse } from 'next/server'
import { sessionCookie, signSession } from '../../../../lib/auth'
import { verifyLogin } from '../../../../lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørgsel' }, { status: 400 })
  }
  const email = String(body.email || '').toLowerCase().trim()
  const code = String(body.code || '')
  if (!email || !code) return NextResponse.json({ error: 'Udfyld e-mail og kode' }, { status: 400 })

  const user = await verifyLogin(email, code)
  if (!user) return NextResponse.json({ error: 'Forkert e-mail eller kode' }, { status: 401 })

  const res = NextResponse.json({ email: user.email, name: user.name })
  res.headers.set('Set-Cookie', sessionCookie(signSession(user.email)))
  return res
}

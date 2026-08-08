/**
 * Stateless session auth: HMAC-signed cookie carrying { email, exp }.
 * No session store — the signature is the session.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

export const SESSION_COOKIE = 'fotoapp_session'
const THIRTY_DAYS = 30 * 24 * 60 * 60

export type Session = { email: string; exp: number }

function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET is not set')
  return s
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function hmac(data: string): Buffer {
  return createHmac('sha256', secret()).update(data).digest()
}

export function signSession(email: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS })))
  return `${payload}.${b64url(hmac(payload))}`
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  try {
    const expected = hmac(payload)
    const got = Buffer.from(sig, 'base64url')
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null
    const session: Session = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!session.email || session.exp < Date.now() / 1000) return null
    return session
  } catch {
    return null
  }
}

export function getSession(req: NextRequest): Session | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value)
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${THIRTY_DAYS}`
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

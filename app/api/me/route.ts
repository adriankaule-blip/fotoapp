import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { getUser } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ user: null })
  const user = await getUser(session.email)
  if (!user || !user.active) return NextResponse.json({ user: null })
  return NextResponse.json({ user: { email: user.email, name: user.name } })
}

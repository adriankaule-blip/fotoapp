import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../lib/auth'
import { listJobs } from '../../../lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Log ind først' }, { status: 401 })
  const jobs = await listJobs(session.email)
  return NextResponse.json({
    jobs: jobs.map(j => ({
      id: j.id,
      mode: j.mode,
      style: j.style,
      caption: j.caption,
      createdAt: j.createdAt,
      files: j.files,
    })),
  })
}

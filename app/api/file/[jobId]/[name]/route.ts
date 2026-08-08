import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '../../../../../lib/auth'
import { getJob } from '../../../../../lib/db'
import { JOB_FILES, JobFileName, readJobFile } from '../../../../../lib/storage'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string; name: string }> }) {
  const session = getSession(req)
  if (!session) return NextResponse.json({ error: 'Log ind først' }, { status: 401 })

  const { jobId, name } = await params
  if (!(JOB_FILES as readonly string[]).includes(name)) {
    return NextResponse.json({ error: 'Ukendt fil' }, { status: 404 })
  }
  const job = await getJob(jobId)
  if (!job || job.email !== session.email) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })

  try {
    const buf = await readJobFile(jobId, name as JobFileName)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Filen findes ikke længere' }, { status: 404 })
  }
}

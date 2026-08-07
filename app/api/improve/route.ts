import { NextRequest, NextResponse } from 'next/server'
import { composeStoryCard, generateWithRetry, modelChain, prepInput } from '../../../lib/engine'
import { STYLES, buildStylePrompt } from '../../../lib/styles'

export const runtime = 'nodejs'
export const maxDuration = 120

// Everything happens in memory for the duration of the request — nothing is
// written to disk or stored anywhere.
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Server mangler GEMINI_API_KEY' }, { status: 500 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Ugyldig forespørgsel' }, { status: 400 })
  }

  const passcode = String(form.get('passcode') || '')
  const expected = process.env.APP_PASSCODE
  if (expected && passcode !== expected) {
    return NextResponse.json({ error: 'Forkert adgangskode' }, { status: 401 })
  }

  const styleKey = String(form.get('style') || '')
  if (!STYLES[styleKey]) return NextResponse.json({ error: 'Ukendt stil' }, { status: 400 })

  const caption = String(form.get('caption') || '').slice(0, 120) || STYLES[styleKey].caption

  const file = form.get('image')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Intet billede modtaget' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Billedet er for stort (max 8 MB)' }, { status: 413 })

  try {
    const original = Buffer.from(await file.arrayBuffer())
    const prepped = await prepInput(original)
    const result = await generateWithRetry(apiKey, modelChain('auto'), prepped, buildStylePrompt(styleKey), [15_000])
    if (!result) return NextResponse.json({ error: 'Genereringen mislykkedes — prøv igen om lidt' }, { status: 502 })

    const card = await composeStoryCard(prepped, result.buffer, caption)

    return NextResponse.json({
      improved: `data:image/jpeg;base64,${result.buffer.toString('base64')}`,
      storyCard: `data:image/jpeg;base64,${card.toString('base64')}`,
      model: result.model,
    })
  } catch (err: any) {
    console.error('improve failed:', err)
    return NextResponse.json({ error: 'Der skete en fejl under genereringen' }, { status: 500 })
  }
}

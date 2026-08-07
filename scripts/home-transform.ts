/**
 * fotoapp CLI — AI home photo improver
 *
 * Usage:
 *   npx tsx scripts/home-transform.ts <image> <scene> [model] [--caption "..."]
 *   npx tsx scripts/home-transform.ts --compose-only <output-dir> [--caption "..."]
 *   npx tsx scripts/home-transform.ts --batch <config.json>
 *
 * Core logic lives in lib/engine.ts + lib/scenes.ts (shared with the web app).
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { SCENES } from '../lib/scenes'
import { composeStoryCard, generateWithRetry, modelChain, prepInput } from '../lib/engine'

// --- .env loader (no dependency) ---
const projectRoot = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const envPath = path.join(projectRoot, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

function openOnMac(target: string) {
  if (process.platform === 'darwin') {
    try { execSync(`open "${target}"`) } catch {}
  }
}

async function main() {
  const args = process.argv.slice(2)
  const captionIdx = args.indexOf('--caption')
  let captionOverride: string | undefined
  if (captionIdx !== -1) {
    captionOverride = args[captionIdx + 1]
    args.splice(captionIdx, 2)
  }

  const apiKey = process.env.GEMINI_API_KEY

  // --batch <config.json>
  if (args[0] === '--batch') {
    if (!apiKey) { console.error('Missing GEMINI_API_KEY'); process.exit(1) }
    const config = JSON.parse(fs.readFileSync(path.resolve(args[1]), 'utf8'))
    const outDir = path.resolve(config.outDir)
    fs.mkdirSync(outDir, { recursive: true })
    const failed: string[] = []

    for (const [i, job] of config.jobs.entries()) {
      const scene = SCENES[job.scene]
      const imagePath = path.resolve(job.image)
      const name = job.name || path.basename(imagePath).replace(/\.[^.]+$/, '')
      console.log(`\n[${i + 1}/${config.jobs.length}] ${name} → ${scene?.name || job.scene}`)
      if (!scene || !fs.existsSync(imagePath)) {
        console.error(`  ✗ skipped (${!scene ? 'unknown scene' : 'file not found'})`)
        failed.push(name)
        continue
      }
      const prepped = await prepInput(imagePath)
      const result = await generateWithRetry(apiKey, modelChain('auto'), prepped, scene.prompt)
      if (!result) { console.error('  ✗ generation failed'); failed.push(name); continue }
      const improvedOut = path.join(outDir, `${name}-improved.jpg`)
      fs.writeFileSync(improvedOut, result.buffer)
      const card = await composeStoryCard(imagePath, result.buffer, job.caption || scene.caption)
      fs.writeFileSync(path.join(outDir, `${name}-story.jpg`), card)
      console.log(`  ✓ ${name}-story.jpg`)
    }

    console.log(`\nDone. ${config.jobs.length - failed.length}/${config.jobs.length} succeeded.${failed.length ? ` Failed: ${failed.join(', ')}` : ''}`)
    openOnMac(outDir)
    return
  }

  // --compose-only <dir>
  if (args[0] === '--compose-only') {
    const dir = path.resolve(args[1])
    const improved = fs.readdirSync(dir).find(f => f.startsWith('1-improved'))
    if (!improved) { console.error('No 1-improved-*.jpg in dir'); process.exit(1) }
    const sceneKey = Object.keys(SCENES).find(k => dir.endsWith(k))
    const caption = captionOverride || (sceneKey ? SCENES[sceneKey].caption : 'Før / Efter')
    const card = await composeStoryCard(path.join(dir, '0-original.jpg'), path.join(dir, improved), caption)
    const cardOut = path.join(dir, 'story-card.jpg')
    fs.writeFileSync(cardOut, card)
    console.log(`Saved: ${cardOut}`)
    return
  }

  // Single image
  const [imageArg, sceneArg, modelArg = 'pro'] = args
  if (!imageArg || !sceneArg || !SCENES[sceneArg]) {
    console.log(`
fotoapp — AI Home Photo Improver
────────────────────────────────
Usage: npx tsx scripts/home-transform.ts <image> <scene> [model] [--caption "..."]
       npx tsx scripts/home-transform.ts --compose-only <output-dir> [--caption "..."]
       npx tsx scripts/home-transform.ts --batch <config.json>

Scenes: ${Object.keys(SCENES).join(', ')}
Models: pro (default), flash, auto (pro → flash fallback)
`)
    process.exit(1)
  }
  if (!apiKey) { console.error('Missing GEMINI_API_KEY (set in .env)'); process.exit(1) }

  const scene = SCENES[sceneArg]
  const imagePath = path.resolve(imageArg)
  if (!fs.existsSync(imagePath)) { console.error(`File not found: ${imagePath}`); process.exit(1) }

  const basename = path.basename(imagePath).replace(/\.[^.]+$/, '')
  const outDir = path.join(projectRoot, 'output', `${basename}-${sceneArg}`)
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`\n🏡 fotoapp — ${scene.name}`)
  console.log(`   Input:  ${imagePath}`)
  console.log(`   Output: ${outDir}\n`)

  fs.copyFileSync(imagePath, path.join(outDir, '0-original.jpg'))
  const prepped = await prepInput(imagePath)
  const result = await generateWithRetry(apiKey, modelChain(modelArg as any), prepped, scene.prompt)
  if (!result) { console.error('\n✗ Generation failed on all models.'); process.exit(1) }

  const improvedOut = path.join(outDir, `1-improved-${result.model}.jpg`)
  fs.writeFileSync(improvedOut, result.buffer)
  console.log(`\n  Saved: ${improvedOut}`)

  const card = await composeStoryCard(imagePath, result.buffer, captionOverride || scene.caption)
  const cardOut = path.join(outDir, 'story-card.jpg')
  fs.writeFileSync(cardOut, card)
  console.log(`  Saved: ${cardOut} (1080x1920 story card)`)
  openOnMac(cardOut)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

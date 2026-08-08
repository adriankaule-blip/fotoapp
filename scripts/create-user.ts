/**
 * Create or update a fotoapp user (invite-code account).
 *
 *   npx tsx scripts/create-user.ts <email> "<name>" [code]
 *
 * Prints the login code. Requires ADC (gcloud auth application-default login).
 */

import { randomBytes } from 'crypto'
import { upsertUser } from '../lib/db'

async function main() {
  const [email, name, codeArg] = process.argv.slice(2)
  if (!email || !name) {
    console.error('Usage: npx tsx scripts/create-user.ts <email> "<name>" [code]')
    process.exit(1)
  }
  const code = codeArg || randomBytes(4).toString('hex')
  await upsertUser({
    email: email.toLowerCase().trim(),
    name,
    code,
    active: true,
    createdAt: new Date().toISOString(),
  })
  console.log(`✓ ${email} — login code: ${code}`)
}

main()

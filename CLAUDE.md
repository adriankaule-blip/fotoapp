# CLAUDE.md

## What This Is

AI home photo improver. Takes real photos of a house (rooms, garden, exterior), generates a tastefully renovated version with Gemini image models ("Nano Banana"), and composes a mobile-friendly 9:16 story card: original on top, AI-improved below, Danish serif caption band at the seam (Instagram carousel style, inspired by signewenneberg house-tour posts — see `output_samples/`).

## Commands

```bash
npm install

# Generate an improvement + story card
npm run improve -- <image> <scene> [model] [--caption "..."]
npx tsx scripts/home-transform.ts files_sneden/pictures/DSC06691.jpg living-room pro

# Rebuild only the story card (no API call, free)
npx tsx scripts/home-transform.ts --compose-only output/DSC06691-living-room [--caption "..."]

# Batch: many images → one folder of <name>-improved.jpg + <name>-story.jpg
npx tsx scripts/home-transform.ts --batch batch-sneden.json
```

Scenes: `living-room, kitchen, bedroom, office, bathroom, attic, garden, exterior, garage, ude, ude-moderne, dining-room, sunroom, oppe`
- `ude` — Sneden facade renovation: yellow walls → crisp white, black timber + red doors stay, algae-free roof, mown lawn, weed-free gravel
- `ude-moderne` — modernization variant: black natural slate roof (skifer), slim matte-black window frames in same openings, black zinc gutters, white render
- `oppe` — raw attic → finished first-floor lounge with loft til kip: white-clad sloped ceilings, visible sanded beams, oak floor, skylights, cozy seating

Batch configs: `{ outDir, jobs: [{ image, scene, caption?, name? }] }`
- `batch-sneden.json` — Adrian's 11 selected photos (4 ude, 5 inde, 2 oppe) → `output/sneden_forbedret/` (11/11 succeeded, approved)
- `batch-sneden-moderne.json` — the 4 exteriors again as `ude-moderne` → `output/sneden_moderne/` (4/4 succeeded, approved)
Models: `pro` (default, `gemini-3-pro-image` / Nano Banana Pro), `flash` (`gemini-3.1-flash-image` / Nano Banana 2), `auto` (pro → flash fallback)

## Input Material

`files_sneden/` — photos of the house ("Sneden"): `pictures/DSC*.jpg` are 3456x2304 real-estate photos, `DJI-*.jpg` are drone shots of house + garden, `wetransfer_*/` has more prints. Notable: DSC06691 = living room, DSC06731 = kitchen, DSC06711 = bathroom, DSC06661 = office, DSC06641-1/DSC06646 = attic, DSC06752 = garage, DJI shots = exterior/garden.

## Architecture

One self-contained script, `scripts/home-transform.ts`:

1. **`STRUCTURE_BLOCK`** — the architecture-preservation prompt block (the analog of tinder-transform's identity block). Same camera, same room geometry, same windows/views, keep character features (beams, wood ceilings, stoves). Anti-AI mandate: must look like a real Danish real-estate listing photo.
2. **`SCENES`** — per-scene renovation prompts + default Danish captions. Each defines exactly what may change (furniture, rugs, paint, tidiness) vs. what must stay.
3. **Generation** — `@google/genai` SDK, `responseModalities: ['TEXT','IMAGE']`, input downscaled to 2048px, retry with backoff on 429, model fallback.
4. **Story card** — sharp composite: 1080x1920, two 1080x960 center-cropped halves, white serif (Georgia) caption band centered on the seam, FØR label top-left, EFTER — AI label below the caption band.

Output (single): `output/<basename>-<scene>/{0-original.jpg, 1-improved-<model>.jpg, story-card.jpg}`.
Output (batch): `<outDir>/{<name>-improved.jpg, <name>-story.jpg}` — names match the input files.

## Renovation Rule (Adrian's directive, 2026-08-07)

**Only fixed installations are kept** — beams, ceilings, stoves, windows, doors, walls, radiators. ALL loose furniture and freestanding storage from the input is removed/replaced (explicitly list what to remove, e.g. "the dark bookcase — GONE"). Floors are upgraded (e.g. wide-plank oak). Confirmed on the DSC06691 living-room sample.

## Prompt Lessons (inherited from ../tinder-transform, adapted)

- Frame the task as **renovation of the SAME room**, not generation — "output will be shown directly below the input in a before/after" makes the model preserve geometry.
- Explicitly list what to KEEP (beams, stove, window views, camera angle) and what to CHANGE — the model respects a clear keep/change contract.
- Anti-AI mandate ("no HDR glow, slight imperfection is good") avoids the plastic render look.
- Never regenerate what you can preserve; a boring photo of the RIGHT room beats a beautiful photo of the WRONG room.

## Environment

- `GEMINI_API_KEY` in `.env` (gitignored) — Google AI Studio key.
- Pro generation ≈ 20-25s, ~$0.13/image (2K).

## Web App (Next.js, built 2026-08-07)

Drag & drop single-image app. User drops a photo, picks a **style** (klassisk, moderne, romantisk, minimalistisk, landlig, luksus — Adrian's directive: styles are the user-facing choice, the AI identifies the room/exterior itself), edits the caption, enters the passcode → gets the improved image + 9:16 story card back as downloads. **Stateless: nothing is stored** — images live in memory for the duration of the request only.

- `app/page.tsx` — client UI (Danish). Downscales to 2048px in the browser before upload (keeps requests under Vercel's 4.5 MB limit)
- `app/api/improve/route.ts` — passcode check (`APP_PASSCODE` env), Gemini call, story card composition, returns base64 data URLs. `maxDuration = 120`
- `lib/engine.ts` — buffer-based generation + story card composition (shared with CLI)
- `lib/scenes.ts` — scene prompts (CLI), `lib/styles.ts` — style prompts + adaptive space detection (web)

Layout note: the `EFTER — AI` label must be positioned below the caption band (caption is composited last and covers the seam).

## Deployment

- GitHub: https://github.com/adriankaule-blip/fotoapp (public)
- Vercel: auto-deploy on push to main. Env vars needed in Vercel: `GEMINI_API_KEY`, `APP_PASSCODE`
- Local: `npm run dev` (reads `.env`; passcode is in there too)

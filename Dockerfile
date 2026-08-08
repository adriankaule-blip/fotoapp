# fotoapp — Next.js on Cloud Run (pattern from loveOS)
# Secrets (GEMINI_API_KEY, APP_PASSCODE) come from GCP Secret Manager at
# runtime — never baked into the image.

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --include=optional

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /srv
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /srv
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Fonts for sharp's SVG text rendering (story card captions) — without these,
# text renders as empty boxes on Alpine
RUN apk add --no-cache fontconfig ttf-dejavu && fc-cache -f

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /srv/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /srv/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /srv/public ./public

# Belt-and-suspenders: sharp's native musl binaries live in @img/* platform
# packages that the Next.js file tracer can miss
COPY --from=builder --chown=nextjs:nodejs /srv/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /srv/node_modules/@img ./node_modules/@img

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

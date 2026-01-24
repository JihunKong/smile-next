FROM node:20-alpine AS base

LABEL org.opencontainers.image.source=https://github.com/seeds-smile-the-ultimate/smile-web

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy prisma schema first for postinstall script
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npm run db:generate

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1
# Increase Node.js memory for build
ENV NODE_OPTIONS=--max-old-space-size=1536

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy prisma directory for DB commands
COPY prisma ./prisma/

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Install prisma CLI and tsx for migrations/seeding, with correct ownership for nextjs user
RUN npm install prisma tsx && chown -R nextjs:nodejs node_modules


USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

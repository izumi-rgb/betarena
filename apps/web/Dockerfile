# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files for dependency resolution
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install all dependencies (including devDeps for build)
RUN npm ci --workspace=apps/web --workspace=packages/shared --include-workspace-root

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy installed dependencies from deps stage (all hoisted to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy root workspace files
COPY package.json package-lock.json tsconfig.base.json ./

# Copy shared package source
COPY packages/shared/ packages/shared/

# Copy web app source
COPY apps/web/ apps/web/

# Copy variant-exports (referenced by @variant-exports/* alias in tsconfig)
COPY variant-exports/ variant-exports/

# Set production environment for optimized build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV STANDALONE_BUILD=1

# Build the Next.js app (standalone output)
RUN npm run build --workspace=apps/web

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the standalone server output
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets (if they exist)
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

# Health check: verify Next.js is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["dumb-init", "node", "apps/web/server.js"]

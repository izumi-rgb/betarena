# ============================================
# Stage 1: Build
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files for dependency resolution
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production + dev dependencies (need devDeps for build)
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

# Copy shared package source (API depends on @betarena/shared)
COPY packages/shared/ packages/shared/

# Copy API source
COPY apps/api/ apps/api/

# Copy root tsconfig
COPY tsconfig.base.json ./

# Build the API
RUN npm run build --workspace=apps/api

# Compile migration .ts files to .js for production use
RUN cd apps/api && npx tsc --outDir migrations-compiled \
    --module commonjs --target ES2022 --esModuleInterop \
    --skipLibCheck --declaration false \
    migrations/*.ts

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set production environment
ENV NODE_ENV=production

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install production dependencies only
RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root --omit=dev \
    && npm cache clean --force

# Copy shared package source (needed at runtime since main points to src/)
COPY packages/shared/src/ packages/shared/src/

# Copy built API output from build stage
COPY --from=build /app/apps/api/dist apps/api/dist

# Copy compiled JS migrations for production
COPY --from=build /app/apps/api/migrations-compiled/ apps/api/migrations/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 4000

# Health check: hit a lightweight endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["dumb-init", "node", "apps/api/dist/index.js"]

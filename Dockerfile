FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Stage 1: Dependencies
FROM base AS dependency-stage
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# Stage 2: Build
FROM base AS build-stage
COPY --from=dependency-stage /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Prisma Migration
FROM base AS migration-stage
COPY --from=dependency-stage /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

# Stage 4: Production Runner
FROM base AS runner-stage

# Create non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build-stage /app/public ./public
COPY --from=build-stage --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build-stage --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

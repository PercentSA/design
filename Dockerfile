# Docs site (apps/docs). The build context is the repository root:
#   docker build -t percent-design-docs .
#   docker run -p 3000:3000 percent-design-docs
FROM oven/bun:alpine AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN cd packages/tokens && bun run build && cd ../../apps/docs && bun run build

FROM oven/bun:alpine AS production-dependencies
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/docs/package.json apps/docs/
COPY packages/tokens/package.json packages/tokens/
COPY packages/ui/package.json packages/ui/
COPY packages/motion/package.json packages/motion/
RUN bun install --production --frozen-lockfile --filter docs

FROM oven/bun:alpine
# Without it React loads its development build next to the production server renderer.
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/apps/docs/node_modules ./apps/docs/node_modules
COPY apps/docs/package.json apps/docs/server.ts ./apps/docs/
COPY --from=build /app/apps/docs/build ./apps/docs/build
WORKDIR /app/apps/docs
USER bun
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1
# The docs server (apps/docs/server.ts) runs on Bun.
CMD ["bun", "--bun", "run", "start"]

# Stage 1: Build WASM
FROM rust:1.90-slim AS wasm-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl pkg-config libssl-dev ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN cargo install wasm-pack --locked

WORKDIR /src
COPY wasm/ ./wasm/
WORKDIR /src/wasm
RUN wasm-pack build --release --target nodejs

# Stage 2: Base node image for workspace installs
FROM node:20-slim AS pnpm-base
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /usr/src/app

# Copy workspace manifests first for better Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json

# Stage 3: Install backend deps for build (includes dev deps)
FROM pnpm-base AS build-deps
RUN pnpm install --frozen-lockfile --filter backend...

# Stage 4: Build backend
FROM build-deps AS builder
COPY backend/ ./backend/
# backend imports wasm from "../../wasm/pkg", so runtime path is backend/wasm/pkg
COPY --from=wasm-builder /src/wasm/pkg ./backend/wasm/pkg
RUN pnpm --filter backend build

# Stage 5: Install backend production deps only
FROM pnpm-base AS prod-deps
RUN pnpm install --frozen-lockfile --prod --filter backend...

# Stage 6: Runtime
FROM node:20-slim AS runtime
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /usr/src/app/backend
ENV NODE_ENV=production

# Keep pnpm symlinked node_modules layout intact for workspace install
COPY --from=prod-deps /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=prod-deps /usr/src/app/backend/node_modules ./node_modules

# Copy runtime backend files
COPY --from=builder /usr/src/app/backend/package.json ./package.json
COPY --from=builder /usr/src/app/backend/dist ./dist
COPY --from=builder /usr/src/app/backend/csv-to-json.js ./csv-to-json.js
COPY --from=builder /usr/src/app/backend/wasm ./wasm

EXPOSE 8080

CMD ["pnpm", "start"]

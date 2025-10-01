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

# Stage 2: Build backend with pnpm
FROM node:20-bullseye-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

# Copy wasm pkg from previous stage
COPY --from=wasm-builder /src/wasm/pkg ./wasm/pkg

# Copy backend files
COPY backend/pnpm-lock.yaml backend/package.json ./backend/
COPY backend/ ./backend/
WORKDIR /usr/src/app/backend

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Build the backend
RUN pnpm run build

# Prune dev dependencies for production
RUN pnpm prune --prod

# Stage 3: Runtime
FROM node:20-slim AS runtime
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app/backend

# Copy built output and production dependencies
COPY --from=builder /usr/src/app/backend/dist ./dist
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
COPY --from=builder /usr/src/app/backend/package.json ./package.json

# Copy other runtime files
COPY --from=builder /usr/src/app/backend/csv-to-json.js ./csv-to-json.js
COPY --from=builder /usr/src/app/wasm ./wasm

ENV NODE_ENV=production

EXPOSE 8080

CMD ["pnpm", "start"]

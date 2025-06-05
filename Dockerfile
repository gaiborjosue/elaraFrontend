#############################################
# Stage 1: Build (dependencies + next build)
#############################################
FROM node:20-alpine AS builder

# ARG for build-time public env vars. This will be populated by --set-build-env-vars
ARG NEXT_PUBLIC_BACKEND_API_URL

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm \
 && pnpm install --frozen-lockfile

COPY . .

# Set ENV from ARG for the build process. This makes it available to `next build`.
# Next.js will inline this into client bundles because of the NEXT_PUBLIC_ prefix.
ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}

RUN echo "BUILDER STAGE - NEXT_PUBLIC_BACKEND_API_URL: ${NEXT_PUBLIC_BACKEND_API_URL}"
RUN pnpm build

#############################################
# Stage 2: Production image
#############################################
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
# Only install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
# next-env.d.ts is a dev file, usually not needed in production runner

# Environment variables for runtime (like GOOGLE_GENERATIVE_AI_API_KEY
# and RUNTIME_NEXT_PUBLIC_BACKEND_API_URL) will be injected by Cloud Run's --set-secrets.
# You don't strictly need ARG/ENV declarations for them here in the runner stage
# if Cloud Run is providing them, but they don't hurt.

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

ENV PORT 8080
EXPOSE 8080

CMD ["pnpm", "start", "--port", "8080"]
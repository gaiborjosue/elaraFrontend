#############################################
# Stage 1: Build (dependencies + next build)
#############################################
FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_BACKEND_API_URL
ARG GOOGLE_GENERATIVE_AI_API_KEY

WORKDIR /app

# TURN OFF telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the lockfiles first (caches layers)
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies
RUN npm install -g pnpm \
 && pnpm install --frozen-lockfile

# Copy entire source
COPY . .



ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
ENV GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}

# Log backend api url variable
RUN echo "NEXT_PUBLIC_BACKEND_API: ${NEXT_PUBLIC_BACKEND_API_URL}"

# Actually build Next
RUN pnpm build


#############################################
# Stage 2: Production image
#############################################
FROM node:20-alpine AS runner

ARG NEXT_PUBLIC_BACKEND_API_URL
ARG GOOGLE_GENERATIVE_AI_API_KEY

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy the built app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/next-env.d.ts ./

# Runtime environment variables
ENV NEXT_PUBLIC_BACKEND_API_URL=${NEXT_PUBLIC_BACKEND_API_URL}
ENV GOOGLE_GENERATIVE_AI_API_KEY=${GOOGLE_GENERATIVE_AI_API_KEY}

# Use a non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Cloud Run listens on $PORT (automatically set to 8080)
ENV PORT=8080
EXPOSE 8080

# Start Next.js using next start
CMD ["pnpm", "start", "--port", "8080"]
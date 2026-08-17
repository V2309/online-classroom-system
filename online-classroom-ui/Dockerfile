# ==========================================
# 1. Base Stage
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ==========================================
# 2. Dependencies Stage
# ==========================================
FROM base AS dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# ==========================================
# 3. Builder Stage
# ==========================================
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Các biến môi trường cần thiết khi Next.js build static
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:8080/api
ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000
ENV JWT_SECRET_KEY=mock_jwt_secret_key
ENV NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/mock"
ENV NEXT_PUBLIC_STREAM_API_KEY=mock_stream_key
ENV NEXT_PUBLIC_PUSHER_KEY=mock_pusher_key
ENV NEXT_PUBLIC_PUSHER_CLUSTER=ap1

RUN npm run build

# ==========================================
# 4. Production Runner Stage (Standalone)
# ==========================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Tạo user không đặc quyền
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy tài nguyên static và standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

# ==========================================
# 1. Base Stage: Cài đặt môi trường chung
# ==========================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ==========================================
# 2. Dependencies Stage: Cài đặt node_modules
# ==========================================
FROM base AS dependencies
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# ==========================================
# 3. Builder Stage: Build mã nguồn NestJS
# ==========================================
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ==========================================
# 4. Production Runner Stage
# ==========================================
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080

# Tạo user không đặc quyền để tăng tính bảo mật
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Cài đặt production dependencies & sinh lại Prisma client cho runtime
RUN npm ci --omit=dev && npx prisma generate

# Copy mã nguồn đã build từ builder stage
COPY --from=builder /app/dist ./dist

USER nestjs

EXPOSE 8080

CMD ["node", "dist/src/main.js"]

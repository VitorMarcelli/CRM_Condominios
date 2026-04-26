FROM node:20-alpine AS builder

WORKDIR /app

# Prisma engines need openssl + glibc shim on Alpine
RUN apk add --no-cache openssl libc6-compat

# Install dependencies first for caching
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client and build NestJS app
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Prisma engines need openssl + glibc shim on Alpine at runtime too
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Start command runs migrations and starts app
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]

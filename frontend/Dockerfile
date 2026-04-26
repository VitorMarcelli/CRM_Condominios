FROM node:20-alpine AS builder

WORKDIR /app

# Enable Next.js standalone build for Docker
ENV NEXT_TELEMETRY_DISABLED 1

# NEXT_PUBLIC_* vars are inlined at build time, so they must be ARGs
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV

COPY package*.json ./
RUN npm ci

COPY . .

# Build the Next.js app
RUN npm run build

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy public folder and standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

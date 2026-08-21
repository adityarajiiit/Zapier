FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/oauth/package.json ./packages/oauth/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --filter @repo/web... --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/prisma ./packages/prisma
COPY packages/crypto ./packages/crypto
COPY packages/oauth ./packages/oauth
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/prisma build
RUN pnpm --filter @repo/crypto build
RUN pnpm --filter @repo/oauth build
ENV DATABASE_URL="postgresql://temp:temp@localhost/temp"
ENV NEXT_PUBLIC_API_URL="https://api.aeroflow.tech"
RUN pnpm --filter @repo/web build

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
CMD ["pnpm","--filter","@repo/web","start"]
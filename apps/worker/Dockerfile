FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/engine/package.json ./packages/engine/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/oauth/package.json ./packages/oauth/
COPY packages/queue/package.json ./packages/queue/

RUN pnpm install --filter @repo/worker... --frozen-lockfile
COPY apps/worker ./apps/worker
COPY packages/engine ./packages/engine
COPY packages/integrations ./packages/integrations
COPY packages/prisma ./packages/prisma
COPY packages/typescript-config ./packages/typescript-config
COPY packages/crypto ./packages/crypto
COPY packages/oauth ./packages/oauth
COPY packages/queue ./packages/queue

RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/prisma build
RUN pnpm --filter @repo/crypto build
RUN pnpm --filter @repo/oauth build
RUN pnpm --filter @repo/integrations build
RUN pnpm --filter @repo/queue build
RUN pnpm --filter @repo/engine build
RUN pnpm --filter @repo/worker build

CMD ["node","apps/worker/dist/index.js"]
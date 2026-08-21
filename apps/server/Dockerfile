FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/integrations/package.json ./packages/integrations/
COPY packages/oauth/package.json ./packages/oauth/
COPY packages/crypto/package.json ./packages/crypto/
COPY packages/engine/package.json ./packages/engine/
COPY packages/queue/package.json ./packages/queue/
COPY packages/typescript-config/package.json ./packages/typescript-config/

COPY pnpm-lock.yaml ./ 
RUN pnpm install --filter @repo/server... --frozen-lockfile

COPY apps/server ./apps/server
COPY packages/prisma ./packages/prisma
COPY packages/integrations ./packages/integrations
COPY packages/oauth ./packages/oauth
COPY packages/crypto ./packages/crypto
COPY packages/engine ./packages/engine
COPY packages/queue ./packages/queue
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/prisma build
RUN pnpm --filter @repo/crypto build
RUN pnpm --filter @repo/oauth build
RUN pnpm --filter @repo/queue build
RUN pnpm --filter @repo/engine build
RUN pnpm --filter @repo/integrations build
RUN pnpm --filter @repo/server build

EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]

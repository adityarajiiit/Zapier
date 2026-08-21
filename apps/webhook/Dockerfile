FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm


COPY package.json pnpm-workspace.yaml turbo.json ./


COPY apps/webhook/package.json ./apps/webhook/
COPY packages/prisma/package.json ./packages/prisma/
COPY packages/queue/package.json ./packages/queue/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY pnpm-lock.yaml ./ 
RUN pnpm install --filter @repo/webhook... --frozen-lockfile


COPY apps/webhook ./apps/webhook
COPY packages/prisma ./packages/prisma
COPY packages/queue ./packages/queue
COPY packages/typescript-config ./packages/typescript-config

RUN pnpm --filter @repo/prisma db:generate
RUN pnpm --filter @repo/prisma build
RUN pnpm --filter @repo/queue build
RUN pnpm --filter @repo/webhook build

EXPOSE 3002
CMD ["node", "apps/webhook/dist/src/main.js"]

<p align="center">
  <img src="apps/web/app/icon.png" alt="AeroFlow Logo" width="80" />
</p>

<h1 align="center">AeroFlow</h1>

<p align="center">
  <strong>Open-source workflow automation platform - a Zapier alternative built from scratch</strong>
</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Overview

AeroFlow is a full-stack, production-ready workflow automation platform that lets users connect third-party services, define multi-step workflows with triggers and actions, and execute them automatically via webhooks, polling, or cron schedules. It features an AI-powered workflow generator using Google Gemini, real-time execution streaming via SSE, and a polished Next.js dashboard with animated UI components.

### Key Features

- **Visual Workflow Builder** - Drag-and-drop step editor with React Flow
- **AI Workflow Generation** - Describe what you want in plain English; Gemini builds the workflow
- **7 Built-in Integrations** - GitHub, Slack, Gmail, Google Sheets, Notion, Gemini AI, and extensible utilities
- **3 Trigger Types** - Webhook (real-time), Polling (interval-based), and Cron (schedule-based)
- **4 Step Types** - Action, Condition, Filter, and Delay
- **Real-time Execution Streaming** - SSE-powered live updates as steps execute
- **Encrypted Credential Vault** - AES-256-GCM encryption with key rotation support
- **OAuth2 Flow** - Full OAuth2 authorization code flow for GitHub, Google, Slack, and Notion
- **Webhook Signature Verification** - HMAC-based verification per integration (GitHub, Slack, etc.)
- **Scalable Worker Architecture** - BullMQ-based job queues with configurable concurrency and retries
- **Per-Integration Rate Limiting** - Configurable rate limits stored in the database
- **Premium UI** - Animated components (background beams, shimmer buttons, 3D cards, text effects)

---

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    Client["Browser Client"]

    subgraph Web["Web App - Next.js :3001"]
        W1["Dashboard & Workflow Editor"]
        W2["NextAuth - GitHub + Google SSO"]
        W3["Redux + RTK Query"]
    end

    subgraph Server["API Server - Fastify :3000"]
        S1["Workflows CRUD"]
        S2["Credentials Vault"]
        S3["OAuth2 Flow"]
        S4["AI Generation - Gemini"]
        S5["Rate Limiting"]
        S6["SSE Streaming"]
    end

    External["External Services\nGitHub, Slack, Notion, Gmail, Sheets"]

    subgraph Webhook["Webhook Service - Fastify :3002"]
        WH1["Signature Verification"]
        WH2["Dedup Delivery"]
        WH3["OAuth Forwarding"]
    end

    subgraph RedisLayer["Redis - BullMQ Broker"]
        Q1[/"steps queue"/]
        Q2[/"poll-triggers queue"/]
        Q3[/"cron-triggers queue"/]
    end

    subgraph Worker["Worker - BullMQ × 3 replicas"]
        WK1["Steps Worker\nconcurrency: 5"]
        WK2["Poll Worker\nconcurrency: 10"]
        WK3["Cron Worker\nconcurrency: 5"]
    end

    DB[("PostgreSQL\nNeon / Local\nPrisma ORM")]

    Client -->|"HTTPS"| Web
    Web -->|"REST + JWT"| Server
    External -->|"Webhooks"| Webhook
    Server -->|"Enqueue"| RedisLayer
    Webhook -->|"Enqueue"| RedisLayer
    Q1 --> WK1
    Q2 --> WK2
    Q3 --> WK3
    Worker ---|"Read / Write"| DB
    Server ---|"Read / Write"| DB
    Webhook ---|"Read / Write"| DB
```

### Multi-Layer Architecture

```mermaid
graph TB
    subgraph Presentation["PRESENTATION LAYER"]
        direction LR
        P1["Next.js 16 + React 19"]
        P2["Tailwind CSS + DaisyUI + Framer Motion"]
        P3["NextAuth v5 - GitHub + Google SSO -> JWT"]
        P4["Redux Toolkit + RTK Query"]
        P5["React Flow - Visual Workflow Editor"]
        P6["Animated UI Components"]
    end

    subgraph API["API LAYER"]
        direction LR
        A1["Fastify 5 + Helmet + CORS"]
        A2["JWT Middleware - HS256 + AUTH_SECRET"]
        A3["Zod Request Validation"]
        A4["Redis-backed Rate Limiting"]
        A5["Routes: /workflows, /integrations,\n/executions, /credentials, /oauth, /health"]
        A6["SSE Streaming - Real-time Updates"]
    end

    subgraph Business["BUSINESS LOGIC LAYER"]
        direction LR
        B1["@repo/engine\nStep Execution, Conditions,\nFilters, Input Resolution"]
        B2["@repo/integrations\nGitHub, Slack, Gmail,\nSheets, Notion, Gemini, Utils"]
        B3["@repo/oauth\nToken Exchange,\nRefresh, Decrypt"]
        B4["@repo/crypto\nAES-256-GCM,\nKey Rotation"]
    end

    subgraph Queue["QUEUE / MESSAGING LAYER"]
        direction LR
        MQ1["steps queue\nExecute each workflow step\nwith retries and backoff"]
        MQ2["poll-triggers queue\nScheduled every 60s\nper active polling trigger"]
        MQ3["cron-triggers queue\nCron-pattern-based\njob scheduler"]
    end

    subgraph Data["DATA LAYER"]
        direction LR
        D1[("PostgreSQL\nPrisma ORM\n17 models")]
        D2[("Redis\nJob Queues +\nRate Limiting")]
    end

    Presentation -->|"JWT Bearer Token"| API
    API --> Business
    Business --> Queue
    Queue --> Data
    API --> Data
```

### Workflow Execution Flow

```mermaid
flowchart TD
    A["User clicks 'Run'\nPOST /workflows/:id/trigger"] -->|"1. Create Execution\n2. Create first StepResult\n3. Enqueue to steps queue"| R["Redis - steps queue"]
    B["External Event\nGitHub push, Slack msg"] --> C["Webhook Service\nPOST /webhooks/:token"]
    C -->|"1. Verify signature\n2. Deduplicate delivery\n3. Store webhook record\n4. Create Execution\n5. Enqueue first step"| R

    R --> W["Worker - Process Step"]

    W --> Claim{"1. Claim Step\n(lease-based lock)"}
    Claim -->|"Claimed"| TypeCheck{"2. Check Step Type"}
    Claim -->|"Already claimed"| Skip["Skip - another worker owns it"]

    TypeCheck -->|"ACTION"| Action["Call Integration Handler\n(GitHub, Slack, Gmail, ...)"]
    TypeCheck -->|"CONDITION"| Condition["Evaluate Condition\nSkip remaining if false"]
    TypeCheck -->|"FILTER"| Filter["Evaluate Filter\nStop pipeline if false"]
    TypeCheck -->|"DELAY"| Delay["Re-enqueue with delay"]

    Action --> Resolve["3. Resolve Input Templates\n(reference previous step outputs)"]
    Resolve --> Execute["4. Execute Integration API Call"]
    Execute --> Complete["5. Complete Step\nStore output -> Create next StepResult"]
    Complete -->|"More steps?"| R
    Complete -->|"Last step"| Done["Execution COMPLETED"]

    Condition --> Complete
    Filter --> Complete
    Delay --> R

    Execute -->|"Error + Retries left"| Retry["Retry with Exponential Backoff"]
    Retry --> R
    Execute -->|"Error + No retries"| Failed["Execution FAILED"]
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, DaisyUI 5, Framer Motion, React Flow, Redux Toolkit, RTK Query |
| **API Server** | Fastify 5, TypeScript, Zod validation, JWT (jsonwebtoken) |
| **Webhook Service** | Fastify 5, HMAC signature verification |
| **Worker** | BullMQ 6, TypeScript, lease-based execution |
| **Database** | PostgreSQL (Neon-compatible), Prisma ORM 6 |
| **Queue Broker** | Redis 7, ioredis, BullMQ |
| **Auth** | NextAuth v5 (Auth.js) with GitHub + Google providers, JWT sessions |
| **Encryption** | AES-256-GCM (Node.js crypto), key rotation support |
| **AI** | Google Gemini API (workflow generation) |
| **Build System** | Turborepo, pnpm workspaces |
| **Containerization** | Docker, Docker Compose |
| **Runtime** | Node.js 20 (Alpine) |

---

## Project Structure

```
Zapier/
├── apps/
│   ├── server/                     # REST API server (Fastify, port 3000)
│   │   ├── index.ts                # Entry point - server bootstrap
│   │   ├── Dockerfile              # Production container
│   │   ├── seed-integrations.ts    # DB seeder for integrations
│   │   ├── controllers/
│   │   │   ├── ai.ts               # AI workflow generation (Gemini)
│   │   │   ├── credentials.ts      # Credential CRUD + testing
│   │   │   ├── executions.ts       # Execution listing & detail
│   │   │   ├── integrations.ts     # Integration catalog
│   │   │   ├── oauth.ts            # OAuth2 connect + callback
│   │   │   └── workflows.ts        # Full workflow CRUD, steps, sync
│   │   ├── middleware/
│   │   │   └── verifyToken.ts      # JWT auth middleware (HS256)
│   │   ├── routes/
│   │   │   ├── credentials.ts      # /credentials routes
│   │   │   ├── executions.ts       # /executions routes
│   │   │   ├── health.ts           # /health liveness check
│   │   │   ├── integrations.ts     # /integrations routes
│   │   │   ├── oauth.ts            # /oauth routes
│   │   │   ├── sse.ts              # /executions/:id/stream (SSE)
│   │   │   └── workflows.ts        # /workflows routes + AI generate
│   │   └── utils/
│   │       └── ai.ts               # Gemini prompt builder & caller
│   │
│   ├── web/                        # Frontend dashboard (Next.js, port 3001)
│   │   ├── Dockerfile              # Production container
│   │   ├── auth.ts                 # NextAuth config (GitHub + Google)
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── providers.tsx       # Redux provider wrapper
│   │   │   ├── globals.css         # Tailwind + DaisyUI theme
│   │   │   ├── login/              # Login page
│   │   │   ├── api/                # NextAuth API route handlers
│   │   │   └── dashboard/
│   │   │       ├── page.tsx        # Dashboard home (stats, recent runs)
│   │   │       ├── layout.tsx      # Dashboard layout with sidebar
│   │   │       ├── workflows/      # Workflow list, editor, history
│   │   │       ├── executions/     # Execution list, detail + live stream
│   │   │       ├── credentials/    # Credential management
│   │   │       ├── integrations/   # Integration catalog browser
│   │   │       └── settings/       # User settings
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   └── nav/            # Sidebar navigation
│   │   │   └── ui/                 # Reusable animated UI components
│   │   │       ├── background-beams.tsx
│   │   │       ├── shimmer-button.tsx
│   │   │       ├── sparkles-text.tsx
│   │   │       ├── card-3d.tsx
│   │   │       ├── number-ticker.tsx
│   │   │       ├── text-generate-effect.tsx
│   │   │       ├── sidebar.tsx
│   │   │       └── ...             # 16 animated components total
│   │   ├── store/
│   │   │   └── store.ts            # Redux store configuration
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utility libraries
│   │   └── utils/                  # Helper functions
│   │
│   ├── webhook/                    # Webhook ingestion service (Fastify, port 3002)
│   │   ├── Dockerfile              # Production container
│   │   └── src/
│   │       ├── main.ts             # Entry point - Fastify bootstrap
│   │       ├── index.ts            # Signature verification & helpers
│   │       ├── processor.ts        # Execution creator from webhooks
│   │       ├── routes/
│   │       │   ├── webhook.ts      # POST /webhooks/:token
│   │       │   └── slack.ts        # Slack-specific webhook routes
│   │       └── verification/       # Per-integration verification logic
│   │
│   └── worker/                     # Background job processor (BullMQ)
│       ├── Dockerfile              # Production container
│       ├── index.ts                # Entry - 3 BullMQ workers
│       └── utils/
│           ├── executor.ts         # Step execution engine
│           └── poller.ts           # Poll trigger handler
│
├── packages/
│   ├── prisma/                     # Database schema & client
│   │   ├── prisma/
│   │   │   └── schema.prisma       # 17 models, enums, relations
│   │   └── src/
│   │       ├── index.ts            # Prisma client export
│   │       └── seed.ts             # Database seeder
│   │
│   ├── engine/                     # Workflow execution engine
│   │   └── src/
│   │       ├── index.ts            # Public API exports
│   │       └── execution-engine.ts # Core: completeStep, failStep,
│   │                               # resolveInput, evaluateCondition,
│   │                               # evaluateFilter, buildContext,
│   │                               # enqueueStep, backoffFor
│   │
│   ├── queue/                      # BullMQ queue definitions
│   │   └── src/
│   │       └── index.ts            # 3 queues: steps, poll-triggers,
│   │                               # cron-triggers + Redis connection
│   │
│   ├── integrations/               # Integration registry & handlers
│   │   └── src/
│   │       ├── index.ts            # Registry: register all integrations
│   │       ├── integration.ts      # Base integration class
│   │       ├── types.ts            # Integration type definitions
│   │       ├── integrations/
│   │       │   ├── github/         # GitHub: issues, PRs, repos, stars
│   │       │   ├── slack/          # Slack: messages, channels
│   │       │   ├── gmail/          # Gmail: send, read emails
│   │       │   ├── googlesheets/   # Google Sheets: read/write rows
│   │       │   ├── notion/         # Notion: pages, databases
│   │       │   ├── gemini/         # Gemini AI: text generation
│   │       │   ├── test/           # Test integration (for development)
│   │       │   └── utils/          # Utility actions (transform, HTTP)
│   │       └── utils/
│   │           ├── ratelimiter.ts   # Redis-based rate limiter
│   │           └── safe-fetch.ts    # SSRF-safe HTTP client
│   │
│   ├── crypto/                     # Encryption vault
│   │   └── src/
│   │       ├── index.ts            # encrypt, decrypt, isLegacyCiphertext
│   │       └── vault.ts            # AES-256-GCM implementation
│   │
│   ├── oauth/                      # OAuth2 token management
│   │   └── src/
│   │       └── index.ts            # Token exchange, refresh, decrypt
│   │
│   ├── eslint-config/              # Shared ESLint configuration
│   └── typescript-config/          # Shared TypeScript tsconfig presets
│
├── docker-compose.yaml             # Full stack: redis, migrate, server,
│                                   # worker (×3), webhook, web
├── turbo.json                      # Turborepo task pipeline config
├── pnpm-workspace.yaml             # Monorepo workspace definition
├── package.json                    # Root scripts & dev dependencies
└── .env.production                 # Production env configuration
```

---

## Database Schema

The database contains **17 models** organized around the core domain:

```mermaid
erDiagram
    User ||--o{ Workflow : owns
    User ||--o{ Credential : stores
    User ||--o{ Account : has
    User ||--o{ Session : has

    Workflow ||--o| WorkflowTrigger : "started by"
    Workflow ||--o{ WorkflowStep : contains
    Workflow ||--o{ WorkflowExecution : runs
    Workflow ||--o| CronSchedule : "scheduled by"

    WorkflowTrigger }o--|| Trigger : references
    WorkflowTrigger ||--o{ Webhook : receives
    WorkflowTrigger }o--o| Credential : "uses"

    WorkflowStep }o--o| Action : performs
    WorkflowStep }o--o| Credential : uses
    WorkflowStep ||--o{ StepResult : produces

    WorkflowExecution ||--o{ StepResult : contains
    WorkflowExecution ||--o{ Webhook : logs

    Integration ||--o{ Trigger : offers
    Integration ||--o{ Action : provides
    Integration ||--o{ Credential : "linked to"
    Integration ||--o| OAuthConfig : "configured with"
    Integration ||--o| RateLimitConfig : "limited by"

    User {
        string id PK
        string name
        string email UK
        datetime createdAt
    }

    Workflow {
        string id PK
        string userId FK
        string name
        boolean isActive
    }

    WorkflowStep {
        string id PK
        string workflowId FK
        string stepType "ACTION, CONDITION, FILTER, DELAY"
        int stepOrder
        json input
    }

    WorkflowTrigger {
        string id PK
        string workflowId FK
        string triggerType "WEBHOOK, POLLING, CRON"
        string webhookPath
        string webhookSecret
    }

    WorkflowExecution {
        string id PK
        string workflowId FK
        string status "PENDING, RUNNING, COMPLETED, FAILED"
        datetime startedAt
        datetime finishedAt
    }

    StepResult {
        string id PK
        string executionId FK
        string status "PENDING, RUNNING, COMPLETED, FAILED, SKIPPED"
        json output
        string leaseOwner
    }

    Credential {
        string id PK
        string userId FK
        string authType "OAUTH2, APIKEY, TOKEN, NONE"
        string encryptedData
    }

    Integration {
        string id PK
        string name
        string authType
    }
```

### Key Models

| Model | Purpose |
|-------|---------|
| `User` | Authenticated user (via GitHub/Google SSO) |
| `Workflow` | Named automation with ordered steps |
| `WorkflowTrigger` | How a workflow starts (webhook/poll/cron) |
| `WorkflowStep` | Individual step: action, condition, filter, or delay |
| `WorkflowExecution` | Single run of a workflow |
| `StepResult` | Output of one step in an execution (with lease-based locking) |
| `Integration` | Third-party service definition (GitHub, Slack, etc.) |
| `Trigger` | Available trigger for an integration |
| `Action` | Available action for an integration |
| `Credential` | AES-256-GCM encrypted user credentials |
| `OAuthConfig` | OAuth2 config per integration (client ID, secret, URLs, scopes) |
| `CronSchedule` | Persisted cron schedule with next/last run tracking |
| `Webhook` | Inbound webhook record with deduplication |
| `RateLimitConfig` | Per-integration rate limit rules |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9.0.0
- **PostgreSQL** (local or [Neon](https://neon.tech))
- **Redis** 7+
- **Docker & Docker Compose** (for containerized deployment)

### Local Development Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-username/zapier.git
cd zapier
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment variables**

Create a `.env` file in the project root and fill in the required values (see [Environment Variables](#environment-variables) below).

Copy the `.env` file into each app directory that needs it:

```bash
cp .env apps/server/.env
cp .env apps/worker/.env
cp .env apps/webhook/.env
cp .env apps/web/.env
```

**4. Generate Prisma client**

```bash
pnpm --filter @repo/prisma db:generate
```

**5. Run database migrations**

```bash
pnpm --filter @repo/prisma db:migrate
```

**6. Seed integrations**

```bash
pnpm --filter @repo/server build
pnpm --filter @repo/server seed:integrations
```

**7. Build all packages**

```bash
pnpm build
```

**8. Start the development servers**

```bash
pnpm dev
```

This starts all four services via Turborepo:

| Service | URL | Description |
|---------|-----|-------------|
| Web | `http://localhost:3001` | Next.js dashboard |
| Server | `http://localhost:3000` | REST API |
| Webhook | `http://localhost:3002` | Webhook ingestion |
| Worker | - (background) | BullMQ job processor |

### Docker Deployment

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Scale workers
docker compose up --scale worker=5 -d

# Stop all services
docker compose down
```

The Docker Compose stack includes:
- **Redis** - Queue broker with health checks and persistent volume
- **Migrate** - One-shot container that runs Prisma migrations and seeds integrations
- **Server** - API server (port 3000)
- **Worker** - 3 replicas by default
- **Webhook** - Webhook service (port 3002)
- **Web** - Next.js frontend (port 3001)

---

## Environment Variables

### Core Infrastructure

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/zapier` |
| `REDIS_URL` | Yes | Redis connection URL | `redis://localhost:6379` |
| `NODE_ENV` | No | Environment mode | `development` / `production` |
| `LOG_LEVEL` | No | Pino log level | `info` |
| `PORT` | No | API server port (default: 3000) | `3000` |

### Security & Encryption

| Variable | Required | Description | How to Generate |
|----------|----------|-------------|-----------------|
| `ENCRYPTION_KEY` | Yes | 64 hex chars (32 bytes) for AES-256-GCM credential encryption | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PREVIOUS_ENCRYPTION_KEY` | No | Old key during rotation window | Same as above |
| `AUTH_SECRET` | Yes | 64 hex chars - signs JWT sessions and API bearer tokens | Same as above |

### Service URLs

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SERVER_URL` | Yes | API server base URL | `http://localhost:3000` |
| `WEB_URL` | Yes | Web app base URL | `http://localhost:3001` |
| `WEBHOOK_URL` | Yes | Webhook service base URL | `http://localhost:3002` |
| `AUTH_URL` | Yes | NextAuth callback URL | `http://localhost:3001` |
| `NEXTAUTH_URL` | Yes | NextAuth base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Yes | API URL (client-side) | `http://localhost:3000` |

### OAuth Redirect

| Variable | Required | Description |
|----------|----------|-------------|
| `OAUTH_REDIRECT_URL` | Yes | OAuth callback URL for integrations |
| `SLACK_REDIRECT_URL` | Yes | Slack-specific OAuth callback |

### Sign-in Providers (NextAuth)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_GITHUB_ID` | No | GitHub OAuth App ID (sign-in) |
| `AUTH_GITHUB_SECRET` | No | GitHub OAuth App Secret (sign-in) |
| `AUTH_GOOGLE_ID` | No | Google OAuth Client ID (sign-in) |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth Client Secret (sign-in) |

### Integration OAuth Apps

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth for workflow integrations |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth for Gmail / Sheets |
| `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` | Slack OAuth |
| `SLACK_SIGNING_SECRET` | Slack webhook signature verification |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` | Notion OAuth |

### AI

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `GEMINI_MODEL` | No | Gemini model name (default: `gemini-3.6-flash`) |

---

## API Reference

All API routes (except `/health` and `/oauth/callback`) require a `Bearer` JWT token in the `Authorization` header.

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Liveness check (DB ping) |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows` | List all user workflows |
| `GET` | `/workflows/:id` | Get workflow with trigger & steps |
| `POST` | `/workflows` | Create a new workflow |
| `PUT` | `/workflows/:id` | Update workflow name/description |
| `DELETE` | `/workflows/:id` | Delete a workflow |
| `POST` | `/workflows/:id/activate` | Activate (registers webhooks/polls/crons) |
| `POST` | `/workflows/:id/deactivate` | Deactivate (unregisters hooks/schedules) |
| `POST` | `/workflows/:id/trigger` | Manually trigger execution |
| `PUT` | `/workflows/:id/sync` | Batch sync trigger + steps (upsert) |
| `POST` | `/workflows/:id/steps` | Add a step |
| `PUT` | `/workflows/:id/steps/:stepId` | Update a step |
| `DELETE` | `/workflows/:id/steps/:stepId` | Delete a step (re-orders remaining) |
| `PUT` | `/workflows/:id/steps/reorder` | Reorder steps |
| `POST` | `/workflows/:id/webhook/regenerate` | Regenerate webhook secret |
| `GET` | `/workflows/:id/webhook/list` | List recent webhook deliveries |
| `POST` | `/workflows/generate` | AI-powered workflow generation |

### Integrations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/integrations` | List all available integrations |
| `GET` | `/integrations/:id` | Get integration details (triggers + actions) |

### Executions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/executions` | List all user executions |
| `GET` | `/executions/:id` | Get execution with step results |
| `GET` | `/executions/:id/stream` | SSE stream of live execution updates |

### Credentials

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/credentials` | List user credentials |
| `POST` | `/credentials` | Store a new encrypted credential |
| `DELETE` | `/credentials/:id` | Delete a credential |
| `GET` | `/credentials/:id/test` | Test credential validity |

### OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/oauth/connect/:integrationId` | Start OAuth2 authorization flow |
| `GET` | `/oauth/callback` | OAuth2 callback handler |

### Webhook Service (Port 3002)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/:token` | Receive inbound webhooks |
| `POST` | `/slack/*` | Slack-specific webhook endpoints |
| `GET` | `/health` | Webhook service health check |
| `GET` | `/oauth/callback` | Forwards to API server |

---

## Supported Integrations

| Integration | Auth Type | Triggers | Actions |
|-------------|-----------|----------|---------|
| **GitHub** | OAuth2 | Push, Issues, PRs, Stars, Comments | Create Issue, Create Comment, Star Repo, etc. |
| **Slack** | OAuth2 | Messages, Events | Send Message, List Channels |
| **Gmail** | OAuth2 | - | Send Email, Read Emails |
| **Google Sheets** | OAuth2 | - | Read/Write Rows, Create Spreadsheet |
| **Notion** | OAuth2 | - | Create Page, Query Database |
| **Gemini AI** | API Key | - | Generate Text, Summarize |
| **Utils** | None | - | HTTP Request, Transform Data, Delay |
| **Test** | None | Test Trigger | Test Action (development) |

---

## Key Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm format` | Format all `.ts`, `.tsx`, `.md` files with Prettier |
| `pnpm check-types` | TypeScript type checking |
| `pnpm --filter @repo/prisma db:generate` | Generate Prisma client |
| `pnpm --filter @repo/prisma db:migrate` | Run database migrations |
| `pnpm --filter @repo/prisma db:push` | Push schema to database |
| `pnpm --filter @repo/prisma db:seed` | Seed the database |
| `pnpm --filter @repo/server seed:integrations` | Seed integration catalog |

---

## Deployment

### Production Architecture

```mermaid
graph TD
    LB["Load Balancer / Reverse Proxy"]

    LB -->|"aeroflow.tech"| WebProd["Web App\nNext.js :3001"]
    LB -->|"api.aeroflow.tech"| ServerProd["API Server\nFastify :3000"]
    LB -->|"webhooks.aeroflow.tech"| WebhookProd["Webhook Service\nFastify :3002"]

    ServerProd --> WorkerProd["Worker × N\nBullMQ"]
    WebhookProd --> WorkerProd

    ServerProd --> RedisProd[("Redis\nDocker")]
    WebhookProd --> RedisProd
    WorkerProd --> RedisProd

    ServerProd --> PgProd[("PostgreSQL\nNeon Cloud")]
    WebhookProd --> PgProd
    WorkerProd --> PgProd

    WebProd -->|"REST + JWT"| ServerProd
```

### Deploy with Docker Compose

```bash
# 1. Configure production environment
cp .env.example .env.production
# Edit .env.production with production values

# 2. Build and deploy
docker compose --env-file .env.production up --build -d

# 3. Scale workers as needed
docker compose up --scale worker=5 -d
```

### Health Checks

Each service includes built-in health checks:

- **Server**: `GET /health` - pings the database
- **Webhook**: `GET /health` - pings the database
- **Redis**: `redis-cli ping`
- **Docker**: Built-in `HEALTHCHECK` in Dockerfiles (30s interval, 3 retries)

---

## License

This project is for educational and personal use.


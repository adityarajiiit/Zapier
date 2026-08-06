-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('OAUTH2', 'APIKEY', 'TOKEN', 'NONE');

-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('ACTION', 'CONDITION', 'FILTER', 'DELAY');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('WEBHOOK', 'POLLING', 'CRON');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email-verified" TIMESTAMP(3),
    "image" TEXT,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated-at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user-id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider-account-id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session-token" TEXT NOT NULL,
    "user-id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "auth-type" "AuthType" NOT NULL,
    "is-enabled" BOOLEAN NOT NULL DEFAULT true,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triggers" (
    "id" TEXT NOT NULL,
    "integration-id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger-type" "TriggerType" NOT NULL,
    "output-schema" JSONB,
    "is-enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "integration-id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "input-schema" JSONB,
    "output-schema" JSONB,
    "is-enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "user-id" TEXT NOT NULL,
    "integration-id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "auth-type" "AuthType" NOT NULL,
    "encrypted-data" TEXT NOT NULL,
    "is-valid" BOOLEAN NOT NULL DEFAULT true,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated-at" TIMESTAMP(3) NOT NULL,
    "token-expires-at" TIMESTAMP(3),

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "user-id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is-active" BOOLEAN NOT NULL DEFAULT false,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated-at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow-triggers" (
    "id" TEXT NOT NULL,
    "workflow-id" TEXT NOT NULL,
    "trigger-id" TEXT NOT NULL,
    "credential-id" TEXT,
    "config" JSONB,
    "webhook-secret" TEXT,
    "webhook-path" TEXT,
    "cron" TEXT,
    "last-fired-at" TIMESTAMP(3),

    CONSTRAINT "workflow-triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow-steps" (
    "id" TEXT NOT NULL,
    "workflow-id" TEXT NOT NULL,
    "action-id" TEXT,
    "credential-id" TEXT,
    "step-order" INTEGER NOT NULL,
    "name" TEXT,
    "input" JSONB,
    "step-type" "StepType" NOT NULL DEFAULT 'ACTION',
    "condition-config" JSONB,
    "error-config" JSONB,
    "is-enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "workflow-steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow-executions" (
    "id" TEXT NOT NULL,
    "workflow-id" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "trigger-data" JSONB,
    "started-at" TIMESTAMP(3),
    "finished-at" TIMESTAMP(3),
    "error" TEXT,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow-executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step-results" (
    "id" TEXT NOT NULL,
    "execution-id" TEXT NOT NULL,
    "workflow-step-id" TEXT NOT NULL,
    "step-order" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "started-at" TIMESTAMP(3),
    "finished-at" TIMESTAMP(3),
    "attempt-number" INTEGER NOT NULL DEFAULT 0,
    "iteration-index" INTEGER,
    "was-skipped" BOOLEAN NOT NULL DEFAULT false,
    "parent-result-id" TEXT,

    CONSTRAINT "step-results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth-configs" (
    "id" TEXT NOT NULL,
    "integration-id" TEXT NOT NULL,
    "client-id" TEXT NOT NULL,
    "client-secret" TEXT NOT NULL,
    "auth-url" TEXT NOT NULL,
    "token-url" TEXT NOT NULL,
    "scopes" TEXT[],
    "extra-params" JSONB,

    CONSTRAINT "oauth-configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron-schedules" (
    "id" TEXT NOT NULL,
    "workflow-id" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "next-run-at" TIMESTAMP(3) NOT NULL,
    "last-run-at" TIMESTAMP(3),
    "is-active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cron-schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "workflow-trigger-id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status-code" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "execution-id" TEXT,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate-limit-configs" (
    "id" TEXT NOT NULL,
    "integration-id" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "max-requests" INTEGER NOT NULL,

    CONSTRAINT "rate-limit-configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider-account-id_key" ON "accounts"("provider", "provider-account-id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session-token_key" ON "sessions"("session-token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_token_key" ON "verification_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "triggers_integration-id_name_key" ON "triggers"("integration-id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "actions_integration-id_name_key" ON "actions"("integration-id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "workflow-triggers_workflow-id_key" ON "workflow-triggers"("workflow-id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow-triggers_webhook-path_key" ON "workflow-triggers"("webhook-path");

-- CreateIndex
CREATE UNIQUE INDEX "workflow-steps_workflow-id_step-order_key" ON "workflow-steps"("workflow-id", "step-order");

-- CreateIndex
CREATE INDEX "workflow-executions_workflow-id_created-at_idx" ON "workflow-executions"("workflow-id", "created-at");

-- CreateIndex
CREATE INDEX "step-results_status_step-order_idx" ON "step-results"("status", "step-order");

-- CreateIndex
CREATE UNIQUE INDEX "oauth-configs_integration-id_key" ON "oauth-configs"("integration-id");

-- CreateIndex
CREATE UNIQUE INDEX "cron-schedules_workflow-id_key" ON "cron-schedules"("workflow-id");

-- CreateIndex
CREATE INDEX "cron-schedules_is-active_next-run-at_idx" ON "cron-schedules"("is-active", "next-run-at");

-- CreateIndex
CREATE INDEX "webhooks_workflow-trigger-id_created-at_idx" ON "webhooks"("workflow-trigger-id", "created-at");

-- CreateIndex
CREATE UNIQUE INDEX "rate-limit-configs_integration-id_key" ON "rate-limit-configs"("integration-id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user-id_fkey" FOREIGN KEY ("user-id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user-id_fkey" FOREIGN KEY ("user-id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_integration-id_fkey" FOREIGN KEY ("integration-id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_integration-id_fkey" FOREIGN KEY ("integration-id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user-id_fkey" FOREIGN KEY ("user-id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_integration-id_fkey" FOREIGN KEY ("integration-id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_user-id_fkey" FOREIGN KEY ("user-id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-triggers" ADD CONSTRAINT "workflow-triggers_workflow-id_fkey" FOREIGN KEY ("workflow-id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-triggers" ADD CONSTRAINT "workflow-triggers_trigger-id_fkey" FOREIGN KEY ("trigger-id") REFERENCES "triggers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-triggers" ADD CONSTRAINT "workflow-triggers_credential-id_fkey" FOREIGN KEY ("credential-id") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-steps" ADD CONSTRAINT "workflow-steps_workflow-id_fkey" FOREIGN KEY ("workflow-id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-steps" ADD CONSTRAINT "workflow-steps_action-id_fkey" FOREIGN KEY ("action-id") REFERENCES "actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-steps" ADD CONSTRAINT "workflow-steps_credential-id_fkey" FOREIGN KEY ("credential-id") REFERENCES "credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow-executions" ADD CONSTRAINT "workflow-executions_workflow-id_fkey" FOREIGN KEY ("workflow-id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step-results" ADD CONSTRAINT "step-results_execution-id_fkey" FOREIGN KEY ("execution-id") REFERENCES "workflow-executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step-results" ADD CONSTRAINT "step-results_workflow-step-id_fkey" FOREIGN KEY ("workflow-step-id") REFERENCES "workflow-steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth-configs" ADD CONSTRAINT "oauth-configs_integration-id_fkey" FOREIGN KEY ("integration-id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cron-schedules" ADD CONSTRAINT "cron-schedules_workflow-id_fkey" FOREIGN KEY ("workflow-id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_workflow-trigger-id_fkey" FOREIGN KEY ("workflow-trigger-id") REFERENCES "workflow-triggers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate-limit-configs" ADD CONSTRAINT "rate-limit-configs_integration-id_fkey" FOREIGN KEY ("integration-id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

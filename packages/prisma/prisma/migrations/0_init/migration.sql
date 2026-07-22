-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DagRunEnum" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskInstanceEnum" AS ENUM ('WAITING', 'READY', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "dags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task-nodes" (
    "id" TEXT NOT NULL,
    "dag-id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "retry" JSONB NOT NULL,

    CONSTRAINT "task-nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task-edges" (
    "dag-id" TEXT NOT NULL,
    "parent-task-id" TEXT NOT NULL,
    "child-task-id" TEXT NOT NULL,

    CONSTRAINT "task-edges_pkey" PRIMARY KEY ("parent-task-id","child-task-id")
);

-- CreateTable
CREATE TABLE "dag-runs" (
    "id" TEXT NOT NULL,
    "dag-id" TEXT NOT NULL,
    "status" "DagRunEnum" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "started-at" TIMESTAMP(3),
    "finished-at" TIMESTAMP(3),
    "created-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dag-runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task-instances" (
    "id" TEXT NOT NULL,
    "dag-run-id" TEXT NOT NULL,
    "task-node-id" TEXT NOT NULL,
    "status" "TaskInstanceEnum" NOT NULL DEFAULT 'WAITING',
    "remaining-dependencies" INTEGER NOT NULL DEFAULT 0,
    "attempt-number" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB,
    "error" TEXT,
    "started-at" TIMESTAMP(3),
    "finished-at" TIMESTAMP(3),

    CONSTRAINT "task-instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task-rents" (
    "task-instance-id" TEXT NOT NULL,
    "worker-id" TEXT NOT NULL,
    "execution-id" BIGSERIAL NOT NULL,
    "acquired-at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires-at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task-rents_pkey" PRIMARY KEY ("task-instance-id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dags_name_key" ON "dags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "task-nodes_dag-id_name_key" ON "task-nodes"("dag-id", "name");

-- CreateIndex
CREATE INDEX "task-edges_parent-task-id_idx" ON "task-edges"("parent-task-id");

-- CreateIndex
CREATE INDEX "task-edges_child-task-id_idx" ON "task-edges"("child-task-id");

-- CreateIndex
CREATE INDEX "task-instances_status_remaining-dependencies_idx" ON "task-instances"("status", "remaining-dependencies");

-- CreateIndex
CREATE UNIQUE INDEX "task-instances_dag-run-id_task-node-id_key" ON "task-instances"("dag-run-id", "task-node-id");

-- AddForeignKey
ALTER TABLE "task-nodes" ADD CONSTRAINT "task-nodes_dag-id_fkey" FOREIGN KEY ("dag-id") REFERENCES "dags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task-edges" ADD CONSTRAINT "task-edges_parent-task-id_fkey" FOREIGN KEY ("parent-task-id") REFERENCES "task-nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task-edges" ADD CONSTRAINT "task-edges_child-task-id_fkey" FOREIGN KEY ("child-task-id") REFERENCES "task-nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag-runs" ADD CONSTRAINT "dag-runs_dag-id_fkey" FOREIGN KEY ("dag-id") REFERENCES "dags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task-instances" ADD CONSTRAINT "task-instances_dag-run-id_fkey" FOREIGN KEY ("dag-run-id") REFERENCES "dag-runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task-instances" ADD CONSTRAINT "task-instances_task-node-id_fkey" FOREIGN KEY ("task-node-id") REFERENCES "task-nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task-rents" ADD CONSTRAINT "task-rents_task-instance-id_fkey" FOREIGN KEY ("task-instance-id") REFERENCES "task-instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;


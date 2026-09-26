-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CREDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CaseNature" AS ENUM ('RECUPERACAO_JUDICIAL', 'FALENCIA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('EM_ANALISE', 'DEFERIDO', 'INDEFERIDO');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('PUBLICO', 'PRIVADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('HABILITACAO_CREDITO', 'DIVERGENCIA_CREDITO', 'HABILITACAO_ACG', 'OUTROS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CREDITOR',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMPTZ,
    "avatar_key" TEXT,
    "registration_ip" VARCHAR(45),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "judicial_admin" VARCHAR(300) NOT NULL,
    "judge" VARCHAR(300) NOT NULL,
    "nature" "CaseNature" NOT NULL,
    "process_number" VARCHAR(50) NOT NULL,
    "protocol_date" DATE NOT NULL,
    "author" VARCHAR(300) NOT NULL,
    "comarca" VARCHAR(300) NOT NULL,
    "observations" VARCHAR(300),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(1000),
    "type" "DocumentType" NOT NULL,
    "custom_type" VARCHAR(255),
    "status" "DocumentStatus" NOT NULL DEFAULT 'EM_ANALISE',
    "visibility" "DocumentVisibility" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "extension" VARCHAR(10) NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "company_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_tokens_token_hash_key" ON "email_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "email_tokens_user_id_idx" ON "email_tokens"("user_id");

-- CreateIndex
CREATE INDEX "email_tokens_expires_at_idx" ON "email_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "companies_nature_idx" ON "companies"("nature");

-- CreateIndex
CREATE INDEX "companies_process_number_idx" ON "companies"("process_number");

-- CreateIndex
CREATE UNIQUE INDEX "documents_storage_key_key" ON "documents"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "documents_content_hash_key" ON "documents"("content_hash");

-- CreateIndex
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");

-- CreateIndex
CREATE INDEX "documents_owner_id_idx" ON "documents"("owner_id");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "documents"("status");

-- CreateIndex
CREATE INDEX "documents_visibility_idx" ON "documents"("visibility");

-- CreateIndex
CREATE INDEX "documents_content_hash_idx" ON "documents"("content_hash");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

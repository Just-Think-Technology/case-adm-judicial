-- DropIndex
DROP INDEX "documents_content_hash_key";

-- CreateIndex
CREATE UNIQUE INDEX "documents_owner_id_company_id_content_hash_key" ON "documents"("owner_id", "company_id", "content_hash");

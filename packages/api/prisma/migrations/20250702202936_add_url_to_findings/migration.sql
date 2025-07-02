-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE INDEX "Finding_url_idx" ON "Finding"("url");

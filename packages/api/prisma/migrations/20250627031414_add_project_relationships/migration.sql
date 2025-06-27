/*
  Warnings:

  - Added the required column `expiresAt` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProjectRelationship" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "sourceProjectId" TEXT NOT NULL,
    "targetProjectId" TEXT NOT NULL,

    CONSTRAINT "ProjectRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRelationship_sourceProjectId_targetProjectId_type_key" ON "ProjectRelationship"("sourceProjectId", "targetProjectId", "type");

-- AddForeignKey
ALTER TABLE "ProjectRelationship" ADD CONSTRAINT "ProjectRelationship_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRelationship" ADD CONSTRAINT "ProjectRelationship_targetProjectId_fkey" FOREIGN KEY ("targetProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

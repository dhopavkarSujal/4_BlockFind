/*
  Warnings:

  - The values [OPEN,CLAIM_PENDING,RECOVERED,CLOSED] on the enum `AssetStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `location` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `reportedById` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `assetId` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `assetId` on the `RecoveryRecord` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[claimId]` on the table `RecoveryRecord` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[foundItemId]` on the table `RecoveryRecord` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foundItemId` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lostReportId` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `claimId` to the `RecoveryRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foundItemId` to the `RecoveryRecord` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LostReportStatus" AS ENUM ('OPEN', 'CLAIM_PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FoundItemStatus" AS ENUM ('IN_CUSTODY', 'CLAIM_PENDING', 'RELEASED', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "AssetStatus_new" AS ENUM ('ACTIVE', 'ARCHIVED');
ALTER TABLE "public"."Asset" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Asset" ALTER COLUMN "status" TYPE "AssetStatus_new" USING ("status"::text::"AssetStatus_new");
ALTER TYPE "AssetStatus" RENAME TO "AssetStatus_old";
ALTER TYPE "AssetStatus_new" RENAME TO "AssetStatus";
DROP TYPE "public"."AssetStatus_old";
ALTER TABLE "Asset" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
ALTER TYPE "ClaimStatus" ADD VALUE 'IN_REVIEW';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VERIFIER';

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_assetId_fkey";

-- DropForeignKey
ALTER TABLE "RecoveryRecord" DROP CONSTRAINT "RecoveryRecord_assetId_fkey";

-- DropIndex
DROP INDEX "Asset_reportedById_idx";

-- DropIndex
DROP INDEX "Asset_type_status_idx";

-- DropIndex
DROP INDEX "Claim_assetId_status_idx";

-- DropIndex
DROP INDEX "Claim_claimantId_idx";

-- DropIndex
DROP INDEX "RecoveryRecord_assetId_key";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "location",
DROP COLUMN "reportedById",
DROP COLUMN "type",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "ownerId" UUID NOT NULL,
ADD COLUMN     "serialNumber" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "assetId",
ADD COLUMN     "decisionNotes" TEXT,
ADD COLUMN     "foundItemId" UUID NOT NULL,
ADD COLUMN     "lostReportId" UUID NOT NULL,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" UUID;

-- AlterTable
ALTER TABLE "RecoveryRecord" DROP COLUMN "assetId",
ADD COLUMN     "claimId" UUID NOT NULL,
ADD COLUMN     "foundItemId" UUID NOT NULL;

-- DropEnum
DROP TYPE "AssetType";

-- CreateTable
CREATE TABLE "LostReport" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "reportedById" UUID NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "lostAt" TIMESTAMP(3),
    "status" "LostReportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LostReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoundItem" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "location" TEXT NOT NULL,
    "foundAt" TIMESTAMP(3),
    "status" "FoundItemStatus" NOT NULL DEFAULT 'IN_CUSTODY',
    "recordedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256Hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LostReport_assetId_status_idx" ON "LostReport"("assetId", "status");

-- CreateIndex
CREATE INDEX "LostReport_reportedById_status_idx" ON "LostReport"("reportedById", "status");

-- CreateIndex
CREATE INDEX "LostReport_status_createdAt_idx" ON "LostReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FoundItem_category_status_idx" ON "FoundItem"("category", "status");

-- CreateIndex
CREATE INDEX "FoundItem_status_createdAt_idx" ON "FoundItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FoundItem_recordedById_idx" ON "FoundItem"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimEvidence_storageKey_key" ON "ClaimEvidence"("storageKey");

-- CreateIndex
CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Asset_ownerId_status_idx" ON "Asset"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Claim_lostReportId_status_idx" ON "Claim"("lostReportId", "status");

-- CreateIndex
CREATE INDEX "Claim_foundItemId_status_idx" ON "Claim"("foundItemId", "status");

-- CreateIndex
CREATE INDEX "Claim_claimantId_status_idx" ON "Claim"("claimantId", "status");

-- CreateIndex
CREATE INDEX "Claim_reviewedById_idx" ON "Claim"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryRecord_claimId_key" ON "RecoveryRecord"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveryRecord_foundItemId_key" ON "RecoveryRecord"("foundItemId");

-- CreateIndex
CREATE INDEX "RecoveryRecord_recordedById_idx" ON "RecoveryRecord"("recordedById");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostReport" ADD CONSTRAINT "LostReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LostReport" ADD CONSTRAINT "LostReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundItem" ADD CONSTRAINT "FoundItem_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_lostReportId_fkey" FOREIGN KEY ("lostReportId") REFERENCES "LostReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "FoundItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRecord" ADD CONSTRAINT "RecoveryRecord_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryRecord" ADD CONSTRAINT "RecoveryRecord_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "FoundItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

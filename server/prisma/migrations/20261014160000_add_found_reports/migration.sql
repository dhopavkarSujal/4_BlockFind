-- CreateEnum
CREATE TYPE "FoundReportStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'NEEDS_INFO', 'REJECTED', 'ACCEPTED_IN_CUSTODY');

-- CreateTable
CREATE TABLE "FoundReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "location" TEXT NOT NULL,
    "foundAt" TIMESTAMP(3),
    "status" "FoundReportStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "custodyReceivedById" UUID,
    "custodyReceivedAt" TIMESTAMP(3),
    "foundItemId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoundReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoundReport_foundItemId_key" ON "FoundReport"("foundItemId");

-- CreateIndex
CREATE INDEX "FoundReport_reporterId_status_idx" ON "FoundReport"("reporterId", "status");

-- CreateIndex
CREATE INDEX "FoundReport_status_createdAt_idx" ON "FoundReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FoundReport_reviewedById_idx" ON "FoundReport"("reviewedById");

-- CreateIndex
CREATE INDEX "FoundReport_custodyReceivedById_idx" ON "FoundReport"("custodyReceivedById");

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_custodyReceivedById_fkey" FOREIGN KEY ("custodyReceivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_foundItemId_fkey" FOREIGN KEY ("foundItemId") REFERENCES "FoundItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

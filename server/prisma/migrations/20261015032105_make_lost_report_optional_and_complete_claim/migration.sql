-- AlterEnum
ALTER TYPE "ClaimStatus" ADD VALUE 'COMPLETED';

-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_lostReportId_fkey";

-- AlterTable
ALTER TABLE "Claim" ALTER COLUMN "lostReportId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_lostReportId_fkey" FOREIGN KEY ("lostReportId") REFERENCES "LostReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

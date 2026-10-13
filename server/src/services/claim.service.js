import { recordAuditEvent } from './audit-log.service.js';
import prisma from '../db/prisma.js';

const ACTIVE_CLAIM_STATUSES = ['PENDING', 'IN_REVIEW'];

const CLAIM_INCLUDE = {
  lostReport: {
    select: {
      id: true,
      description: true,
      location: true,
      lostAt: true,
      status: true,
      createdAt: true,
      asset: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          brand: true,
          model: true,
          status: true,
        },
      },
    },
  },
  foundItem: {
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      brand: true,
      model: true,
      location: true,
      foundAt: true,
      status: true,
      createdAt: true,
    },
  },
  claimant: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

export class ClaimServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ClaimServiceError';
    this.statusCode = statusCode;
  }
}

async function runSerializableTransaction(callback) {
  try {
    return await prisma.$transaction(callback, {
      isolationLevel: 'Serializable',
    });
  } catch (error) {
    if (error?.code === 'P2034') {
      throw new ClaimServiceError(
        'Another operation changed this claim or item. Refresh and try again.',
        409,
      );
    }

    throw error;
  }
}

function ensureClaimCanBeReviewed(claim) {
  if (!claim) {
    throw new ClaimServiceError('Claim not found', 404);
  }

  if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
    throw new ClaimServiceError(
      'Only pending or in-review claims can be processed',
      409,
    );
  }

  if (
    claim.lostReport.status !== 'CLAIM_PENDING' ||
    claim.foundItem.status !== 'CLAIM_PENDING'
  ) {
    throw new ClaimServiceError(
      'Claim and item statuses are inconsistent. Please investigate before proceeding.',
      409,
    );
  }
}

export async function createClaim({
  claimantId,
  lostReportId,
  foundItemId,
  details,
}) {
  return runSerializableTransaction(async (tx) => {
    const lostReport = await tx.lostReport.findUnique({
      where: { id: lostReportId },
      select: {
        id: true,
        reportedById: true,
        status: true,
        asset: {
          select: {
            ownerId: true,
            status: true,
          },
        },
      },
    });

    // Do not reveal reports belonging to another user.
    if (
      !lostReport ||
      lostReport.reportedById !== claimantId ||
      lostReport.asset.ownerId !== claimantId
    ) {
      throw new ClaimServiceError('Lost report not found', 404);
    }

    const foundItem = await tx.foundItem.findUnique({
      where: { id: foundItemId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!foundItem) {
      throw new ClaimServiceError('Found item not found', 404);
    }

    const duplicate = await tx.claim.findFirst({
      where: {
        lostReportId,
        foundItemId,
        status: { in: ACTIVE_CLAIM_STATUSES },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ClaimServiceError(
        'An active claim already exists for this lost report and found item',
        409,
      );
    }

    if (lostReport.asset.status !== 'ACTIVE') {
      throw new ClaimServiceError(
        'Claims cannot be created for an archived asset',
        409,
      );
    }

    if (lostReport.status !== 'OPEN') {
      throw new ClaimServiceError(
        'This lost report is not available for a new claim',
        409,
      );
    }

    if (foundItem.status !== 'IN_CUSTODY') {
      throw new ClaimServiceError(
        'This found item is not available for a new claim',
        409,
      );
    }

    const claim = await tx.claim.create({
      data: {
        lostReportId,
        foundItemId,
        claimantId,
        details: details ?? null,
        status: 'PENDING',
      },
      select: { id: true },
    });

    // Change both records atomically with the claim.
    await tx.lostReport.update({
      where: { id: lostReportId },
      data: { status: 'CLAIM_PENDING' },
    });

    await tx.foundItem.update({
      where: { id: foundItemId },
      data: { status: 'CLAIM_PENDING' },
    });
    
    await recordAuditEvent(tx, {
      actorId: claimantId,
      action: 'CLAIM_SUBMITTED',
      entityType: 'Claim',
      entityId: claim.id,
      details: {
        lostReportId,
        foundItemId,
      },
    });
    return tx.claim.findUnique({
      where: { id: claim.id },
      include: CLAIM_INCLUDE,
    });
  });
}

export async function listMyClaims(claimantId) {
  return prisma.claim.findMany({
    where: { claimantId },
    include: CLAIM_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClaimById(id, requester) {
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: CLAIM_INCLUDE,
  });

  if (!claim) {
    throw new ClaimServiceError('Claim not found', 404);
  }

  const isOwner = claim.claimantId === requester.id;
  const isStaff = ['VERIFIER', 'ADMIN'].includes(requester.role);

  if (!isOwner && !isStaff) {
    throw new ClaimServiceError('Claim not found', 404);
  }

  return claim;
}

export async function listClaimsForReview(status) {
  return prisma.claim.findMany({
    where: {
      status: status ?? { in: ACTIVE_CLAIM_STATUSES },
    },
    include: CLAIM_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });
}

export async function startClaimReview(id, reviewerId) {
  return runSerializableTransaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id },
      include: {
        lostReport: { select: { status: true } },
        foundItem: { select: { status: true } },
      },
    });

    ensureClaimCanBeReviewed(claim);

    if (claim.status !== 'PENDING') {
      throw new ClaimServiceError(
        'Only a pending claim can enter review',
        409,
      );
    }

    await tx.claim.update({
      where: { id },
      data: {
        status: 'IN_REVIEW',
        reviewedById: reviewerId,
        reviewedAt: null,
        decisionNotes: null,
      },
    });

    await recordAuditEvent(tx, {
      actorId: reviewerId,
      action: 'CLAIM_REVIEW_STARTED',
      entityType: 'Claim',
      entityId: id,
      details: {
        status: 'IN_REVIEW',
      },
    });

    return tx.claim.findUnique({
      where: { id },
      include: CLAIM_INCLUDE,
    });
  });
}

export async function reviewClaim(
  id,
  reviewerId,
  { decision, decisionNotes },
) {
  return runSerializableTransaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id },
      include: {
        lostReport: { select: { id: true, status: true } },
        foundItem: { select: { id: true, status: true } },
      },
    });

    ensureClaimCanBeReviewed(claim);

    if (claim.status !== 'IN_REVIEW') {
      throw new ClaimServiceError(
        'Start claim review before making a decision',
        409,
      );
    }

    const reviewedAt = new Date();

    if (decision === 'APPROVED') {
      const existingRecovery = await tx.recoveryRecord.findFirst({
        where: {
          OR: [
            { claimId: id },
            { foundItemId: claim.foundItemId },
          ],
        },
        select: { id: true },
      });

      if (existingRecovery) {
        throw new ClaimServiceError(
          'A recovery record already exists for this claim or found item',
          409,
        );
      }

      await tx.lostReport.update({
        where: { id: claim.lostReportId },
        data: { status: 'RESOLVED' },
      });

      await tx.foundItem.update({
        where: { id: claim.foundItemId },
        data: { status: 'RELEASED' },
      });

            const recoveryRecord = await tx.recoveryRecord.create({
        data: {
          claimId: id,
          foundItemId: claim.foundItemId,
          recordedById: reviewerId,
          recoveredAt: reviewedAt,
          notes:
            decisionNotes ??
            'Claim approved and item released after verification.',
        },
      });

      await recordAuditEvent(tx, {
        actorId: reviewerId,
        action: 'RECOVERY_RECORDED',
        entityType: 'RecoveryRecord',
        entityId: recoveryRecord.id,
        details: {
          claimId: id,
          foundItemId: claim.foundItemId,
        },
      });
    } else {
      // A rejected claim makes both records available again.
      await tx.lostReport.update({
        where: { id: claim.lostReportId },
        data: { status: 'OPEN' },
      });

      await tx.foundItem.update({
        where: { id: claim.foundItemId },
        data: { status: 'IN_CUSTODY' },
      });
    }

    await tx.claim.update({
      where: { id },
      data: {
        status: decision,
        reviewedById: reviewerId,
        reviewedAt,
        decisionNotes: decisionNotes ?? null,
      },
    });
    await recordAuditEvent(tx, {
      actorId: reviewerId,
      action:
        decision === 'APPROVED'
          ? 'CLAIM_APPROVED'
          : 'CLAIM_REJECTED',
      entityType: 'Claim',
      entityId: id,
      details: {
        lostReportId: claim.lostReportId,
        foundItemId: claim.foundItemId,
        decisionNotes: decisionNotes ?? null,
      },
    });
    return tx.claim.findUnique({
      where: { id },
      include: CLAIM_INCLUDE,
    });
  });
}

export async function cancelClaim(id, claimantId) {
  return runSerializableTransaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: { id },
      include: {
        lostReport: { select: { status: true } },
        foundItem: { select: { status: true } },
      },
    });

    if (!claim || claim.claimantId !== claimantId) {
      throw new ClaimServiceError('Claim not found', 404);
    }

    if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      throw new ClaimServiceError(
        'Only pending or in-review claims can be cancelled',
        409,
      );
    }

    if (
      claim.lostReport.status !== 'CLAIM_PENDING' ||
      claim.foundItem.status !== 'CLAIM_PENDING'
    ) {
      throw new ClaimServiceError(
        'Claim and item statuses are inconsistent. Please investigate before cancelling.',
        409,
      );
    }

    await tx.lostReport.update({
      where: { id: claim.lostReportId },
      data: { status: 'OPEN' },
    });

    await tx.foundItem.update({
      where: { id: claim.foundItemId },
      data: { status: 'IN_CUSTODY' },
    });

    await tx.claim.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        reviewedById: null,
        reviewedAt: null,
        decisionNotes: null,
      },
    });

    await recordAuditEvent(tx, {
      actorId: claimantId,
      action: 'CLAIM_CANCELLED',
      entityType: 'Claim',
      entityId: id,
      details: {
        lostReportId: claim.lostReportId,
        foundItemId: claim.foundItemId,
      },
    });
    return tx.claim.findUnique({
      where: { id },
      include: CLAIM_INCLUDE,
    });
  });
}

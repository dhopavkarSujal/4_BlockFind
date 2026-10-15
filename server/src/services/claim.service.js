
import { recordAuditEvent } from './audit-log.service.js'
import prisma from '../db/prisma.js'

const ACTIVE_CLAIM_STATUSES = ['PENDING', 'IN_REVIEW']

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
}

export class ClaimServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'ClaimServiceError'
    this.statusCode = statusCode
  }
}

async function runSerializableTransaction(callback) {
  try {
    return await prisma.$transaction(callback, {
      isolationLevel: 'Serializable',
      maxWait: 20_000,
      timeout: 30_000,
    })
  } catch (error) {
    if (error?.code === 'P2034') {
      throw new ClaimServiceError(
        'Another operation changed this claim or item. Refresh and try again.',
        409,
      )
    }

    throw error
  }
}

function ensureClaimCanBeReviewed(claim) {
  if (!claim) {
    throw new ClaimServiceError('Claim not found', 404)
  }

  if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
    throw new ClaimServiceError(
      'Only pending or in-review claims can be processed',
      409,
    )
  }

  // A direct claim has no linked lost report.
  // If one exists, its status must also be consistent.
  if (
    (claim.lostReport &&
      claim.lostReport.status !== 'CLAIM_PENDING') ||
    claim.foundItem.status !== 'CLAIM_PENDING'
  ) {
    throw new ClaimServiceError(
      'Claim and item statuses are inconsistent. Please investigate before proceeding.',
      409,
    )
  }
}

// Submit a claim with or without a linked lost report.
export async function createClaim({
  claimantId,
  lostReportId,
  foundItemId,
  details,
}) {
  return runSerializableTransaction(async (tx) => {
    let lostReport = null

    // A linked lost report is optional.
    if (lostReportId) {
      lostReport = await tx.lostReport.findUnique({
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
      })

      // The lost report and its asset must belong to the claimant.
      if (
        !lostReport ||
        lostReport.reportedById !== claimantId ||
        lostReport.asset.ownerId !== claimantId
      ) {
        throw new ClaimServiceError('Lost report not found', 404)
      }

      if (lostReport.asset.status !== 'ACTIVE') {
        throw new ClaimServiceError(
          'Claims cannot be created for an archived asset',
          409,
        )
      }

      if (lostReport.status !== 'OPEN') {
        throw new ClaimServiceError(
          'This lost report is not available for a new claim',
          409,
        )
      }
    }

    const foundItem = await tx.foundItem.findUnique({
      where: { id: foundItemId },
      select: {
        id: true,
        status: true,
      },
    })

    if (!foundItem) {
      throw new ClaimServiceError('Found item not found', 404)
    }

    // Prevent the same user from creating duplicate active claims.
    const duplicate = await tx.claim.findFirst({
      where: {
        claimantId,
        foundItemId,
        status: {
          in: ACTIVE_CLAIM_STATUSES,
        },
      },
      select: {
        id: true,
      },
    })

    if (duplicate) {
      throw new ClaimServiceError(
        'You already have an active claim for this found item',
        409,
      )
    }

    if (foundItem.status !== 'IN_CUSTODY') {
      throw new ClaimServiceError(
        'This found item is not available for a new claim',
        409,
      )
    }

    const claim = await tx.claim.create({
      data: {
        claimantId,
        foundItemId,
        lostReportId: lostReport?.id ?? null,
        details: details ?? null,
        status: 'PENDING',
      },
      select: {
        id: true,
      },
    })

    // Reserve the found item while its claim is being processed.
    await tx.foundItem.update({
      where: {
        id: foundItemId,
      },
      data: {
        status: 'CLAIM_PENDING',
      },
    })

    // Update the lost report only when one was linked.
    if (lostReport) {
      await tx.lostReport.update({
        where: {
          id: lostReport.id,
        },
        data: {
          status: 'CLAIM_PENDING',
        },
      })
    }

    await recordAuditEvent(tx, {
      actorId: claimantId,
      action: 'CLAIM_SUBMITTED',
      entityType: 'Claim',
      entityId: claim.id,
      details: {
        lostReportId: lostReport?.id ?? null,
        foundItemId,
      },
    })

    return tx.claim.findUnique({
      where: {
        id: claim.id,
      },
      include: CLAIM_INCLUDE,
    })
  })
}

export async function listMyClaims(claimantId) {
  return prisma.claim.findMany({
    where: {
      claimantId,
    },
    include: CLAIM_INCLUDE,
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getClaimById(id, requester) {
  const claim = await prisma.claim.findUnique({
    where: {
      id,
    },
    include: CLAIM_INCLUDE,
  })

  if (!claim) {
    throw new ClaimServiceError('Claim not found', 404)
  }

  const isOwner = claim.claimantId === requester.id
  const isStaff = ['VERIFIER', 'ADMIN'].includes(requester.role)

  if (!isOwner && !isStaff) {
    throw new ClaimServiceError('Claim not found', 404)
  }

  return claim
}

export async function listClaimsForReview(status) {
  return prisma.claim.findMany({
    where: {
      status: status ?? {
        in: ACTIVE_CLAIM_STATUSES,
      },
    },
    include: CLAIM_INCLUDE,
    orderBy: {
      createdAt: 'asc',
    },
  })
}

export async function startClaimReview(id, reviewerId) {
  return runSerializableTransaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: {
        id,
      },
      include: {
        lostReport: {
          select: {
            status: true,
          },
        },
        foundItem: {
          select: {
            status: true,
          },
        },
      },
    })

    ensureClaimCanBeReviewed(claim)

    if (claim.status !== 'PENDING') {
      throw new ClaimServiceError(
        'Only a pending claim can enter review',
        409,
      )
    }

    await tx.claim.update({
      where: {
        id,
      },
      data: {
        status: 'IN_REVIEW',
        reviewedById: reviewerId,
        reviewedAt: null,
        decisionNotes: null,
      },
    })

    await recordAuditEvent(tx, {
      actorId: reviewerId,
      action: 'CLAIM_REVIEW_STARTED',
      entityType: 'Claim',
      entityId: id,
      details: {
        status: 'IN_REVIEW',
      },
    })

    return tx.claim.findUnique({
      where: {
        id,
      },
      include: CLAIM_INCLUDE,
    })
  })
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
        lostReport: {
          select: {
            id: true,
            status: true,
          },
        },
        foundItem: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    ensureClaimCanBeReviewed(claim)

    if (claim.status !== 'IN_REVIEW') {
      throw new ClaimServiceError(
        'Start claim review before making a decision',
        409,
      )
    }

    const reviewedAt = new Date()

    if (decision === 'APPROVED') {
      // Approval reserves the item; physical handover happens separately.
      const existingRecovery = await tx.recoveryRecord.findFirst({
        where: {
          OR: [
            { claimId: id },
            { foundItemId: claim.foundItemId },
          ],
        },
        select: { id: true },
      })

      if (existingRecovery) {
        throw new ClaimServiceError(
          'A recovery record already exists for this claim or found item',
          409,
        )
      }

      // Keep the item reserved until the actual handover.
      // Do not resolve the lost report or create a recovery record here.
      await tx.foundItem.update({
        where: { id: claim.foundItemId },
        data: { status: 'CLAIM_PENDING' },
      })
    } else if (decision === 'REJECTED') {
      // Rejected claims release the reservation.
      if (claim.lostReportId) {
        await tx.lostReport.update({
          where: { id: claim.lostReportId },
          data: { status: 'OPEN' },
        })
      }

      await tx.foundItem.update({
        where: { id: claim.foundItemId },
        data: { status: 'IN_CUSTODY' },
      })
    } else {
      throw new ClaimServiceError('Invalid claim decision')
    }

    const updatedClaim = await tx.claim.update({
      where: { id },
      data: {
        status: decision,
        decisionNotes: decisionNotes ?? null,
        reviewedAt,
        reviewedById: reviewerId,
      },
      include: CLAIM_INCLUDE,
    })

    await recordAuditEvent(tx, {
      actorId: reviewerId,
      action: decision === 'APPROVED'
        ? 'CLAIM_APPROVED'
        : 'CLAIM_REJECTED',
      entityType: 'Claim',
      entityId: id,
      details: {
        foundItemId: claim.foundItemId,
        lostReportId: claim.lostReportId ?? null,
        status: decision,
      },
    })

    return updatedClaim
  })
}

export async function cancelClaim(id, claimantId) {
  return runSerializableTransaction(async (tx) => {
    const claim = await tx.claim.findUnique({
      where: {
        id,
      },
      include: {
        lostReport: {
          select: {
            status: true,
          },
        },
        foundItem: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!claim || claim.claimantId !== claimantId) {
      throw new ClaimServiceError('Claim not found', 404)
    }

    if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      throw new ClaimServiceError(
        'Only pending or in-review claims can be cancelled',
        409,
      )
    }

    if (
      (claim.lostReport &&
        claim.lostReport.status !== 'CLAIM_PENDING') ||
      claim.foundItem.status !== 'CLAIM_PENDING'
    ) {
      throw new ClaimServiceError(
        'Claim and item statuses are inconsistent. Please investigate before cancelling.',
        409,
      )
    }

    // Restore the lost report only when one was linked.
    if (claim.lostReportId) {
      await tx.lostReport.update({
        where: {
          id: claim.lostReportId,
        },
        data: {
          status: 'OPEN',
        },
      })
    }

    await tx.foundItem.update({
      where: {
        id: claim.foundItemId,
      },
      data: {
        status: 'IN_CUSTODY',
      },
    })

    await tx.claim.update({
      where: {
        id,
      },
      data: {
        status: 'CANCELLED',
        reviewedById: null,
        reviewedAt: null,
        decisionNotes: null,
      },
    })

    await recordAuditEvent(tx, {
      actorId: claimantId,
      action: 'CLAIM_CANCELLED',
      entityType: 'Claim',
      entityId: id,
      details: {
        lostReportId: claim.lostReportId,
        foundItemId: claim.foundItemId,
      },
    })

    return tx.claim.findUnique({
      where: {
        id,
      },
      include: CLAIM_INCLUDE,
    })
  })
}

import prisma from '../db/prisma.js';
import { recordAuditEvent } from './audit-log.service.js';

export class RecoveryServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'RecoveryServiceError';
    this.statusCode = statusCode;
  }
}

const RECOVERY_INCLUDE = {
  claim: {
    select: {
      id: true,
      status: true,
      claimantId: true,
      details: true,
      createdAt: true,
      reviewedAt: true,
      claimant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      lostReport: {
        select: {
          id: true,
          description: true,
          location: true,
          asset: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      },
    },
  },
  foundItem: {
    select: {
      id: true,
      title: true,
      category: true,
      brand: true,
      model: true,
      location: true,
      foundAt: true,
      status: true,
    },
  },
  recordedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

async function listRecords(where, { page, pageSize }) {
  const [records, total] = await Promise.all([
    prisma.recoveryRecord.findMany({
      where,
      include: RECOVERY_INCLUDE,
      orderBy: { recoveredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.recoveryRecord.count({ where }),
  ]);

  return { records, total, page, pageSize };
}

export async function listMyRecoveries(claimantId, pagination) {
  return listRecords(
    {
      claim: {
        is: { claimantId },
      },
    },
    pagination,
  );
}

export async function listRecoveries(pagination) {
  return listRecords({}, pagination);
}

export async function getRecoveryById(id, requester) {
  const record = await prisma.recoveryRecord.findUnique({
    where: { id },
    include: RECOVERY_INCLUDE,
  });

  if (!record) {
    throw new RecoveryServiceError('Recovery record not found', 404);
  }

  const isOwner = record.claim.claimantId === requester.id;
  const isStaff = ['VERIFIER', 'ADMIN'].includes(requester.role);

  if (!isOwner && !isStaff) {
    throw new RecoveryServiceError('Recovery record not found', 404);
  }

  return record;
}

export async function recordHandover(claimId, recordedById, notes) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const claim = await tx.claim.findUnique({
          where: { id: claimId },
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
                title: true,
                status: true,
              },
            },
          },
        });

        if (!claim) {
          throw new RecoveryServiceError('Claim not found', 404);
        }

        if (claim.status !== 'APPROVED') {
          throw new RecoveryServiceError(
            'Only approved claims can be handed over',
            409,
          );
        }

        if (claim.foundItem.status !== 'CLAIM_PENDING') {
          throw new RecoveryServiceError(
            'The found item is not reserved for this claim',
            409,
          );
        }

        const existingRecovery = await tx.recoveryRecord.findFirst({
          where: {
            OR: [
              { claimId },
              { foundItemId: claim.foundItemId },
            ],
          },
          select: { id: true },
        });

        if (existingRecovery) {
          throw new RecoveryServiceError(
            'A recovery record already exists for this claim or item',
            409,
          );
        }

        const recoveredAt = new Date();

        const normalizedNotes =
          typeof notes === 'string' && notes.trim()
            ? notes.trim()
            : null;

        const recoveryRecord = await tx.recoveryRecord.create({
          data: {
            claimId,
            foundItemId: claim.foundItemId,
            recordedById,
            recoveredAt,
            notes: normalizedNotes,
          },
        });

        await tx.claim.update({
          where: { id: claimId },
          data: { status: 'COMPLETED' },
        });

        await tx.foundItem.update({
          where: { id: claim.foundItemId },
          data: { status: 'RELEASED' },
        });

        if (claim.lostReportId) {
          await tx.lostReport.update({
            where: { id: claim.lostReportId },
            data: { status: 'RESOLVED' },
          });
        }

        await recordAuditEvent(tx, {
          actorId: recordedById,
          action: 'RECOVERY_RECORDED',
          entityType: 'RecoveryRecord',
          entityId: recoveryRecord.id,
          details: {
            claimId,
            foundItemId: claim.foundItemId,
            lostReportId: claim.lostReportId ?? null,
          },
        });

        await recordAuditEvent(tx, {
          actorId: recordedById,
          action: 'CLAIM_COMPLETED',
          entityType: 'Claim',
          entityId: claimId,
          details: {
            foundItemId: claim.foundItemId,
            lostReportId: claim.lostReportId ?? null,
          },
        });

        return tx.recoveryRecord.findUnique({
          where: { id: recoveryRecord.id },
          include: RECOVERY_INCLUDE,
        });
      },
      {
        isolationLevel: 'Serializable',
        maxWait: 20_000,
        timeout: 30_000,
      },
    );
  } catch (error) {
    if (error instanceof RecoveryServiceError) {
      throw error;
    }

    if (error?.code === 'P2034') {
      throw new RecoveryServiceError(
        'Another operation changed this claim. Refresh and try again.',
        409,
      );
    }

    if (error?.code === 'P2002') {
      throw new RecoveryServiceError(
        'A recovery record already exists for this claim or item',
        409,
      );
    }

    throw error;
  }
}
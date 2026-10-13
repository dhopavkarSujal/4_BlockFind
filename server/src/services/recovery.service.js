import prisma from '../db/prisma.js';

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
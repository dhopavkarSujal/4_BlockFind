import prisma from '../db/prisma.js';
import { recordAuditEvent } from './audit-log.service.js';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const ACTIVE_CLAIM_STATUSES = ['PENDING', 'IN_REVIEW'];

export class AdminServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AdminServiceError';
    this.statusCode = statusCode;
  }
}

function groupedCounts(rows, field) {
  return Object.fromEntries(
    rows.map((row) => [row[field], row._count._all]),
  );
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalAssets,
    totalLostReports,
    totalFoundItems,
    totalClaims,
    totalRecoveries,
    pendingClaims,
    userRoleRows,
    assetStatusRows,
    lostReportStatusRows,
    foundItemStatusRows,
    claimStatusRows,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.asset.count(),
    prisma.lostReport.count(),
    prisma.foundItem.count(),
    prisma.claim.count(),
    prisma.recoveryRecord.count(),

    prisma.claim.count({
      where: { status: { in: ACTIVE_CLAIM_STATUSES } },
    }),

    prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    }),

    prisma.asset.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    prisma.lostReport.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    prisma.foundItem.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    prisma.claim.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),

    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    generatedAt: new Date().toISOString(),

    totals: {
      users: totalUsers,
      assets: totalAssets,
      lostReports: totalLostReports,
      foundItems: totalFoundItems,
      claims: totalClaims,
      recoveries: totalRecoveries,
      pendingClaims,
    },

    usersByRole: groupedCounts(userRoleRows, 'role'),
    assetsByStatus: groupedCounts(assetStatusRows, 'status'),
    lostReportsByStatus: groupedCounts(lostReportStatusRows, 'status'),
    foundItemsByStatus: groupedCounts(foundItemStatusRows, 'status'),
    claimsByStatus: groupedCounts(claimStatusRows, 'status'),

    recentAuditEvents,
  };
}

export async function listUsers({ page, pageSize, search, role }) {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),

    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });

  if (!user) {
    throw new AdminServiceError('User not found', 404);
  }

  return user;
}

export async function changeUserRole({ adminId, userId, role }) {
  if (adminId === userId) {
    throw new AdminServiceError(
      'You cannot change your own role through this endpoint',
      409,
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: userId },
          select: USER_SELECT,
        });

        if (!target) {
          throw new AdminServiceError('User not found', 404);
        }

        if (target.role === role) {
          return {
            user: target,
            changed: false,
            previousRole: target.role,
          };
        }

        // Prevent the final administrator from being demoted.
        if (target.role === 'ADMIN' && role !== 'ADMIN') {
          const adminCount = await tx.user.count({
            where: { role: 'ADMIN' },
          });

          if (adminCount <= 1) {
            throw new AdminServiceError(
              'The last administrator cannot be demoted',
              409,
            );
          }
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { role },
          select: USER_SELECT,
        });

        await recordAuditEvent(tx, {
          actorId: adminId,
          action: 'USER_ROLE_CHANGED',
          entityType: 'User',
          entityId: userId,
          details: {
            previousRole: target.role,
            newRole: role,
          },
        });

        return {
          user: updatedUser,
          changed: true,
          previousRole: target.role,
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  } catch (error) {
    if (error instanceof AdminServiceError) {
      throw error;
    }

    if (error?.code === 'P2034') {
      throw new AdminServiceError(
        'A concurrent role change occurred. Refresh and try again.',
        409,
      );
    }

    throw error;
  }
}
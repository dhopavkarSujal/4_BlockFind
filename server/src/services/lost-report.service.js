
import prisma from '../db/prisma.js';

export class LostReportServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'LostReportServiceError';
    this.statusCode = statusCode;
  }
}

// Create a lost report for an asset owned by the authenticated user.
export async function createLostReport(reportedById, data) {
  const asset = await prisma.asset.findFirst({
    where: {
      id: data.assetId,
      ownerId: reportedById,
    },
    select: {
      id: true,
      status: true,
    },
  });

  // Do not reveal whether an asset belongs to another user.
  if (!asset) {
    throw new LostReportServiceError('Asset not found', 404);
  }

  if (asset.status !== 'ACTIVE') {
    throw new LostReportServiceError(
      'Archived assets cannot be reported as lost',
      409
    );
  }

  // Prevent multiple unresolved lost reports for the same asset.
  const existingReport = await prisma.lostReport.findFirst({
    where: {
      assetId: data.assetId,
      reportedById,
      status: {
        in: ['OPEN', 'CLAIM_PENDING'],
      },
    },
    select: {
      id: true,
    },
  });

  if (existingReport) {
    throw new LostReportServiceError(
      'This asset already has an unresolved lost report',
      409
    );
  }

  return prisma.lostReport.create({
    data: {
      assetId: data.assetId,
      reportedById,
      location: data.location,
      description: data.description ?? null,
      lostAt: data.lostAt ? new Date(data.lostAt) : null,
    },
  });
}

// Retrieve the authenticated user's lost reports.
export async function getMyLostReports(reportedById) {
  return prisma.lostReport.findMany({
    where: {
      reportedById,
    },
    include: {
      asset: {
        select: {
          id: true,
          title: true,
          category: true,
          brand: true,
          model: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Retrieve one lost report only if it belongs to the user.
export async function getMyLostReportById(reportedById, reportId) {
  return prisma.lostReport.findFirst({
    where: {
      id: reportId,
      reportedById,
    },
    include: {
      asset: {
        select: {
          id: true,
          title: true,
          category: true,
          brand: true,
          model: true,
          status: true,
        },
      },
    },
  });
}

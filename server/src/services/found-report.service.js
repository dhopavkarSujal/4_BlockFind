
import prisma from '../db/prisma.js';

export class FoundReportServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'FoundReportServiceError';
    this.statusCode = statusCode;
  }
}

// Keep API responses consistent across submission and review operations.
const foundReportInclude = {
  reporter: {
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
  custodyReceivedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  foundItem: {
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      createdAt: true,
    },
  },
};

function toReportData(data) {
  return {
    title: data.title,
    description: data.description ?? null,
    category: data.category,
    brand: data.brand ?? null,
    model: data.model ?? null,
    location: data.location,
    foundAt: data.foundAt ? new Date(data.foundAt) : null,
  };
}

async function getReportOrThrow(db, id) {
  const report = await db.foundReport.findUnique({
    where: { id },
    include: foundReportInclude,
  });

  if (!report) {
    throw new FoundReportServiceError('Found report not found', 404);
  }

  return report;
}

// Submit a found-item report for verification.
// The authenticated reporter's ID comes from the controller.
export async function createFoundReport(reporterId, data) {
  return prisma.foundReport.create({
    data: {
      reporterId,
      ...toReportData(data),
      status: 'PENDING_REVIEW',
    },
    include: foundReportInclude,
  });
}

// List reports submitted by the authenticated user.
export async function listMyFoundReports(reporterId) {
  return prisma.foundReport.findMany({
    where: { reporterId },
    include: foundReportInclude,
    orderBy: { createdAt: 'desc' },
  });
}

// List items awaiting action by a verifier or administrator.
// An explicit status can also be used to filter the queue.
export async function listFoundReportsForReview(status) {
  const where = status
    ? { status }
    : {
        status: {
          in: ['PENDING_REVIEW', 'IN_REVIEW', 'NEEDS_INFO'],
        },
      };

  return prisma.foundReport.findMany({
    where,
    include: foundReportInclude,
    orderBy: { createdAt: 'asc' },
  });
}

// Move a pending report into review.
export async function startFoundReportReview(id, reviewerId) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.foundReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!current) {
      throw new FoundReportServiceError('Found report not found', 404);
    }

    if (current.status !== 'PENDING_REVIEW') {
      throw new FoundReportServiceError(
        'Only pending found reports can be moved into review',
        409,
      );
    }

    // Conditional update prevents two reviewers from starting the same
    // pending report simultaneously.
    const result = await tx.foundReport.updateMany({
      where: {
        id,
        status: 'PENDING_REVIEW',
      },
      data: {
        status: 'IN_REVIEW',
        reviewedById: reviewerId,
        reviewedAt: null,
        reviewNotes: null,
      },
    });

    if (result.count !== 1) {
      throw new FoundReportServiceError(
        'The report changed before review could start. Refresh and try again.',
        409,
      );
    }

    return getReportOrThrow(tx, id);
  });
}

// Record a verifier's decision.
// Acceptance and creation of the public found item happen atomically.
export async function reviewFoundReport(id, reviewerId, decisionData) {
  const { decision, reviewNotes } = decisionData;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const current = await tx.foundReport.findUnique({
      where: { id },
    });

    if (!current) {
      throw new FoundReportServiceError('Found report not found', 404);
    }

    if (current.status !== 'IN_REVIEW') {
      throw new FoundReportServiceError(
        'Only reports currently under review can receive a decision',
        409,
      );
    }

    const notes = reviewNotes?.trim() || null;

    if (decision !== 'ACCEPTED_IN_CUSTODY') {
      const result = await tx.foundReport.updateMany({
        where: {
          id,
          status: 'IN_REVIEW',
        },
        data: {
          status: decision,
          reviewNotes: notes,
          reviewedById: reviewerId,
          reviewedAt: now,
        },
      });

      if (result.count !== 1) {
        throw new FoundReportServiceError(
          'The report changed before the decision could be saved',
          409,
        );
      }

      return getReportOrThrow(tx, id);
    }

    // The validation schema requires confirmCustody === true.
    // Keep this check in the service as an additional safeguard.
    if (decisionData.confirmCustody !== true) {
      throw new FoundReportServiceError(
        'Confirm physical custody before accepting the item',
        400,
      );
    }

    // Claim the review transition first. Any later failure rolls back
    // this update because the operations share a transaction.
    const result = await tx.foundReport.updateMany({
      where: {
        id,
        status: 'IN_REVIEW',
      },
      data: {
        status: 'ACCEPTED_IN_CUSTODY',
        reviewNotes: notes,
        reviewedById: reviewerId,
        reviewedAt: now,
        custodyReceivedById: reviewerId,
        custodyReceivedAt: now,
      },
    });

    if (result.count !== 1) {
      throw new FoundReportServiceError(
        'The report changed before custody could be recorded',
        409,
      );
    }

    // Create the catalogue item only after the verifier accepts custody.
    // The original reporter remains the person who submitted the item.
    const foundItem = await tx.foundItem.create({
      data: {
        title: current.title,
        description: current.description,
        category: current.category,
        brand: current.brand,
        model: current.model,
        location: current.location,
        foundAt: current.foundAt,
        recordedById: current.reporterId,
        status: 'IN_CUSTODY',
      },
    });

    return tx.foundReport.update({
      where: { id },
      data: {
        foundItemId: foundItem.id,
      },
      include: foundReportInclude,
    });
  });
}

// Allow the original reporter to resubmit a report that needs more
// information. A different user cannot edit or resubmit their report.
export async function resubmitFoundReport(id, reporterId, data) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.foundReport.findFirst({
      where: {
        id,
        reporterId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!current) {
      throw new FoundReportServiceError('Found report not found', 404);
    }

    if (current.status !== 'NEEDS_INFO') {
      throw new FoundReportServiceError(
        'Only reports requiring additional information can be resubmitted',
        409,
      );
    }

    const result = await tx.foundReport.updateMany({
      where: {
        id,
        reporterId,
        status: 'NEEDS_INFO',
      },
      data: {
        ...toReportData(data),
        status: 'PENDING_REVIEW',
        reviewNotes: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });

    if (result.count !== 1) {
      throw new FoundReportServiceError(
        'The report changed before it could be resubmitted',
        409,
      );
    }

    return getReportOrThrow(tx, id);
  });
}
import prisma from '../db/prisma.js';

export class AuditLogServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuditLogServiceError';
    this.statusCode = statusCode;
  }
}

// Pass either the Prisma client or a Prisma transaction client.
export async function recordAuditEvent(db, event) {
  const {
    actorId = null,
    action,
    entityType,
    entityId = null,
    details,
  } = event;

  const data = {
    actorId,
    action,
    entityType,
    entityId,
  };

  // Omit absent JSON details rather than passing an ambiguous database null.
  if (details !== undefined && details !== null) {
    data.details = details;
  }

  return db.auditLog.create({ data });
}

const AUDIT_LOG_SELECT = {
  id: true,
  actorId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  createdAt: true,
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

export async function listAuditLogs(filters) {
  const {
    page,
    pageSize,
    action,
    entityType,
    actorId,
    entityId,
  } = filters;

  const where = {};

  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (actorId) where.actorId = actorId;
  if (entityId) where.entityId = entityId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      select: AUDIT_LOG_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize };
}

export async function getAuditLogById(id) {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    select: AUDIT_LOG_SELECT,
  });

  if (!log) {
    throw new AuditLogServiceError('Audit log not found', 404);
  }

  return log;
}
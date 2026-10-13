import {
  AuditLogServiceError,
  listAuditLogs as fetchAuditLogs,
  getAuditLogById as fetchAuditLogById,
} from '../services/audit-log.service.js';

import {
  auditLogIdSchema,
  auditLogQuerySchema,
} from '../validators/audit-log.validation.js';

function sendError(res, error) {
  if (error instanceof AuditLogServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Audit log API error:', error);

  return res.status(500).json({
    success: false,
    message: 'Could not retrieve audit logs',
  });
}

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

export async function listAuditLogs(req, res) {
  const parsed = auditLogQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const result = await fetchAuditLogs(parsed.data);

    return res.status(200).json({
      success: true,
      ...result,
      count: result.logs.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getAuditLog(req, res) {
  const parsed = auditLogIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const log = await fetchAuditLogById(parsed.data);

    return res.status(200).json({
      success: true,
      log,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
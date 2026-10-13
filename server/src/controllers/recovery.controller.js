
import {
  RecoveryServiceError,
  listMyRecoveries as fetchMyRecoveries,
  listRecoveries as fetchRecoveries,
  getRecoveryById as fetchRecoveryById,
} from '../services/recovery.service.js';

import {
  recoveryIdSchema,
  recoveryPaginationSchema,
} from '../validators/recovery.validation.js';

function sendError(res, error) {
  if (error instanceof RecoveryServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Recovery API error:', error);

  return res.status(500).json({
    success: false,
    message: 'Could not retrieve recovery records',
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

export async function listMyRecoveries(req, res) {
  const parsed = recoveryPaginationSchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const result = await fetchMyRecoveries(req.user.id, parsed.data);

    return res.status(200).json({
      success: true,
      ...result,
      count: result.records.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listRecoveries(req, res) {
  const parsed = recoveryPaginationSchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const result = await fetchRecoveries(parsed.data);

    return res.status(200).json({
      success: true,
      ...result,
      count: result.records.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getRecovery(req, res) {
  const parsed = recoveryIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const record = await fetchRecoveryById(parsed.data, req.user);

    return res.status(200).json({
      success: true,
      recovery: record,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

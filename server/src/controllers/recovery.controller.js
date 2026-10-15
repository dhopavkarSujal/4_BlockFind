
import {
  RecoveryServiceError,
  listMyRecoveries as fetchMyRecoveries,
  listRecoveries as fetchRecoveries,
  getRecoveryById as fetchRecoveryById,
  recordHandover as createHandover,
} from '../services/recovery.service.js';

import {
  recoveryIdSchema,
  recoveryPaginationSchema,
  recordHandoverSchema,
} from '../validators/recovery.validation.js';

function sendError(
  res,
  error,
  fallbackMessage = 'Could not retrieve recovery records',
) {
  if (error instanceof RecoveryServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Recovery API error:', error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
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

export async function recordHandover(req, res) {
  const parsed = recordHandoverSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const recovery = await createHandover(
      parsed.data.claimId,
      req.user.id,
      parsed.data.notes,
    );

    return res.status(201).json({
      success: true,
      message: 'Physical handover recorded successfully',
      recovery,
    });
  } catch (error) {
    return sendError(
      res,
      error,
      'Could not record the physical handover',
    );
  }
}
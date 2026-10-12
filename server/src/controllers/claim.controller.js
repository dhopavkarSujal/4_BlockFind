
import {
  ClaimServiceError,
  createClaim,
  listMyClaims as getMyClaims,
  getClaimById,
  listClaimsForReview as getReviewQueue,
  startClaimReview as beginReview,
  reviewClaim as processReview,
  cancelClaim as cancelExistingClaim,
} from '../services/claim.service.js';

import {
  claimIdSchema,
  createClaimSchema,
  claimQueueQuerySchema,
  reviewClaimSchema,
} from '../validators/claim.validation.js';

function sendError(res, error) {
  if (error instanceof ClaimServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Claim API error:', error);

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred while processing the claim',
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

function getValidatedId(req, res) {
  const result = claimIdSchema.safeParse(req.params.id);

  if (!result.success) {
    sendValidationError(res, result.error);
    return null;
  }

  return result.data;
}

export async function submitClaim(req, res) {
  const parsed = createClaimSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const claim = await createClaim({
      claimantId: req.user.id,
      ...parsed.data,
    });

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      claim,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listMyClaims(req, res) {
  try {
    const claims = await getMyClaims(req.user.id);

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getClaim(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  try {
    const claim = await getClaimById(id, req.user);

    return res.status(200).json({
      success: true,
      claim,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listClaimsForReview(req, res) {
  const parsed = claimQueueQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const claims = await getReviewQueue(parsed.data.status);

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function startClaimReview(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  try {
    const claim = await beginReview(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Claim moved to IN_REVIEW',
      claim,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function decideClaim(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  const parsed = reviewClaimSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const claim = await processReview(
      id,
      req.user.id,
      parsed.data,
    );

    return res.status(200).json({
      success: true,
      message:
        parsed.data.decision === 'APPROVED'
          ? 'Claim approved and item released'
          : 'Claim rejected and item returned to custody',
      claim,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function cancelClaim(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  try {
    const claim = await cancelExistingClaim(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Claim cancelled successfully',
      claim,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

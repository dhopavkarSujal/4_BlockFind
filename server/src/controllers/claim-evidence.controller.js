
import { z } from 'zod';

import {
  ClaimEvidenceServiceError,
  uploadClaimEvidence as saveEvidence,
  listClaimEvidence as getEvidenceList,
  getClaimEvidenceDownloadUrl as createDownloadUrl,
} from '../services/claim-evidence.service.js';

const uuidSchema = z.string().uuid();

function validateUuid(value, label, res) {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    res.status(400).json({
      success: false,
      message: `Invalid ${label}`,
    });
    return null;
  }

  return result.data;
}

function handleError(res, error) {
  if (error instanceof ClaimEvidenceServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Claim evidence API error:', error);

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred while processing evidence',
  });
}

export async function uploadClaimEvidence(req, res) {
  const claimId = validateUuid(req.params.id, 'claim ID', res);
  if (!claimId) return;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Attach one file using the multipart field name "file"',
    });
  }

  try {
    const evidence = await saveEvidence(claimId, req.user, req.file);

    return res.status(201).json({
      success: true,
      message: 'Claim evidence uploaded successfully',
      evidence,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listClaimEvidence(req, res) {
  const claimId = validateUuid(req.params.id, 'claim ID', res);
  if (!claimId) return;

  try {
    const evidence = await getEvidenceList(claimId, req.user);

    return res.status(200).json({
      success: true,
      count: evidence.length,
      evidence,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function createClaimEvidenceDownloadUrl(req, res) {
  const claimId = validateUuid(req.params.id, 'claim ID', res);
  if (!claimId) return;

  const evidenceId = validateUuid(
    req.params.evidenceId,
    'evidence ID',
    res,
  );
  if (!evidenceId) return;

  try {
    const result = await createDownloadUrl(
      claimId,
      evidenceId,
      req.user,
    );

    return res.status(200).json({
      success: true,
      evidence: result.evidence,
      signedUrl: result.signedUrl,
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

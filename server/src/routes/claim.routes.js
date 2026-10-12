
import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { uploadEvidenceFile } from '../middleware/evidence-upload.middleware.js';

import {
  submitClaim,
  listMyClaims,
  getClaim,
  listClaimsForReview,
  startClaimReview,
  decideClaim,
  cancelClaim,
} from '../controllers/claim.controller.js';

import {
  uploadClaimEvidence,
  listClaimEvidence,
  createClaimEvidenceDownloadUrl,
} from '../controllers/claim-evidence.controller.js';

const router = Router();

// Authentication is required for every claim endpoint.
router.use(authenticateToken);

// User claim endpoints
router.post('/', submitClaim);
router.get('/my', listMyClaims);
router.post('/:id/cancel', cancelClaim);

// Claim evidence endpoints
router.post(
  '/:id/evidence',
  uploadEvidenceFile,
  uploadClaimEvidence,
);

router.get(
  '/:id/evidence',
  listClaimEvidence,
);

router.get(
  '/:id/evidence/:evidenceId/download',
  createClaimEvidenceDownloadUrl,
);

// Verifier/admin endpoints
router.get(
  '/review-queue',
  authorizeRoles('VERIFIER', 'ADMIN'),
  listClaimsForReview,
);

router.post(
  '/:id/start-review',
  authorizeRoles('VERIFIER', 'ADMIN'),
  startClaimReview,
);

router.patch(
  '/:id/review',
  authorizeRoles('VERIFIER', 'ADMIN'),
  decideClaim,
);

// Keep the general claim-detail route last.
router.get('/:id', getClaim);

export default router;

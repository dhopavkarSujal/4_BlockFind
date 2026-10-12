
import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  submitClaim,
  listMyClaims,
  getClaim,
  listClaimsForReview,
  startClaimReview,
  decideClaim,
  cancelClaim,
} from '../controllers/claim.controller.js';

const router = Router();

// Authentication is required for every claim endpoint.
router.use(authenticateToken);

// User endpoints
router.post('/', submitClaim);
router.get('/my', listMyClaims);

// Restrict the review queue to verifiers and admins.
router.get(
  '/review-queue',
  authorizeRoles('VERIFIER', 'ADMIN'),
  listClaimsForReview,
);

// Review actions
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

// Claim detail and cancellation
router.post('/:id/cancel', cancelClaim);
router.get('/:id', getClaim);

// IMPORTANT: app.js imports this router as a default export.
export default router;

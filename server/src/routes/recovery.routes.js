
import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  listMyRecoveries,
  listRecoveries,
  getRecovery,
  recordHandover,
} from '../controllers/recovery.controller.js';

const router = Router();

router.use(authenticateToken);

// Users can view their own recovery records.
router.get('/my', listMyRecoveries);

// Only verifiers and admins may browse all recovery records.
router.get(
  '/',
  authorizeRoles('VERIFIER', 'ADMIN'),
  listRecoveries,
);

// Only verifiers and admins may record physical handover.
router.post(
  '/handover',
  authorizeRoles('VERIFIER', 'ADMIN'),
  recordHandover,
);

// Claim owners and authorized staff can retrieve individual records.
router.get('/:id', getRecovery);

export default router;
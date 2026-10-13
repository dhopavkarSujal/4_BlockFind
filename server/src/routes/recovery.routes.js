import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  listMyRecoveries,
  listRecoveries,
  getRecovery,
} from '../controllers/recovery.controller.js';

const router = Router();

router.use(authenticateToken);

// Put /my before /:id so "my" is not interpreted as a record ID.
router.get('/my', listMyRecoveries);

// Only verifiers and admins may browse all recoveries.
router.get(
  '/',
  authorizeRoles('VERIFIER', 'ADMIN'),
  listRecoveries,
);

// Claim owners and authorized staff can retrieve an individual record.
router.get('/:id', getRecovery);

export default router;
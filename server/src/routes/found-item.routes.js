import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  registerFoundItem,
  listFoundItems,
  getFoundItem,
  editFoundItem,
} from '../controllers/found-item.controller.js';

const router = Router();

// Every endpoint requires authentication.
router.use(authenticateToken);

// Any authenticated user can search and view visible found items.
router.get('/', listFoundItems);
router.get('/:id', getFoundItem);

// Only security verifiers and administrators can record or edit items.
router.post(
  '/',
  authorizeRoles('VERIFIER', 'ADMIN'),
  registerFoundItem
);

router.patch(
  '/:id',
  authorizeRoles('VERIFIER', 'ADMIN'),
  editFoundItem
);

export default router;
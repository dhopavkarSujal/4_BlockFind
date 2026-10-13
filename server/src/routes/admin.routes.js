import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  dashboardStats,
  listAdminUsers,
  getAdminUser,
  updateAdminUserRole,
} from '../controllers/admin.controller.js';

const router = Router();

// All administrative endpoints require authentication and ADMIN role.
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/stats', dashboardStats);
router.get('/users', listAdminUsers);
router.get('/users/:id', getAdminUser);
router.patch('/users/:id/role', updateAdminUserRole);

export default router;
import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  listAuditLogs,
  getAuditLog,
} from '../controllers/audit-log.controller.js';

const router = Router();

router.use(authenticateToken);

// All audit history is restricted to administrators.
router.use(authorizeRoles('ADMIN'));

router.get('/', listAuditLogs);
router.get('/:id', getAuditLog);

export default router;
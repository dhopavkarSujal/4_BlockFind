import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';

import {
  registerLostReport,
  listMyLostReports,
  getLostReportById,
} from '../controllers/lost-report.controller.js';

const router = Router();

// Require authentication for every lost-report endpoint.
router.use(authenticateToken);

router.post('/', registerLostReport);

// Register /my before /:id.
router.get('/my', listMyLostReports);

router.get('/:id', getLostReportById);

export default router;
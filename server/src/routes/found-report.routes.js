import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

import {
  submitFoundReport,
  listMyFoundReports,
  listFoundReportsForReview,
  startFoundReportReview,
  decideFoundReport,
  resubmitFoundReport,
} from '../controllers/found-report.controller.js';

const router = Router();

// All routes require authentication.
router.use(authenticateToken);

// User routes.
router.post('/', submitFoundReport);
router.get('/my', listMyFoundReports);
router.patch('/:id/resubmit', resubmitFoundReport);

// Verifier/admin routes.
router.get(
  '/review-queue',
  authorizeRoles('VERIFIER', 'ADMIN'),
  listFoundReportsForReview,
);

router.post(
  '/:id/start-review',
  authorizeRoles('VERIFIER', 'ADMIN'),
  startFoundReportReview,
);

router.patch(
  '/:id/review',
  authorizeRoles('VERIFIER', 'ADMIN'),
  decideFoundReport,
);

export default router;
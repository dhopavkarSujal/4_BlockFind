
import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';

import {
  registerAsset,
  listMyAssets,
  getAssetById,
  editAsset,
} from '../controllers/asset.controller.js';

const router = Router();

// All asset endpoints require authentication.
router.use(authenticateToken);

router.post('/', registerAsset);

// Keep /my before /:id so "my" is not treated as an asset ID.
router.get('/my', listMyAssets);

router.get('/:id', getAssetById);

router.patch('/:id', editAsset);

export default router;

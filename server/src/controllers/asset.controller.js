
import { z } from 'zod';
import {
  createAssetSchema,
  updateAssetSchema,
} from '../validators/asset.validation.js';

import {
  AssetServiceError,
  createAsset,
  getMyAssets,
  getOwnedAsset,
  updateOwnedAsset,
} from '../services/asset.service.js';

// Register a new asset.
export async function registerAsset(req, res) {
  const validation = createAssetSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset details',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const asset = await createAsset(req.user.id, validation.data);

    return res.status(201).json({
      success: true,
      message: 'Asset registered successfully',
      asset,
    });
  } catch (error) {
    console.error('Asset registration failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to register asset',
    });
  }
}

// Retrieve the authenticated user's assets.
export async function listMyAssets(req, res) {
  try {
    const assets = await getMyAssets(req.user.id);

    return res.status(200).json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error) {
    console.error('Asset listing failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve assets',
    });
  }
}

// Retrieve one asset belonging to the authenticated user.
export async function getAssetById(req, res) {
  const idValidation = z.string().uuid().safeParse(req.params.id);

  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset ID',
    });
  }

  try {
    const asset = await getOwnedAsset(req.user.id, idValidation.data);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error('Asset lookup failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve asset',
    });
  }
}

// Update asset details or archive an asset.
export async function editAsset(req, res) {
  const idValidation = z.string().uuid().safeParse(req.params.id);

  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset ID',
    });
  }

  const validation = updateAssetSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid asset update',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const asset = await updateOwnedAsset(
      req.user.id,
      idValidation.data,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      asset,
    });
  } catch (error) {
    if (error instanceof AssetServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Asset update failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update asset',
    });
  }
}

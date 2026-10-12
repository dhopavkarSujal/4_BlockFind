import prisma from '../db/prisma.js';

export class AssetServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'AssetServiceError';
    this.statusCode = statusCode;
  }
}

// Register a new asset for the authenticated user.
export async function createAsset(ownerId, data) {
  return prisma.asset.create({
    data: {
      ...data,
      ownerId,
    },
  });
}

// Retrieve assets belonging to the authenticated user.
export async function getMyAssets(ownerId) {
  return prisma.asset.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Retrieve one asset, but only if it belongs to the user.
export async function getOwnedAsset(ownerId, assetId) {
  return prisma.asset.findFirst({
    where: {
      id: assetId,
      ownerId,
    },
  });
}

// Update an owned asset or archive it.
export async function updateOwnedAsset(ownerId, assetId, data) {
  const existingAsset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      ownerId,
    },
  });

  if (!existingAsset) {
    throw new AssetServiceError(
      'Asset not found',
      404
    );
  }

  if (existingAsset.status === 'ARCHIVED') {
    throw new AssetServiceError(
      'Archived assets cannot be updated',
      409
    );
  }

  return prisma.asset.update({
    where: {
      id: assetId,
    },
    data,
  });
}
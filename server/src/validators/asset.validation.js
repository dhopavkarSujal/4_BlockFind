
import { z } from 'zod';

// Validate data when registering a new asset.
export const createAssetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must contain at least 2 characters')
    .max(100, 'Title cannot exceed 100 characters'),

  category: z
    .string()
    .trim()
    .min(2, 'Category must contain at least 2 characters')
    .max(80, 'Category cannot exceed 80 characters'),

  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .nullable()
    .optional(),

  brand: z
    .string()
    .trim()
    .max(80, 'Brand cannot exceed 80 characters')
    .nullable()
    .optional(),

  model: z
    .string()
    .trim()
    .max(80, 'Model cannot exceed 80 characters')
    .nullable()
    .optional(),

  serialNumber: z
    .string()
    .trim()
    .max(150, 'Serial number cannot exceed 150 characters')
    .nullable()
    .optional(),
});

// Validate data when updating an existing asset.
// An asset can be archived, but clients cannot change its owner.
export const updateAssetSchema = createAssetSchema
  .partial()
  .extend({
    status: z.literal('ARCHIVED').optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'Provide at least one field to update',
    }
  );

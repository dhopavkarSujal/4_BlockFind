
import { z } from 'zod';

export const createLostReportSchema = z.object({
  assetId: z
    .string()
    .uuid('A valid asset ID is required'),

  location: z
    .string()
    .trim()
    .min(2, 'Location must contain at least 2 characters')
    .max(200, 'Location cannot exceed 200 characters'),

  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .nullable()
    .optional(),

  lostAt: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
});

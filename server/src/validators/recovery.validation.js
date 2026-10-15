
import { z } from 'zod';

export const recoveryIdSchema = z.string().uuid();

export const recoveryPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// Validates a request to record the physical handover of a found item.
export const recordHandoverSchema = z.object({
  claimId: z.string().uuid(),
  notes: z
    .string()
    .trim()
    .max(1000, 'Handover notes must be 1000 characters or fewer')
    .optional(),
});
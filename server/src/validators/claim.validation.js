
import { z } from 'zod';

export const claimIdSchema = z.string().uuid('Invalid claim ID');

export const createClaimSchema = z.object({
  lostReportId: z.string().uuid('A valid lost report ID is required'),
  foundItemId: z.string().uuid('A valid found item ID is required'),
  details: z
    .string()
    .trim()
    .max(2000, 'Claim details cannot exceed 2000 characters')
    .optional()
    .nullable(),
});

export const claimQueueQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW']).optional(),
});

export const reviewClaimSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  decisionNotes: z
    .string()
    .trim()
    .max(1000, 'Decision notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

import { z } from 'zod';

const foundAtSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const createFoundReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Item name must contain at least 2 characters')
    .max(100),

  category: z
    .string()
    .trim()
    .min(2, 'Category must contain at least 2 characters')
    .max(80),

  description: z.string().trim().max(1000).nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  model: z.string().trim().max(80).nullable().optional(),

  location: z
    .string()
    .trim()
    .min(2, 'Found location must contain at least 2 characters')
    .max(200),

  foundAt: foundAtSchema,
});

export const foundReportIdSchema = z.string().uuid();

export const foundReportQueueQuerySchema = z.object({
  status: z
    .enum([
      'PENDING_REVIEW',
      'IN_REVIEW',
      'NEEDS_INFO',
      'REJECTED',
      'ACCEPTED_IN_CUSTODY',
    ])
    .optional(),
});

export const reviewFoundReportSchema = z
  .object({
    decision: z.enum([
      'NEEDS_INFO',
      'REJECTED',
      'ACCEPTED_IN_CUSTODY',
    ]),

    reviewNotes: z.string().trim().max(1000).optional(),

    // Required for acceptance so the verifier explicitly confirms
    // that the physical item has been received into custody.
    confirmCustody: z.boolean().optional(),
  })
  .superRefine((data, context) => {
    if (
      ['NEEDS_INFO', 'REJECTED'].includes(data.decision) &&
      !data.reviewNotes
    ) {
      context.addIssue({
        code: 'custom',
        path: ['reviewNotes'],
        message: 'Provide notes explaining this decision.',
      });
    }

    if (
      data.decision === 'ACCEPTED_IN_CUSTODY' &&
      data.confirmCustody !== true
    ) {
      context.addIssue({
        code: 'custom',
        path: ['confirmCustody'],
        message: 'Confirm physical custody before accepting the item.',
      });
    }
  });
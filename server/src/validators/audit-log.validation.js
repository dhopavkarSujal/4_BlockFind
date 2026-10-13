import { z } from 'zod';

export const auditLogIdSchema = z.string().uuid();

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().min(1).max(100).optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  actorId: z.string().uuid().optional(),
  entityId: z.string().trim().min(1).max(100).optional(),
});
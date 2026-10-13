import { z } from 'zod';

export const adminUserIdSchema = z.string().uuid('Invalid user ID');

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['USER', 'VERIFIER', 'ADMIN']).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'VERIFIER', 'ADMIN']),
});
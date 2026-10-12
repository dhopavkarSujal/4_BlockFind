import { z } from 'zod';

const foundAtSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional();

export const createFoundItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must contain at least 2 characters')
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
    .min(2, 'Location must contain at least 2 characters')
    .max(200),

  foundAt: foundAtSchema,
});

export const updateFoundItemSchema = createFoundItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const searchFoundItemsSchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  location: z.string().trim().max(200).optional(),
});
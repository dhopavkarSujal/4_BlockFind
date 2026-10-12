
import { z } from 'zod';

import {
  createFoundItemSchema,
  updateFoundItemSchema,
  searchFoundItemsSchema,
} from '../validators/found-item.validation.js';

import {
  FoundItemServiceError,
  createFoundItem,
  getFoundItems,
  getFoundItemById,
  updateFoundItem,
} from '../services/found-item.service.js';

// Record a found item. Role authorization is handled by the route.
export async function registerFoundItem(req, res) {
  const validation = createFoundItemSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid found-item details',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const item = await createFoundItem(req.user.id, validation.data);

    return res.status(201).json({
      success: true,
      message: 'Found item recorded successfully',
      item,
    });
  } catch (error) {
    console.error('Found-item creation failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to record found item',
    });
  }
}

// List and search found items visible to authenticated users.
export async function listFoundItems(req, res) {
  const validation = searchFoundItemsSchema.safeParse(req.query);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid search filters',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const items = await getFoundItems(validation.data);

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error('Found-item search failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve found items',
    });
  }
}

// Retrieve a single visible found item.
export async function getFoundItem(req, res) {
  const validation = z.string().uuid().safeParse(req.params.id);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid found-item ID',
    });
  }

  try {
    const item = await getFoundItemById(validation.data);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found',
      });
    }

    return res.status(200).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Found-item lookup failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve found item',
    });
  }
}

// Update an item while it remains in custody.
export async function editFoundItem(req, res) {
  const idValidation = z.string().uuid().safeParse(req.params.id);

  if (!idValidation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid found-item ID',
    });
  }

  const validation = updateFoundItemSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid found-item update',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const item = await updateFoundItem(
      idValidation.data,
      validation.data
    );

    return res.status(200).json({
      success: true,
      message: 'Found item updated successfully',
      item,
    });
  } catch (error) {
    if (error instanceof FoundItemServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Found-item update failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to update found item',
    });
  }
}

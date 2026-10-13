import {
  AdminServiceError,
  getDashboardStats,
  listUsers as fetchUsers,
  getUserById as fetchUserById,
  changeUserRole,
} from '../services/admin.service.js';

import {
  adminUserIdSchema,
  adminUsersQuerySchema,
  updateUserRoleSchema,
} from '../validators/admin.validation.js';

function sendError(res, error) {
  if (error instanceof AdminServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Admin API error:', error);

  return res.status(500).json({
    success: false,
    message: 'An unexpected administrative error occurred',
  });
}

function sendValidationError(res, error) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

export async function dashboardStats(req, res) {
  try {
    const stats = await getDashboardStats();

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listAdminUsers(req, res) {
  const parsed = adminUsersQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const result = await fetchUsers(parsed.data);

    return res.status(200).json({
      success: true,
      ...result,
      count: result.users.length,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getAdminUser(req, res) {
  const parsed = adminUserIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const user = await fetchUserById(parsed.data);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function updateAdminUserRole(req, res) {
  const parsedId = adminUserIdSchema.safeParse(req.params.id);

  if (!parsedId.success) {
    return sendValidationError(res, parsedId.error);
  }

  const parsedBody = updateUserRoleSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendValidationError(res, parsedBody.error);
  }

  try {
    const result = await changeUserRole({
      adminId: req.user.id,
      userId: parsedId.data,
      role: parsedBody.data.role,
    });

    return res.status(200).json({
      success: true,
      message: result.changed
        ? 'User role updated successfully'
        : 'User already has this role',
      changed: result.changed,
      previousRole: result.previousRole,
      user: result.user,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
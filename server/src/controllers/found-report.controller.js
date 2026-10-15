import {
  createFoundReport,
  listMyFoundReports as getMyReports,
  listFoundReportsForReview as getReviewQueue,
  startFoundReportReview as beginReview,
  reviewFoundReport as processReview,
  resubmitFoundReport as resubmitReport,
  FoundReportServiceError,
} from '../services/found-report.service.js';

import {
  createFoundReportSchema,
  foundReportIdSchema,
  foundReportQueueQuerySchema,
  reviewFoundReportSchema,
} from '../validators/found-report.validation.js';

function sendError(res, error) {
  if (error instanceof FoundReportServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('Found-report API error:', error);

  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred while processing the found report',
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

function getValidatedId(req, res) {
  const result = foundReportIdSchema.safeParse(req.params.id);

  if (!result.success) {
    sendValidationError(res, result.error);
    return null;
  }

  return result.data;
}

export async function submitFoundReport(req, res) {
  const parsed = createFoundReportSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const report = await createFoundReport(req.user.id, parsed.data);

    return res.status(201).json({
      success: true,
      message: 'Found-item report submitted for verification',
      report,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listMyFoundReports(req, res) {
  try {
    const reports = await getMyReports(req.user.id);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function listFoundReportsForReview(req, res) {
  const parsed = foundReportQueueQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const reports = await getReviewQueue(parsed.data.status);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function startFoundReportReview(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  try {
    const report = await beginReview(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Found report moved to IN_REVIEW',
      report,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function decideFoundReport(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  const parsed = reviewFoundReportSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const report = await processReview(id, req.user.id, parsed.data);

    const messages = {
      NEEDS_INFO: 'Additional information requested from the reporter',
      REJECTED: 'Found report rejected',
      ACCEPTED_IN_CUSTODY:
        'Physical custody recorded and found item published',
    };

    return res.status(200).json({
      success: true,
      message: messages[parsed.data.decision],
      report,
    });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function resubmitFoundReport(req, res) {
  const id = getValidatedId(req, res);
  if (!id) return;

  const parsed = createFoundReportSchema.safeParse(req.body);

  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const report = await resubmitReport(id, req.user.id, parsed.data);

    return res.status(200).json({
      success: true,
      message: 'Found report resubmitted for verification',
      report,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
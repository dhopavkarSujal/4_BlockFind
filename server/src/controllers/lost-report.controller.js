import { z } from 'zod';

import { createLostReportSchema } from '../validators/lost-report.validation.js';

import {
  LostReportServiceError,
  createLostReport,
  getMyLostReports,
  getMyLostReportById,
} from '../services/lost-report.service.js';

export async function registerLostReport(req, res) {
  const validation = createLostReportSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid lost report details',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  try {
    const report = await createLostReport(
      req.user.id,
      validation.data
    );

    return res.status(201).json({
      success: true,
      message: 'Lost report created successfully',
      report,
    });
  } catch (error) {
    if (error instanceof LostReportServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Lost report creation failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to create lost report',
    });
  }
}

export async function listMyLostReports(req, res) {
  try {
    const reports = await getMyLostReports(req.user.id);

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error('Lost report listing failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve lost reports',
    });
  }
}

export async function getLostReportById(req, res) {
  const validation = z.string().uuid().safeParse(req.params.id);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid lost report ID',
    });
  }

  try {
    const report = await getMyLostReportById(
      req.user.id,
      validation.data
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lost report not found',
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Lost report lookup failed:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve lost report',
    });
  }
}
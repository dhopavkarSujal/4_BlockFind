
import express from 'express'
import cors from 'cors'
import prisma from './db/prisma.js'
import authRoutes from './routes/auth.routes.js'
import assetRoutes from './routes/asset.routes.js';
import lostReportRoutes from './routes/lost-report.routes.js';
import foundItemRoutes from './routes/found-item.routes.js';
import foundReportRoutes from './routes/found-report.routes.js';
import claimRoutes from './routes/claim.routes.js';
import recoveryRoutes from './routes/recovery.routes.js';
import auditLogRoutes from './routes/audit-log.routes.js';
import adminRoutes from './routes/admin.routes.js';
const app = express()

app.use(
  cors({
    origin: 'http://localhost:5173',
  }),
)

app.use(express.json())

// Basic API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BlockFind API is running',
  })
})

// Database health check
app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`

    res.status(200).json({
      success: true,
      message: 'Supabase database connection is healthy',
    })
  } catch (error) {
    console.error('Database health check failed:', error.message)

    res.status(503).json({
      success: false,
      message: 'Database connection failed',
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/assets', assetRoutes);
app.use('/api/lost-reports', lostReportRoutes);
app.use('/api/found-items', foundItemRoutes);
app.use('/api/found-reports', foundReportRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/recoveries', recoveryRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/admin', adminRoutes);

export default app
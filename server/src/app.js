
import express from 'express'
import cors from 'cors'
import prisma from './db/prisma.js'
import authRoutes from './routes/auth.routes.js'
import assetRoutes from './routes/asset.routes.js';
import lostReportRoutes from './routes/lost-report.routes.js';
import foundItemRoutes from './routes/found-item.routes.js';

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
export default app

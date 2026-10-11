
import { Router } from 'express'
import {
  register,
  login,
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import prisma from '../db/prisma.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found',
      })
    }

    return res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Profile lookup failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve profile',
    })
  }
})

export default router
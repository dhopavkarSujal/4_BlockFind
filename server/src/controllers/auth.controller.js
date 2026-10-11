
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db/prisma.js'
import {
  loginSchema,
  registerSchema,
} from '../validators/auth.validation.js'


export async function login(req, res) {
  const validation = loginSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password',
    })
  }

  const { email, password } = validation.data

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from server/.env')

      return res.status(500).json({
        success: false,
        message: 'Authentication service is unavailable',
      })
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    )

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to log in at this time',
    })
  }
}

export async function register(req, res) {
  const validation = registerSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  const { name, email, password } = validation.data

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user,
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      })
    }

    console.error('Registration failed:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Unable to create account at this time',
    })
  }
}

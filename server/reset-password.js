
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from './src/db/prisma.js'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

try {
  const email = (
    await rl.question('Enter the account email: ')
  ).trim().toLowerCase()

  const password = await rl.question('Enter the new password: ')

  if (!email || password.length < 8) {
    throw new Error(
      'Enter a valid email and a password of at least 8 characters.',
    )
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  if (!user) {
    throw new Error(`No account found for ${email}`)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  console.log(
    `\nPassword reset successfully for ${user.name} (${user.email}).`,
  )
  console.log('You can now sign in with your new password.')
} catch (error) {
  console.error('\nPassword reset failed:', error.message)
  process.exitCode = 1
} finally {
  rl.close()
  await prisma.$disconnect()
}
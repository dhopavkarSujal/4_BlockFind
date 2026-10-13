
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/db/prisma.js";

const targetEmail = "blockfind-found-482ec5ff@example.com";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset passwords in production.");
  }

  if (
    process.env.ALLOW_DEV_PASSWORD_RESET !== "YES" ||
    process.env.CONFIRM_DEV_PASSWORD_RESET_EMAIL?.toLowerCase() !== targetEmail
  ) {
    throw new Error("Development password reset was not explicitly confirmed.");
  }

  const password = process.env.DEV_VERIFIER_NEW_PASSWORD;

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    throw new Error("The new password must contain 8–72 characters.");
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw new Error("Target verifier account not found.");
  }

  if (user.role !== "VERIFIER") {
    throw new Error("Target account is not a VERIFIER; no changes made.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log("Development verifier password reset successfully.");
  console.log(`Account: ${user.email}`);
  console.log(`Role unchanged: ${user.role}`);
}

try {
  await main();
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

import "dotenv/config";
import prisma from "../src/db/prisma.js";

const targetEmail = "blockfind-found-482ec5ff@example.com";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to change roles in production.");
  }

  if (
    process.env.ALLOW_DEV_ROLE_CHANGE !== "YES" ||
    process.env.CONFIRM_DEV_ROLE_EMAIL?.toLowerCase() !== targetEmail
  ) {
    throw new Error("Development role change was not explicitly confirmed.");
  }

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    throw new Error("Target account not found.");
  }

  if (user.role === "ADMIN") {
    throw new Error("Target is already an ADMIN.");
  }

  if (user.role === "VERIFIER") {
    console.log("Account is already a VERIFIER.");
    console.table([user]);
    return;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "VERIFIER" },
    select: { id: true, name: true, email: true, role: true },
  });

  console.log("Development account updated:");
  console.table([updated]);
}

try {
  await main();
} catch (error) {
  console.error("Role provisioning failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

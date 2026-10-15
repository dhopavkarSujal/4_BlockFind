import prisma from "./src/db/prisma.js";

try {
  const result = await prisma.$transaction(
    async (tx) => {
      return await tx.$queryRaw`SELECT 1 AS ok`;
    },
    {
      isolationLevel: "Serializable",
      maxWait: 20000,
      timeout: 30000,
    }
  );

  console.log("Interactive transaction OK:", result);
} catch (error) {
  console.error("Interactive transaction FAILED");
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

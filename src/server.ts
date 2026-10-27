import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./db/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received; shutting down gracefully...`);

  server.close(async (error) => {
    try {
      await prisma.$disconnect();
      if (error) {
        console.error("HTTP server close failed:", error);
        process.exitCode = 1;
      }
      process.exit();
    } catch (disconnectError) {
      console.error("Database disconnect failed:", disconnectError);
      process.exit(1);
    }
  });
  setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
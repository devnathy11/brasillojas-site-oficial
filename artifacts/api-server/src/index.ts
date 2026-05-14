import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./migrate";

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

runMigrations()
  .then(() => {
    const server = app.listen(port, "0.0.0.0", () => {
      logger.info({ port }, "Server listening");
    });

    server.on("error", (err) => {
      logger.error({ err }, "Server listen error");
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error({ err }, "Fatal: DB migration failed");
    process.exit(1);
  });

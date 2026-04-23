import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger";

/**
 * Applies additive schema migrations that may not yet exist on the database.
 * Safe to run on every startup: uses IF NOT EXISTS / IF EXISTS guards.
 */
export async function runMigrations() {
  try {
    await db.execute(sql`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode text;
    `);

    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email text;
    `);

    logger.info("DB migrations applied (barcode, recovery_email)");
  } catch (err) {
    logger.error({ err }, "Error applying DB migrations");
    throw err;
  }
}

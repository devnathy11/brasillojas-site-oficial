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

    // Update orders.status column default to 'criando' (new tracking flow)
    await db.execute(sql`
      ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'criando';
    `);

    // Add/replace orders.status check constraint to include new tracking statuses.
    // Drop old constraint first (if any), then add updated one covering all valid values.
    await db.execute(sql`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    `);
    await db.execute(sql`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check
        CHECK (status IN (
          'pending','confirmed','processing','shipped','delivered','cancelled',
          'criando','processando','saiu_para_entrega','entregue'
        ));
    `);

    logger.info("DB migrations applied (barcode, recovery_email, orders.status default+constraint)");
  } catch (err) {
    logger.error({ err }, "Error applying DB migrations");
    throw err;
  }
}

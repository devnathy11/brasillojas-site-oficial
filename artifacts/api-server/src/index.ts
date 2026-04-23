import app from "./app";
import { logger } from "./lib/logger";
import { getUncachableStripeClient } from "./stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  try {
    // Validate credentials by fetching a fresh client — throws if not connected
    const stripe = await getUncachableStripeClient();

    // Quick connectivity check
    await stripe.paymentMethods.list({ limit: 1 });

    logger.info("Stripe connection verified successfully");
  } catch (err: any) {
    // Non-fatal: server starts, but Stripe payments won't work until integration is active
    logger.warn(
      { msg: err?.message },
      "Stripe init skipped — integration not connected or not configured"
    );
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  // Initialize Stripe after server starts (non-blocking)
  initStripe();
});

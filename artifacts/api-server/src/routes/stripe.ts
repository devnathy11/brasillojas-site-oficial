import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

function getPublicBaseUrl(): string {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return "http://localhost:18891"; // fallback: storefront dev port
}

// POST /api/stripe/create-checkout-session
router.post("/stripe/create-checkout-session", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const stripe = await getUncachableStripeClient();
    const base = getPublicBaseUrl();

    // Get cart items with product info
    const cartItems = await db
      .select({ cartItem: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
      .where(eq(cartItemsTable.userId, userId));

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio" });
    }

    const { shippingAddress, couponCode } = req.body;
    if (!shippingAddress) {
      return res.status(400).json({ error: "Endereço de entrega obrigatório" });
    }

    const lineItems = cartItems.map(({ cartItem, product }) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: product.name,
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: cartItem.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      locale: "pt-BR",
      success_url: `${base}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/cart`,
      metadata: {
        userId,
        shippingAddress: JSON.stringify(shippingAddress),
        couponCode: couponCode ?? "",
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    if (
      err.message?.includes("integration not connected") ||
      err.message?.includes("Missing Replit")
    ) {
      return res.status(503).json({
        error:
          "Pagamento via cartão não configurado. Conecte a integração Stripe para habilitar pagamentos reais.",
      });
    }
    res.status(500).json({ error: "Erro ao criar sessão de pagamento: " + err.message });
  }
});

// POST /api/stripe/complete-order
// Called by the frontend after Stripe redirects back with a session_id
router.post("/stripe/complete-order", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "session_id required" });

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(402).json({ error: "Pagamento não confirmado" });
    }

    const metadata = session.metadata ?? {};
    if (metadata.userId !== userId) {
      return res.status(403).json({ error: "Sessão de outro utilizador" });
    }

    const shippingAddress = JSON.parse(metadata.shippingAddress ?? "{}");
    const couponCode = metadata.couponCode || null;

    // Fetch cart (may still be there if not yet cleared)
    const cartItems = await db
      .select({ cartItem: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(productsTable.id, cartItemsTable.productId))
      .where(eq(cartItemsTable.userId, userId));

    if (cartItems.length === 0) {
      // Idempotency: order already created, find it
      // Return a 409 so the frontend knows to redirect to /orders
      return res.status(409).json({ error: "Pedido já processado" });
    }

    const items = cartItems.map(({ cartItem, product }) => ({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      quantity: cartItem.quantity,
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const stripeTotal = (session.amount_total ?? 0) / 100;

    const [order] = await db.insert(ordersTable).values({
      userId,
      status: "confirmed",
      items,
      subtotal: subtotal.toFixed(2),
      discount: Math.max(0, subtotal - stripeTotal).toFixed(2),
      total: stripeTotal.toFixed(2),
      couponCode,
      shippingAddress,
      paymentMethod: "credit_card",
      paymentStatus: "paid",
    }).returning();

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

    res.json({ orderId: order.id });
  } catch (err: any) {
    console.error("Stripe complete-order error:", err);
    res.status(500).json({ error: "Erro ao finalizar pedido: " + err.message });
  }
});

export default router;

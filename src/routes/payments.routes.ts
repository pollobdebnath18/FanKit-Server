import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../lib/middleware.js";
import {
  createStripePaymentIntent,
  getStripe,
  verifyStripeWebhook,
} from "../lib/stripe.js";
import {
  ApiError,
  applyOrderStock,
  clearCartFor,
  createOrderFromCart,
  markOrderFailed,
  markOrderPaid,
} from "../lib/order.service.js";
import {
  validateCustomerInfo,
  validateShippingAddress,
} from "../lib/validation.js";

const router = Router();

const getCheckoutPayload = (body: Record<string, unknown>) => {
  const customer = validateCustomerInfo(
    body.customer as Parameters<typeof validateCustomerInfo>[0],
  );
  const shippingAddress = validateShippingAddress(
    body.shippingAddress as Parameters<typeof validateShippingAddress>[0],
  );
  return { customer, shippingAddress };
};

//============================================== Stripe ==============================================

// POST /api/payments/stripe/intent — create a payment intent (order snapshot is created server-side)
router.post(
  "/stripe/intent",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { customer, shippingAddress } = getCheckoutPayload(req.body);

      const order = await createOrderFromCart({
        userId: req.userId!,
        customer,
        shippingAddress,
        paymentMethod: "stripe",
        paymentStatus: "pending",
      });

      const intent = await createStripePaymentIntent({
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        amount: order.total,
      });

      await collections.orders().updateOne(
        { _id: order._id },
        { $set: { paymentId: intent.id, updatedAt: new Date() } },
      );

      res.json({
        success: true,
        clientSecret: intent.clientSecret,
        orderId: String(order._id),
      });
    } catch (error) {
      nextError(error, res);
    }
  },
);

// POST /api/payments/stripe/webhook — verify payment server-side and mark the order paid
router.post(
  "/stripe/webhook",
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string | undefined;

    if (!signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Stripe signature." });
    }

    let event;
    try {
      event = verifyStripeWebhook(req.body as string | Buffer, signature);
    } catch (error) {
      console.error("[stripe-webhook] signature error", error);
      return res
        .status(400)
        .send(`Webhook signature verification failed.`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as {
          id: string;
          amount: number;
          metadata?: Record<string, string>;
        };
        const orderId = paymentIntent.metadata?.orderId;

        if (orderId && ObjectId.isValid(orderId)) {
          const order = await collections
            .orders()
            .findOne({ _id: new ObjectId(orderId) });

          if (order && order.paymentStatus !== "paid") {
            // Never trust the client — verify the amount against our snapshot.
            if (Math.round(order.total * 100) !== paymentIntent.amount) {
              console.error(
                `[stripe-webhook] amount mismatch for order ${orderId}`,
              );
              return res
                .status(400)
                .json({ success: false, message: "Amount mismatch." });
            }

            await markOrderPaid(order, paymentIntent.id, paymentIntent.id);
            await applyOrderStock(order);
            await clearCartFor(order.userId);
          }
        }
      }

      if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object as {
          metadata?: Record<string, string>;
        };
        const orderId = paymentIntent.metadata?.orderId;
        if (orderId && ObjectId.isValid(orderId)) {
          const order = await collections
            .orders()
            .findOne({ _id: new ObjectId(orderId) });
          if (order && order.paymentStatus === "pending") {
            await markOrderFailed(order, "failed");
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("[stripe-webhook] handler error", error);
      res.status(500).json({ success: false, message: "Webhook failed." });
    }
  },
);

// POST /api/payments/stripe/confirm — finalize the order after a successful client payment.
// Verifies the PaymentIntent directly with Stripe (never trusts the client's claim), marks
// the order paid, decrements stock and clears the cart. Idempotent alongside the webhook.
router.post(
  "/stripe/confirm",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { paymentIntentId } = req.body as { paymentIntentId?: string };

      if (!paymentIntentId) {
        return res
          .status(400)
          .json({ success: false, message: "Payment intent id is required." });
      }

      const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      const orderId = intent.metadata?.orderId;

      if (!orderId || !ObjectId.isValid(orderId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment intent." });
      }

      const order = await collections.orders().findOne({
        _id: new ObjectId(orderId),
        userId: req.userId!,
      });

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }

      if (intent.status !== "succeeded") {
        return res
          .status(400)
          .json({ success: false, message: "Payment was not successful." });
      }

      // Verify the charged amount matches our server-side snapshot.
      if (Math.round(order.total * 100) !== intent.amount) {
        return res
          .status(400)
          .json({ success: false, message: "Amount mismatch." });
      }

      if (order.paymentStatus !== "paid") {
        await markOrderPaid(order, intent.id, intent.id);
        await applyOrderStock(order);
        await clearCartFor(order.userId);
      }

      res.json({ success: true, orderId: String(order._id) });
    } catch (error) {
      nextError(error, res);
    }
  },
);

//============================================== shared ==============================================

const nextError = (error: unknown, res: Response) => {
  if (error instanceof ApiError) {
    return res
      .status(error.status)
      .json({ success: false, message: error.message });
  }
  console.error(error);
  return res
    .status(500)
    .json({ success: false, message: "Payment processing failed." });
};

export default router;

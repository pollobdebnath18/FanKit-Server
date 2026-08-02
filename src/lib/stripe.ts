import Stripe from "stripe";
import "dotenv/config";
import { ApiError } from "./order.service.js";

const secretKey = process.env.STRIPE_SECRET_KEY || "";

const API_VERSION = "2026-07-29.dahlia";

let stripeInstance: Stripe | null = null;

/** Lazily creates the Stripe client so the server boots without keys. */
export const getStripe = (): Stripe => {
  if (!secretKey) {
    throw new ApiError(
      500,
      "Stripe is not configured on the server. Add STRIPE_SECRET_KEY to continue.",
    );
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: API_VERSION,
    });
  }
  return stripeInstance;
};

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
export const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || "bdt";

/** Converts a BDT amount to the smallest currency unit (poisha). */
export const toMinorUnits = (amount: number): number =>
  Math.round(amount * 100);

export interface PaymentIntentResult {
  id: string;
  clientSecret: string | null;
}

export const createStripePaymentIntent = async ({
  orderId,
  orderNumber,
  amount,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
}): Promise<PaymentIntentResult> => {
  const paymentIntent = await getStripe().paymentIntents.create({
    amount: toMinorUnits(amount),
    currency: PAYMENT_CURRENCY,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId,
      orderNumber,
    },
  });

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
};

/** Verifies a Stripe webhook signature and returns the parsed event. */
export const verifyStripeWebhook = (
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event => {
  return getStripe().webhooks.constructEvent(
    rawBody,
    signature,
    STRIPE_WEBHOOK_SECRET,
  );
};

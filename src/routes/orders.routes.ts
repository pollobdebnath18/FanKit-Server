import { Router, type Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import {
  requireAuth,
  requireAdmin,
  type AuthedRequest,
} from "../lib/middleware.js";
import {
  ApiError,
  VALID_ORDER_STATUSES,
  createOrderFromCart,
} from "../lib/order.service.js";
import {
  validateCustomerInfo,
  validateShippingAddress,
} from "../lib/validation.js";

const router = Router();

// GET /api/orders/admin — all orders (admin)
router.get("/admin", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const orders = await collections
      .orders()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get orders." });
  }
});

// GET /api/orders — user's orders
router.get("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const orders = await collections
      .orders()
      .find({ userId: req.userId! })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get orders." });
  }
});

// GET /api/orders/by-payment/:paymentId — find order by payment intent id (used by success page after Stripe redirect)
router.get(
  "/by-payment/:paymentId",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    try {
      const { paymentId } = req.params as { paymentId: string };
      const order = await collections
        .orders()
        .findOne({ paymentId, userId: req.userId! });

      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found." });
      }

      res.json({ success: true, order });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to get order." });
    }
  },
);

// GET /api/orders/:id — single order detail (ownership check)
router.get("/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id." });
    }

    const order = await collections.orders().findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const isAdmin =
      (req.user as { role?: string } | undefined)?.role === "admin";
    if (!isAdmin && order.userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get order." });
  }
});

// POST /api/orders — create cash-on-delivery order from cart
router.post("/", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const customer = validateCustomerInfo(req.body.customer);
    const shippingAddress = validateShippingAddress(req.body.shippingAddress);

    const order = await createOrderFromCart({
      userId: req.userId!,
      customer,
      shippingAddress,
      paymentMethod: "cash-on-delivery",
      paymentStatus: "pending",
    });

    // Cash on delivery is confirmed at order time.
    await collections.orders().updateOne(
      { _id: order._id },
      { $set: { status: "pending", updatedAt: new Date() } },
    );

    await collections
      .carts()
      .updateOne(
        { userId: req.userId! },
        { $set: { items: [], updatedAt: new Date() } },
      );

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to place order." });
  }
});

// PATCH /api/orders/:id/status — update order status (admin)
router.patch("/:id/status", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id." });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status." });
    }

    const order = await collections.orders().findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const statusHistory = [
      ...(order.statusHistory ?? []),
      { status, at: new Date() },
    ];

    await collections.orders().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, statusHistory, updatedAt: new Date() } },
    );

    res.json({ success: true, message: "Order status updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update order status." });
  }
});

// PATCH /api/orders/:id/tracking — add tracking info (admin)
router.patch("/:id/tracking", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { trackingNumber } = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id." });
    }

    if (!trackingNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Tracking number is required." });
    }

    const result = await collections.orders().updateOne(
      { _id: new ObjectId(id) },
      { $set: { trackingNumber, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, message: "Tracking info updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update tracking." });
  }
});

export default router;

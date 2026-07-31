import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../lib/middleware.js";

const router = Router();

const SHIPPING_RATE = 100;
const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FK-${timestamp}${random}`;
};

// GET /api/orders — user's orders
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const orders = await collections
      .orders()
      .find({ userId: req.userId! })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get orders." });
  }
});

// GET /api/orders/:id — single order detail (ownership check)
router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id." });
    }

    const order = await collections
      .orders()
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const isAdmin = (req.user as { role?: string } | undefined)?.role === "admin";
    if (!isAdmin && order.userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get order." });
  }
});

// POST /api/orders — create order from cart (checkout)
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { shippingAddress, paymentMethod = "cash-on-delivery" } = req.body;

    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Shipping address is required." });
    }

    const cart = await collections.carts().findOne({ userId: req.userId! });
    const cartItems = (cart?.items ?? []) as any[];

    if (cartItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Your cart is empty." });
    }

    const items = [];
    for (const item of cartItems) {
      if (!ObjectId.isValid(item.productId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid product in cart." });
      }
      const product = await collections
        .products()
        .findOne({ _id: new ObjectId(item.productId) });

      if (!product) {
        return res
          .status(400)
          .json({ success: false, message: "A product in your cart no longer exists." });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `"${product.title}" has only ${product.stock} in stock.`,
        });
      }

      items.push({
        productId: item.productId,
        title: product.title,
        price: product.price,
        size: item.size ?? null,
        quantity: item.quantity,
        image: (product.images ?? [])[0] ?? "",
      });

      // decrement stock + increment sales
      await collections.products().updateOne(
        { _id: new ObjectId(item.productId) },
        {
          $inc: { stock: -item.quantity, salesCount: item.quantity },
          $set: { updatedAt: new Date() },
        },
      );
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = subtotal + SHIPPING_RATE;

    const order = {
      _id: new ObjectId(),
      userId: req.userId!,
      orderNumber: generateOrderNumber(),
      items,
      shippingAddress,
      subtotal,
      shipping: SHIPPING_RATE,
      total,
      status: "pending",
      trackingNumber: null,
      paymentMethod,
      paymentStatus: "pending",
      statusHistory: [
        { status: "pending", at: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.orders().insertOne(order);

    // clear cart
    await collections.carts().updateOne(
      { userId: req.userId! },
      { $set: { items: [], updatedAt: new Date() } },
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: result.insertedId,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to place order." });
  }
});

// PATCH /api/orders/:id/status — update order status (admin)
router.patch("/:id/status", requireAdmin, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id." });
    }

    if (!VALID_STATUSES.includes(status)) {
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

    const statusHistory = order.statusHistory
      ? [...order.statusHistory, { status, at: new Date() }]
      : [{ status, at: new Date() }];

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
router.patch("/:id/tracking", requireAdmin, async (req: AuthedRequest, res) => {
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

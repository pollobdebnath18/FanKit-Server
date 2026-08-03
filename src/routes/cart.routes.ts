import { Router, type Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/middleware.js";

const router = Router();
router.use(requireAuth);

const getCart = async (userId: string) => {
  const cart = await collections.carts().findOne({ userId });
  if (cart) return cart;
  const newCart = {
    _id: new ObjectId(),
    userId,
    items: [],
    updatedAt: new Date(),
  };
  await collections.carts().insertOne(newCart);
  return newCart;
};

// GET /api/cart — current user's cart with populated product data
router.get("/", async (req: AuthedRequest, res: Response) => {
  try {
    const cart = await getCart(req.userId!);

    const items = await Promise.all(
      (cart.items as any[]).map(async (item) => {
        const product = await collections
          .products()
          .findOne({ _id: new ObjectId(item.productId) });
        return {
          _id: item._id,
          productId: item.productId,
          size: item.size ?? null,
          quantity: item.quantity,
          product: product
            ? {
                _id: product._id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                comparePrice: product.comparePrice,
                imageUrl: product.imageUrl,
                images: product.images,
                stock: product.stock,
                category: product.category,
                team: product.team,
              }
            : null,
        };
      }),
    );

    const subtotal = items.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
      0,
    );

    res.json({ success: true, cart: { _id: cart._id, items, subtotal } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get cart." });
  }
});

// POST /api/cart/items — add item to cart
router.post("/items", async (req: AuthedRequest, res: Response) => {
  try {
    const { productId, size, quantity = 1 } = req.body;

    if (!productId || !ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product." });
    }

    const product = await collections
      .products()
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const qty = Math.max(1, Number(quantity));
    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items in stock.`,
      });
    }

    const cart = await getCart(req.userId!);

    const existing = (cart.items as any[]).find(
      (item) =>
        String(item.productId) === String(productId) &&
        (item.size ?? null) === (size ?? null),
    );

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items in stock.`,
        });
      }
      await collections.carts().updateOne(
      { userId: req.userId!, "items._id": existing._id },
      { $set: { "items.$.quantity": newQty, updatedAt: new Date() } },
    );
  } else {
    const newItem = {
      _id: new ObjectId(),
      productId,
      size: size ?? null,
      quantity: qty,
    };
    await collections.carts().updateOne(
      { userId: req.userId! },
      { $push: { items: newItem }, $set: { updatedAt: new Date() } },
    );
    }

    res.status(201).json({ success: true, message: "Item added to cart." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add item to cart." });
  }
});

// PATCH /api/cart/items/:id — update item quantity
router.patch("/items/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { quantity } = req.body;

    const cart = await getCart(req.userId!);
    const item = (cart.items as any[]).find(
      (i) => String(i._id) === String(id),
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found." });
    }

    const product = await collections
      .products()
      .findOne({ _id: new ObjectId(item.productId) });

    const qty = Math.max(1, Number(quantity));
    if (product && qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items in stock.`,
      });
    }

    await collections.carts().updateOne(
      { userId: req.userId!, "items._id": new ObjectId(id) },
      { $set: { "items.$.quantity": qty, updatedAt: new Date() } },
    );

    res.json({ success: true, message: "Cart updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update cart." });
  }
});

// DELETE /api/cart/items/:id — remove item from cart
router.delete("/items/:id", async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const result = await collections.carts().updateOne(
      { userId: req.userId! },
      { $pull: { items: { _id: new ObjectId(id) } }, $set: { updatedAt: new Date() } },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cart item not found." });
    }

    res.json({ success: true, message: "Item removed from cart." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove cart item." });
  }
});

// DELETE /api/cart — clear cart
router.delete("/", async (req: AuthedRequest, res: Response) => {
  try {
    await collections.carts().updateOne(
      { userId: req.userId! },
      { $set: { items: [], updatedAt: new Date() } },
    );
    res.json({ success: true, message: "Cart cleared." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to clear cart." });
  }
});

export default router;

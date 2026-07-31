import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/middleware.js";

const router = Router();
router.use(requireAuth);

const getWishlist = async (userId: string) => {
  const wishlist = await collections.wishlists().findOne({ userId });
  if (wishlist) return wishlist;
  const newWishlist = { _id: new ObjectId(), userId, productIds: [] };
  await collections.wishlists().insertOne(newWishlist);
  return newWishlist;
};

// GET /api/wishlist — user's wishlist with populated products
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const wishlist = await getWishlist(req.userId!);

    const productIds = (wishlist.productIds as string[]).filter((id) =>
      ObjectId.isValid(id),
    );

    const products = productIds.length
      ? await collections
          .products()
          .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [];

    res.json({ success: true, wishlist: { _id: wishlist._id, products } });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get wishlist." });
  }
});

// POST /api/wishlist/items — add product to wishlist
router.post("/items", async (req: AuthedRequest, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const product = await collections
      .products()
      .findOne({ _id: new ObjectId(productId) });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const wishlist = await getWishlist(req.userId!);

    const exists = (wishlist.productIds as string[]).some(
      (id) => String(id) === String(productId),
    );

    if (!exists) {
      await collections.wishlists().updateOne(
        { userId: req.userId! },
        { $push: { productIds: productId } },
      );
    }

    res.status(201).json({ success: true, message: "Added to wishlist." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add to wishlist." });
  }
});

// DELETE /api/wishlist/items/:productId — remove from wishlist
router.delete("/items/:productId", async (req: AuthedRequest, res) => {
  try {
    const { productId } = req.params as { productId: string };

    await collections.wishlists().updateOne(
      { userId: req.userId! },
      { $pull: { productIds: productId } },
    );

    res.json({ success: true, message: "Removed from wishlist." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove from wishlist." });
  }
});

export default router;

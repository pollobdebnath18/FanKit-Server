import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/middleware.js";

const router = Router();

const recomputeRating = async (productId: string) => {
  const productObjectId = new ObjectId(productId);

  const [aggregation] = await collections
    .reviews()
    .aggregate([
      { $match: { productId: productObjectId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const avg = aggregation ? Math.round((aggregation.avg as number) * 10) / 10 : 0;
  const count = aggregation ? (aggregation.count as number) : 0;

  await collections.products().updateOne(
    { _id: productObjectId },
    { $set: { rating: avg, reviewCount: count } },
  );
};

// GET /api/products/:productId/reviews — public
router.get("/products/:productId/reviews", async (req, res) => {
  try {
    const { productId } = req.params as { productId: string };

    if (!ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const reviews = await collections
      .reviews()
      .find({ productId: new ObjectId(productId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, reviews });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get reviews." });
  }
});

// POST /api/products/:productId/reviews — create review (authenticated)
router.post("/products/:productId/reviews", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { productId } = req.params as { productId: string };
    const { rating, title, comment } = req.body;

    if (!ObjectId.isValid(productId)) {
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

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const existing = await collections.reviews().findOne({
      productId: new ObjectId(productId),
      userId: req.userId!,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const review = {
      _id: new ObjectId(),
      productId: new ObjectId(productId),
      userId: req.userId!,
      rating: ratingNum,
      title: title ?? "",
      comment: comment ?? "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collections.reviews().insertOne(review);
    await recomputeRating(productId);

    res.status(201).json({ success: true, message: "Review added." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add review." });
  }
});

// PATCH /api/reviews/:id — edit own review
router.patch("/reviews/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };
    const { rating, title, comment } = req.body;

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid review id." });
    }

    const review = await collections.reviews().findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    if (review.userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (ratingNum < 1 || ratingNum > 5) {
        return res
          .status(400)
          .json({ success: false, message: "Rating must be between 1 and 5." });
      }
      updates.rating = ratingNum;
    }
    if (title !== undefined) updates.title = title;
    if (comment !== undefined) updates.comment = comment;

    await collections
      .reviews()
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    await recomputeRating(String(review.productId));

    res.json({ success: true, message: "Review updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update review." });
  }
});

// DELETE /api/reviews/:id — delete own review
router.delete("/reviews/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid review id." });
    }

    const review = await collections.reviews().findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });
    }

    if (review.userId !== req.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await collections.reviews().deleteOne({ _id: new ObjectId(id) });
    await recomputeRating(String(review.productId));

    res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete review." });
  }
});

export default router;

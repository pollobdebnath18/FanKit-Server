import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAdmin } from "../lib/middleware.js";

const router = Router();

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// GET /api/products — all products (with pagination)
// Backward-compatible: returns a plain array (as the existing client expects).
// Optional query params: page, limit.
router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const products = await collections
      .products()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get products." });
  }
});

// GET /api/products/:slug — single product by slug (fallback to _id for legacy links)
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params as { slug: string };
    let product = null;

    if (ObjectId.isValid(slug)) {
      product = await collections
        .products()
        .findOne({ _id: new ObjectId(slug) });
    }

    if (!product) {
      product = await collections.products().findOne({ slug });
    }

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get product." });
  }
});

// POST /api/products — create product (admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      title,
      team,
      category,
      subcategory,
      type,
      shortDescription,
      fullDescription,
      price,
      comparePrice,
      stock,
      sizes,
      colors,
      images,
      tags,
      featured,
      onSale,
    } = req.body;

    if (!title || !team || !category || !shortDescription || !fullDescription) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const product = {
      _id: new ObjectId(),
      title,
      slug: slugify(title),
      category,
      subcategory: subcategory ?? null,
      type: type ?? null,
      team,
      shortDescription,
      fullDescription,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      stock: Number(stock),
      sizes: sizes ?? [],
      colors: colors ?? [],
      images: images ?? [],
      tags: tags ?? [],
      featured: featured ?? false,
      onSale: onSale ?? false,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.products().insertOne(product);

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add product." });
  }
});

// PATCH /api/products/:id — update product (admin)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const existing = await collections
      .products()
      .findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const updates: Record<string, unknown> = { ...req.body, updatedAt: new Date() };

    // regenerate slug if title changed and no explicit slug
    if (updates.title && !updates.slug) {
      updates.slug = slugify(updates.title as string);
    }
    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.comparePrice !== undefined)
      updates.comparePrice = updates.comparePrice ? Number(updates.comparePrice) : null;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock);

    delete updates._id;

    await collections
      .products()
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    res.json({ success: true, message: "Product updated successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update product." });
  }
});

// DELETE /api/products/:id — delete product (admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id." });
    }

    const result = await collections
      .products()
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete product." });
  }
});

export default router;

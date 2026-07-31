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

// GET /api/products — filtered products with pagination
// Query params: category (→ `sport`), type (→ `category`), gender, brand,
//               search, sort, page, limit, minPrice, maxPrice, availability.
// Backward-compatible: with NO filter params it returns a plain array
// (as the existing client expects). With filters it returns
// { products, totalProducts, totalPages, currentPage, filterCounts }.
router.get("/", async (req, res) => {
  try {
    const {
      category, // → DB `sport` (football | cricket | accessories)
      type, // → DB `category` (Home Kit, Away Kit, ...)
      gender, // → DB `gender` (men | women | kids | unisex)
      brand,
      search = "",
      sort = "newest",
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      availability,
      featured,
      newArrival,
      onSale,
    } = req.query;

    const hasFilterParams = [
      category,
      type,
      gender,
      brand,
      search,
      minPrice,
      maxPrice,
      availability,
      featured,
      newArrival,
      onSale,
    ].some((v) => v !== undefined && v !== "");

    // Backward-compatible plain-array response when no filters are used.
    if (!hasFilterParams) {
      const all = await collections
        .products()
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .toArray();
      return res.json(all);
    }

    const query: Record<string, unknown> = { status: "active" };

    if (category && category !== "All") query.sport = category;
    if (type && type !== "All") {
      // Normalize slug-style values ("club-jerseys") to display labels ("Club Jerseys")
      // while still matching exact labels case-insensitively.
      const typePattern = String(type)
        .replace(/-/g, " ")
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.category = { $regex: `^${typePattern}$`, $options: "i" };
    }
    if (gender && gender !== "All") query.gender = gender;
    if (brand && brand !== "All") query.brand = brand;

    if (search) {
      const regex = { $regex: search, $options: "i" } as const;
      query.$or = [
        { title: regex },
        { team: regex },
        { brand: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    if (Object.keys(priceFilter).length > 0) query.price = priceFilter;

    if (availability === "in-stock") query.stock = { $gt: 0 };
    if (availability === "out-of-stock") query.stock = 0;
    if (featured === "true") query.featured = true;
    if (newArrival === "true") query.newArrival = true;
    if (onSale === "true") query.onSale = true;

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "best-selling":
        sortOption = { salesCount: -1 };
        break;
      case "highest-rated":
        sortOption = { rating: -1 };
        break;
      case "name":
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, totalProducts] = await Promise.all([
      collections
        .products()
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      collections.products().countDocuments(query),
    ]);

    // Sidebar counts: scoped to the sport (category) + search only, so all
    // filter options remain visible regardless of the active type/gender.
    const countQuery: Record<string, unknown> = { status: "active" };
    if (category && category !== "All") countQuery.sport = category;
    if (search) {
      const regex = { $regex: search, $options: "i" } as const;
      countQuery.$or = [
        { title: regex },
        { team: regex },
        { brand: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const filterDocs = await collections
      .products()
      .find(countQuery)
      .project({ category: 1, gender: 1, brand: 1, stock: 1 })
      .toArray();

    const filterCounts: Record<string, Record<string, number> | number> = {
      types: {},
      genders: {},
      brands: {},
      inStock: 0,
      outOfStock: 0,
    };

    for (const doc of filterDocs) {
      const types = filterCounts.types as Record<string, number>;
      types[doc.category] = (types[doc.category] ?? 0) + 1;
      if (doc.gender) {
        const genders = filterCounts.genders as Record<string, number>;
        genders[doc.gender] = (genders[doc.gender] ?? 0) + 1;
      }
      if (doc.brand) {
        const brands = filterCounts.brands as Record<string, number>;
        brands[doc.brand] = (brands[doc.brand] ?? 0) + 1;
      }
      if ((doc.stock ?? 0) > 0) {
        filterCounts.inStock = (filterCounts.inStock as number) + 1;
      } else {
        filterCounts.outOfStock = (filterCounts.outOfStock as number) + 1;
      }
    }

    res.json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / Number(limit)),
      currentPage: Number(page),
      filterCounts,
    });
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
      sport,
      gender,
      category,
      type,
      brand,
      season,
      shortDescription,
      fullDescription,
      price,
      comparePrice,
      stock,
      sku,
      sizes,
      colors,
      images,
      imageUrl,
      tags,
      featured,
      newArrival,
      onSale,
      status,
    } = req.body;

    if (!title || !team || !sport || !shortDescription || !fullDescription) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const product = {
      _id: new ObjectId(),
      title,
      slug: slugify(title),
      sport,
      gender: gender ?? null,
      category: category ?? "",
      type: type ?? null,
      team,
      brand: brand ?? null,
      season: season ?? null,
      shortDescription,
      fullDescription,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      stock: Number(stock),
      sku: sku ?? "",
      sizes: sizes ?? [],
      colors: colors ?? [],
      images: images ?? (imageUrl ? [imageUrl] : []),
      imageUrl: imageUrl ?? (Array.isArray(images) ? images[0] : undefined) ?? null,
      tags: tags ?? [],
      featured: featured ?? false,
      newArrival: newArrival ?? false,
      onSale: onSale ?? false,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      status: status ?? "active",
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

import { Router } from "express";
import { collections } from "../lib/db.js";

const router = Router();

// GET /api/collections — filtered products with pagination
// Query params: search, category, subcategory, type, team, sort, page, limit, minPrice, maxPrice, featured, onSale
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      category,
      subcategory,
      type,
      team,
      sort = "newest",
      page = 1,
      limit = 8,
      minPrice,
      maxPrice,
      featured,
      newArrival,
      onSale,
    } = req.query;

    const query: Record<string, unknown> = { status: "active" };

    if (req.query.status) query.status = req.query.status;

    if (search) {
      const regex = { $regex: search, $options: "i" } as const;
      query.$or = [
        { title: regex },
        { team: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    if (category && category !== "All") query.category = category;
    if (subcategory && subcategory !== "All") query.subcategory = subcategory;
    if (type && type !== "All") query.type = type;
    if (team && team !== "All") query.team = team;

    if (featured === "true") query.featured = true;
    if (newArrival === "true") query.newArrival = true;
    if (onSale === "true") query.onSale = true;

    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    if (Object.keys(priceFilter).length > 0) query.price = priceFilter;

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case "price-low":
        sortOption = { price: 1 };
        break;
      case "price-high":
        sortOption = { price: -1 };
        break;
      case "name":
        sortOption = { title: 1 };
        break;
      case "best-selling":
        sortOption = { salesCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      collections
        .products()
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      collections.products().countDocuments(query),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get products." });
  }
});

export default router;

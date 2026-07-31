import { Router } from "express";
import { collections } from "../lib/db.js";

const router = Router();

// GET /api/blog — all published posts
router.get("/", async (_req, res) => {
  try {
    const posts = await collections
      .blogPosts()
      .find({ published: true })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get posts." });
  }
});

// GET /api/blog/:slug — single post
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await collections.blogPosts().findOne({ slug, published: true });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get post." });
  }
});

export default router;

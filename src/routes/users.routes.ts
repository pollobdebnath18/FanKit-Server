import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { collections } from "../lib/db.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../lib/middleware.js";

const router = Router();

// GET /api/users/auth-status?email=... — check sign-in options for an email
router.get("/auth-status", async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await collections.users().findOne({ email });
    if (!user) {
      return res.json({ success: true, exists: false, hasPassword: false });
    }

    const account = await collections
      .users()
      .db.collection("account")
      .findOne({ userId: user._id, providerId: "credential" });

    res.json({
      success: true,
      exists: true,
      hasPassword: Boolean(account?.password),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to check auth status." });
  }
});

// POST /api/users/set-role — set role to 'user' after signup
router.post("/set-role", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const result = await collections.users().updateOne(
      { email },
      { $set: { role: "user", updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User role set." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to set user role." });
  }
});

// GET /api/users/me — current user profile
router.get("/me",requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const user = await collections.users().findOne({ _id: new ObjectId(req.userId!) });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get user." });
  }
});

// PATCH /api/users/me — update profile (name, email, phone, avatar)
router.patch("/me", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { name, email, phone, avatar, image } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    if (image !== undefined) updates.image = image;
    if (email !== undefined) updates.email = email;

    // keep Better Auth session in sync
    try {
      await auth.api.updateUser({
        body: {
          name: name as string,
          image: (avatar as string) ?? (image as string),
        },
        headers: fromNodeHeaders(req.headers),
      });
    } catch (e) {
      console.error("better-auth updateUser failed:", e);
    }

    await collections
      .users()
      .updateOne({ _id: new ObjectId(req.userId!) }, { $set: updates });

    res.json({ success: true, message: "Profile updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile." });
  }
});

// PATCH /api/users/me/password — change password
router.patch("/me/password", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Both passwords are required." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 8 characters." });
    }

    const result = await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: fromNodeHeaders(req.headers),
    });

    res.json({ success: true, message: "Password changed." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to change password." });
  }
});

// GET /api/users — all users (admin)
router.get("/", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await collections.users().find({}).toArray();
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to get users." });
  }
});

// PATCH /api/users/:id/role — set user role (admin)
router.patch("/:id/role", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { role } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    if (role !== "user" && role !== "admin") {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

    const result = await collections.users().updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User role updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update user role." });
  }
});

// DELETE /api/users/:id — delete user (admin)
router.delete("/:id", requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }

    const result = await collections.users().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // clean up related data
    await Promise.all([
      collections.carts().deleteMany({ userId: id }),
      collections.wishlists().deleteMany({ userId: id }),
      collections.orders().deleteMany({ userId: id }),
      collections.addresses().deleteMany({ userId: id }),
      collections.reviews().deleteMany({ userId: id }),
    ]);

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete user." });
  }
});

export default router;

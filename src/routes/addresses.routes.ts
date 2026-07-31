import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../lib/middleware.js";

const router = Router();
router.use(requireAuth);

// GET /api/addresses — user's addresses
router.get("/", async (req: AuthedRequest, res) => {
  try {
    const addresses = await collections
      .addresses()
      .find({ userId: req.userId! })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray();

    res.json({ success: true, addresses });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get addresses." });
  }
});

// POST /api/addresses — add address
router.post("/", async (req: AuthedRequest, res) => {
  try {
    const { name, phone, address, city, state, zip, country, isDefault } = req.body;

    if (!name || !phone || !address || !city || !country) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields." });
    }

    const count = await collections.addresses().countDocuments({ userId: req.userId! });

    const makeDefault = isDefault ?? count === 0;

    if (makeDefault) {
      await collections
        .addresses()
        .updateMany({ userId: req.userId! }, { $set: { isDefault: false } });
    }

    const addressDoc = {
      _id: new ObjectId(),
      userId: req.userId!,
      name,
      phone,
      address,
      city,
      state: state ?? "",
      zip: zip ?? "",
      country,
      isDefault: makeDefault,
      createdAt: new Date(),
    };

    await collections.addresses().insertOne(addressDoc);

    res.status(201).json({ success: true, message: "Address added." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add address." });
  }
});

// PATCH /api/addresses/:id — update address
router.patch("/:id", async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid address id." });
    }

    const existing = await collections
      .addresses()
      .findOne({ _id: new ObjectId(id), userId: req.userId! });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }

    const updates: Record<string, unknown> = { ...req.body };
    delete updates._id;
    delete updates.userId;

    if (updates.isDefault) {
      await collections
        .addresses()
        .updateMany({ userId: req.userId! }, { $set: { isDefault: false } });
    }

    await collections
      .addresses()
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    res.json({ success: true, message: "Address updated." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update address." });
  }
});

// DELETE /api/addresses/:id — delete address
router.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const { id } = req.params as { id: string };

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid address id." });
    }

    const result = await collections
      .addresses()
      .deleteOne({ _id: new ObjectId(id), userId: req.userId! });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }

    res.json({ success: true, message: "Address deleted." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete address." });
  }
});

export default router;

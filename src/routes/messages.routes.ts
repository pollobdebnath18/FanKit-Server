import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";

const router = Router();

// POST /api/messages — submit a contact form message (public)
router.post("/messages", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const doc = {
      _id: new ObjectId(),
      name: String(name).trim(),
      email: String(email).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
      read: false,
      createdAt: new Date(),
    };

    await collections.messages().insertOne(doc);

    res
      .status(201)
      .json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send message." });
  }
});

export default router;

import { Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../lib/db.js";

const router = Router();

// POST /api/contact — submit contact form
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields." });
    }

    await collections.contactSubmissions().insertOne({
      _id: new ObjectId(),
      name,
      email,
      subject: subject ?? "",
      message,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully. We will get back to you soon.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send message." });
  }
});

// POST /api/newsletter — subscribe email
router.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid email." });
    }

    await collections.newsletterSubscribers().updateOne(
      { email },
      { $setOnInsert: { email, subscribedAt: new Date() } },
      { upsert: true },
    );

    res.status(201).json({
      success: true,
      message: "Subscribed successfully.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to subscribe." });
  }
});

export default router;

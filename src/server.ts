import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { client } from "./lib/mongodb.js";
import { envVar } from "./lib/env.js";

const app = express();
await client.connect();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Mount BEFORE express.json() — Better Auth reads the raw body itself
app.all("/api/auth/*path", toNodeHandler(auth));

// Now safe to parse JSON for everything else (your jersey/cart/order routes etc.)
app.use(express.json());

app.get("/", (req, res) => {
  res.send({
    message: "server running successfully",
  });
});

//========================================== routes ===========================================
// create user collection
const userCollection = client.db(envVar.DB_NAME).collection("user");
const productCollection = client.db(envVar.DB_NAME).collection("products");

//  create add product route (admin - add product page)
app.post("/api/products", async (req, res) => {
  try {
    const {
      title,
      team,
      category,
      shortDescription,
      fullDescription,
      price,
      stock,
      sizes,
      imageUrl,
    } = req.body;

    // Basic validation
    if (!title || !team || !category || !shortDescription || !fullDescription) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const product = {
      title,
      team,
      category,
      shortDescription,
      fullDescription,
      price: Number(price),
      stock: Number(stock),
      sizes,
      imageUrl,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await productCollection.insertOne(product);

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to add product.",
    });
  }
});

// create user collection route
app.get("/api/users/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });

    if (!session) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await userCollection.findOne({
      email: session.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

app.listen(envVar.PORT, () => {
  console.log(`Server running On PORT ${envVar.PORT}`);
});

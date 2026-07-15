import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { client } from "./lib/mongodb.js";
import { envVar } from "./lib/env.js";
import { ObjectId } from "mongodb";

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
    // console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to add product.",
    });
  }
});

// get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await productCollection.find({}).toArray();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get products.",
    });
  }
});

// collection route get all products
app.get("/api/collections", async (req, res) => {
  const {
    search = "",
    category,
    team,
    sort = "newest",
    page = 1,
    limit = 8,
    maxPrice,
  } = req.query;

  const query: any = {};

  if (search) {
    query.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        team: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (category && category !== "All") {
    query.category = category;
  }

  if (team && team !== "All") {
    query.team = team;
  }

  if (maxPrice) {
    query.price = {
      $lte: Number(maxPrice),
    };
  }

  let sortOption = {};

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

    default:
      sortOption = { createdAt: -1 };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const products = await productCollection
    .find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit))
    .toArray();

  const total = await productCollection.countDocuments(query);

  res.json({
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
});

// get product by id
app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = {
      _id: new ObjectId(id),
    };
    const product = await productCollection.findOne(query);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get product.",
    });
  }
});

// set role for user
app.post("/api/users/set-role", async (req, res) => {
  try {
    const { email } = req.body;

    await userCollection.updateOne(
      { email },
      {
        $set: {
          role: "user",
        },
      },
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
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

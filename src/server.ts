import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { client } from "./lib/mongodb.js";

import productsRouter from "./routes/products.routes.js";
import collectionsRouter from "./routes/collections.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import reviewsRouter from "./routes/reviews.routes.js";
import usersRouter from "./routes/users.routes.js";
import addressesRouter from "./routes/addresses.routes.js";
import blogRouter from "./routes/blog.routes.js";
import miscRouter from "./routes/misc.routes.js";
import messagesRouter from "./routes/messages.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import { ApiError } from "./lib/order.service.js";

const app = express();
await client.connect();

// Trust the first proxy (Render, Vercel, etc.) so req.protocol / req.ip are correct
app.set("trust proxy", 1);

const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean) as string[];

const isLocalhost = (origin: string | undefined) =>
  Boolean(origin && /^http:\/\/localhost(:\d+)?$/.test(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // No origin (server-to-server, health checks) – allow
      // Dev: allow any localhost port (Vite may auto-shift if 5173 is busy)
      if (!origin || isLocalhost(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);

// Mount BEFORE express.json() — Better Auth reads the raw body itself
app.all("/api/auth/*path", toNodeHandler(auth));

// Stripe webhook needs the raw body to verify the signature (skips JSON parsing).
app.use("/api/payments/stripe/webhook", express.raw({ type: "application/json" }));

// Now safe to parse JSON for everything else
app.use(express.json());

app.get("/", (_req, res) => {
  res.send({
    message: "server running successfully",
  });
});

//========================================== routes ===========================================
app.use("/api/products", productsRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/orders", ordersRouter);
app.use("/api", reviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/addresses", addressesRouter);
app.use("/api/blog", blogRouter);
app.use("/api", messagesRouter);
app.use("/api", miscRouter);
app.use("/api/payments", paymentsRouter);

// Central error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof ApiError) {
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);

const port = Number(process.env.PORT) || 8000;
app.listen(port, () => {
  console.log(`Server running On PORT ${port}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || "(not set)"}`);
  console.log(`BASE_URL: ${process.env.BETTER_AUTH_URL || process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || "(not set)"}`);
  console.log(`CLIENT_URL: ${process.env.CLIENT_URL || "(not set)"}`);
});

import express from "express";
import cors from "cors";
import { client } from "./lib/mongodb.js";
import { env } from "./lib/env.js";

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
// await client.connect();

// Trust the first proxy (Render, Vercel, etc.) so req.protocol / req.ip are correct
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.RENDER_EXTERNAL_URL,
  process.env.BASE_URL,
].filter(Boolean) as string[];

const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");

const isVercelOrigin = (origin: string | undefined) =>
  Boolean(origin && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowedOrigin =
        allowedOrigins.includes(normalizedOrigin) || isVercelOrigin(origin);

      if (isAllowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);
// Mount BEFORE express.json() — Stripe webhook needs the raw body to verify the signature.
app.use(
  "/api/payments/stripe/webhook",
  express.raw({ type: "application/json" }),
);

// Now safe to parse JSON for everything else
app.use(express.json());

app.get("/", (_req: express.Request, res: express.Response) => {
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

const port = Number(env.PORT) || 8000;

if (!env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running On PORT ${port}`);
    console.log(`NODE_ENV: ${env.NODE_ENV || "(not set)"}`);
    console.log(
      `BASE_URL: ${env.RENDER_EXTERNAL_URL || env.BASE_URL || "(not set)"}`,
    );
    console.log(`CLIENT_URL: ${env.CLIENT_URL || "(not set)"}`);
  });
}

export default app;

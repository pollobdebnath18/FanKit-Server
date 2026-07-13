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

app.listen(envVar.PORT, () => {
  console.log(`Server running On PORT ${envVar.PORT}`);
});

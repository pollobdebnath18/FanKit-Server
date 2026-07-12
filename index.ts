import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World. This is FanKit Server");
});

app.use("/api/auth", toNodeHandler(auth));

app.listen(port, () => {
  console.log(`Example app is running on port ${port}`);
});

import dotenv from "dotenv";
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

dotenv.config();

const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/fankit";
const client = new MongoClient(mongoUri);
const db = client.db(process.env.MONGODB_DB ?? "fankit");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
});

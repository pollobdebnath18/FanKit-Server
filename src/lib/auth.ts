import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./mongodb.js";
import { envVar } from "./env.js";

const isProd = process.env.NODE_ENV === "production";

const trustedOrigins = [
  envVar.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175"
].filter(Boolean);

export const auth = betterAuth({
  database: mongodbAdapter(client.db(envVar.DB_NAME)),
  baseURL: envVar.BASE_URL,
  secret: envVar.BETTER_AUTH_SECRET,

  trustedOrigins,

  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: isProd ? {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    } : {},
  },
});

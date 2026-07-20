import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./mongodb.js";
import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

const trustedOrigins = [process.env.CLIENT_URL].filter(Boolean) as string[];

export const auth = betterAuth({
  database: mongodbAdapter(client.db(process.env.DB_NAME)),
  baseURL: process.env.BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,

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
    useSecureCookies: isProd,
    defaultCookieAttributes: isProd
      ? {
          sameSite: "none",
          secure: true,
          httpOnly: true,
          partitioned: true, // CHIPS — required for cross-origin cookies in Chrome 118+
        }
      : {},
  },
});

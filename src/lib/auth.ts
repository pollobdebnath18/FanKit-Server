import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./mongodb.js";
import { envVar } from "./env.js";

const isProd = process.env.NODE_ENV === "production" || 
  (!envVar.CLIENT_URL.includes("localhost") && !envVar.CLIENT_URL.includes("127.0.0.1"));

export const auth = betterAuth({
  database: mongodbAdapter(client.db(envVar.DB_NAME)),
  baseURL: envVar.BASE_URL,
  secret: envVar.BETTER_AUTH_SECRET,

  trustedOrigins: [envVar.CLIENT_URL],

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
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
});

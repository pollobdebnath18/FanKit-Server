import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { client } from "./mongodb.js";
import { envVar } from "./env.js";

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
        default: "user",
      },
    },
  },
});

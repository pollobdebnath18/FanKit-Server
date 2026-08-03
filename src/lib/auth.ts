import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { client } from "./mongodb.js";
import { sendEmail } from "./email.js";
import "dotenv/config";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.RENDER_EXTERNAL_URL || // Render sets this automatically
  process.env.BASE_URL ||
  "http://localhost:8000";

const isProd = baseURL.startsWith("https://");

const clientOrigin = process.env.CLIENT_URL?.replace(/\/$/, "") || "";
const serverOrigin = baseURL.replace(/\/$/, "");

const trustedOrigins = Array.from(
  new Set(
    [
      clientOrigin,
      serverOrigin,
      ...(isProd ? [] : ["http://localhost:5173", "http://localhost:8000"]),
    ].filter(Boolean),
  ),
) as string[];

export const auth = betterAuth({
  database: mongodbAdapter(client.db(process.env.DB_NAME)),
  baseURL: baseURL!,
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins,

  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      console.log(`[forgot-password] ${user.email}: ${url}`);
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          to: email,
          subject:
            type === "forget-password"
              ? "FanKit – Your password reset code"
              : "FanKit – Your verification code",
          text: `Your FanKit ${type === "forget-password" ? "password reset" : "verification"} code is: ${otp}\n\nThis code expires in 5 minutes. If you didn't request this, you can safely ignore this email.`,
          html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
            <h2 style="color:#0B1F3A;margin:0 0 12px;">FanKit</h2>
            <p style="color:#334155;font-size:14px;">Your ${
              type === "forget-password" ? "password reset" : "verification"
            } code is:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0B1F3A;margin:16px 0;">${otp}</p>
            <p style="color:#64748b;font-size:13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>`,
        });
      },
    }),
  ],

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
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
          // NOTE: do NOT use CHIPS (partitioned) here — a partitioned cookie is
          // scoped to its top-level site, so the OAuth `state` cookie is dropped
          // across the Google redirect chain and sign-in fails with
          // state_mismatch. Deterministic cross-site cookies work via SameSite=None + Secure.
        }
      : {},
  },
});

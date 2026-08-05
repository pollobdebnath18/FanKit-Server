import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { client } from "./mongodb.js";
import { sendEmail } from "./email.js";
import { env } from "./env.js";

const fallbackServerOrigin = "https://fan-kit-server.vercel.app";
const fallbackClientOrigin = "https://fankit-two.vercel.app";

const serverOrigin = (
  env.BETTER_AUTH_URL ||
  env.RENDER_EXTERNAL_URL ||
  env.BASE_URL ||
  (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : fallbackServerOrigin)
).replace(/\/$/, "");

const clientOrigin = (env.CLIENT_URL || fallbackClientOrigin).replace(/\/$/, "");

const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;

// In production the browser only ever calls the client origin: Vercel rewrites
// /api/* to the server, so the session cookie stays first-party and every URL
// better-auth generates (OAuth callbacks, etc.) must go through the client too.
// Always include both the env-derived values AND the hardcoded fallbacks so
// Better Auth's CSRF/origin check never rejects the Vercel frontend, even if
// CLIENT_URL or BETTER_AUTH_URL are missing from Render's env vars.
const trustedOrigins = Array.from(
  new Set(
    [
      clientOrigin,
      serverOrigin,
      fallbackClientOrigin, // https://fankit-two.vercel.app  (always included)
      fallbackServerOrigin, // https://fan-kit-server.vercel.app (always included)
      ...(isProd ? [] : ["http://localhost:5173", "http://localhost:8000"]),
    ].filter(Boolean),
  ),
) as string[];

export const auth = betterAuth({
  database: mongodbAdapter(client.db(env.DB_NAME)),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: isProd ? clientOrigin : serverOrigin,

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
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
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
        }
      : {},
  },
});

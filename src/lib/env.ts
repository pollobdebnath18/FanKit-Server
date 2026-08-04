import dotenv from "dotenv";
dotenv.config();

const value = (key: string) => process.env[key] ?? "";

export const env = {
  MONGODB_URI: value("MONGODB_URI"),
  DB_NAME: value("DB_NAME"),
  PORT: value("PORT"),
  NODE_ENV: value("NODE_ENV"),

  BASE_URL: value("BASE_URL"),
  BETTER_AUTH_URL: value("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: value("BETTER_AUTH_SECRET"),
  RENDER_EXTERNAL_URL: value("RENDER_EXTERNAL_URL"),
  VERCEL_URL: value("VERCEL_URL"),
  VERCEL: value("VERCEL"),

  CLIENT_URL: value("CLIENT_URL"),

  GOOGLE_CLIENT_ID: value("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: value("GOOGLE_CLIENT_SECRET"),

  SMTP_HOST: value("SMTP_HOST") || "smtp.gmail.com",
  SMTP_PORT: value("SMTP_PORT") || "587",
  SMTP_USER: value("SMTP_USER"),
  SMTP_PASS: value("SMTP_PASS"),
  EMAIL_FROM: value("EMAIL_FROM"),

  STRIPE_SECRET_KEY: value("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: value("STRIPE_WEBHOOK_SECRET"),
  PAYMENT_CURRENCY: value("PAYMENT_CURRENCY") || "bdt",
};
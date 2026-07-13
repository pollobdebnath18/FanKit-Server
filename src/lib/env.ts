import dotenv from "dotenv";
dotenv.config();

export const envVar = {
  MONGODB_URI: process.env.MONGODB_URI!,
  DB_NAME: process.env.DB_NAME!,
  PORT: Number(process.env.PORT) || 8000,
  BASE_URL: process.env.BASE_URL!,
  CLIENT_URL: process.env.CLIENT_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
};

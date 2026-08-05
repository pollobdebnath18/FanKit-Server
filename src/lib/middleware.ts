import type { NextFunction, Request, Response } from "express";
import { getAuthenticatedUserProfile } from "./firebase-admin.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string | undefined;
  image?: string | null | undefined;
}

export interface AuthedRequest extends Request {
  body: any;
  params: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
  userId?: string;
}

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
};

export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const profile = await getAuthenticatedUserProfile(token);

  if (!profile) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  req.user = profile.user;
  req.userId = profile.userId;
  next();
};

export const requireAdmin = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const profile = await getAuthenticatedUserProfile(token);

  if (!profile) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (profile.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  req.user = profile.user;
  req.userId = profile.userId;
  next();
};

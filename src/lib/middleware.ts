import type { NextFunction, Request, Response } from "express";
import { auth } from "./auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { User } from "better-auth";

export interface AuthedRequest extends Request {
  user?: User;
  userId?: string;
}

export const requireAuth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = session.user;
    req.userId = session.user.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export const requireAdmin = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (session.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.user = session.user;
    req.userId = session.user.id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

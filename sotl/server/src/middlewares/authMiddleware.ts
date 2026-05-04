import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

export interface AuthRequest extends Request {
  user?: {
    role: string;
    userId: mongoose.Types.ObjectId;
  } & JwtPayload;
}

const authMiddleware = (allowedRoles: string[] = [], optional?: boolean) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header("Authorization") || "";

    // ❗ DEBUG: confirm header arrives
    console.log("[auth] Authorization header:", authHeader ? "PRESENT" : "MISSING");

    if (!optional && (!authHeader || !authHeader.startsWith("Bearer "))) {
      console.warn("[auth] No Bearer token");
      return res.status(401).json({
        message: "[Msg]No Token, Authorization Denied",
      });
    }

    try {
      if (!optional || authHeader) {
        const token = authHeader.replace(/^Bearer\s+/i, "").trim();

        // ❗ DEBUG: confirm JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
          console.error("[auth] JWT_SECRET is NOT defined");
          return res.status(500).json({
            message: "[Msg]Server misconfiguration (JWT_SECRET missing)",
          });
        }

        // ❗ DEBUG: show secret prefix (safe)
        console.log(
          "[auth] Using JWT_SECRET starting with:",
          process.env.JWT_SECRET.slice(0, 6)
        );

        // ❗ THIS LINE IS WHERE YOUR 401 IS COMING FROM
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        ) as JwtPayload & {
          role: string;
          userId: mongoose.Types.ObjectId;
        };

        console.log("[auth] Token verified successfully");

        req.user = decoded;

        // ❗ DEBUG: show decoded payload (safe fields)
        console.log("[auth] Decoded payload:", {
          userId: decoded.userId,
          role: decoded.role,
          exp: decoded.exp,
        });

        if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
          console.warn("[auth] Role forbidden:", req.user.role);
          return res.status(403).json({
            message: "[Msg]Access Denied: Insufficient Permissions",
          });
        }
      }

      next();
    } catch (err: any) {
      // ❗ THIS IS THE MOST IMPORTANT LOG
      console.error(
        "[auth] jwt.verify FAILED:",
        err?.name,
        err?.message
      );

      return res.status(401).json({
        message: "[Msg]Token is Not Valid",
      });
    }
  };
};

export default authMiddleware;

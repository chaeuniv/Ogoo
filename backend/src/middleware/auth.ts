import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorResponse } from "../lib/response";

export interface AuthPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    errorResponse(res, 401, "UNAUTHORIZED", "인증 토큰이 없습니다.");
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    const userId = Number(payload.sub ?? payload.userId);
    if (!userId || isNaN(userId)) {
      errorResponse(res, 401, "UNAUTHORIZED", "유효하지 않은 토큰입니다.");
      return;
    }
    req.user = { userId };
    next();
  } catch {
    errorResponse(res, 401, "UNAUTHORIZED", "유효하지 않은 토큰입니다.");
  }
}

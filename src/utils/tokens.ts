import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env";

export type AccessClaims = { sub: string; role: UserRole; typ: "access" };
export type RefreshClaims = { sub: string; sid: string; typ: "refresh" };

export function createAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role, typ: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}
export function createRefreshToken(userId: string, sessionId: string): string {
  return jwt.sign({ sub: userId, sid: sessionId, typ: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_DAYS}d`
  });
}
export function verifyAccessToken(token: string): AccessClaims {
  const value = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof value === "string" || value.typ !== "access" || typeof value.sub !== "string" ||
      (value.role !== "USER" && value.role !== "ADMIN")) {
    throw new Error("Invalid access token");
  }
  return value as AccessClaims;
}
export function verifyRefreshToken(token: string): RefreshClaims {
  const value = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof value === "string" || value.typ !== "refresh" || typeof value.sub !== "string" ||
      typeof value.sid !== "string") {
    throw new Error("Invalid refresh token");
  }
  return value as RefreshClaims;
}
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
export function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}
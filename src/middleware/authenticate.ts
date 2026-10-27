import type { RequestHandler } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/tokens";
import { HttpError } from "../utils/http-error";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "A bearer access token is required", "UNAUTHENTICATED");
    }

    const token = header.slice("Bearer ".length).trim();
    const claims = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, role: true, status: true, passwordChangedAt: true }
    });

    if (!user || user.status !== "ACTIVE") {
      throw new HttpError(401, "Account is unavailable", "UNAUTHENTICATED");
    }

    // Role is read from the database so a stale JWT role cannot grant permissions.
    req.auth = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    return next(new HttpError(401, "Invalid or expired access token", "UNAUTHENTICATED"));
  }
};
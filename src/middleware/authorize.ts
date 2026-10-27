import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { HttpError } from "../utils/http-error";

export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new HttpError(401, "Please log in", "UNAUTHENTICATED"));
    if (!allowedRoles.includes(req.auth.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action", "FORBIDDEN"));
    }
    next();
  };
}
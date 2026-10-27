import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../utils/http-error";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, "Request body validation failed", "VALIDATION_ERROR"));
      return;
    }
    req.body = result.data;
    next();
  };
}
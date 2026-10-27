import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(12, "Password must be at least 12 characters").max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
}).strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
}).strict();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional()
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password
}).strict();
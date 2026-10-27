import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema, refreshSchema } from "../validators/auth.validators";

const controller = new AuthController();
export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), controller.register);
authRoutes.post("/login", validateBody(loginSchema), controller.login);
authRoutes.post("/refresh", validateBody(refreshSchema), controller.refresh);
authRoutes.post("/logout", validateBody(refreshSchema.partial()), controller.logout);
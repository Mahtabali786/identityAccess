import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody } from "../middleware/validate";
import { updateProfileSchema, changePasswordSchema } from "../validators/auth.validators";
import { z } from "zod";

const controller = new UserController();
export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/me", controller.me);
userRoutes.patch("/me", validateBody(updateProfileSchema), controller.updateMe);
userRoutes.patch("/me/password", validateBody(changePasswordSchema), controller.changePassword);
userRoutes.get("/", authorize("ADMIN"), controller.listUsers);
userRoutes.patch("/:id/status", authorize("ADMIN"), validateBody(z.object({
  status: z.enum(["ACTIVE", "DISABLED"])
}).strict()), controller.setStatus);
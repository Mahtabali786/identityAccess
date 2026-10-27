import type { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { asyncHandler } from "../utils/async-handler";

const service = new UserService();

export class UserController {
  me = asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await service.getMe(req.auth!.userId) });
  });

  updateMe = asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await service.updateMe(req.auth!.userId, req.body.name) });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: await service.changePassword(req.auth!.userId, req.body.currentPassword, req.body.newPassword) });
  });

  listUsers = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ data: await service.listUsers() });
  });

  setStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = req.body.status as "ACTIVE" | "DISABLED";
    res.json({ data: await service.setUserStatus(req.auth!.userId, req.params.id, status) });
  });
}
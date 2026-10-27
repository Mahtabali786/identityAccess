import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/async-handler";

const service = new AuthService();

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.register(req.body);
    res.status(201).json({ data: result });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.login(req.body);
    res.status(200).json({ data: result });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.refresh(req.body.refreshToken);
    res.status(200).json({ data: result });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await service.logout(req.body?.refreshToken);
    res.status(200).json({ data: { message: "Logged out" } });
  });
}
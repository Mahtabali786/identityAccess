import bcrypt from "bcrypt";
import { AuthRepository } from "../repositories/auth.repository";
import { UserRepository } from "../repositories/user.repository";
import { HttpError } from "../utils/http-error";
import { env } from "../config/env";
import { writeAuditEvent } from "../utils/audit";

const users = new UserRepository();
const auth = new AuthRepository();

export class UserService {
  async getMe(userId: string) {
    const user = await users.findPublicById(userId);
    if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
    return user;
  }

  async updateMe(userId: string, name: string) {
    const user = await users.updateName(userId, name);
    await writeAuditEvent({ actorId: userId, action: "USER_PROFILE_UPDATED", targetType: "User", targetId: userId });
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await users.findForPasswordChange(userId);
    if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect", "CURRENT_PASSWORD_INVALID");
    }
    if (currentPassword === newPassword) {
      throw new HttpError(400, "New password must be different", "PASSWORD_UNCHANGED");
    }
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await users.updatePassword(userId, passwordHash);
    await auth.revokeAllRefreshSessions(userId);
    await writeAuditEvent({ actorId: userId, action: "USER_PASSWORD_CHANGED", targetType: "User", targetId: userId });
    return { message: "Password changed. Please log in again on all devices." };
  }

  listUsers() { return users.listUsers(); }

  async setUserStatus(actorId: string, targetId: string, status: "ACTIVE" | "DISABLED") {
    if (actorId === targetId && status === "DISABLED") {
      throw new HttpError(400, "You cannot disable your own account", "SELF_DISABLE_NOT_ALLOWED");
    }
    const user = await users.setStatus(targetId, status);
    await writeAuditEvent({ actorId, action: "ADMIN_USER_STATUS_CHANGED", targetType: "User", targetId, metadata: { status } });
    return user;
  }
}
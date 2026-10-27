import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { UserStatus } from "@prisma/client";
import { AuthRepository } from "../repositories/auth.repository";
import { HttpError } from "../utils/http-error";
import { createAccessToken, createRefreshToken, hashToken, refreshExpiry, verifyRefreshToken } from "../utils/tokens";
import { env } from "../config/env";
import { writeAuditEvent } from "../utils/audit";

const repository = new AuthRepository();

function publicUser(user: { id: string; name: string; email: string; role: "USER" | "ADMIN"; status: UserStatus; createdAt: Date }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt };
}

async function issueTokens(user: { id: string; role: "USER" | "ADMIN" }) {
  const sessionId = crypto.randomUUID();
  const refreshToken = createRefreshToken(user.id, sessionId);
  await repository.createRefreshSession({
    id: sessionId, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiry()
  });
  return { accessToken: createAccessToken(user.id, user.role), refreshToken };
}

export class AuthService {
  async register(input: { name: string; email: string; password: string }) {
    const existing = await repository.findUserByEmail(input.email);
    if (existing) throw new HttpError(409, "An account with this email already exists", "EMAIL_EXISTS");
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
    const user = await repository.createUser({ name: input.name, email: input.email, passwordHash });
    await writeAuditEvent({ actorId: user.id, action: "AUTH_REGISTER", targetType: "User", targetId: user.id });
    const tokens = await issueTokens(user);
    return { user, ...tokens };
  }

  async login(input: { email: string; password: string }) {
    const user = await repository.findUserByEmail(input.email);
    const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !valid || user.status !== "ACTIVE") {
      throw new HttpError(401, "Email or password is incorrect", "INVALID_CREDENTIALS");
    }
    const tokens = await issueTokens(user);
    await writeAuditEvent({ actorId: user.id, action: "AUTH_LOGIN", targetType: "User", targetId: user.id });
    return { user: publicUser(user), ...tokens };
  }

  async refresh(rawToken: string) {
    let claims;
    try { claims = verifyRefreshToken(rawToken); }
    catch { throw new HttpError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN"); }

    const session = await repository.findRefreshSession(claims.sid);
    if (!session || session.userId !== claims.sub || session.revokedAt ||
        session.expiresAt <= new Date() || session.tokenHash !== hashToken(rawToken) ||
        session.user.status !== "ACTIVE") {
      throw new HttpError(401, "Refresh session is no longer valid", "INVALID_REFRESH_TOKEN");
    }

    // Rotate refresh tokens: a used token is revoked before a replacement is issued.
    await repository.revokeRefreshSession(session.id);
    const tokens = await issueTokens(session.user);
    return { user: publicUser(session.user), ...tokens };
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    try {
      const claims = verifyRefreshToken(rawToken);
      const session = await repository.findRefreshSession(claims.sid);
      if (session && session.tokenHash === hashToken(rawToken)) {
        await repository.revokeRefreshSession(session.id);
        await writeAuditEvent({ actorId: claims.sub, action: "AUTH_LOGOUT", targetType: "User", targetId: claims.sub });
      }
    } catch {
      // Logout remains idempotent for missing, malformed, or expired refresh tokens.
    }
  }
}
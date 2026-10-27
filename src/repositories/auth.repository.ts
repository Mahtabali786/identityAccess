import { prisma } from "../db/prisma";

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  createUser(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
    });
  }

  createRefreshSession(data: { id: string; userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshSession.create({ data });
  }

  findRefreshSession(id: string) {
    return prisma.refreshSession.findUnique({ where: { id }, include: { user: true } });
  }

  revokeRefreshSession(id: string) {
    return prisma.refreshSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  revokeAllRefreshSessions(userId: string) {
    return prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
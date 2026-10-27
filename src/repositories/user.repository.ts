import { prisma } from "../db/prisma";

export class UserRepository {
  findPublicById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true }
    });
  }

  updateName(id: string, name: string) {
    return prisma.user.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true }
    });
  }

  findForPasswordChange(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true }
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() }
    });
  }

  listUsers() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async setStatus(id: string, status: "ACTIVE" | "DISABLED") {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id }, data: { status },
        select: { id: true, name: true, email: true, role: true, status: true }
      });
      if (status === "DISABLED") {
        await tx.refreshSession.updateMany({
          where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() }
        });
      }
      return user;
    });
  }
}
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export async function writeAuditEvent(input: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  // Audit logging should not include passwords, raw tokens, or other secrets.
  return prisma.auditEvent.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata
    }
  });
}
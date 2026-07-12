import { prisma } from "./db";

export async function logActivity(userId: string, action: string, target: string, detail?: string) {
  await prisma.activityLog.create({
    data: { userId, action, target, detail },
  });
}

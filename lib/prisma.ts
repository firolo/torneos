import { PrismaClient } from "@prisma/client";

// En desarrollo, Next.js recarga módulos constantemente. Guardamos una única
// instancia en globalThis para no abrir una conexión nueva en cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

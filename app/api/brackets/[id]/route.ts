import { prisma } from "@/lib/prisma";
import { NO_ENCONTRADO, esErrorPrisma } from "@/lib/errores";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;

  const bracket = await prisma.bracket.findUnique({
    where: { id },
    include: {
      competencia: true,
      combates: {
        orderBy: [{ ronda: "asc" }, { posicion: "asc" }],
        include: {
          competidorA: { include: { participante: true } },
          competidorB: { include: { participante: true } },
        },
      },
    },
  });

  if (!bracket) return NO_ENCONTRADO("El bracket");
  return Response.json(bracket);
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { id } = await params;
  try {
    // Los combates se borran en cascada (ver onDelete en el esquema)
    await prisma.bracket.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return NO_ENCONTRADO("El bracket");
    throw e;
  }
}

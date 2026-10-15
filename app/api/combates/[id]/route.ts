import { prisma } from "@/lib/prisma";
import { NO_ENCONTRADO, leerJson, respuestaErrores } from "@/lib/errores";
import { resultadoCombateSchema } from "@/lib/validaciones";

type Contexto = { params: Promise<{ id: string }> };

/**
 * Carga (o borra) el resultado de un combate.
 *
 * Al cargar un ganador, éste se coloca automáticamente en el combate
 * siguiente. Al borrar el resultado, se limpia también la rama que quedó
 * aguas abajo, porque ya no es válida.
 */
export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;

  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = resultadoCombateSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }
  const { ganadorId, metodo, rondas, observaciones } = parseo.data;

  const combate = await prisma.combate.findUnique({
    where: { id },
    include: { bracket: true },
  });
  if (!combate) return NO_ENCONTRADO("El combate");

  if (ganadorId !== null) {
    if (ganadorId !== combate.competidorAId && ganadorId !== combate.competidorBId) {
      return respuestaErrores(["El ganador elegido no es uno de los competidores del combate"]);
    }
    if (!combate.competidorAId || !combate.competidorBId) {
      // Un combate con un solo competidor ya se resolvió como pase libre
      if (metodo !== "BYE" && metodo !== "AUSENCIA") {
        return respuestaErrores([
          "El combate todavía no tiene los dos competidores definidos",
        ]);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    if (ganadorId === null) {
      // Borrar el resultado y limpiar la rama siguiente
      await tx.combate.update({
        where: { id },
        data: { ganadorId: null, resultado: null, estado: "PENDIENTE" },
      });
      await limpiarAguasAbajo(tx, combate.combateSiguienteId, combate.ranuraSiguiente);
    } else {
      await tx.combate.update({
        where: { id },
        data: {
          ganadorId,
          estado: "FINALIZADO",
          resultado: { rondas, metodo, observaciones },
        },
      });

      if (combate.combateSiguienteId !== null && combate.ranuraSiguiente !== null) {
        await tx.combate.update({
          where: { id: combate.combateSiguienteId },
          data:
            combate.ranuraSiguiente === 0
              ? { competidorAId: ganadorId }
              : { competidorBId: ganadorId },
        });
      }
    }

    await recalcularEstadoBracket(tx, combate.bracketId);
  });

  const actualizado = await prisma.combate.findUnique({
    where: { id },
    include: {
      competidorA: { include: { participante: true } },
      competidorB: { include: { participante: true } },
    },
  });

  return Response.json(actualizado);
}

type ClienteTransaccion = {
  combate: {
    findUnique(args: {
      where: { id: string };
    }): PromiseLike<{
      id: string;
      ganadorId: string | null;
      combateSiguienteId: string | null;
      ranuraSiguiente: number | null;
    } | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): PromiseLike<unknown>;
    count(args: { where: Record<string, unknown> }): PromiseLike<number>;
    findFirst(args: {
      where: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }): PromiseLike<{ estado: string } | null>;
  };
  bracket: {
    update(args: { where: { id: string }; data: Record<string, unknown> }): PromiseLike<unknown>;
  };
};

/**
 * Deja vacante la ranura que alimentaba este combate y, si ese combate ya
 * tenía un resultado cargado, lo borra y sigue limpiando hacia la final.
 */
async function limpiarAguasAbajo(
  tx: ClienteTransaccion,
  combateSiguienteId: string | null,
  ranuraSiguiente: number | null,
): Promise<void> {
  let idActual = combateSiguienteId;
  let ranuraActual = ranuraSiguiente;
  let vueltas = 0;

  while (idActual !== null && ranuraActual !== null && vueltas < 32) {
    vueltas++;

    const siguiente = await tx.combate.findUnique({ where: { id: idActual } });
    if (!siguiente) return;

    const teniaResultado = siguiente.ganadorId !== null;

    await tx.combate.update({
      where: { id: idActual },
      data: {
        ...(ranuraActual === 0 ? { competidorAId: null } : { competidorBId: null }),
        ...(teniaResultado ? { ganadorId: null, resultado: null, estado: "PENDIENTE" } : {}),
      },
    });

    if (!teniaResultado) return;

    idActual = siguiente.combateSiguienteId;
    ranuraActual = siguiente.ranuraSiguiente;
  }
}

/** ARMADO si no hay nada cargado, FINALIZADO si la final ya tiene ganador. */
async function recalcularEstadoBracket(
  tx: ClienteTransaccion,
  bracketId: string,
): Promise<void> {
  const final = await tx.combate.findFirst({
    where: { bracketId, combateSiguienteId: null },
    orderBy: { ronda: "desc" },
  });

  if (final?.estado === "FINALIZADO") {
    await tx.bracket.update({ where: { id: bracketId }, data: { estado: "FINALIZADO" } });
    return;
  }

  const finalizados = await tx.combate.count({
    where: { bracketId, estado: "FINALIZADO" },
  });

  await tx.bracket.update({
    where: { id: bracketId },
    data: { estado: finalizados > 0 ? "EN_CURSO" : "ARMADO" },
  });
}

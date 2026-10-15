import { prisma } from "@/lib/prisma";
import { leerJson, respuestaErrores } from "@/lib/errores";
import { generarCombates } from "@/lib/bracket";
import { bracketSchema } from "@/lib/validaciones";

export async function GET(request: Request) {
  const competenciaId = new URL(request.url).searchParams.get("competenciaId");

  const brackets = await prisma.bracket.findMany({
    where: competenciaId ? { competenciaId } : undefined,
    orderBy: { creadoEn: "desc" },
    include: {
      competencia: true,
      _count: { select: { combates: true } },
    },
  });
  return Response.json(brackets);
}

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = bracketSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }
  const { competenciaId, nombre, inscripcionIds, mezclar } = parseo.data;

  const competencia = await prisma.competencia.findUnique({ where: { id: competenciaId } });
  if (!competencia) return respuestaErrores(["La competencia no existe"], 404);

  // Inscripciones candidatas: confirmadas de esa competencia
  let inscripciones = await prisma.inscripcion.findMany({
    where: { competenciaId, estado: "CONFIRMADA" },
    include: { participante: true },
  });

  if (inscripcionIds && inscripcionIds.length > 0) {
    const elegidas = new Set(inscripcionIds);
    inscripciones = inscripciones.filter((i) => elegidas.has(i.id));
  }

  if (inscripciones.length < 2) {
    return respuestaErrores([
      "Se necesitan al menos 2 inscripciones confirmadas para armar un bracket",
    ]);
  }

  // Un participante no puede estar en dos brackets de la misma competencia
  const yaEnBracket = await prisma.combate.findMany({
    where: {
      bracket: { competenciaId },
      OR: [
        { competidorAId: { in: inscripciones.map((i) => i.id) } },
        { competidorBId: { in: inscripciones.map((i) => i.id) } },
      ],
    },
    include: {
      bracket: true,
      competidorA: { include: { participante: true } },
      competidorB: { include: { participante: true } },
    },
  });

  if (yaEnBracket.length > 0) {
    const elegidas = new Set(inscripciones.map((i) => i.id));
    const nombres = new Set<string>();
    for (const combate of yaEnBracket) {
      for (const lado of [combate.competidorA, combate.competidorB]) {
        if (lado && elegidas.has(lado.id)) {
          nombres.add(`${lado.participante.apellido}, ${lado.participante.nombre}`);
        }
      }
    }
    return respuestaErrores([
      `Estos participantes ya están en otro bracket de esta competencia: ${[...nombres].join("; ")}.`,
    ]);
  }

  // Orden de siembra: al azar, o alfabético por apellido y nombre
  const ordenadas = mezclar
    ? mezclarArreglo(inscripciones)
    : [...inscripciones].sort((a, b) =>
        `${a.participante.apellido} ${a.participante.nombre}`.localeCompare(
          `${b.participante.apellido} ${b.participante.nombre}`,
          "es",
        ),
      );

  const planos = generarCombates(ordenadas.map((i) => i.id));
  const rondasDescendentes = [...new Set(planos.map((p) => p.ronda))].sort((a, b) => b - a);

  const bracket = await prisma.$transaction(async (tx) => {
    const creado = await tx.bracket.create({
      data: { competenciaId, nombre, tipo: "ELIMINACION_SIMPLE" },
    });

    // Se crean de la final hacia atrás, así el combate siguiente ya existe
    const idPorPosicion = new Map<string, string>();

    for (const ronda of rondasDescendentes) {
      for (const plano of planos.filter((p) => p.ronda === ronda)) {
        const siguienteId =
          plano.posicionSiguiente === null
            ? null
            : (idPorPosicion.get(`${ronda + 1}-${plano.posicionSiguiente}`) ?? null);

        const combate = await tx.combate.create({
          data: {
            bracketId: creado.id,
            ronda: plano.ronda,
            posicion: plano.posicion,
            competidorAId: plano.competidorAId,
            competidorBId: plano.competidorBId,
            combateSiguienteId: siguienteId,
            ranuraSiguiente: plano.ranuraSiguiente,
          },
        });
        idPorPosicion.set(`${ronda}-${plano.posicion}`, combate.id);
      }
    }

    // Pases libres: si un combate de la primera ronda tiene un solo competidor,
    // ese competidor avanza automáticamente.
    for (const plano of planos.filter((p) => p.ronda === 1)) {
      const soloA = plano.competidorAId && !plano.competidorBId;
      const soloB = plano.competidorBId && !plano.competidorAId;
      if (!soloA && !soloB) continue;

      const ganadorId = (plano.competidorAId ?? plano.competidorBId) as string;
      const idCombate = idPorPosicion.get(`1-${plano.posicion}`);
      if (!idCombate) continue;

      await tx.combate.update({
        where: { id: idCombate },
        data: {
          ganadorId,
          estado: "FINALIZADO",
          resultado: { rondas: [], metodo: "BYE", observaciones: null },
        },
      });

      if (plano.posicionSiguiente !== null) {
        const siguienteId = idPorPosicion.get(`2-${plano.posicionSiguiente}`);
        if (siguienteId) {
          await tx.combate.update({
            where: { id: siguienteId },
            data:
              plano.ranuraSiguiente === 0
                ? { competidorAId: ganadorId }
                : { competidorBId: ganadorId },
          });
        }
      }
    }

    return creado;
  });

  return Response.json(bracket, { status: 201 });
}

/** Mezcla al azar una copia del arreglo (Fisher-Yates). */
function mezclarArreglo<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

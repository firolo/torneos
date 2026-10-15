import { prisma } from "@/lib/prisma";
import { NO_ENCONTRADO, esErrorPrisma, leerJson, respuestaErrores } from "@/lib/errores";
import { revisarInscripciones } from "@/lib/inscripciones";
import { participanteSchema } from "@/lib/validaciones";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const participante = await prisma.participante.findUnique({
    where: { id },
    include: { inscripciones: { include: { competencia: true } } },
  });
  if (!participante) return NO_ENCONTRADO("El participante");
  return Response.json(participante);
}

export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;

  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = participanteSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }
  const datos = parseo.data;

  const existente = await prisma.participante.findUnique({
    where: { id },
    include: { inscripciones: true },
  });
  if (!existente) return NO_ENCONTRADO("El participante");

  const revision = await revisarInscripciones(datos.inscripciones);
  if ("errores" in revision) return respuestaErrores(revision.errores);

  // Inscripciones que el usuario quitó del formulario
  const competenciasNuevas = new Set(revision.inscripciones.map((i) => i.competenciaId));
  const aQuitar = existente.inscripciones.filter(
    (i) => !competenciasNuevas.has(i.competenciaId),
  );

  // No se puede quitar una inscripción que ya está colocada en un bracket
  if (aQuitar.length > 0) {
    const enUso = await prisma.combate.findMany({
      where: {
        OR: [
          { competidorAId: { in: aQuitar.map((i) => i.id) } },
          { competidorBId: { in: aQuitar.map((i) => i.id) } },
        ],
      },
      include: { bracket: true },
    });
    if (enUso.length > 0) {
      const nombres = [...new Set(enUso.map((c) => c.bracket.nombre))].join(", ");
      return respuestaErrores([
        `No se puede quitar la inscripción: el participante ya está colocado en el bracket "${nombres}". Primero hay que quitarlo de ese bracket.`,
      ]);
    }
  }

  try {
    const participante = await prisma.$transaction(async (tx) => {
      if (aQuitar.length > 0) {
        await tx.inscripcion.deleteMany({ where: { id: { in: aQuitar.map((i) => i.id) } } });
      }

      for (const inscripcion of revision.inscripciones) {
        await tx.inscripcion.upsert({
          where: {
            participanteId_competenciaId: {
              participanteId: id,
              competenciaId: inscripcion.competenciaId,
            },
          },
          create: {
            participanteId: id,
            competenciaId: inscripcion.competenciaId,
            categoria: inscripcion.categoria,
            estado: inscripcion.estado,
            respuestas: inscripcion.respuestas as object,
          },
          update: {
            categoria: inscripcion.categoria,
            estado: inscripcion.estado,
            respuestas: inscripcion.respuestas as object,
          },
        });
      }

      return tx.participante.update({
        where: { id },
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          documento: datos.documento,
          fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
          genero: datos.genero,
          clubEscuela: datos.clubEscuela,
          contacto: datos.contacto,
        },
        include: { inscripciones: true },
      });
    });

    return Response.json(participante);
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) {
      return respuestaErrores(["Ya existe un participante con ese documento"], 409);
    }
    if (esErrorPrisma(e, "P2025")) return NO_ENCONTRADO("El participante");
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { id } = await params;

  const inscripciones = await prisma.inscripcion.findMany({
    where: { participanteId: id },
    select: { id: true },
  });

  if (inscripciones.length > 0) {
    const enUso = await prisma.combate.count({
      where: {
        OR: [
          { competidorAId: { in: inscripciones.map((i) => i.id) } },
          { competidorBId: { in: inscripciones.map((i) => i.id) } },
        ],
      },
    });
    if (enUso > 0) {
      return respuestaErrores([
        "No se puede eliminar: el participante ya está colocado en un bracket.",
      ]);
    }
  }

  try {
    await prisma.participante.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return NO_ENCONTRADO("El participante");
    throw e;
  }
}

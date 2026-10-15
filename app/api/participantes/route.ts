import { prisma } from "@/lib/prisma";
import { esErrorPrisma, leerJson, respuestaErrores } from "@/lib/errores";
import { revisarInscripciones } from "@/lib/inscripciones";
import { participanteSchema } from "@/lib/validaciones";

export async function GET() {
  const participantes = await prisma.participante.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: { inscripciones: { include: { competencia: true } } },
  });
  return Response.json(participantes);
}

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = participanteSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }
  const datos = parseo.data;

  const revision = await revisarInscripciones(datos.inscripciones);
  if ("errores" in revision) return respuestaErrores(revision.errores);

  try {
    const participante = await prisma.participante.create({
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        documento: datos.documento,
        fechaNacimiento: datos.fechaNacimiento ? new Date(datos.fechaNacimiento) : null,
        genero: datos.genero,
        clubEscuela: datos.clubEscuela,
        contacto: datos.contacto,
        inscripciones: {
          create: revision.inscripciones.map((i) => ({
            competenciaId: i.competenciaId,
            categoria: i.categoria,
            estado: i.estado,
            respuestas: i.respuestas as object,
          })),
        },
      },
      include: { inscripciones: true },
    });
    return Response.json(participante, { status: 201 });
  } catch (e) {
    if (esErrorPrisma(e, "P2002")) {
      return respuestaErrores(["Ya existe un participante con ese documento"], 409);
    }
    throw e;
  }
}

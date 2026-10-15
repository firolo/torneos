import { prisma } from "@/lib/prisma";
import { NO_ENCONTRADO, esErrorPrisma, leerJson, respuestaErrores } from "@/lib/errores";
import { competenciaSchema } from "@/lib/validaciones";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const competencia = await prisma.competencia.findUnique({ where: { id } });
  if (!competencia) return NO_ENCONTRADO("La competencia");
  return Response.json(competencia);
}

export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;

  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = competenciaSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }

  try {
    const competencia = await prisma.competencia.update({
      where: { id },
      data: parseo.data,
    });
    return Response.json(competencia);
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return NO_ENCONTRADO("La competencia");
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { id } = await params;

  // No se borra una competencia que ya tiene inscriptos o brackets armados
  const [inscriptos, brackets] = await Promise.all([
    prisma.inscripcion.count({ where: { competenciaId: id } }),
    prisma.bracket.count({ where: { competenciaId: id } }),
  ]);

  if (inscriptos > 0 || brackets > 0) {
    const motivos: string[] = [];
    if (inscriptos > 0) motivos.push(`${inscriptos} participante(s) inscripto(s)`);
    if (brackets > 0) motivos.push(`${brackets} bracket(s) armado(s)`);
    return respuestaErrores([
      `No se puede eliminar la competencia porque tiene ${motivos.join(" y ")}.`,
    ]);
  }

  try {
    await prisma.competencia.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    if (esErrorPrisma(e, "P2025")) return NO_ENCONTRADO("La competencia");
    throw e;
  }
}

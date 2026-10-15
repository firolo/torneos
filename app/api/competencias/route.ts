import { prisma } from "@/lib/prisma";
import { leerJson, respuestaErrores } from "@/lib/errores";
import { competenciaSchema } from "@/lib/validaciones";

export async function GET() {
  const competencias = await prisma.competencia.findMany({
    orderBy: { creadoEn: "desc" },
  });
  return Response.json(competencias);
}

export async function POST(request: Request) {
  const cuerpo = await leerJson(request);
  if (cuerpo === null) {
    return respuestaErrores(["El cuerpo de la solicitud no es JSON válido"]);
  }

  const parseo = competenciaSchema.safeParse(cuerpo);
  if (!parseo.success) {
    return respuestaErrores(parseo.error.issues.map((i) => i.message));
  }

  const competencia = await prisma.competencia.create({ data: parseo.data });
  return Response.json(competencia, { status: 201 });
}

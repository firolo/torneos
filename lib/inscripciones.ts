import { prisma } from "./prisma";
import { validarRespuestas, type CampoRequerido, type InscripcionInput } from "./validaciones";

export type InscripcionParaGuardar = {
  competenciaId: string;
  categoria: string | null;
  estado: "PENDIENTE" | "CONFIRMADA";
  respuestas: Record<string, unknown>;
};

/**
 * Comprueba que las competencias existan y que las respuestas a sus campos
 * requeridos sean válidas. Devuelve las inscripciones normalizadas y listas
 * para guardar, o la lista de errores para mostrar al usuario.
 */
export async function revisarInscripciones(
  inscripciones: InscripcionInput[],
): Promise<{ errores: string[] } | { inscripciones: InscripcionParaGuardar[] }> {
  if (inscripciones.length === 0) return { inscripciones: [] };

  const competencias = await prisma.competencia.findMany({
    where: { id: { in: inscripciones.map((i) => i.competenciaId) } },
  });
  const porId = new Map(competencias.map((c) => [c.id, c]));

  const errores: string[] = [];
  const listas: InscripcionParaGuardar[] = [];

  for (const inscripcion of inscripciones) {
    const competencia = porId.get(inscripcion.competenciaId);
    if (!competencia) {
      errores.push("Una de las competencias elegidas no existe");
      continue;
    }
    if (competencia.estado === "FINALIZADA") {
      errores.push(`La competencia "${competencia.nombre}" ya está finalizada`);
      continue;
    }

    const camposCrudos = competencia.camposRequeridos as unknown;
    const campos: CampoRequerido[] = Array.isArray(camposCrudos)
      ? (camposCrudos as CampoRequerido[])
      : [];

    const { errores: erroresCampos, valores } = validarRespuestas(
      campos,
      inscripcion.respuestas,
      competencia.nombre,
    );
    errores.push(...erroresCampos);

    listas.push({
      competenciaId: inscripcion.competenciaId,
      categoria: inscripcion.categoria,
      estado: inscripcion.estado,
      respuestas: valores,
    });
  }

  return errores.length > 0 ? { errores } : { inscripciones: listas };
}

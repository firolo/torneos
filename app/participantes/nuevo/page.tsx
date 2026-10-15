import Link from "next/link";
import FormularioParticipante from "@/components/FormularioParticipante";
import { prisma } from "@/lib/prisma";
import type { CampoRequerido } from "@/lib/validaciones";
import type { CompetenciaParaFormulario } from "@/components/FormularioParticipante";

export const dynamic = "force-dynamic";

export default async function NuevoParticipante() {
  const competencias = await prisma.competencia.findMany({
    where: { estado: { in: ["BORRADOR", "ABIERTA", "CERRADA"] } },
    orderBy: { nombre: "asc" },
  });

  const paraFormulario: CompetenciaParaFormulario[] = competencias.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: c.tipo,
    estado: c.estado,
    camposRequeridos: (Array.isArray(c.camposRequeridos)
      ? c.camposRequeridos
      : []) as unknown as CampoRequerido[],
  }));

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Nuevo participante</h1>
      </div>

      {paraFormulario.length === 0 && (
        <div className="errores">
          No hay competencias disponibles. Primero{" "}
          <Link href="/competencias/nueva">creá una competencia</Link>.
        </div>
      )}

      <FormularioParticipante competencias={paraFormulario} />
    </main>
  );
}

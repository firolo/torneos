import { notFound } from "next/navigation";
import FormularioCompetencia from "@/components/FormularioCompetencia";
import { prisma } from "@/lib/prisma";
import type { CampoRequerido } from "@/lib/validaciones";

export const dynamic = "force-dynamic";

export default async function EditarCompetencia({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const competencia = await prisma.competencia.findUnique({ where: { id } });
  if (!competencia) notFound();

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Editar competencia</h1>
      </div>
      <FormularioCompetencia
        competencia={{
          id: competencia.id,
          nombre: competencia.nombre,
          tipo: competencia.tipo,
          descripcion: competencia.descripcion,
          estado: competencia.estado,
          camposRequeridos: competencia.camposRequeridos as unknown as CampoRequerido[],
        }}
      />
    </main>
  );
}

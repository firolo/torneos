import { notFound } from "next/navigation";
import FormularioParticipante, {
  type CompetenciaParaFormulario,
} from "@/components/FormularioParticipante";
import { prisma } from "@/lib/prisma";
import type { CampoRequerido } from "@/lib/validaciones";

export const dynamic = "force-dynamic";

function aFechaInput(fecha: Date | null): string | null {
  if (!fecha) return null;
  return fecha.toISOString().slice(0, 10);
}

export default async function EditarParticipante({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [participante, competencias] = await Promise.all([
    prisma.participante.findUnique({
      where: { id },
      include: { inscripciones: true },
    }),
    prisma.competencia.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  if (!participante) notFound();

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
        <h1>Editar participante</h1>
      </div>
      <FormularioParticipante
        competencias={paraFormulario}
        participante={{
          id: participante.id,
          nombre: participante.nombre,
          apellido: participante.apellido,
          documento: participante.documento,
          fechaNacimiento: aFechaInput(participante.fechaNacimiento),
          genero: participante.genero,
          clubEscuela: participante.clubEscuela,
          contacto: participante.contacto,
          inscripciones: participante.inscripciones.map((i) => ({
            competenciaId: i.competenciaId,
            categoria: i.categoria,
            estado: i.estado,
            respuestas: (i.respuestas ?? {}) as Record<string, unknown>,
          })),
        }}
      />
    </main>
  );
}

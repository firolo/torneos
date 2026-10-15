import Link from "next/link";
import CreadorBracket, {
  type CompetenciaConInscriptos,
} from "@/components/CreadorBracket";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NuevoBracket() {
  const competencias = await prisma.competencia.findMany({
    orderBy: { nombre: "asc" },
    include: {
      inscripciones: {
        where: { estado: "CONFIRMADA" },
        include: { participante: true },
      },
      // Los combates ya armados sirven para saber qué inscriptos están ocupados
      brackets: {
        include: {
          combates: { select: { competidorAId: true, competidorBId: true } },
        },
      },
    },
  });

  const datos: CompetenciaConInscriptos[] = competencias.map((c) => {
    const ocupadas = new Set<string>();
    for (const bracket of c.brackets) {
      for (const combate of bracket.combates) {
        if (combate.competidorAId) ocupadas.add(combate.competidorAId);
        if (combate.competidorBId) ocupadas.add(combate.competidorBId);
      }
    }

    return {
      id: c.id,
      nombre: c.nombre,
      inscriptos: c.inscripciones
        .map((i) => ({
          id: i.id,
          nombre: `${i.participante.apellido}, ${i.participante.nombre}`,
          categoria: i.categoria,
          club: i.participante.clubEscuela,
          yaEnBracket: ocupadas.has(i.id),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    };
  });

  const hayInscriptosLibres = datos.some((c) =>
    c.inscriptos.some((i) => !i.yaEnBracket),
  );

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Nuevo bracket</h1>
      </div>

      {!hayInscriptosLibres && (
        <div className="errores">
          No hay inscripciones confirmadas disponibles. Cargá{" "}
          <Link href="/participantes/nuevo">participantes</Link> e inscribilos en una
          competencia.
        </div>
      )}

      <CreadorBracket competencias={datos} />
    </main>
  );
}

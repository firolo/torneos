import Link from "next/link";
import { notFound } from "next/navigation";
import AutoRefresco from "@/components/AutoRefresco";
import Tablero, { type CombateTablero } from "@/components/Tablero";
import { prisma } from "@/lib/prisma";
import { ETIQUETAS_ESTADO_BRACKET } from "@/lib/constantes";
import type { ResultadoCombateInput } from "@/lib/validaciones";

export const dynamic = "force-dynamic";

export default async function TableroBracket({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const bracket = await prisma.bracket.findUnique({
    where: { id },
    include: {
      competencia: true,
      combates: {
        orderBy: [{ ronda: "asc" }, { posicion: "asc" }],
        include: {
          competidorA: { include: { participante: true } },
          competidorB: { include: { participante: true } },
        },
      },
    },
  });

  if (!bracket) notFound();

  const combates: CombateTablero[] = bracket.combates.map((c) => ({
    id: c.id,
    ronda: c.ronda,
    posicion: c.posicion,
    estado: c.estado,
    ganadorId: c.ganadorId,
    competidorA: c.competidorA
      ? {
          id: c.competidorA.id,
          nombre: `${c.competidorA.participante.apellido}, ${c.competidorA.participante.nombre}`,
          club: c.competidorA.participante.clubEscuela,
        }
      : null,
    competidorB: c.competidorB
      ? {
          id: c.competidorB.id,
          nombre: `${c.competidorB.participante.apellido}, ${c.competidorB.participante.nombre}`,
          club: c.competidorB.participante.clubEscuela,
        }
      : null,
    resultado: (c.resultado ?? null) as ResultadoCombateInput | null,
  }));

  return (
    <main>
      <AutoRefresco segundos={15} />

      <div className="encabezado-pagina">
        <div>
          <h1>{bracket.nombre}</h1>
          <p className="ayuda" style={{ margin: 0 }}>
            {bracket.competencia.nombre} · {ETIQUETAS_ESTADO_BRACKET[bracket.estado]}
          </p>
        </div>
        <Link href="/panel" className="btn">
          Cambiar bracket
        </Link>
      </div>

      <Tablero combates={combates} />
    </main>
  );
}

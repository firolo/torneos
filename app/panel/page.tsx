import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETIQUETAS_ESTADO_BRACKET,
  ETIQUETAS_TIPO_COMPETENCIA,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function Panel() {
  const competencias = await prisma.competencia.findMany({
    orderBy: { nombre: "asc" },
    include: {
      brackets: {
        orderBy: { nombre: "asc" },
        include: { _count: { select: { combates: true } } },
      },
    },
  });

  const conBrackets = competencias.filter((c) => c.brackets.length > 0);

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Panel en vivo</h1>
      </div>

      {conBrackets.length === 0 ? (
        <div className="tarjeta">
          <p className="vacio">
            No hay brackets armados todavía. <Link href="/brackets/nuevo">Armá uno</Link> para
            poder cargar resultados.
          </p>
        </div>
      ) : (
        conBrackets.map((competencia) => (
          <div className="tarjeta" key={competencia.id}>
            <h2>
              {competencia.nombre}{" "}
              <span className="etiqueta">
                {ETIQUETAS_TIPO_COMPETENCIA[competencia.tipo]}
              </span>
            </h2>

            <div className="lista-brackets">
              {competencia.brackets.map((bracket) => (
                <Link className="tarjeta-bracket" href={`/panel/${bracket.id}`} key={bracket.id}>
                  <strong>{bracket.nombre}</strong>
                  <span className="ayuda">
                    {bracket._count.combates} combates ·{" "}
                    {ETIQUETAS_ESTADO_BRACKET[bracket.estado]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  );
}

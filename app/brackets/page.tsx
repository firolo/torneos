import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETIQUETAS_ESTADO_BRACKET,
  ETIQUETAS_TIPO_BRACKET,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function ListadoBrackets() {
  const brackets = await prisma.bracket.findMany({
    orderBy: { creadoEn: "desc" },
    include: {
      competencia: true,
      _count: { select: { combates: true } },
    },
  });

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Brackets</h1>
        <Link href="/brackets/nuevo" className="btn btn-primario">
          Nuevo bracket
        </Link>
      </div>

      <div className="tarjeta">
        {brackets.length === 0 ? (
          <p className="vacio">
            Todavía no hay brackets armados. Creá el primero a partir de una competencia con
            inscriptos.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bracket</th>
                <th>Competencia</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Combates</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brackets.map((b) => (
                <tr key={b.id}>
                  <td>{b.nombre}</td>
                  <td>{b.competencia.nombre}</td>
                  <td>{ETIQUETAS_TIPO_BRACKET[b.tipo]}</td>
                  <td>
                    <span className="etiqueta">{ETIQUETAS_ESTADO_BRACKET[b.estado]}</span>
                  </td>
                  <td>{b._count.combates}</td>
                  <td>
                    <Link href={`/brackets/${b.id}`}>Ver</Link>
                    {" · "}
                    <Link href={`/panel/${b.id}`}>Tablero</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

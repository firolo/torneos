import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminarBracket from "@/components/BotonEliminarBracket";
import { prisma } from "@/lib/prisma";
import { nombreRonda } from "@/lib/bracket";
import {
  ETIQUETAS_ESTADO_BRACKET,
  ETIQUETAS_TIPO_BRACKET,
} from "@/lib/constantes";

export const dynamic = "force-dynamic";

export default async function DetalleBracket({
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

  const totalRondas = bracket.combates.reduce((max, c) => Math.max(max, c.ronda), 1);
  const primeraRonda = bracket.combates.filter((c) => c.ronda === 1);

  const nombreDe = (lado: (typeof bracket.combates)[number]["competidorA"]) =>
    lado ? `${lado.participante.apellido}, ${lado.participante.nombre}` : "Pase libre";

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>{bracket.nombre}</h1>
        <Link href={`/panel/${bracket.id}`} className="btn btn-primario">
          Abrir tablero
        </Link>
      </div>

      <div className="tarjeta">
        <h2>Datos del bracket</h2>
        <dl className="datos">
          <div>
            <dt>Competencia</dt>
            <dd>{bracket.competencia.nombre}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{ETIQUETAS_TIPO_BRACKET[bracket.tipo]}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{ETIQUETAS_ESTADO_BRACKET[bracket.estado]}</dd>
          </div>
          <div>
            <dt>Rondas</dt>
            <dd>{totalRondas}</dd>
          </div>
          <div>
            <dt>Combates</dt>
            <dd>{bracket.combates.length}</dd>
          </div>
        </dl>
      </div>

      <div className="tarjeta">
        <h2>{nombreRonda(1, totalRondas)} — cruces iniciales</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Competidor A</th>
              <th>Competidor B</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {primeraRonda.map((combate) => (
              <tr key={combate.id}>
                <td>{combate.posicion + 1}</td>
                <td className={combate.competidorA ? undefined : "ayuda"}>
                  {nombreDe(combate.competidorA)}
                </td>
                <td className={combate.competidorB ? undefined : "ayuda"}>
                  {nombreDe(combate.competidorB)}
                </td>
                <td>
                  {combate.estado === "FINALIZADO" ? (
                    <span className="etiqueta">Resuelto</span>
                  ) : (
                    <span className="ayuda">Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ayuda">
          Los cruces se arman al crear el bracket. Para cambiarlos, hay que eliminar este
          bracket y volver a armarlo.
        </p>
      </div>

      <div className="acciones">
        <Link href="/brackets" className="btn">
          Volver al listado
        </Link>
        <span className="separador" />
        <BotonEliminarBracket id={bracket.id} nombre={bracket.nombre} />
      </div>
    </main>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [competencias, participantes, brackets] = await Promise.all([
    prisma.competencia.count(),
    prisma.participante.count(),
    prisma.bracket.count(),
  ]);

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Panel del torneo</h1>
      </div>

      <div className="tarjeta">
        <h2>Resumen</h2>
        <dl className="datos">
          <div>
            <dt>Competencias</dt>
            <dd>{competencias}</dd>
          </div>
          <div>
            <dt>Participantes</dt>
            <dd>{participantes}</dd>
          </div>
          <div>
            <dt>Brackets</dt>
            <dd>{brackets}</dd>
          </div>
        </dl>
      </div>

      <div className="tarjeta">
        <h2>Flujo de trabajo</h2>
        <ol>
          <li>
            <Link href="/competencias">Competencias</Link> — crear las pruebas y definir qué
            datos se piden a cada participante.
          </li>
          <li>
            <Link href="/participantes">Participantes</Link> — cargar los datos personales e
            inscribirlos en las competencias.
          </li>
          <li>
            <Link href="/brackets">Brackets</Link> — armar las llaves con los inscriptos
            confirmados.
          </li>
          <li>
            <Link href="/panel">Panel en vivo</Link> — durante el torneo, cargar los resultados
            de cada combate.
          </li>
        </ol>
        <p className="ayuda">
          Estado de la API: <a href="/api/health">/api/health</a>
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ListadoParticipantes() {
  const participantes = await prisma.participante.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: { inscripciones: { include: { competencia: true } } },
  });

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Participantes</h1>
        <Link href="/participantes/nuevo" className="btn btn-primario">
          Nuevo participante
        </Link>
      </div>

      <div className="tarjeta">
        {participantes.length === 0 ? (
          <p className="vacio">
            Todavía no hay participantes. Cargá el primero.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Apellido y nombre</th>
                <th>Documento</th>
                <th>Club / escuela</th>
                <th>Competencias</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.apellido}, {p.nombre}
                  </td>
                  <td>{p.documento}</td>
                  <td>{p.clubEscuela ?? "—"}</td>
                  <td>
                    {p.inscripciones.length === 0 ? (
                      <span className="ayuda">Sin inscripciones</span>
                    ) : (
                      p.inscripciones.map((i) => (
                        <span key={i.id} className="etiqueta" style={{ marginRight: 4 }}>
                          {i.competencia.nombre}
                        </span>
                      ))
                    )}
                  </td>
                  <td>
                    <Link href={`/participantes/${p.id}`}>Editar</Link>
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

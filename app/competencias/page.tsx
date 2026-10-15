import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ETIQUETAS_ESTADO_COMPETENCIA,
  ETIQUETAS_TIPO_COMPETENCIA,
} from "@/lib/constantes";

// Siempre consulta la base al cargar (no usar versión en caché)
export const dynamic = "force-dynamic";

export default async function ListadoCompetencias() {
  const competencias = await prisma.competencia.findMany({
    orderBy: { creadoEn: "desc" },
  });

  return (
    <main>
      <div className="encabezado-pagina">
        <h1>Competencias</h1>
        <Link href="/competencias/nueva" className="btn btn-primario">
          Nueva competencia
        </Link>
      </div>

      <div className="tarjeta">
        {competencias.length === 0 ? (
          <p className="vacio">Todavía no hay competencias. Creá la primera.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Datos requeridos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {competencias.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td>{ETIQUETAS_TIPO_COMPETENCIA[c.tipo]}</td>
                  <td>
                    <span className="etiqueta">
                      {ETIQUETAS_ESTADO_COMPETENCIA[c.estado]}
                    </span>
                  </td>
                  <td>{Array.isArray(c.camposRequeridos) ? c.camposRequeridos.length : 0}</td>
                  <td>
                    <Link href={`/competencias/${c.id}`}>Editar</Link>
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

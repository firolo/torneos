"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tamanoCuadro } from "@/lib/bracket";

export type InscriptoParaBracket = {
  id: string;
  nombre: string;
  categoria: string | null;
  club: string | null;
  yaEnBracket: boolean;
};

export type CompetenciaConInscriptos = {
  id: string;
  nombre: string;
  inscriptos: InscriptoParaBracket[];
};

export default function CreadorBracket({
  competencias,
}: {
  competencias: CompetenciaConInscriptos[];
}) {
  const router = useRouter();

  const [competenciaId, setCompetenciaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [mezclar, setMezclar] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const competencia = competencias.find((c) => c.id === competenciaId);
  const disponibles = useMemo(
    () => (competencia?.inscriptos ?? []).filter((i) => !i.yaEnBracket),
    [competencia],
  );

  function elegirCompetencia(id: string) {
    setCompetenciaId(id);
    const elegida = competencias.find((c) => c.id === id);
    // Por defecto entran todos los inscriptos que no estén ya en otro bracket
    setSeleccionados(
      new Set((elegida?.inscriptos ?? []).filter((i) => !i.yaEnBracket).map((i) => i.id)),
    );
    if (elegida && !nombre) setNombre(elegida.nombre);
  }

  function alternar(id: string) {
    setSeleccionados((actuales) => {
      const copia = new Set(actuales);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  const cantidad = seleccionados.size;
  const tamano = cantidad >= 2 ? tamanoCuadro(cantidad) : 0;
  const pasesLibres = tamano > 0 ? tamano - cantidad : 0;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    try {
      const respuesta = await fetch("/api/brackets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competenciaId,
          nombre,
          inscripcionIds: [...seleccionados],
          mezclar,
        }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setErrores(datos?.errores ?? ["No se pudo crear el bracket."]);
        return;
      }

      const bracket = await respuesta.json();
      router.push(`/brackets/${bracket.id}`);
      router.refresh();
    } catch {
      setErrores(["No hay conexión con el servidor. Intentá nuevamente."]);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={crear}>
      {errores.length > 0 && (
        <div className="errores" role="alert">
          <ul>
            {errores.map((mensaje, i) => (
              <li key={i}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="tarjeta">
        <h2>Competencia</h2>
        <div className="grupo">
          <label htmlFor="competencia">Competencia</label>
          <select
            id="competencia"
            value={competenciaId}
            onChange={(e) => elegirCompetencia(e.target.value)}
            required
          >
            <option value="">Elegir…</option>
            {competencias.map((c) => {
              const libres = c.inscriptos.filter((i) => !i.yaEnBracket).length;
              return (
                <option key={c.id} value={c.id} disabled={libres < 2}>
                  {c.nombre} ({libres} disponible{libres === 1 ? "" : "s"})
                </option>
              );
            })}
          </select>
        </div>

        <div className="grupo">
          <label htmlFor="nombre">Nombre del bracket</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej.: Shuai jiao -70 kg Sub 18"
            required
          />
          <p className="ayuda">
            Conviene que incluya la categoría, porque una competencia puede tener varios
            brackets.
          </p>
        </div>

        <label className="casilla">
          <input
            type="checkbox"
            checked={mezclar}
            onChange={(e) => setMezclar(e.target.checked)}
          />
          Sortear el orden de las llaves al azar
        </label>
        <p className="ayuda">
          Si lo desmarcás, el orden es alfabético por apellido, que es más previsible para
          revisar el cuadro impreso.
        </p>
      </div>

      {competencia && (
        <div className="tarjeta">
          <h2>Participantes ({cantidad} seleccionado{cantidad === 1 ? "" : "s"})</h2>

          {disponibles.length === 0 ? (
            <p className="vacio">
              Todos los inscriptos de esta competencia ya están en otro bracket.
            </p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Apellido y nombre</th>
                    <th>Categoría</th>
                    <th>Club / escuela</th>
                  </tr>
                </thead>
                <tbody>
                  {disponibles.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionados.has(i.id)}
                          onChange={() => alternar(i.id)}
                          aria-label={`Incluir a ${i.nombre}`}
                        />
                      </td>
                      <td>{i.nombre}</td>
                      <td>{i.categoria ?? "—"}</td>
                      <td>{i.club ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cantidad >= 2 && (
                <p className="ayuda">
                  Cuadro de {tamano} ranuras
                  {pasesLibres > 0 &&
                    `, con ${pasesLibres} pase${pasesLibres === 1 ? "" : "s"} libre${
                      pasesLibres === 1 ? "" : "s"
                    } en la primera ronda`}
                  .
                </p>
              )}
              {cantidad < 2 && (
                <p className="ayuda">Hacen falta al menos 2 participantes.</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="acciones">
        <button
          type="submit"
          className="btn btn-primario"
          disabled={guardando || cantidad < 2 || !competenciaId}
        >
          {guardando ? "Armando…" : "Armar bracket"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => router.push("/brackets")}
          disabled={guardando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

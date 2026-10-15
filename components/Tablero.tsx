"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ETIQUETAS_METODO_VICTORIA,
  MAXIMO_RONDAS,
  METODOS_VICTORIA_MANUALES,
  RONDAS_POR_DEFECTO,
  type MetodoVictoria,
} from "@/lib/constantes";
import { nombreRonda, sugerirGanador, totalPuntos } from "@/lib/bracket";
import type { ResultadoCombateInput } from "@/lib/validaciones";

export type CompetidorTablero = {
  id: string;
  nombre: string;
  club: string | null;
};

export type CombateTablero = {
  id: string;
  ronda: number;
  posicion: number;
  estado: string;
  ganadorId: string | null;
  competidorA: CompetidorTablero | null;
  competidorB: CompetidorTablero | null;
  resultado: ResultadoCombateInput | null;
};

export default function Tablero({ combates }: { combates: CombateTablero[] }) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  const totalRondas = combates.reduce((max, c) => Math.max(max, c.ronda), 1);
  const rondas = Array.from({ length: totalRondas }, (_, i) => i + 1);
  const seleccionado = combates.find((c) => c.id === seleccionadoId) ?? null;

  return (
    <>
      <div className="tarjeta">
        <div className="cuadro">
          {rondas.map((ronda) => (
            <div className="columna-ronda" key={ronda}>
              <h3>{nombreRonda(ronda, totalRondas)}</h3>
              <div className="combates-ronda">
                {combates
                  .filter((c) => c.ronda === ronda)
                  .map((combate) => (
                    <TarjetaCombate
                      key={combate.id}
                      combate={combate}
                      seleccionado={combate.id === seleccionadoId}
                      onSeleccionar={() =>
                        setSeleccionadoId(combate.id === seleccionadoId ? null : combate.id)
                      }
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="ayuda">
          Tocá un combate para cargar o modificar su resultado. El ganador pasa
          automáticamente a la ronda siguiente.
        </p>
      </div>

      {seleccionado && (
        <EditorCombate
          key={seleccionado.id}
          combate={seleccionado}
          totalRondas={totalRondas}
          onCerrar={() => setSeleccionadoId(null)}
        />
      )}
    </>
  );
}

function TarjetaCombate({
  combate,
  seleccionado,
  onSeleccionar,
}: {
  combate: CombateTablero;
  seleccionado: boolean;
  onSeleccionar: () => void;
}) {
  const puntos = totalPuntos(combate.resultado?.rondas ?? []);
  const esBye = combate.resultado?.metodo === "BYE";
  const finalizado = combate.estado === "FINALIZADO";

  const clases = [
    "combate",
    finalizado ? "finalizado" : "",
    seleccionado ? "seleccionado" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={clases} onClick={onSeleccionar}>
      <Lado
        competidor={combate.competidorA}
        puntos={esBye ? null : puntos.a}
        esGanador={combate.ganadorId !== null && combate.ganadorId === combate.competidorA?.id}
        mostrarPuntos={finalizado && !esBye}
      />
      <Lado
        competidor={combate.competidorB}
        puntos={esBye ? null : puntos.b}
        esGanador={combate.ganadorId !== null && combate.ganadorId === combate.competidorB?.id}
        mostrarPuntos={finalizado && !esBye}
      />
      {esBye && <span className="cinta-bye">Pase libre</span>}
    </button>
  );
}

function Lado({
  competidor,
  puntos,
  esGanador,
  mostrarPuntos,
}: {
  competidor: CompetidorTablero | null;
  puntos: number | null;
  esGanador: boolean;
  mostrarPuntos: boolean;
}) {
  return (
    <span className={`competidor ${esGanador ? "ganador" : ""} ${competidor ? "" : "vacante"}`}>
      <span className="nombre-competidor">
        {competidor ? competidor.nombre : "A definir"}
        {competidor?.club && <small> · {competidor.club}</small>}
      </span>
      {mostrarPuntos && puntos !== null && <span className="puntos">{puntos}</span>}
    </span>
  );
}

type RondaPuntos = { a: number; b: number };

function EditorCombate({
  combate,
  totalRondas,
  onCerrar,
}: {
  combate: CombateTablero;
  totalRondas: number;
  onCerrar: () => void;
}) {
  const router = useRouter();

  const [rondas, setRondas] = useState<RondaPuntos[]>(
    combate.resultado?.rondas?.length
      ? combate.resultado.rondas.map((r) => ({ a: r.a, b: r.b }))
      : Array.from({ length: RONDAS_POR_DEFECTO }, () => ({ a: 0, b: 0 })),
  );
  const [metodo, setMetodo] = useState<MetodoVictoria>(
    combate.resultado?.metodo && combate.resultado.metodo !== "BYE"
      ? combate.resultado.metodo
      : "PUNTOS",
  );
  const [ganadorId, setGanadorId] = useState<string | null>(combate.ganadorId);
  const [ganadorTocado, setGanadorTocado] = useState<boolean>(combate.ganadorId !== null);
  const [observaciones, setObservaciones] = useState(combate.resultado?.observaciones ?? "");
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const completo = Boolean(combate.competidorA && combate.competidorB);
  const esBye = combate.resultado?.metodo === "BYE";

  const sugerido = sugerirGanador(rondas);
  const idSugerido =
    sugerido === "a"
      ? (combate.competidorA?.id ?? null)
      : sugerido === "b"
        ? (combate.competidorB?.id ?? null)
        : null;

  // Mientras el árbitro no elija el ganador a mano, sigue la sugerencia por puntos
  useEffect(() => {
    if (!ganadorTocado && metodo === "PUNTOS") setGanadorId(idSugerido);
  }, [idSugerido, ganadorTocado, metodo]);

  function actualizarRonda(indice: number, lado: "a" | "b", valor: string) {
    const numero = Math.max(0, Math.min(999, Number(valor) || 0));
    setRondas((actuales) =>
      actuales.map((r, i) => (i === indice ? { ...r, [lado]: numero } : r)),
    );
  }

  async function enviar(nuevoGanadorId: string | null) {
    setErrores([]);
    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/combates/${combate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ganadorId: nuevoGanadorId,
          metodo,
          rondas: metodo === "PUNTOS" ? rondas : [],
          observaciones,
        }),
      });

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setErrores(datos?.errores ?? ["No se pudo guardar el resultado."]);
        return;
      }

      router.refresh();
      onCerrar();
    } catch {
      setErrores([
        "No hay conexión con el servidor. El resultado no se guardó: volvé a intentarlo.",
      ]);
    } finally {
      setGuardando(false);
    }
  }

  const totales = totalPuntos(rondas);

  return (
    <div className="tarjeta editor-combate">
      <h2>
        {nombreRonda(combate.ronda, totalRondas)} · combate {combate.posicion + 1}
      </h2>

      {errores.length > 0 && (
        <div className="errores" role="alert">
          <ul>
            {errores.map((mensaje, i) => (
              <li key={i}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      {esBye && (
        <p className="ayuda">
          Este combate se resolvió como pase libre al armar el bracket: no hay resultado para
          cargar.
        </p>
      )}

      {!completo && !esBye && (
        <p className="ayuda">
          Faltan definir los competidores. Cargá primero los resultados de la ronda anterior.
        </p>
      )}

      {completo && !esBye && (
        <>
          <div className="grupo">
            <label htmlFor="metodo">Forma de definición</label>
            <select
              id="metodo"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value as MetodoVictoria)}
            >
              {METODOS_VICTORIA_MANUALES.map((m) => (
                <option key={m} value={m}>
                  {ETIQUETAS_METODO_VICTORIA[m]}
                </option>
              ))}
            </select>
          </div>

          {metodo === "PUNTOS" && (
            <div className="grupo">
              <label>Puntos por ronda</label>
              <table className="tabla-puntos">
                <thead>
                  <tr>
                    <th>Ronda</th>
                    <th>{combate.competidorA?.nombre}</th>
                    <th>{combate.competidorB?.nombre}</th>
                  </tr>
                </thead>
                <tbody>
                  {rondas.map((ronda, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={ronda.a}
                          onChange={(e) => actualizarRonda(i, "a", e.target.value)}
                          aria-label={`Ronda ${i + 1}, puntos de ${combate.competidorA?.nombre}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={ronda.b}
                          onChange={(e) => actualizarRonda(i, "b", e.target.value)}
                          aria-label={`Ronda ${i + 1}, puntos de ${combate.competidorB?.nombre}`}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="fila-total">
                    <td>Total</td>
                    <td>{totales.a}</td>
                    <td>{totales.b}</td>
                  </tr>
                </tbody>
              </table>

              <div className="acciones" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-chico"
                  onClick={() => setRondas((r) => [...r, { a: 0, b: 0 }])}
                  disabled={rondas.length >= MAXIMO_RONDAS}
                >
                  + Agregar ronda
                </button>
                <button
                  type="button"
                  className="btn btn-chico"
                  onClick={() => setRondas((r) => r.slice(0, -1))}
                  disabled={rondas.length <= 1}
                >
                  Quitar última
                </button>
              </div>
            </div>
          )}

          <div className="grupo">
            <label htmlFor="ganador">Ganador</label>
            <select
              id="ganador"
              value={ganadorId ?? ""}
              onChange={(e) => {
                setGanadorTocado(true);
                setGanadorId(e.target.value || null);
              }}
            >
              <option value="">Sin definir</option>
              <option value={combate.competidorA?.id ?? ""}>{combate.competidorA?.nombre}</option>
              <option value={combate.competidorB?.id ?? ""}>{combate.competidorB?.nombre}</option>
            </select>
            {metodo === "PUNTOS" && (
              <p className="ayuda">
                {sugerido === null
                  ? "Por puntos hay empate: definí el ganador a mano."
                  : `Por puntos gana ${
                      sugerido === "a" ? combate.competidorA?.nombre : combate.competidorB?.nombre
                    }. Podés cambiarlo si el criterio del torneo es otro.`}
              </p>
            )}
          </div>

          <div className="grupo">
            <label htmlFor="observaciones">Observaciones (opcional)</label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Amonestaciones, lesiones, aclaraciones del jurado…"
            />
          </div>

          <div className="acciones">
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => enviar(ganadorId)}
              disabled={guardando || !ganadorId}
            >
              {guardando ? "Guardando…" : "Guardar resultado"}
            </button>
            <button type="button" className="btn" onClick={onCerrar} disabled={guardando}>
              Cerrar
            </button>
            <span className="separador" />
            {combate.ganadorId !== null && (
              <button
                type="button"
                className="btn btn-peligro"
                onClick={() => {
                  if (
                    window.confirm(
                      "¿Borrar el resultado? Si el ganador ya avanzó, también se limpian los combates siguientes.",
                    )
                  ) {
                    void enviar(null);
                  }
                }}
                disabled={guardando}
              >
                Borrar resultado
              </button>
            )}
          </div>
        </>
      )}

      {(!completo || esBye) && (
        <div className="acciones">
          <button type="button" className="btn" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

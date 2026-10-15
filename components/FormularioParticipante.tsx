"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ESTADOS_INSCRIPCION,
  ETIQUETAS_ESTADO_INSCRIPCION,
  ETIQUETAS_GENERO,
  ETIQUETAS_TIPO_COMPETENCIA,
  GENEROS,
  type EstadoCompetencia,
  type EstadoInscripcion,
  type Genero,
  type TipoCompetencia,
} from "@/lib/constantes";
import type { CampoRequerido } from "@/lib/validaciones";

export type CompetenciaParaFormulario = {
  id: string;
  nombre: string;
  tipo: TipoCompetencia;
  estado: EstadoCompetencia;
  camposRequeridos: CampoRequerido[];
};

type InscripcionForm = {
  competenciaId: string;
  categoria: string;
  estado: EstadoInscripcion;
  respuestas: Record<string, string>;
};

type ParticipanteExistente = {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  fechaNacimiento: string | null;
  genero: Genero | null;
  clubEscuela: string | null;
  contacto: string | null;
  inscripciones: {
    competenciaId: string;
    categoria: string | null;
    estado: EstadoInscripcion;
    respuestas: Record<string, unknown>;
  }[];
};

export default function FormularioParticipante({
  competencias,
  participante,
}: {
  competencias: CompetenciaParaFormulario[];
  participante?: ParticipanteExistente;
}) {
  const router = useRouter();

  const [nombre, setNombre] = useState(participante?.nombre ?? "");
  const [apellido, setApellido] = useState(participante?.apellido ?? "");
  const [documento, setDocumento] = useState(participante?.documento ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(participante?.fechaNacimiento ?? "");
  const [genero, setGenero] = useState<Genero | "">(participante?.genero ?? "");
  const [clubEscuela, setClubEscuela] = useState(participante?.clubEscuela ?? "");
  const [contacto, setContacto] = useState(participante?.contacto ?? "");

  const [inscripciones, setInscripciones] = useState<InscripcionForm[]>(
    (participante?.inscripciones ?? []).map((i) => ({
      competenciaId: i.competenciaId,
      categoria: i.categoria ?? "",
      estado: i.estado,
      respuestas: Object.fromEntries(
        Object.entries(i.respuestas ?? {}).map(([k, v]) => [k, valorATexto(v)]),
      ),
    })),
  );

  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const inscriptoEn = new Set(inscripciones.map((i) => i.competenciaId));
  const disponibles = competencias.filter((c) => !inscriptoEn.has(c.id));

  function agregarInscripcion(competenciaId: string) {
    if (!competenciaId) return;
    setInscripciones((actuales) => [
      ...actuales,
      { competenciaId, categoria: "", estado: "CONFIRMADA", respuestas: {} },
    ]);
  }

  function quitarInscripcion(competenciaId: string) {
    setInscripciones((actuales) => actuales.filter((i) => i.competenciaId !== competenciaId));
  }

  function actualizarInscripcion(competenciaId: string, cambios: Partial<InscripcionForm>) {
    setInscripciones((actuales) =>
      actuales.map((i) => (i.competenciaId === competenciaId ? { ...i, ...cambios } : i)),
    );
  }

  function actualizarRespuesta(competenciaId: string, clave: string, valor: string) {
    setInscripciones((actuales) =>
      actuales.map((i) =>
        i.competenciaId === competenciaId
          ? { ...i, respuestas: { ...i.respuestas, [clave]: valor } }
          : i,
      ),
    );
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    try {
      const respuesta = await fetch(
        participante ? `/api/participantes/${participante.id}` : "/api/participantes",
        {
          method: participante ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            apellido,
            documento,
            fechaNacimiento: fechaNacimiento || null,
            genero: genero || null,
            clubEscuela,
            contacto,
            inscripciones: inscripciones.map((i) => ({
              competenciaId: i.competenciaId,
              categoria: i.categoria,
              estado: i.estado,
              respuestas: i.respuestas,
            })),
          }),
        },
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setErrores(datos?.errores ?? ["No se pudo guardar. Intentá nuevamente."]);
        return;
      }

      router.push("/participantes");
      router.refresh();
    } catch {
      setErrores(["No hay conexión con el servidor. Intentá nuevamente."]);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!participante) return;
    if (!window.confirm(`¿Eliminar a ${participante.apellido}, ${participante.nombre}?`)) return;

    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/participantes/${participante.id}`, {
        method: "DELETE",
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setErrores(datos?.errores ?? ["No se pudo eliminar el participante."]);
        return;
      }
      router.push("/participantes");
      router.refresh();
    } catch {
      setErrores(["No hay conexión con el servidor."]);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar}>
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
        <h2>Datos personales</h2>

        <div className="fila-dos">
          <div className="grupo">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div className="grupo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="fila-dos">
          <div className="grupo">
            <label htmlFor="documento">Documento</label>
            <input
              id="documento"
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              required
            />
          </div>
          <div className="grupo">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              id="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
            />
          </div>
        </div>

        <div className="fila-dos">
          <div className="grupo">
            <label htmlFor="genero">Género</label>
            <select
              id="genero"
              value={genero}
              onChange={(e) => setGenero(e.target.value as Genero | "")}
            >
              <option value="">Sin especificar</option>
              {GENEROS.map((g) => (
                <option key={g} value={g}>
                  {ETIQUETAS_GENERO[g]}
                </option>
              ))}
            </select>
          </div>
          <div className="grupo">
            <label htmlFor="clubEscuela">Club o escuela</label>
            <input
              id="clubEscuela"
              type="text"
              value={clubEscuela}
              onChange={(e) => setClubEscuela(e.target.value)}
            />
          </div>
        </div>

        <div className="grupo">
          <label htmlFor="contacto">Contacto (teléfono o correo)</label>
          <input
            id="contacto"
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
          />
        </div>
      </div>

      <div className="tarjeta">
        <h2>Competencias</h2>

        {inscripciones.length === 0 && (
          <p className="vacio">Todavía no está inscripto en ninguna competencia.</p>
        )}

        {inscripciones.map((inscripcion) => {
          const competencia = competencias.find((c) => c.id === inscripcion.competenciaId);
          if (!competencia) return null;

          return (
            <div className="bloque-inscripcion" key={inscripcion.competenciaId}>
              <div className="encabezado-inscripcion">
                <div>
                  <strong>{competencia.nombre}</strong>{" "}
                  <span className="etiqueta">
                    {ETIQUETAS_TIPO_COMPETENCIA[competencia.tipo]}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-chico btn-peligro"
                  onClick={() => quitarInscripcion(inscripcion.competenciaId)}
                >
                  Quitar
                </button>
              </div>

              <div className="fila-dos">
                <div className="grupo">
                  <label htmlFor={`categoria-${competencia.id}`}>Categoría</label>
                  <input
                    id={`categoria-${competencia.id}`}
                    type="text"
                    value={inscripcion.categoria}
                    onChange={(e) =>
                      actualizarInscripcion(competencia.id, { categoria: e.target.value })
                    }
                    placeholder="Ej.: -70 kg, Cinturón negro"
                  />
                </div>
                <div className="grupo">
                  <label htmlFor={`estado-${competencia.id}`}>Estado</label>
                  <select
                    id={`estado-${competencia.id}`}
                    value={inscripcion.estado}
                    onChange={(e) =>
                      actualizarInscripcion(competencia.id, {
                        estado: e.target.value as EstadoInscripcion,
                      })
                    }
                  >
                    {ESTADOS_INSCRIPCION.map((s) => (
                      <option key={s} value={s}>
                        {ETIQUETAS_ESTADO_INSCRIPCION[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {competencia.camposRequeridos.length > 0 && (
                <div className="campos-dinamicos">
                  {competencia.camposRequeridos.map((campo) => (
                    <div className="grupo" key={campo.clave}>
                      <label htmlFor={`${competencia.id}-${campo.clave}`}>
                        {campo.etiqueta}
                        {campo.obligatorio && <span aria-hidden> *</span>}
                      </label>
                      <CampoDinamico
                        id={`${competencia.id}-${campo.clave}`}
                        campo={campo}
                        valor={inscripcion.respuestas[campo.clave] ?? ""}
                        onChange={(valor) =>
                          actualizarRespuesta(competencia.id, campo.clave, valor)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {disponibles.length > 0 && (
          <div className="grupo" style={{ marginTop: 12 }}>
            <label htmlFor="agregar-competencia">Inscribir en una competencia</label>
            <select
              id="agregar-competencia"
              value=""
              onChange={(e) => agregarInscripcion(e.target.value)}
            >
              <option value="">Elegir…</option>
              {disponibles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({ETIQUETAS_TIPO_COMPETENCIA[c.tipo]})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="acciones">
        <button type="submit" className="btn btn-primario" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => router.push("/participantes")}
          disabled={guardando}
        >
          Cancelar
        </button>
        <span className="separador" />
        {participante && (
          <button type="button" className="btn btn-peligro" onClick={eliminar} disabled={guardando}>
            Eliminar participante
          </button>
        )}
      </div>
    </form>
  );
}

function CampoDinamico({
  id,
  campo,
  valor,
  onChange,
}: {
  id: string;
  campo: CampoRequerido;
  valor: string;
  onChange: (valor: string) => void;
}) {
  if (campo.tipo === "seleccion") {
    return (
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Elegir…</option>
        {(campo.opciones ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (campo.tipo === "si_no") {
    return (
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Elegir…</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }

  const tipoHtml = campo.tipo === "numero" ? "number" : campo.tipo === "fecha" ? "date" : "text";
  return (
    <input id={id} type={tipoHtml} value={valor} onChange={(e) => onChange(e.target.value)} />
  );
}

function valorATexto(valor: unknown): string {
  if (typeof valor === "boolean") return valor ? "true" : "false";
  if (valor === null || valor === undefined) return "";
  return String(valor);
}

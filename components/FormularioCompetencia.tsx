"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ESTADOS_COMPETENCIA,
  ETIQUETAS_ESTADO_COMPETENCIA,
  ETIQUETAS_TIPO_CAMPO,
  ETIQUETAS_TIPO_COMPETENCIA,
  TIPOS_CAMPO,
  TIPOS_COMPETENCIA,
  type EstadoCompetencia,
  type TipoCampo,
  type TipoCompetencia,
} from "@/lib/constantes";
import { claveUnica } from "@/lib/utilidades";
import type { CampoRequerido } from "@/lib/validaciones";

type CompetenciaExistente = {
  id: string;
  nombre: string;
  tipo: TipoCompetencia;
  descripcion: string | null;
  estado: EstadoCompetencia;
  camposRequeridos: CampoRequerido[];
};

// Estado interno de cada fila del editor de campos
type CampoForm = {
  clave: string; // vacío en campos nuevos: se genera al guardar
  etiqueta: string;
  tipo: TipoCampo;
  obligatorio: boolean;
  opciones: string; // texto separado por comas
};

const CAMPOS_SUGERIDOS: CampoForm[] = [
  { clave: "", etiqueta: "Peso (kg)", tipo: "numero", obligatorio: true, opciones: "" },
  {
    clave: "",
    etiqueta: "Nivel",
    tipo: "seleccion",
    obligatorio: true,
    opciones: "Principiante, Intermedio, Avanzado",
  },
  { clave: "", etiqueta: "Años de experiencia", tipo: "numero", obligatorio: false, opciones: "" },
];

function desdeCampoRequerido(c: CampoRequerido): CampoForm {
  return {
    clave: c.clave,
    etiqueta: c.etiqueta,
    tipo: c.tipo,
    obligatorio: c.obligatorio,
    opciones: (c.opciones ?? []).join(", "),
  };
}

export default function FormularioCompetencia({
  competencia,
}: {
  competencia?: CompetenciaExistente;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(competencia?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCompetencia>(competencia?.tipo ?? "COMBATE");
  const [descripcion, setDescripcion] = useState(competencia?.descripcion ?? "");
  const [estado, setEstado] = useState<EstadoCompetencia>(competencia?.estado ?? "BORRADOR");
  const [campos, setCampos] = useState<CampoForm[]>(
    (competencia?.camposRequeridos ?? []).map(desdeCampoRequerido),
  );
  const [errores, setErrores] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(indice: number, cambios: Partial<CampoForm>) {
    setCampos((actuales) => actuales.map((c, i) => (i === indice ? { ...c, ...cambios } : c)));
  }

  function quitarCampo(indice: number) {
    setCampos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function agregarCampo(nuevo?: CampoForm) {
    setCampos((actuales) => [
      ...actuales,
      nuevo ?? { clave: "", etiqueta: "", tipo: "texto", obligatorio: false, opciones: "" },
    ]);
  }

  function armarCamposParaEnviar(): CampoRequerido[] {
    // Las claves existentes se conservan; las nuevas se generan a partir de la etiqueta
    const usadas = new Set(campos.map((c) => c.clave).filter(Boolean));
    return campos.map((c) => {
      const clave = c.clave || claveUnica(c.etiqueta, usadas);
      usadas.add(clave);
      const opciones =
        c.tipo === "seleccion"
          ? c.opciones.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined;
      return {
        clave,
        etiqueta: c.etiqueta.trim(),
        tipo: c.tipo,
        obligatorio: c.obligatorio,
        ...(opciones ? { opciones } : {}),
      };
    });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores([]);
    setGuardando(true);

    try {
      const respuesta = await fetch(
        competencia ? `/api/competencias/${competencia.id}` : "/api/competencias",
        {
          method: competencia ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            tipo,
            descripcion,
            estado,
            camposRequeridos: armarCamposParaEnviar(),
          }),
        },
      );

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        setErrores(datos?.errores ?? ["No se pudo guardar. Intentá nuevamente."]);
        return;
      }

      router.push("/competencias");
      router.refresh();
    } catch {
      setErrores(["No hay conexión con el servidor. Intentá nuevamente."]);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!competencia) return;
    if (!window.confirm(`¿Eliminar la competencia "${competencia.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await fetch(`/api/competencias/${competencia.id}`, { method: "DELETE" });
      if (!respuesta.ok) {
        setErrores(["No se pudo eliminar la competencia."]);
        return;
      }
      router.push("/competencias");
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
        <h2>Datos generales</h2>

        <div className="grupo">
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej.: Shuai jiao — 70 kg masculino"
            required
          />
        </div>

        <div className="fila-dos">
          <div className="grupo">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoCompetencia)}>
              {TIPOS_COMPETENCIA.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETAS_TIPO_COMPETENCIA[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="grupo">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoCompetencia)}
            >
              {ESTADOS_COMPETENCIA.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETAS_ESTADO_COMPETENCIA[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grupo">
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>
      </div>

      <div className="tarjeta">
        <h2>Datos requeridos a los participantes</h2>
        <p className="ayuda" style={{ marginTop: 0 }}>
          Además de los datos personales (que se piden siempre), acá definís qué más hay que
          cargar para esta competencia.
        </p>

        {campos.length === 0 && <p className="vacio">No hay campos adicionales.</p>}

        {campos.map((campo, i) => (
          <div className="campo-fila" key={i}>
            <div>
              <label htmlFor={`etiqueta-${i}`}>Etiqueta</label>
              <input
                id={`etiqueta-${i}`}
                type="text"
                value={campo.etiqueta}
                onChange={(e) => actualizarCampo(i, { etiqueta: e.target.value })}
                placeholder="Ej.: Peso (kg)"
              />
            </div>
            <div>
              <label htmlFor={`tipo-campo-${i}`}>Tipo de dato</label>
              <select
                id={`tipo-campo-${i}`}
                value={campo.tipo}
                onChange={(e) => actualizarCampo(i, { tipo: e.target.value as TipoCampo })}
              >
                {TIPOS_CAMPO.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETAS_TIPO_CAMPO[t]}
                  </option>
                ))}
              </select>
            </div>
            <label className="casilla">
              <input
                type="checkbox"
                checked={campo.obligatorio}
                onChange={(e) => actualizarCampo(i, { obligatorio: e.target.checked })}
              />
              Obligatorio
            </label>
            <button type="button" className="btn btn-chico btn-peligro" onClick={() => quitarCampo(i)}>
              Quitar
            </button>

            {campo.tipo === "seleccion" && (
              <div className="opciones">
                <label htmlFor={`opciones-${i}`}>Opciones (separadas por coma)</label>
                <input
                  id={`opciones-${i}`}
                  type="text"
                  value={campo.opciones}
                  onChange={(e) => actualizarCampo(i, { opciones: e.target.value })}
                  placeholder="Ej.: Principiante, Intermedio, Avanzado"
                />
              </div>
            )}
          </div>
        ))}

        <div className="acciones">
          <button type="button" className="btn" onClick={() => agregarCampo()}>
            + Agregar campo
          </button>
          <span className="ayuda">Sugeridos:</span>
          {CAMPOS_SUGERIDOS.map((s) => (
            <button
              key={s.etiqueta}
              type="button"
              className="btn btn-chico"
              onClick={() => agregarCampo(s)}
            >
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="acciones">
        <button type="submit" className="btn btn-primario" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn" onClick={() => router.push("/competencias")} disabled={guardando}>
          Cancelar
        </button>
        <span className="separador" />
        {competencia && (
          <button type="button" className="btn btn-peligro" onClick={eliminar} disabled={guardando}>
            Eliminar competencia
          </button>
        )}
      </div>
    </form>
  );
}

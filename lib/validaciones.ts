import { z } from "zod";
import {
  ESTADOS_COMPETENCIA,
  ESTADOS_INSCRIPCION,
  GENEROS,
  MAXIMO_RONDAS,
  METODOS_VICTORIA,
  TIPOS_CAMPO,
  TIPOS_COMPETENCIA,
  type TipoCampo,
} from "./constantes";

// --- Competencias -----------------------------------------------------------

export const campoRequeridoSchema = z
  .object({
    clave: z
      .string()
      .regex(/^[a-z][a-z0-9_]{0,39}$/, "La clave de un campo no es válida"),
    etiqueta: z
      .string()
      .trim()
      .min(1, "Cada campo necesita una etiqueta")
      .max(80, "La etiqueta de un campo es demasiado larga (máximo 80)"),
    tipo: z.enum(TIPOS_CAMPO),
    obligatorio: z.boolean(),
    opciones: z.array(z.string().trim().min(1)).max(50).optional(),
  })
  .superRefine((campo, ctx) => {
    if (campo.tipo === "seleccion" && (campo.opciones?.length ?? 0) < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El campo "${campo.etiqueta}" es una lista y necesita al menos 2 opciones`,
      });
    }
  });

export const competenciaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .max(120, "El nombre es demasiado largo (máximo 120)"),
    tipo: z.enum(TIPOS_COMPETENCIA),
    descripcion: z
      .string()
      .trim()
      .max(1000, "La descripción es demasiado larga (máximo 1000)")
      .nullish()
      .transform((v) => (v ? v : null)),
    estado: z.enum(ESTADOS_COMPETENCIA).default("BORRADOR"),
    camposRequeridos: z
      .array(campoRequeridoSchema)
      .max(30, "Máximo 30 campos por competencia")
      .default([]),
  })
  .superRefine((datos, ctx) => {
    const claves = datos.camposRequeridos.map((c) => c.clave);
    if (new Set(claves).size !== claves.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hay campos repetidos: cada campo debe tener una clave distinta",
      });
    }
  });

export type CampoRequerido = z.infer<typeof campoRequeridoSchema>;
export type CompetenciaInput = z.infer<typeof competenciaSchema>;

// --- Participantes ----------------------------------------------------------

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const inscripcionInputSchema = z.object({
  competenciaId: z.string().min(1),
  categoria: z
    .string()
    .trim()
    .max(60, "La categoría es demasiado larga (máximo 60)")
    .nullish()
    .transform((v) => (v ? v : null)),
  estado: z.enum(ESTADOS_INSCRIPCION).default("CONFIRMADA"),
  respuestas: z.record(z.unknown()).default({}),
});

export const participanteSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(80, "El nombre es demasiado largo (máximo 80)"),
    apellido: z
      .string()
      .trim()
      .min(2, "El apellido debe tener al menos 2 caracteres")
      .max(80, "El apellido es demasiado largo (máximo 80)"),
    documento: z
      .string()
      .trim()
      .min(4, "El documento debe tener al menos 4 caracteres")
      .max(30, "El documento es demasiado largo (máximo 30)"),
    fechaNacimiento: z
      .string()
      .trim()
      .regex(FECHA, "La fecha de nacimiento debe tener el formato AAAA-MM-DD")
      .nullish()
      .transform((v) => (v ? v : null)),
    genero: z
      .enum(GENEROS)
      .nullish()
      .transform((v) => v ?? null),
    clubEscuela: z
      .string()
      .trim()
      .max(120, "El club o escuela es demasiado largo (máximo 120)")
      .nullish()
      .transform((v) => (v ? v : null)),
    contacto: z
      .string()
      .trim()
      .max(120, "El contacto es demasiado largo (máximo 120)")
      .nullish()
      .transform((v) => (v ? v : null)),
    inscripciones: z
      .array(inscripcionInputSchema)
      .max(20, "Máximo 20 inscripciones por participante")
      .default([]),
  })
  .superRefine((datos, ctx) => {
    const ids = datos.inscripciones.map((i) => i.competenciaId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El participante está inscripto dos veces en la misma competencia",
      });
    }
  });

export type ParticipanteInput = z.infer<typeof participanteSchema>;
export type InscripcionInput = z.infer<typeof inscripcionInputSchema>;

/**
 * Valida las respuestas de una inscripción contra los campos definidos en la
 * competencia, y devuelve los valores normalizados (números como number, etc.).
 */
export function validarRespuestas(
  campos: CampoRequerido[],
  respuestas: Record<string, unknown>,
  nombreCompetencia: string,
): { errores: string[]; valores: Record<string, unknown> } {
  const errores: string[] = [];
  const valores: Record<string, unknown> = {};
  const prefijo = `${nombreCompetencia}:`;

  for (const campo of campos) {
    const bruto = respuestas[campo.clave];
    const vacio = bruto === undefined || bruto === null || bruto === "";

    if (vacio) {
      if (campo.obligatorio) {
        errores.push(`${prefijo} falta completar "${campo.etiqueta}"`);
      }
      continue;
    }

    const normalizado = normalizarValor(campo.tipo, bruto);
    if (normalizado === undefined) {
      errores.push(`${prefijo} "${campo.etiqueta}" tiene un valor inválido`);
      continue;
    }

    if (campo.tipo === "seleccion" && !(campo.opciones ?? []).includes(String(normalizado))) {
      errores.push(`${prefijo} "${campo.etiqueta}" no es una opción válida`);
      continue;
    }

    valores[campo.clave] = normalizado;
  }

  return { errores, valores };
}

function normalizarValor(tipo: TipoCampo, bruto: unknown): unknown | undefined {
  switch (tipo) {
    case "numero": {
      const n = typeof bruto === "number" ? bruto : Number(String(bruto).replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    }
    case "fecha": {
      const s = String(bruto);
      return FECHA.test(s) ? s : undefined;
    }
    case "si_no": {
      if (typeof bruto === "boolean") return bruto;
      const s = String(bruto).toLowerCase();
      if (["true", "si", "sí", "1"].includes(s)) return true;
      if (["false", "no", "0"].includes(s)) return false;
      return undefined;
    }
    case "texto":
    case "seleccion":
      return String(bruto).trim();
  }
}

// --- Brackets y combates ----------------------------------------------------

export const bracketSchema = z.object({
  competenciaId: z.string().min(1, "Hay que elegir una competencia"),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del bracket debe tener al menos 2 caracteres")
    .max(120, "El nombre del bracket es demasiado largo (máximo 120)"),
  // Si no se envía, se usan todas las inscripciones confirmadas de la competencia
  inscripcionIds: z.array(z.string().min(1)).max(256).optional(),
  // true = mezclar al azar; false = ordenar por apellido y nombre
  mezclar: z.boolean().default(true),
});

export type BracketInput = z.infer<typeof bracketSchema>;

export const resultadoCombateSchema = z.object({
  // null borra el resultado y devuelve el combate a "pendiente"
  ganadorId: z.string().min(1).nullable(),
  metodo: z.enum(METODOS_VICTORIA).default("PUNTOS"),
  rondas: z
    .array(
      z.object({
        a: z.number().int().min(0).max(999),
        b: z.number().int().min(0).max(999),
      }),
    )
    .max(MAXIMO_RONDAS, `Máximo ${MAXIMO_RONDAS} rondas`)
    .default([]),
  observaciones: z
    .string()
    .trim()
    .max(500, "Las observaciones son demasiado largas (máximo 500)")
    .nullish()
    .transform((v) => (v ? v : null)),
});

export type ResultadoCombateInput = z.infer<typeof resultadoCombateSchema>;

// Los valores de estas listas deben coincidir exactamente con los enums
// de prisma/schema.prisma.

// --- Competencias -----------------------------------------------------------

export const TIPOS_COMPETENCIA = ["FORMAS", "COMBATE", "ARMAS", "OTRO"] as const;
export type TipoCompetencia = (typeof TIPOS_COMPETENCIA)[number];

export const ETIQUETAS_TIPO_COMPETENCIA: Record<TipoCompetencia, string> = {
  FORMAS: "Formas",
  COMBATE: "Combate",
  ARMAS: "Armas",
  OTRO: "Otro",
};

export const ESTADOS_COMPETENCIA = [
  "BORRADOR",
  "ABIERTA",
  "CERRADA",
  "FINALIZADA",
] as const;
export type EstadoCompetencia = (typeof ESTADOS_COMPETENCIA)[number];

export const ETIQUETAS_ESTADO_COMPETENCIA: Record<EstadoCompetencia, string> = {
  BORRADOR: "Borrador",
  ABIERTA: "Inscripción abierta",
  CERRADA: "Inscripción cerrada",
  FINALIZADA: "Finalizada",
};

// --- Campos dinámicos -------------------------------------------------------

export const TIPOS_CAMPO = ["texto", "numero", "fecha", "seleccion", "si_no"] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

export const ETIQUETAS_TIPO_CAMPO: Record<TipoCampo, string> = {
  texto: "Texto",
  numero: "Número",
  fecha: "Fecha",
  seleccion: "Lista de opciones",
  si_no: "Sí / No",
};

// --- Participantes ----------------------------------------------------------

export const GENEROS = ["MASCULINO", "FEMENINO", "OTRO"] as const;
export type Genero = (typeof GENEROS)[number];

export const ETIQUETAS_GENERO: Record<Genero, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  OTRO: "Otro",
};

export const ESTADOS_INSCRIPCION = ["PENDIENTE", "CONFIRMADA"] as const;
export type EstadoInscripcion = (typeof ESTADOS_INSCRIPCION)[number];

export const ETIQUETAS_ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
};

// --- Brackets ---------------------------------------------------------------

export const TIPOS_BRACKET = ["ELIMINACION_SIMPLE"] as const;
export type TipoBracket = (typeof TIPOS_BRACKET)[number];

export const ETIQUETAS_TIPO_BRACKET: Record<TipoBracket, string> = {
  ELIMINACION_SIMPLE: "Eliminación simple",
};

export const ESTADOS_BRACKET = ["ARMADO", "EN_CURSO", "FINALIZADO"] as const;
export type EstadoBracket = (typeof ESTADOS_BRACKET)[number];

export const ETIQUETAS_ESTADO_BRACKET: Record<EstadoBracket, string> = {
  ARMADO: "Armado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
};

export const ESTADOS_COMBATE = ["PENDIENTE", "EN_CURSO", "FINALIZADO"] as const;
export type EstadoCombate = (typeof ESTADOS_COMBATE)[number];

// --- Resultados de combate --------------------------------------------------

export const METODOS_VICTORIA = [
  "PUNTOS",
  "ABANDONO",
  "DESCALIFICACION",
  "AUSENCIA",
  "BYE",
] as const;
export type MetodoVictoria = (typeof METODOS_VICTORIA)[number];

export const ETIQUETAS_METODO_VICTORIA: Record<MetodoVictoria, string> = {
  PUNTOS: "Por puntos",
  ABANDONO: "Abandono",
  DESCALIFICACION: "Descalificación",
  AUSENCIA: "Ausencia (no se presentó)",
  BYE: "Pase libre",
};

// Métodos que el árbitro puede elegir en el tablero (BYE lo asigna el sistema)
export const METODOS_VICTORIA_MANUALES = METODOS_VICTORIA.filter(
  (m) => m !== "BYE",
) as Exclude<MetodoVictoria, "BYE">[];

/** Cantidad de rondas que el tablero muestra por defecto (shuai jiao: 2, con una
 *  tercera de desempate si hace falta). Es un valor de presentación: el árbitro
 *  puede agregar o quitar rondas en el tablero. */
export const RONDAS_POR_DEFECTO = 2;
export const MAXIMO_RONDAS = 5;

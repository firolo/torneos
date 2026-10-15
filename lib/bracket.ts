/**
 * Lógica de armado de llaves por eliminación simple.
 *
 * Ideas centrales:
 *  - El cuadro siempre tiene un tamaño potencia de 2 (2, 4, 8, 16…). Si hay
 *    menos participantes que ranuras, las que sobran quedan vacías y generan
 *    pases libres (byes).
 *  - El orden de siembra reparte los pases libres: el 1 enfrenta al último,
 *    el 2 al penúltimo, y así. Eso evita que dos vacantes caigan en el mismo
 *    combate y que los pases libres se concentren en una rama.
 */

/** Tamaño de cuadro (potencia de 2) necesario para `cantidad` participantes. */
export function tamanoCuadro(cantidad: number): number {
  let tamano = 2;
  while (tamano < cantidad) tamano *= 2;
  return tamano;
}

/**
 * Orden de siembra clásico. Para 8 devuelve [1, 8, 4, 5, 2, 7, 3, 6]:
 * la ranura 0 del cuadro la ocupa el sembrado 1, la ranura 1 el sembrado 8, etc.
 */
export function ordenSiembra(tamano: number): number[] {
  let orden = [1];
  while (orden.length < tamano) {
    const limite = orden.length * 2;
    const siguiente: number[] = [];
    for (const sembrado of orden) {
      siguiente.push(sembrado, limite + 1 - sembrado);
    }
    orden = siguiente;
  }
  return orden;
}

/**
 * Reparte los ids en las ranuras del cuadro. `null` = vacante (pase libre).
 * `ids` ya viene en el orden de siembra deseado (azar o alfabético).
 */
export function repartirRanuras(ids: string[]): (string | null)[] {
  const tamano = tamanoCuadro(ids.length);
  return ordenSiembra(tamano).map((sembrado) => ids[sembrado - 1] ?? null);
}

export type CombatePlano = {
  ronda: number;
  posicion: number;
  competidorAId: string | null;
  competidorBId: string | null;
  /** Posición del combate de la ronda siguiente al que avanza el ganador. */
  posicionSiguiente: number | null;
  /** 0 = ocupa la ranura A del combate siguiente, 1 = la ranura B. */
  ranuraSiguiente: number | null;
};

/**
 * Devuelve todos los combates del cuadro, de la primera ronda a la final,
 * ya vinculados entre sí por posición.
 */
export function generarCombates(ids: string[]): CombatePlano[] {
  if (ids.length < 2) {
    throw new Error("Se necesitan al menos 2 participantes para armar un bracket");
  }

  const ranuras = repartirRanuras(ids);
  const tamano = ranuras.length;
  const totalRondas = Math.log2(tamano);
  const combates: CombatePlano[] = [];

  for (let ronda = 1; ronda <= totalRondas; ronda++) {
    const cantidad = tamano / 2 ** ronda;
    for (let posicion = 0; posicion < cantidad; posicion++) {
      const esFinal = ronda === totalRondas;
      combates.push({
        ronda,
        posicion,
        competidorAId: ronda === 1 ? ranuras[posicion * 2] : null,
        competidorBId: ronda === 1 ? ranuras[posicion * 2 + 1] : null,
        posicionSiguiente: esFinal ? null : Math.floor(posicion / 2),
        ranuraSiguiente: esFinal ? null : posicion % 2,
      });
    }
  }

  return combates;
}

export function nombreRonda(ronda: number, totalRondas: number): string {
  const desdeElFinal = totalRondas - ronda;
  if (desdeElFinal === 0) return "Final";
  if (desdeElFinal === 1) return "Semifinal";
  if (desdeElFinal === 2) return "Cuartos de final";
  if (desdeElFinal === 3) return "Octavos de final";
  return `Ronda ${ronda}`;
}

/** Suma de puntos por competidor a partir de las rondas cargadas. */
export function totalPuntos(rondas: { a: number; b: number }[]): { a: number; b: number } {
  return rondas.reduce((acc, r) => ({ a: acc.a + r.a, b: acc.b + r.b }), { a: 0, b: 0 });
}

/**
 * Sugiere un ganador según los puntos: primero por rondas ganadas y, si hay
 * empate, por puntos totales. Devuelve "a", "b" o null (empate).
 * Es sólo una sugerencia: el árbitro confirma el ganador en el tablero.
 */
export function sugerirGanador(rondas: { a: number; b: number }[]): "a" | "b" | null {
  if (rondas.length === 0) return null;

  let rondasA = 0;
  let rondasB = 0;
  for (const r of rondas) {
    if (r.a > r.b) rondasA++;
    else if (r.b > r.a) rondasB++;
  }
  if (rondasA !== rondasB) return rondasA > rondasB ? "a" : "b";

  const total = totalPuntos(rondas);
  if (total.a !== total.b) return total.a > total.b ? "a" : "b";
  return null;
}

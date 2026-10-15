/**
 * Convierte una etiqueta ("Años de experiencia") en una clave técnica
 * ("anos_de_experiencia") para guardar las respuestas de los participantes.
 */
export function generarClave(etiqueta: string): string {
  let clave = etiqueta
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  if (!clave || !/^[a-z]/.test(clave)) clave = `campo_${clave}`.replace(/_$/, "");
  return clave.slice(0, 40);
}

/** Devuelve una clave que no esté en `usadas` agregando un sufijo numérico si hace falta. */
export function claveUnica(etiqueta: string, usadas: Set<string>): string {
  const base = generarClave(etiqueta);
  let clave = base;
  let n = 2;
  while (usadas.has(clave)) {
    const sufijo = `_${n++}`;
    clave = base.slice(0, 40 - sufijo.length) + sufijo;
  }
  return clave;
}

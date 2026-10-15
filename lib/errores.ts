/**
 * Detecta un error conocido de Prisma por su código, sin importar el namespace
 * `Prisma` (que sólo existe después de `prisma generate`).
 *
 * Códigos usados en el proyecto:
 *  - P2002: violación de restricción única (ej.: documento repetido)
 *  - P2025: el registro buscado no existe
 */
export function esErrorPrisma(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === codigo
  );
}

export function respuestaErrores(errores: string[], estado = 400): Response {
  return Response.json({ errores }, { status: estado });
}

export const NO_ENCONTRADO = (que: string) =>
  respuestaErrores([`${que} no existe`], 404);

/** Lee y parsea el cuerpo JSON de una solicitud. Devuelve `null` si no es válido. */
export async function leerJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

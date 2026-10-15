"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos del servidor cada cierto tiempo, para que una
 * pantalla de sala muestre los resultados que cargan otros árbitros.
 *
 * Es una solución simple (polling). Cuando sumemos Redis y websockets, esto
 * se reemplaza por actualizaciones en el momento.
 */
export default function AutoRefresco({ segundos = 15 }: { segundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      // No refrescar si el árbitro está completando un campo
      const activo = document.activeElement;
      const editando =
        activo instanceof HTMLInputElement ||
        activo instanceof HTMLSelectElement ||
        activo instanceof HTMLTextAreaElement;

      if (!editando && document.visibilityState === "visible") {
        router.refresh();
      }
    }, segundos * 1000);

    return () => clearInterval(intervalo);
  }, [router, segundos]);

  return null;
}

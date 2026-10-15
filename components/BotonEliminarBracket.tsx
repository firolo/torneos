"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotonEliminarBracket({
  id,
  nombre,
}: {
  id: string;
  nombre: string;
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar el bracket "${nombre}"? Se borran también sus combates y los resultados cargados.`,
      )
    ) {
      return;
    }

    setTrabajando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/brackets/${id}`, { method: "DELETE" });
      if (!respuesta.ok) {
        setError("No se pudo eliminar el bracket.");
        return;
      }
      router.push("/brackets");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor.");
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <>
      {error && <span className="error-inline">{error}</span>}
      <button type="button" className="btn btn-peligro" onClick={eliminar} disabled={trabajando}>
        {trabajando ? "Eliminando…" : "Eliminar bracket"}
      </button>
    </>
  );
}

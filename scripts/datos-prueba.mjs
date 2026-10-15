/**
 * Carga un lote de datos de prueba para recorrer todas las pantallas.
 *
 *   docker compose exec app npm run datos:prueba
 *
 * Genera:
 *   - 2 competencias con datos requeridos distintos
 *   - 39 participantes (25 en la primera competencia, 14 en la segunda)
 *   - 5 brackets por categoría
 *   - resultados cargados en algunos, para ver los tres estados de bracket
 *
 * Trabaja contra la API de la aplicación (no contra la base directamente), así
 * usa las mismas validaciones y la misma lógica de armado de llaves.
 *
 * Es idempotente: antes de cargar borra los datos de prueba de una corrida
 * anterior, reconociéndolos por el nombre de las competencias.
 */

const BASE = process.env.URL_BASE ?? "http://localhost:3000";

const NOMBRE_COMPETENCIA_A = "Shuai Jiao — Combate";
const NOMBRE_COMPETENCIA_B = "Taolu — Formas tradicionales";

// --- Utilidades -------------------------------------------------------------

async function pedir(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error(
      `No se pudo conectar con ${BASE}. ¿Está levantada la app? (docker compose up)`,
    );
  }

  if (respuesta.status === 204) return null;

  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const detalle = datos?.errores?.join(" / ") ?? texto.slice(0, 200);
    throw new Error(`${metodo} ${ruta} → ${respuesta.status}: ${detalle}`);
  }
  return datos;
}

// Generador pseudoaleatorio con semilla fija: cada corrida produce lo mismo.
let semilla = 20261015;
function aleatorio() {
  semilla = (semilla * 1103515245 + 12345) % 2147483648;
  return semilla / 2147483648;
}
function entero(desde, hasta) {
  return desde + Math.floor(aleatorio() * (hasta - desde + 1));
}

// --- Datos ------------------------------------------------------------------

const CLUBES = [
  "Escuela Zhong Yi (Berazategui)",
  "Club Dragón Blanco (Quilmes)",
  "Asociación Wushu La Plata",
  "Centro Shuai Jiao Avellaneda",
  "Escuela Tigre de Jade (CABA)",
  "Club Artes Marciales Lanús",
];

// [apellido, nombre, genero]
const PERSONAS = [
  ["Acosta", "Martín", "MASCULINO"],
  ["Aguirre", "Lucía", "FEMENINO"],
  ["Álvarez", "Nicolás", "MASCULINO"],
  ["Barrios", "Sofía", "FEMENINO"],
  ["Benítez", "Joaquín", "MASCULINO"],
  ["Cabrera", "Valentina", "FEMENINO"],
  ["Cáceres", "Tomás", "MASCULINO"],
  ["Castro", "Camila", "FEMENINO"],
  ["Correa", "Federico", "MASCULINO"],
  ["Díaz", "Agustina", "FEMENINO"],
  ["Domínguez", "Bruno", "MASCULINO"],
  ["Escobar", "Julieta", "FEMENINO"],
  ["Fernández", "Santiago", "MASCULINO"],
  ["Figueroa", "Micaela", "FEMENINO"],
  ["Gómez", "Lautaro", "MASCULINO"],
  ["González", "Florencia", "FEMENINO"],
  ["Gutiérrez", "Emiliano", "MASCULINO"],
  ["Herrera", "Antonella", "FEMENINO"],
  ["Ibarra", "Facundo", "MASCULINO"],
  ["Juárez", "Rocío", "FEMENINO"],
  ["Ledesma", "Ignacio", "MASCULINO"],
  ["López", "Brenda", "FEMENINO"],
  ["Luna", "Matías", "MASCULINO"],
  ["Maldonado", "Carla", "FEMENINO"],
  ["Medina", "Gonzalo", "MASCULINO"],
  ["Molina", "Daiana", "FEMENINO"],
  ["Moreno", "Ramiro", "MASCULINO"],
  ["Núñez", "Victoria", "FEMENINO"],
  ["Ojeda", "Leandro", "MASCULINO"],
  ["Peralta", "Melina", "FEMENINO"],
  ["Pérez", "Diego", "MASCULINO"],
  ["Quiroga", "Abril", "FEMENINO"],
  ["Ramírez", "Hernán", "MASCULINO"],
  ["Rodríguez", "Paula", "FEMENINO"],
  ["Romero", "Cristian", "MASCULINO"],
  ["Sosa", "Ailén", "FEMENINO"],
  ["Torres", "Mariano", "MASCULINO"],
  ["Vargas", "Noelia", "FEMENINO"],
  ["Vera", "Sebastián", "MASCULINO"],
];

const COMPETENCIA_A = {
  nombre: NOMBRE_COMPETENCIA_A,
  tipo: "COMBATE",
  descripcion:
    "Combate de shuai jiao con derribos. Dos rondas, tercera de desempate si hace falta.",
  estado: "ABIERTA",
  camposRequeridos: [
    { clave: "peso", etiqueta: "Peso (kg)", tipo: "numero", obligatorio: true },
    {
      clave: "nivel",
      etiqueta: "Nivel",
      tipo: "seleccion",
      obligatorio: true,
      opciones: ["Principiante", "Intermedio", "Avanzado"],
    },
    {
      clave: "experiencia",
      etiqueta: "Años de experiencia",
      tipo: "numero",
      obligatorio: false,
    },
    {
      clave: "certificado_medico",
      etiqueta: "Presentó certificado médico",
      tipo: "si_no",
      obligatorio: true,
    },
  ],
};

const COMPETENCIA_B = {
  nombre: NOMBRE_COMPETENCIA_B,
  tipo: "FORMAS",
  descripcion: "Rutinas individuales de mano vacía, con puntaje de los jueces.",
  estado: "ABIERTA",
  camposRequeridos: [
    {
      clave: "estilo",
      etiqueta: "Estilo",
      tipo: "seleccion",
      obligatorio: true,
      opciones: ["Changquan", "Nanquan", "Taijiquan"],
    },
    {
      clave: "nivel",
      etiqueta: "Nivel",
      tipo: "seleccion",
      obligatorio: true,
      opciones: ["Intermedio", "Avanzado"],
    },
    {
      clave: "duracion",
      etiqueta: "Duración de la rutina (segundos)",
      tipo: "numero",
      obligatorio: false,
    },
  ],
};

// Reparto de participantes en categorías (define cuántos brackets hay)
const CATEGORIAS_A = [
  { nombre: "-70 kg", cantidad: 9, pesos: [64, 69] },
  { nombre: "-80 kg", cantidad: 8, pesos: [72, 79] },
  { nombre: "+80 kg", cantidad: 8, pesos: [82, 95] },
];
const CATEGORIAS_B = [
  { nombre: "Avanzado", cantidad: 6 },
  { nombre: "Intermedio", cantidad: 8 },
];

const ESTILOS = ["Changquan", "Nanquan", "Taijiquan"];
const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

// --- Limpieza ---------------------------------------------------------------

async function limpiar() {
  const competencias = await pedir("GET", "/api/competencias");
  const deseadas = competencias.filter(
    (c) => c.nombre === NOMBRE_COMPETENCIA_A || c.nombre === NOMBRE_COMPETENCIA_B,
  );
  if (deseadas.length === 0) return;

  const ids = new Set(deseadas.map((c) => c.id));
  console.log(`Borrando datos de una corrida anterior (${deseadas.length} competencia(s))…`);

  // 1. Brackets (arrastran sus combates)
  for (const competencia of deseadas) {
    const brackets = await pedir("GET", `/api/brackets?competenciaId=${competencia.id}`);
    for (const bracket of brackets) {
      await pedir("DELETE", `/api/brackets/${bracket.id}`);
    }
  }

  // 2. Participantes inscriptos en esas competencias (arrastran sus inscripciones)
  const participantes = await pedir("GET", "/api/participantes");
  for (const participante of participantes) {
    const esDePrueba = participante.inscripciones.some((i) => ids.has(i.competenciaId));
    if (esDePrueba) {
      await pedir("DELETE", `/api/participantes/${participante.id}`);
    }
  }

  // 3. Competencias, ya sin inscriptos ni brackets
  for (const competencia of deseadas) {
    await pedir("DELETE", `/api/competencias/${competencia.id}`);
  }
}

// --- Carga ------------------------------------------------------------------

function fechaNacimiento(indice) {
  const anio = 1988 + (indice % 20);
  const mes = String((indice % 12) + 1).padStart(2, "0");
  const dia = String((indice % 27) + 1).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function documento(indice) {
  return String(28000000 + indice * 173341);
}

/** Expande las categorías a una lista plana: ["-70 kg", "-70 kg", …] */
function expandir(categorias) {
  return categorias.flatMap((c) => Array.from({ length: c.cantidad }, () => c.nombre));
}

async function cargar() {
  console.log("Creando competencias…");
  const competenciaA = await pedir("POST", "/api/competencias", COMPETENCIA_A);
  const competenciaB = await pedir("POST", "/api/competencias", COMPETENCIA_B);

  const categoriasA = expandir(CATEGORIAS_A); // 25
  const categoriasB = expandir(CATEGORIAS_B); // 14

  // inscripcionIds agrupados por "competenciaId|categoria"
  const porCategoria = new Map();
  const agregar = (clave, id) => {
    if (!porCategoria.has(clave)) porCategoria.set(clave, []);
    porCategoria.get(clave).push(id);
  };

  console.log(`Creando ${PERSONAS.length} participantes…`);
  for (let i = 0; i < PERSONAS.length; i++) {
    const [apellido, nombre, genero] = PERSONAS[i];
    const enA = i < categoriasA.length;

    let inscripcion;
    if (enA) {
      const categoria = categoriasA[i];
      const rango = CATEGORIAS_A.find((c) => c.nombre === categoria).pesos;
      inscripcion = {
        competenciaId: competenciaA.id,
        categoria,
        estado: "CONFIRMADA",
        respuestas: {
          peso: entero(rango[0], rango[1]),
          nivel: NIVELES[i % NIVELES.length],
          experiencia: entero(1, 12),
          certificado_medico: true,
        },
      };
    } else {
      const indiceB = i - categoriasA.length;
      const categoria = categoriasB[indiceB];
      inscripcion = {
        competenciaId: competenciaB.id,
        categoria,
        estado: "CONFIRMADA",
        respuestas: {
          estilo: ESTILOS[indiceB % ESTILOS.length],
          nivel: categoria,
          duracion: entero(60, 90),
        },
      };
    }

    const participante = await pedir("POST", "/api/participantes", {
      nombre,
      apellido,
      documento: documento(i),
      fechaNacimiento: fechaNacimiento(i),
      genero,
      clubEscuela: CLUBES[i % CLUBES.length],
      contacto: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@ejemplo.com`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, ""),
      inscripciones: [inscripcion],
    });

    const guardada = participante.inscripciones[0];
    agregar(`${inscripcion.competenciaId}|${inscripcion.categoria}`, guardada.id);
  }

  console.log("Armando brackets…");
  const brackets = [];

  for (const categoria of CATEGORIAS_A) {
    const ids = porCategoria.get(`${competenciaA.id}|${categoria.nombre}`) ?? [];
    const bracket = await pedir("POST", "/api/brackets", {
      competenciaId: competenciaA.id,
      nombre: `Shuai Jiao ${categoria.nombre}`,
      inscripcionIds: ids,
      mezclar: true,
    });
    brackets.push({ ...bracket, participantes: ids.length });
  }

  for (const categoria of CATEGORIAS_B) {
    const ids = porCategoria.get(`${competenciaB.id}|${categoria.nombre}`) ?? [];
    const bracket = await pedir("POST", "/api/brackets", {
      competenciaId: competenciaB.id,
      nombre: `Formas — ${categoria.nombre}`,
      inscripcionIds: ids,
      mezclar: false,
    });
    brackets.push({ ...bracket, participantes: ids.length });
  }

  return { competenciaA, competenciaB, brackets };
}

// --- Resultados -------------------------------------------------------------

/**
 * Inventa un resultado coherente: el ganador gana las dos rondas, o bien
 * gana la primera y la tercera (para que se vea el caso de desempate).
 */
function resultadoFicticio(combate) {
  const ganaA = aleatorio() < 0.5;
  const ganadorId = ganaA ? combate.competidorAId : combate.competidorBId;

  // 1 de cada 8 combates se define por abandono, sin puntos
  if (aleatorio() < 0.125) {
    return {
      ganadorId,
      metodo: "ABANDONO",
      rondas: [],
      observaciones: "El rival no pudo continuar.",
    };
  }

  const alto = () => entero(2, 4);
  const bajo = () => entero(0, 1);
  const ronda = (gana) => (gana ? { a: alto(), b: bajo() } : { a: bajo(), b: alto() });

  const rondas =
    aleatorio() < 0.3
      ? [ronda(ganaA), ronda(!ganaA), ronda(ganaA)] // 2-1 en rondas
      : [ronda(ganaA), ronda(ganaA)]; // 2-0 en rondas

  return { ganadorId, metodo: "PUNTOS", rondas, observaciones: null };
}

/**
 * Carga resultados en las primeras `cantidadRondas` rondas del bracket
 * ("todas" para jugarlo completo). Relee el bracket antes de cada ronda,
 * porque los ganadores recién avanzan al guardarse el resultado anterior.
 */
async function jugar(bracketId, cantidadRondas) {
  const inicial = await pedir("GET", `/api/brackets/${bracketId}`);
  const totalRondas = inicial.combates.reduce((max, c) => Math.max(max, c.ronda), 1);
  const hasta = cantidadRondas === "todas" ? totalRondas : Math.min(cantidadRondas, totalRondas);

  for (let ronda = 1; ronda <= hasta; ronda++) {
    const bracket = await pedir("GET", `/api/brackets/${bracketId}`);
    const pendientes = bracket.combates.filter(
      (c) =>
        c.ronda === ronda &&
        c.estado !== "FINALIZADO" &&
        c.competidorAId !== null &&
        c.competidorBId !== null,
    );

    for (const combate of pendientes) {
      await pedir("PUT", `/api/combates/${combate.id}`, resultadoFicticio(combate));
    }
  }
}

// --- Principal --------------------------------------------------------------

async function main() {
  console.log(`Cargando datos de prueba en ${BASE}\n`);

  await limpiar();
  const { brackets } = await cargar();

  // Un bracket de cada estado, para recorrer todas las vistas del tablero
  const plan = [
    { nombre: "Shuai Jiao -70 kg", rondas: 0 }, // ARMADO, con pases libres
    { nombre: "Shuai Jiao -80 kg", rondas: 1 }, // EN_CURSO
    { nombre: "Shuai Jiao +80 kg", rondas: "todas" }, // FINALIZADO
    { nombre: "Formas — Avanzado", rondas: 0 }, // ARMADO, con pases libres
    { nombre: "Formas — Intermedio", rondas: 2 }, // EN_CURSO, final pendiente
  ];

  console.log("Cargando resultados…");
  for (const paso of plan) {
    const bracket = brackets.find((b) => b.nombre === paso.nombre);
    if (!bracket || paso.rondas === 0) continue;
    await jugar(bracket.id, paso.rondas);
  }

  console.log("\nListo. Resumen:\n");
  const finales = await pedir("GET", "/api/brackets");
  for (const bracket of finales) {
    const propio = brackets.find((b) => b.id === bracket.id);
    if (!propio) continue;
    console.log(
      `  ${bracket.nombre.padEnd(22)} ${String(propio.participantes).padStart(2)} participantes` +
        ` · ${String(bracket._count.combates).padStart(2)} combates · ${bracket.estado}`,
    );
  }

  console.log(`
Para recorrer la app:
  ${BASE}/                  resumen
  ${BASE}/competencias      2 competencias con datos requeridos distintos
  ${BASE}/participantes      ${PERSONAS.length} participantes
  ${BASE}/brackets           ${brackets.length} brackets
  ${BASE}/panel              tablero en vivo
`);
}

main().catch((error) => {
  console.error(`\nError: ${error.message}\n`);
  process.exit(1);
});

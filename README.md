# Torneos — artes marciales y deportes de combate

Next.js (full-stack) + PostgreSQL, todo corriendo en Docker.
Uso previsto: árbitros y mesa de control dentro del recinto del torneo.

## Requisitos
- Docker Desktop abierto y en ejecución
- Opcional: VS Code

## Primer arranque
Desde la carpeta del proyecto:

```bash
docker compose up --build
```

La primera vez tarda unos minutos. Cuando veas `Ready`:

- App: http://localhost:3000
- Health check: http://localhost:3000/api/health
- PostgreSQL: `localhost:5432`, usuario `torneo`, contraseña `torneo`, base `torneo`

## Uso diario
```bash
docker compose up            # levantar
docker compose up -d         # levantar en segundo plano
docker compose logs -f app   # ver logs de la app
docker compose down          # apagar (los datos de la base se conservan)
docker compose down -v       # apagar y BORRAR los datos de la base
```

## Instalar una dependencia nueva
```bash
docker compose exec app npm install <paquete>
```
Si cambiás `package.json` a mano, reconstruí con:
```bash
docker compose up --build -V
```

## Base de datos (Prisma)
El esquema está en `prisma/schema.prisma`. Al iniciar, el contenedor genera el
cliente y aplica las migraciones que existan en `prisma/migrations`.

Después de **cambiar el esquema**, creá la migración con:
```bash
docker compose exec app npx prisma migrate dev --name <descripcion_del_cambio>
```
Guardá `prisma/migrations` en git: es el historial de la base.

Para inspeccionar los datos:
```bash
docker compose exec db psql -U torneo -d torneo
docker compose exec app npx prisma studio   # interfaz web en el puerto 5555
```

## Módulos

### 1. Competencias — `/competencias`
Nombre, tipo (formas, combate, armas, otro), estado y **datos requeridos**:
campos extra que se le piden al participante al inscribirse (texto, número,
fecha, lista de opciones, sí/no), con marca de obligatorio.

No se puede eliminar una competencia que ya tiene inscriptos o brackets.

### 2. Participantes — `/participantes`
Datos personales (apellido, nombre, documento único, fecha de nacimiento,
género, club, contacto) e inscripción a una o varias competencias. Al elegir una
competencia, el formulario muestra sus datos requeridos y los valida.

No se puede quitar una inscripción si el participante ya está colocado en un
bracket.

### 3. Brackets — `/brackets`
Eliminación simple. Se elige la competencia, se seleccionan los inscriptos
confirmados y el sistema arma el cuadro:

- El tamaño del cuadro es la potencia de 2 siguiente a la cantidad de
  participantes (5 participantes → cuadro de 8).
- Las ranuras que sobran generan **pases libres**, repartidos con el orden de
  siembra clásico para que no se concentren en una rama.
- El orden puede sortearse al azar o dejarse alfabético.

Los cruces quedan fijos: para cambiarlos hay que eliminar el bracket y armarlo
de nuevo.

### 4. Panel en vivo — `/panel`
Se elige competencia, después bracket, y se abre el tablero. Cada combate se
toca para cargar el resultado: puntos por ronda, forma de definición (puntos,
abandono, descalificación, ausencia), ganador y observaciones.

- El ganador **avanza automáticamente** al combate siguiente.
- El sistema sugiere el ganador por puntos (rondas ganadas y, si hay empate,
  puntos totales), pero el árbitro confirma.
- Al borrar un resultado se limpia también la rama que quedó aguas abajo.
- La pantalla se actualiza sola cada 15 segundos, salvo mientras se está
  completando un campo.

## API

| Método | Ruta | Qué hace |
|---|---|---|
| GET, POST | `/api/competencias` | listar, crear |
| GET, PUT, DELETE | `/api/competencias/:id` | ver, modificar, eliminar |
| GET, POST | `/api/participantes` | listar, crear (con inscripciones) |
| GET, PUT, DELETE | `/api/participantes/:id` | ver, modificar, eliminar |
| GET, POST | `/api/brackets` | listar (`?competenciaId=`), armar |
| GET, DELETE | `/api/brackets/:id` | ver con combates, eliminar |
| PUT | `/api/combates/:id` | cargar o borrar el resultado |

## Pendientes conocidos
- **Sin autenticación.** La app queda abierta a quien alcance la URL. Antes de
  usarla en un torneo real hay que proteger el acceso.
- **Puntaje de shuai jiao.** El tablero guarda puntos por ronda y método de
  victoria, con el ganador confirmado por el árbitro. Si el reglamento usa otro
  criterio (caídas, puntos por tipo de derribo), se ajusta el tablero.
- **Round robin y doble eliminación.** Hoy solo hay eliminación simple.
- **Tiempo real.** Hoy la pantalla usa polling cada 15 segundos. Con Redis y
  websockets pasaría a ser instantáneo.

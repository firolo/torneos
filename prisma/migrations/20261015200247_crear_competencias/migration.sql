-- CreateEnum
CREATE TYPE "TipoCompetencia" AS ENUM ('FORMAS', 'COMBATE', 'ARMAS', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoCompetencia" AS ENUM ('BORRADOR', 'ABIERTA', 'CERRADA', 'FINALIZADA');

-- CreateTable
CREATE TABLE "competencias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoCompetencia" NOT NULL,
    "descripcion" TEXT,
    "camposRequeridos" JSONB NOT NULL DEFAULT '[]',
    "estado" "EstadoCompetencia" NOT NULL DEFAULT 'BORRADOR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencias_pkey" PRIMARY KEY ("id")
);

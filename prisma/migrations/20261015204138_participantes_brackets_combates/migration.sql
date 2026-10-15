-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('PENDIENTE', 'CONFIRMADA');

-- CreateEnum
CREATE TYPE "TipoBracket" AS ENUM ('ELIMINACION_SIMPLE');

-- CreateEnum
CREATE TYPE "EstadoBracket" AS ENUM ('ARMADO', 'EN_CURSO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EstadoCombate" AS ENUM ('PENDIENTE', 'EN_CURSO', 'FINALIZADO');

-- CreateTable
CREATE TABLE "participantes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "genero" "Genero",
    "clubEscuela" TEXT,
    "contacto" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "categoria" TEXT,
    "respuestas" JSONB NOT NULL DEFAULT '{}',
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'CONFIRMADA',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brackets" (
    "id" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoBracket" NOT NULL DEFAULT 'ELIMINACION_SIMPLE',
    "estado" "EstadoBracket" NOT NULL DEFAULT 'ARMADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combates" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "ronda" INTEGER NOT NULL,
    "posicion" INTEGER NOT NULL,
    "competidorAId" TEXT,
    "competidorBId" TEXT,
    "combateSiguienteId" TEXT,
    "ranuraSiguiente" INTEGER,
    "ganadorId" TEXT,
    "resultado" JSONB,
    "estado" "EstadoCombate" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "participantes_documento_key" ON "participantes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_participanteId_competenciaId_key" ON "inscripciones"("participanteId", "competenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "combates_bracketId_ronda_posicion_key" ON "combates"("bracketId", "ronda", "posicion");

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "participantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brackets" ADD CONSTRAINT "brackets_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_competidorAId_fkey" FOREIGN KEY ("competidorAId") REFERENCES "inscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_competidorBId_fkey" FOREIGN KEY ("competidorBId") REFERENCES "inscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_ganadorId_fkey" FOREIGN KEY ("ganadorId") REFERENCES "inscripciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_combateSiguienteId_fkey" FOREIGN KEY ("combateSiguienteId") REFERENCES "combates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

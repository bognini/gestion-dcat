-- CreateTable
CREATE TABLE "MouvementCaisse" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "justificatif" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementCaisse_pkey" PRIMARY KEY ("id")
);

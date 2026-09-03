-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "ticketId" TEXT;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "partenaireId" TEXT NOT NULL,
    "incident" TEXT NOT NULL,
    "dateSignalement" TIMESTAMP(3) NOT NULL,
    "signaleParNom" TEXT NOT NULL,
    "signaleParPrenoms" TEXT,
    "recuParId" TEXT NOT NULL,
    "modeSignalement" TEXT NOT NULL,
    "priseEnChargeParId" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ouvert',
    "mailSupportEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "mailSupportAt" TIMESTAMP(3),
    "fermeAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_numero_key" ON "Ticket"("numero");

-- CreateIndex
CREATE INDEX "Ticket_partenaireId_idx" ON "Ticket"("partenaireId");

-- CreateIndex
CREATE INDEX "Ticket_statut_idx" ON "Ticket"("statut");

-- CreateIndex
CREATE INDEX "Ticket_dateSignalement_idx" ON "Ticket"("dateSignalement");

-- CreateIndex
CREATE INDEX "Intervention_ticketId_idx" ON "Intervention"("ticketId");

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_recuParId_fkey" FOREIGN KEY ("recuParId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_priseEnChargeParId_fkey" FOREIGN KEY ("priseEnChargeParId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

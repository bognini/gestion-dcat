/*
  Warnings:

  - You are about to drop the column `aile` on the `Emplacement` table. All the data in the column will be lost.
  - You are about to drop the column `armoire` on the `Emplacement` table. All the data in the column will be lost.
  - You are about to drop the column `etagere` on the `Emplacement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Depense" ADD COLUMN     "justificatif" TEXT;

-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "parentDevisId" TEXT,
ADD COLUMN     "revisionLetter" TEXT;

-- AlterTable
ALTER TABLE "Emplacement" DROP COLUMN "aile",
DROP COLUMN "armoire",
DROP COLUMN "etagere",
ADD COLUMN     "categorieId" TEXT;

-- CreateIndex
CREATE INDEX "Emplacement_categorieId_idx" ON "Emplacement"("categorieId");

-- AddForeignKey
ALTER TABLE "Emplacement" ADD CONSTRAINT "Emplacement_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_parentDevisId_fkey" FOREIGN KEY ("parentDevisId") REFERENCES "Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

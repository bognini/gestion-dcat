-- DropForeignKey
ALTER TABLE "Modele" DROP CONSTRAINT "Modele_categorieId_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_categorieId_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_marqueId_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_modeleId_fkey";

-- AlterTable
ALTER TABLE "Categorie" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Emplacement" ADD COLUMN     "allee" TEXT,
ADD COLUMN     "etagere" TEXT,
ADD COLUMN     "zone" TEXT;

-- AlterTable
ALTER TABLE "Marque" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Modele" ADD COLUMN     "description" TEXT,
ALTER COLUMN "categorieId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Produit" ADD COLUMN     "dateAchat" TIMESTAMP(3),
ADD COLUMN     "etat" TEXT,
ADD COLUMN     "garantieFin" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "numeroSerie" TEXT,
ALTER COLUMN "marqueId" DROP NOT NULL,
ALTER COLUMN "categorieId" DROP NOT NULL,
ALTER COLUMN "modeleId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Modele" ADD CONSTRAINT "Modele_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_modeleId_fkey" FOREIGN KEY ("modeleId") REFERENCES "Modele"("id") ON DELETE SET NULL ON UPDATE CASCADE;

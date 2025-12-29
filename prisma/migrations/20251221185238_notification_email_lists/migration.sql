/*
  Warnings:

  - You are about to drop the column `allee` on the `Emplacement` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `Emplacement` table. All the data in the column will be lost.
  - You are about to drop the column `categorieId` on the `Modele` table. All the data in the column will be lost.
  - You are about to drop the column `etat` on the `Produit` table. All the data in the column will be lost.
  - You are about to drop the column `numeroSerie` on the `Produit` table. All the data in the column will be lost.
  - Added the required column `familleId` to the `Modele` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Modele" DROP CONSTRAINT "Modele_categorieId_fkey";

-- AlterTable
ALTER TABLE "DemandeAbsence" ADD COLUMN     "documentName" TEXT,
ADD COLUMN     "documentPath" TEXT;

-- AlterTable
ALTER TABLE "Emplacement" DROP COLUMN "allee",
DROP COLUMN "zone",
ADD COLUMN     "aile" TEXT,
ADD COLUMN     "armoire" TEXT,
ADD COLUMN     "bureau" TEXT;

-- AlterTable
ALTER TABLE "Modele" DROP COLUMN "categorieId",
ADD COLUMN     "familleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MouvementStock" ADD COLUMN     "destinationContact" TEXT,
ADD COLUMN     "destinationType" TEXT,
ADD COLUMN     "etat" TEXT,
ADD COLUMN     "partenaireDstId" TEXT;

-- AlterTable
ALTER TABLE "Operation" ADD COLUMN     "dateLimite" TIMESTAMP(3),
ADD COLUMN     "responsableId" TEXT;

-- AlterTable
ALTER TABLE "Produit" DROP COLUMN "etat",
DROP COLUMN "numeroSerie",
ADD COLUMN     "familleId" TEXT,
ADD COLUMN     "prixVenteMin" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Tache" ADD COLUMN     "dateLimite" TIMESTAMP(3),
ADD COLUMN     "dureeMinutes" INTEGER;

-- CreateTable
CREATE TABLE "DocumentEmploye" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fichier" TEXT NOT NULL,
    "mimeType" TEXT,
    "taille" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentEmploye_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheTransport" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeId" TEXT NOT NULL,
    "totalCout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'impaye',
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FicheTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneTransport" (
    "id" TEXT NOT NULL,
    "ficheId" TEXT NOT NULL,
    "depart" TEXT NOT NULL,
    "arrivee" TEXT NOT NULL,
    "typeClient" TEXT NOT NULL,
    "partenaireId" TEXT,
    "particulierNom" TEXT,
    "cout" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remboursement" (
    "id" TEXT NOT NULL,
    "partenaireId" TEXT NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motif" TEXT NOT NULL,
    "reference" TEXT,
    "dateEcheance" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remboursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRemboursement" (
    "id" TEXT NOT NULL,
    "remboursementId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fichier" TEXT NOT NULL,
    "type" TEXT,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRemboursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaiementRemboursement" (
    "id" TEXT NOT NULL,
    "remboursementId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementRemboursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FicheMission" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "projetId" TEXT,
    "destination" TEXT NOT NULL,
    "dateDepart" TIMESTAMP(3) NOT NULL,
    "dateRetour" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'planifiee',
    "budget" DOUBLE PRECISION,
    "depensesReelles" DOUBLE PRECISION,
    "objectifs" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FicheMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TacheMission" (
    "id" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "dureeMinutes" INTEGER,
    "missionId" TEXT NOT NULL,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TacheMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionParticipant" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "role" TEXT,
    "perDiem" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratClient" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "partenaireId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montantMensuel" DOUBLE PRECISION,
    "montantAnnuel" DOUBLE PRECISION,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "modePaiement" TEXT NOT NULL DEFAULT 'mensuel',
    "jourPaiement" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "description" TEXT,
    "notes" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcheanceContrat" (
    "id" TEXT NOT NULL,
    "contratId" TEXT NOT NULL,
    "mois" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'a_payer',
    "datePaiement" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcheanceContrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salaire" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "mois" TIMESTAMP(3) NOT NULL,
    "salaireBase" DOUBLE PRECISION NOT NULL,
    "primes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAPayer" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "datePaiement" TIMESTAMP(3),
    "modePaiement" TEXT,
    "notes" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fournisseur" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "periodicite" TEXT NOT NULL DEFAULT 'mensuel',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateProchainePaiement" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "reference" TEXT,
    "notes" TEXT,
    "alerteJours" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Abonnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcheanceAbonnement" (
    "id" TEXT NOT NULL,
    "abonnementId" TEXT NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'a_payer',
    "datePaiement" TIMESTAMP(3),
    "reference" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcheanceAbonnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratPrestataire" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "partenaireId" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "description" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "delaiExecution" TEXT,
    "conditionsPaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "documentPath" TEXT,
    "documentName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContratPrestataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Famille" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "categorieId" TEXT NOT NULL,

    CONSTRAINT "Famille_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetImageFolder" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetImageFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetImage" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "folderId" TEXT,
    "description" TEXT,
    "fichier" BYTEA NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionDocument" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fichier" BYTEA NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEmailList" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "label" TEXT,
    "emails" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEmailList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3),
    "clientNom" TEXT NOT NULL,
    "clientAdresse" TEXT,
    "clientVille" TEXT,
    "clientPays" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "clientEmail" TEXT,
    "clientTelephone" TEXT,
    "partenaireId" TEXT,
    "devisId" TEXT,
    "objet" TEXT,
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTVA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resteAPayer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "notes" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactureLigne" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "produitId" TEXT,
    "reference" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "details" TEXT,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "unite" TEXT NOT NULL DEFAULT 'u',
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactureLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factureId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "modePaiement" TEXT NOT NULL,
    "banque" TEXT,
    "numeroCheque" TEXT,
    "reference_ext" TEXT,
    "notes" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'particulier',
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "partenaireId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "modePaiement" TEXT,
    "statutPaiement" TEXT NOT NULL DEFAULT 'en_attente',
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adresseLivraison" TEXT,
    "notes" TEXT,
    "documentPath" TEXT,
    "documentName" TEXT,
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeLigne" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandeLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitEmarket" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "prixEmarket" DOUBLE PRECISION,
    "enPromotion" BOOLEAN NOT NULL DEFAULT false,
    "prixPromo" DOUBLE PRECISION,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProduitEmarket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "montant" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "frequence" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depense" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "categorie" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Depense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentEmploye_employeId_idx" ON "DocumentEmploye"("employeId");

-- CreateIndex
CREATE INDEX "LigneTransport_ficheId_idx" ON "LigneTransport"("ficheId");

-- CreateIndex
CREATE INDEX "LigneTransport_partenaireId_idx" ON "LigneTransport"("partenaireId");

-- CreateIndex
CREATE INDEX "Remboursement_partenaireId_idx" ON "Remboursement"("partenaireId");

-- CreateIndex
CREATE INDEX "Remboursement_statut_idx" ON "Remboursement"("statut");

-- CreateIndex
CREATE INDEX "DocumentRemboursement_remboursementId_idx" ON "DocumentRemboursement"("remboursementId");

-- CreateIndex
CREATE INDEX "PaiementRemboursement_remboursementId_idx" ON "PaiementRemboursement"("remboursementId");

-- CreateIndex
CREATE UNIQUE INDEX "FicheMission_reference_key" ON "FicheMission"("reference");

-- CreateIndex
CREATE INDEX "FicheMission_projetId_idx" ON "FicheMission"("projetId");

-- CreateIndex
CREATE INDEX "FicheMission_statut_idx" ON "FicheMission"("statut");

-- CreateIndex
CREATE INDEX "TacheMission_missionId_idx" ON "TacheMission"("missionId");

-- CreateIndex
CREATE INDEX "TacheMission_responsableId_idx" ON "TacheMission"("responsableId");

-- CreateIndex
CREATE INDEX "MissionParticipant_missionId_idx" ON "MissionParticipant"("missionId");

-- CreateIndex
CREATE INDEX "MissionParticipant_utilisateurId_idx" ON "MissionParticipant"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionParticipant_missionId_utilisateurId_key" ON "MissionParticipant"("missionId", "utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "ContratClient_numero_key" ON "ContratClient"("numero");

-- CreateIndex
CREATE INDEX "ContratClient_partenaireId_idx" ON "ContratClient"("partenaireId");

-- CreateIndex
CREATE INDEX "ContratClient_statut_idx" ON "ContratClient"("statut");

-- CreateIndex
CREATE INDEX "EcheanceContrat_contratId_idx" ON "EcheanceContrat"("contratId");

-- CreateIndex
CREATE INDEX "EcheanceContrat_statut_idx" ON "EcheanceContrat"("statut");

-- CreateIndex
CREATE INDEX "Salaire_employeId_idx" ON "Salaire"("employeId");

-- CreateIndex
CREATE INDEX "Salaire_mois_idx" ON "Salaire"("mois");

-- CreateIndex
CREATE INDEX "Salaire_statut_idx" ON "Salaire"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Salaire_employeId_mois_key" ON "Salaire"("employeId", "mois");

-- CreateIndex
CREATE INDEX "Abonnement_type_idx" ON "Abonnement"("type");

-- CreateIndex
CREATE INDEX "Abonnement_statut_idx" ON "Abonnement"("statut");

-- CreateIndex
CREATE INDEX "Abonnement_dateProchainePaiement_idx" ON "Abonnement"("dateProchainePaiement");

-- CreateIndex
CREATE INDEX "EcheanceAbonnement_abonnementId_idx" ON "EcheanceAbonnement"("abonnementId");

-- CreateIndex
CREATE INDEX "EcheanceAbonnement_statut_idx" ON "EcheanceAbonnement"("statut");

-- CreateIndex
CREATE INDEX "EcheanceAbonnement_dateEcheance_idx" ON "EcheanceAbonnement"("dateEcheance");

-- CreateIndex
CREATE UNIQUE INDEX "ContratPrestataire_numero_key" ON "ContratPrestataire"("numero");

-- CreateIndex
CREATE INDEX "ContratPrestataire_partenaireId_idx" ON "ContratPrestataire"("partenaireId");

-- CreateIndex
CREATE INDEX "ContratPrestataire_statut_idx" ON "ContratPrestataire"("statut");

-- CreateIndex
CREATE INDEX "Famille_categorieId_idx" ON "Famille"("categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "Famille_nom_categorieId_key" ON "Famille"("nom", "categorieId");

-- CreateIndex
CREATE INDEX "ProjetImageFolder_projetId_idx" ON "ProjetImageFolder"("projetId");

-- CreateIndex
CREATE INDEX "ProjetImage_projetId_idx" ON "ProjetImage"("projetId");

-- CreateIndex
CREATE INDEX "ProjetImage_folderId_idx" ON "ProjetImage"("folderId");

-- CreateIndex
CREATE INDEX "InterventionDocument_interventionId_idx" ON "InterventionDocument"("interventionId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEmailList_eventKey_key" ON "NotificationEmailList"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_reference_key" ON "Facture"("reference");

-- CreateIndex
CREATE INDEX "Facture_partenaireId_idx" ON "Facture"("partenaireId");

-- CreateIndex
CREATE INDEX "Facture_devisId_idx" ON "Facture"("devisId");

-- CreateIndex
CREATE INDEX "Facture_statut_idx" ON "Facture"("statut");

-- CreateIndex
CREATE INDEX "Facture_date_idx" ON "Facture"("date");

-- CreateIndex
CREATE INDEX "FactureLigne_factureId_idx" ON "FactureLigne"("factureId");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_reference_key" ON "Paiement"("reference");

-- CreateIndex
CREATE INDEX "Paiement_factureId_idx" ON "Paiement"("factureId");

-- CreateIndex
CREATE INDEX "Paiement_date_idx" ON "Paiement"("date");

-- CreateIndex
CREATE INDEX "Client_telephone_idx" ON "Client"("telephone");

-- CreateIndex
CREATE INDEX "Client_nom_idx" ON "Client"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_reference_key" ON "Commande"("reference");

-- CreateIndex
CREATE INDEX "Commande_clientId_idx" ON "Commande"("clientId");

-- CreateIndex
CREATE INDEX "Commande_statut_idx" ON "Commande"("statut");

-- CreateIndex
CREATE INDEX "Commande_date_idx" ON "Commande"("date");

-- CreateIndex
CREATE INDEX "CommandeLigne_commandeId_idx" ON "CommandeLigne"("commandeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProduitEmarket_produitId_key" ON "ProduitEmarket"("produitId");

-- CreateIndex
CREATE INDEX "ProduitEmarket_isPublished_idx" ON "ProduitEmarket"("isPublished");

-- CreateIndex
CREATE INDEX "Modele_familleId_idx" ON "Modele"("familleId");

-- CreateIndex
CREATE INDEX "Operation_responsableId_idx" ON "Operation"("responsableId");

-- CreateIndex
CREATE INDEX "Produit_familleId_idx" ON "Produit"("familleId");

-- AddForeignKey
ALTER TABLE "DocumentEmploye" ADD CONSTRAINT "DocumentEmploye_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheTransport" ADD CONSTRAINT "FicheTransport_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransport" ADD CONSTRAINT "LigneTransport_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "FicheTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneTransport" ADD CONSTRAINT "LigneTransport_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remboursement" ADD CONSTRAINT "Remboursement_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRemboursement" ADD CONSTRAINT "DocumentRemboursement_remboursementId_fkey" FOREIGN KEY ("remboursementId") REFERENCES "Remboursement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementRemboursement" ADD CONSTRAINT "PaiementRemboursement_remboursementId_fkey" FOREIGN KEY ("remboursementId") REFERENCES "Remboursement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FicheMission" ADD CONSTRAINT "FicheMission_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheMission" ADD CONSTRAINT "TacheMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "FicheMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TacheMission" ADD CONSTRAINT "TacheMission_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "FicheMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratClient" ADD CONSTRAINT "ContratClient_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcheanceContrat" ADD CONSTRAINT "EcheanceContrat_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "ContratClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salaire" ADD CONSTRAINT "Salaire_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcheanceAbonnement" ADD CONSTRAINT "EcheanceAbonnement_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "Abonnement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratPrestataire" ADD CONSTRAINT "ContratPrestataire_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Famille" ADD CONSTRAINT "Famille_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modele" ADD CONSTRAINT "Modele_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "Famille"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_partenaireDstId_fkey" FOREIGN KEY ("partenaireDstId") REFERENCES "Partenaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetImageFolder" ADD CONSTRAINT "ProjetImageFolder_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetImage" ADD CONSTRAINT "ProjetImage_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetImage" ADD CONSTRAINT "ProjetImage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ProjetImageFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionDocument" ADD CONSTRAINT "InterventionDocument_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactureLigne" ADD CONSTRAINT "FactureLigne_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactureLigne" ADD CONSTRAINT "FactureLigne_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeLigne" ADD CONSTRAINT "CommandeLigne_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeLigne" ADD CONSTRAINT "CommandeLigne_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitEmarket" ADD CONSTRAINT "ProduitEmarket_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

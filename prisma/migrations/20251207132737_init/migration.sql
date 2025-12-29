-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'technicien',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "inviteToken" TEXT,
    "inviteExpires" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetExpires" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employe" (
    "id" TEXT NOT NULL,
    "photo" BYTEA,
    "photoFilename" TEXT,
    "photoMime" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3),
    "dateEmbauche" TIMESTAMP(3) NOT NULL,
    "poste" TEXT NOT NULL,
    "departement" TEXT,
    "cv" BYTEA,
    "cvFilename" TEXT,
    "cvMime" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "salaire" DOUBLE PRECISION,
    "typeContrat" TEXT,
    "utilisateurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeAbsence" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemandeAbsence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fichier" BYTEA NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "taille" INTEGER,
    "dossierId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evenement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "journeeEntiere" BOOLEAN NOT NULL DEFAULT false,
    "dureeEstimee" INTEGER,
    "lieu" TEXT,
    "couleur" TEXT,
    "rappel" BOOLEAN NOT NULL DEFAULT false,
    "rappelDelai" INTEGER,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "recurrence" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evenement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementParticipant" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'invite',

    CONSTRAINT "EvenementParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marque" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Marque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modele" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "marqueId" TEXT NOT NULL,

    CONSTRAINT "Modele_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emplacement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Emplacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fournisseur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "gtin" TEXT,
    "poids" DOUBLE PRECISION,
    "couleur" TEXT,
    "prixAchat" DOUBLE PRECISION,
    "coutLogistique" DOUBLE PRECISION,
    "prixVente" DOUBLE PRECISION,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seuilAlerte" INTEGER,
    "marqueId" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "modeleId" TEXT NOT NULL,
    "emplacementId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "seoSlug" TEXT,
    "promoPrice" DOUBLE PRECISION,
    "promoStart" TIMESTAMP(3),
    "promoEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitImage" (
    "id" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProduitImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementStock" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "produitId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "demandeurId" TEXT,
    "fournisseurId" TEXT,
    "destination" TEXT,
    "projetId" TEXT,
    "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "justificatifFilename" TEXT,
    "justificatifMime" TEXT,
    "justificatifData" BYTEA,
    "prixVenteDefinitif" DOUBLE PRECISION,
    "commentaire" TEXT,

    CONSTRAINT "MouvementStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partenaire" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT,
    "secteur" TEXT,
    "adresse" TEXT,
    "ville" TEXT,
    "pays" TEXT,
    "email" TEXT,
    "telephone1" TEXT,
    "telephone2" TEXT,
    "siteWeb" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partenaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "fonction" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "partenaireId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT,
    "partenaireId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "montant" DOUBLE PRECISION,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "fichier" BYTEA,
    "filename" TEXT,
    "mime" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "reference" TEXT,
    "partenaireId" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "devisEstimatif" DOUBLE PRECISION,
    "dureeJours" INTEGER,
    "dateDebut" TIMESTAMP(3),
    "dateFinEstimative" TIMESTAMP(3),
    "dateFinReelle" TIMESTAMP(3),
    "etat" TEXT NOT NULL DEFAULT 'planifie',
    "lieu" TEXT,
    "responsableId" TEXT,
    "description" TEXT,
    "priorite" TEXT NOT NULL DEFAULT 'moyenne',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Projet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjetDocument" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "fichier" BYTEA NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "priorite" TEXT NOT NULL DEFAULT 'moyenne',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "progression" INTEGER NOT NULL DEFAULT 0,
    "projetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tache" (
    "id" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "priorite" TEXT NOT NULL DEFAULT 'moyenne',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "operationId" TEXT NOT NULL,
    "assigneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livrable" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_attente',
    "fichier" BYTEA,
    "filename" TEXT,
    "mime" TEXT,
    "projetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livrable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "partenaireId" TEXT NOT NULL,
    "contratId" TEXT,
    "problemeSignale" TEXT NOT NULL,
    "typeMaintenance" TEXT NOT NULL,
    "typeDefaillance" TEXT,
    "causeDefaillance" TEXT,
    "rapport" TEXT,
    "recommandations" TEXT,
    "dureeMinutes" INTEGER,
    "modeIntervention" TEXT,
    "lieu" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "superviseurId" TEXT,
    "ficheSignee" BYTEA,
    "ficheSigneeFilename" TEXT,
    "ficheSigneeMime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionIntervenant" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InterventionIntervenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailConfig" (
    "id" TEXT NOT NULL,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpFrom" TEXT,
    "smtpFromName" TEXT,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmails" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objet" TEXT NOT NULL,
    "clientType" TEXT NOT NULL,
    "clientNom" TEXT NOT NULL,
    "clientAdresse" TEXT,
    "clientVille" TEXT,
    "clientPays" TEXT NOT NULL DEFAULT 'Côte d''Ivoire',
    "clientEmail" TEXT,
    "clientTelephone" TEXT,
    "partenaireId" TEXT,
    "delaiLivraison" TEXT,
    "conditionLivraison" TEXT,
    "validiteOffre" INTEGER NOT NULL DEFAULT 30,
    "garantie" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "pdfGenerated" BOOLEAN NOT NULL DEFAULT false,
    "pdfData" BYTEA,
    "pdfFilename" TEXT,
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevisLigne" (
    "id" TEXT NOT NULL,
    "devisId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevisLigne_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_username_key" ON "Utilisateur"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_inviteToken_key" ON "Utilisateur"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_resetToken_key" ON "Utilisateur"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_utilisateurId_key" ON "Employe"("utilisateurId");

-- CreateIndex
CREATE INDEX "Dossier_type_idx" ON "Dossier"("type");

-- CreateIndex
CREATE INDEX "Dossier_parentId_idx" ON "Dossier"("parentId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Document_dossierId_idx" ON "Document"("dossierId");

-- CreateIndex
CREATE INDEX "Evenement_dateDebut_idx" ON "Evenement"("dateDebut");

-- CreateIndex
CREATE INDEX "Evenement_type_idx" ON "Evenement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "EvenementParticipant_evenementId_userId_key" ON "EvenementParticipant"("evenementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_nom_key" ON "Categorie"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Marque_nom_key" ON "Marque"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Modele_nom_marqueId_key" ON "Modele"("nom", "marqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Emplacement_nom_key" ON "Emplacement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_nom_key" ON "Fournisseur"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_sku_key" ON "Produit"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_gtin_key" ON "Produit"("gtin");

-- CreateIndex
CREATE UNIQUE INDEX "Produit_seoSlug_key" ON "Produit"("seoSlug");

-- CreateIndex
CREATE INDEX "Produit_marqueId_idx" ON "Produit"("marqueId");

-- CreateIndex
CREATE INDEX "Produit_categorieId_idx" ON "Produit"("categorieId");

-- CreateIndex
CREATE INDEX "Produit_modeleId_idx" ON "Produit"("modeleId");

-- CreateIndex
CREATE INDEX "Produit_isPublished_idx" ON "Produit"("isPublished");

-- CreateIndex
CREATE INDEX "ProduitImage_produitId_idx" ON "ProduitImage"("produitId");

-- CreateIndex
CREATE INDEX "MouvementStock_produitId_idx" ON "MouvementStock"("produitId");

-- CreateIndex
CREATE INDEX "MouvementStock_date_idx" ON "MouvementStock"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Partenaire_nom_key" ON "Partenaire"("nom");

-- CreateIndex
CREATE INDEX "Contact_partenaireId_idx" ON "Contact"("partenaireId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrat_numero_key" ON "Contrat"("numero");

-- CreateIndex
CREATE INDEX "Contrat_partenaireId_idx" ON "Contrat"("partenaireId");

-- CreateIndex
CREATE INDEX "Contrat_statut_idx" ON "Contrat"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Projet_reference_key" ON "Projet"("reference");

-- CreateIndex
CREATE INDEX "Projet_partenaireId_idx" ON "Projet"("partenaireId");

-- CreateIndex
CREATE INDEX "Projet_etat_idx" ON "Projet"("etat");

-- CreateIndex
CREATE INDEX "Projet_responsableId_idx" ON "Projet"("responsableId");

-- CreateIndex
CREATE INDEX "ProjetDocument_projetId_idx" ON "ProjetDocument"("projetId");

-- CreateIndex
CREATE INDEX "Operation_projetId_idx" ON "Operation"("projetId");

-- CreateIndex
CREATE INDEX "Operation_statut_idx" ON "Operation"("statut");

-- CreateIndex
CREATE INDEX "Tache_operationId_idx" ON "Tache"("operationId");

-- CreateIndex
CREATE INDEX "Tache_assigneId_idx" ON "Tache"("assigneId");

-- CreateIndex
CREATE INDEX "Livrable_projetId_idx" ON "Livrable"("projetId");

-- CreateIndex
CREATE UNIQUE INDEX "Intervention_reference_key" ON "Intervention"("reference");

-- CreateIndex
CREATE INDEX "Intervention_partenaireId_idx" ON "Intervention"("partenaireId");

-- CreateIndex
CREATE INDEX "Intervention_date_idx" ON "Intervention"("date");

-- CreateIndex
CREATE INDEX "Intervention_statut_idx" ON "Intervention"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionIntervenant_interventionId_userId_key" ON "InterventionIntervenant"("interventionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AppConfig_key_key" ON "AppConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_reference_key" ON "Devis"("reference");

-- CreateIndex
CREATE INDEX "Devis_reference_idx" ON "Devis"("reference");

-- CreateIndex
CREATE INDEX "Devis_date_idx" ON "Devis"("date");

-- CreateIndex
CREATE INDEX "Devis_statut_idx" ON "Devis"("statut");

-- CreateIndex
CREATE INDEX "Devis_clientNom_idx" ON "Devis"("clientNom");

-- CreateIndex
CREATE INDEX "DevisLigne_devisId_idx" ON "DevisLigne"("devisId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employe" ADD CONSTRAINT "Employe_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeAbsence" ADD CONSTRAINT "DemandeAbsence_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementParticipant" ADD CONSTRAINT "EvenementParticipant_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementParticipant" ADD CONSTRAINT "EvenementParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modele" ADD CONSTRAINT "Modele_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Modele" ADD CONSTRAINT "Modele_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "Marque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_modeleId_fkey" FOREIGN KEY ("modeleId") REFERENCES "Modele"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_emplacementId_fkey" FOREIGN KEY ("emplacementId") REFERENCES "Emplacement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitImage" ADD CONSTRAINT "ProduitImage_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_demandeurId_fkey" FOREIGN KEY ("demandeurId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "Fournisseur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementStock" ADD CONSTRAINT "MouvementStock_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projet" ADD CONSTRAINT "Projet_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjetDocument" ADD CONSTRAINT "ProjetDocument_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tache" ADD CONSTRAINT "Tache_assigneId_fkey" FOREIGN KEY ("assigneId") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livrable" ADD CONSTRAINT "Livrable_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_contratId_fkey" FOREIGN KEY ("contratId") REFERENCES "Contrat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_superviseurId_fkey" FOREIGN KEY ("superviseurId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionIntervenant" ADD CONSTRAINT "InterventionIntervenant_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionIntervenant" ADD CONSTRAINT "InterventionIntervenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_partenaireId_fkey" FOREIGN KEY ("partenaireId") REFERENCES "Partenaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisLigne" ADD CONSTRAINT "DevisLigne_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevisLigne" ADD CONSTRAINT "DevisLigne_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

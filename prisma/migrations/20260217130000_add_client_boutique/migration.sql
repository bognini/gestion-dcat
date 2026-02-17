-- CreateTable
CREATE TABLE "ClientBoutique" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),
    "clientId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBoutique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientBoutiqueSession" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientBoutiqueSession_pkey" PRIMARY KEY ("id")
);

-- Add clientBoutiqueId to Commande
ALTER TABLE "Commande" ADD COLUMN "clientBoutiqueId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientBoutique_email_key" ON "ClientBoutique"("email");
CREATE UNIQUE INDEX "ClientBoutique_verificationToken_key" ON "ClientBoutique"("verificationToken");
CREATE UNIQUE INDEX "ClientBoutique_resetToken_key" ON "ClientBoutique"("resetToken");
CREATE UNIQUE INDEX "ClientBoutique_clientId_key" ON "ClientBoutique"("clientId");
CREATE INDEX "ClientBoutique_email_idx" ON "ClientBoutique"("email");
CREATE INDEX "ClientBoutique_telephone_idx" ON "ClientBoutique"("telephone");

CREATE UNIQUE INDEX "ClientBoutiqueSession_token_key" ON "ClientBoutiqueSession"("token");

CREATE INDEX "Commande_clientBoutiqueId_idx" ON "Commande"("clientBoutiqueId");

-- AddForeignKey
ALTER TABLE "ClientBoutique" ADD CONSTRAINT "ClientBoutique_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ClientBoutiqueSession" ADD CONSTRAINT "ClientBoutiqueSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientBoutique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Commande" ADD CONSTRAINT "Commande_clientBoutiqueId_fkey" FOREIGN KEY ("clientBoutiqueId") REFERENCES "ClientBoutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "ClientBoutique_emailVerificationToken_key";

-- CreateTable
CREATE TABLE "Sequence" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClientBoutiqueSession_token_idx" ON "ClientBoutiqueSession"("token");

-- Amorçage des compteurs à partir des références existantes (continuité de la numérotation)
INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'intervention:' || split_part("reference", '-', 1), MAX(split_part("reference", '-', 2)::int), NOW()
FROM "Intervention" WHERE "reference" ~ '^[0-9]{4}-[0-9]+$' GROUP BY 1
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'facture:' || split_part("reference", '-', 2), MAX(split_part("reference", '-', 3)::int), NOW()
FROM "Facture" WHERE "reference" ~ '^FAC-[0-9]{4}-[0-9]+$' GROUP BY 1
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'paiement:' || split_part("reference", '-', 2), MAX(split_part("reference", '-', 3)::int), NOW()
FROM "Paiement" WHERE "reference" ~ '^PAY-[0-9]{4}-[0-9]+$' GROUP BY 1
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'commande:' || split_part("reference", '-', 2), MAX(split_part("reference", '-', 3)::int), NOW()
FROM "Commande" WHERE "reference" ~ '^CMD-[0-9]{4}-[0-9]+$' GROUP BY 1
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'projet', MAX(split_part("reference", '-', 2)::int), NOW()
FROM "Projet" WHERE "reference" ~ '^PRJ-[0-9]+$'
HAVING MAX(split_part("reference", '-', 2)::int) IS NOT NULL
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

INSERT INTO "Sequence" ("key", "value", "updatedAt")
SELECT 'sku:' || split_part("sku", '-', 1), MAX(split_part("sku", '-', 2)::int), NOW()
FROM "Produit" WHERE "sku" ~ '^(PRD|GEN)-[0-9]+$' GROUP BY 1
ON CONFLICT ("key") DO UPDATE SET "value" = GREATEST("Sequence"."value", EXCLUDED."value");

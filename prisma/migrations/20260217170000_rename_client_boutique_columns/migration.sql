-- Rename columns on ClientBoutique to match updated schema
ALTER TABLE "ClientBoutique" RENAME COLUMN "password" TO "passwordHash";
ALTER TABLE "ClientBoutique" RENAME COLUMN "emailVerified" TO "isEmailVerified";
ALTER TABLE "ClientBoutique" RENAME COLUMN "verificationToken" TO "emailVerificationToken";
ALTER TABLE "ClientBoutique" RENAME COLUMN "verificationExpires" TO "emailVerificationExpiry";

-- Drop columns that are no longer in the schema
ALTER TABLE "ClientBoutique" DROP COLUMN IF EXISTS "resetToken";
ALTER TABLE "ClientBoutique" DROP COLUMN IF EXISTS "resetTokenExpires";
ALTER TABLE "ClientBoutique" DROP COLUMN IF EXISTS "isActive";

-- Rename clientId to clientBoutiqueId on ClientBoutiqueSession
ALTER TABLE "ClientBoutiqueSession" DROP CONSTRAINT IF EXISTS "ClientBoutiqueSession_clientId_fkey";
ALTER TABLE "ClientBoutiqueSession" RENAME COLUMN "clientId" TO "clientBoutiqueId";
ALTER TABLE "ClientBoutiqueSession" ADD CONSTRAINT "ClientBoutiqueSession_clientBoutiqueId_fkey"
  FOREIGN KEY ("clientBoutiqueId") REFERENCES "ClientBoutique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old indexes and create new ones
DROP INDEX IF EXISTS "ClientBoutique_verificationToken_key";
DROP INDEX IF EXISTS "ClientBoutique_resetToken_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ClientBoutique_emailVerificationToken_key" ON "ClientBoutique"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS "ClientBoutiqueSession_clientBoutiqueId_idx" ON "ClientBoutiqueSession"("clientBoutiqueId");

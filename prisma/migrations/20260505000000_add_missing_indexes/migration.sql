-- Add missing indexes for frequently queried fields
-- IF NOT EXISTS makes this migration safe to re-run if partially applied

-- Utilisateur: role and isActive are filtered in auth and permission checks
CREATE INDEX IF NOT EXISTS "Utilisateur_role_idx" ON "Utilisateur"("role");
CREATE INDEX IF NOT EXISTS "Utilisateur_isActive_idx" ON "Utilisateur"("isActive");

-- Partenaire: type filter used in /api/partenaires?type=
CREATE INDEX IF NOT EXISTS "Partenaire_type_idx" ON "Partenaire"("type");

-- Produit: emplacementId used in stock location queries
CREATE INDEX IF NOT EXISTS "Produit_emplacementId_idx" ON "Produit"("emplacementId");

# Plan d'Intégration Stock → DCAT E-Market

## Objectif
Permettre la publication des articles du stock interne vers la boutique en ligne DCAT E-Market pour la vente directe aux clients.

---

## Architecture Proposée

### 1. Modèle de Données

#### Nouveau modèle `ArticleEmarket`
```prisma
model ArticleEmarket {
  id              String   @id @default(uuid())
  produitId       String
  produit         Produit  @relation(fields: [produitId], references: [id])
  prixVente       Float    // Prix de vente public
  prixPromo       Float?   // Prix promotionnel (optionnel)
  enPromotion     Boolean  @default(false)
  dateDebutPromo  DateTime?
  dateFinPromo    DateTime?
  publie          Boolean  @default(false) // Visible sur E-Market
  description     String?  // Description marketing
  motsCles        String?  // Pour la recherche
  ordre           Int      @default(0) // Ordre d'affichage
  vues            Int      @default(0) // Compteur de vues
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([produitId])
  @@index([publie])
}
```

### 2. Fonctionnalités Côté Admin (Gestion de Stock)

#### Page `/stock/produits/[id]` - Onglet E-Market
- **Publier sur E-Market** : Bouton pour créer/activer l'article
- **Prix de vente** : Définir le prix public (différent du prix interne)
- **Promotion** : Activer une promo avec dates et prix réduit
- **Description marketing** : Texte enrichi pour la page produit
- **Mots-clés** : Pour améliorer la recherche
- **Aperçu** : Voir comment le produit apparaîtra

#### Page `/stock/emarket` - Gestion des Articles Publiés
- Liste des produits publiés sur E-Market
- Statistiques de ventes par produit
- Gestion des promotions en cours
- Import/Export en masse

### 3. Fonctionnalités Côté E-Market

#### Catalogue Produits
- Affichage des produits publiés avec stock > 0
- Filtrage par catégorie/famille/marque
- Recherche par nom, SKU, mots-clés
- Tri par prix, popularité, nouveautés

#### Page Produit
- Images du produit (depuis Produit.images)
- Description marketing
- Prix (normal et promo si applicable)
- Disponibilité en temps réel
- Bouton "Ajouter au panier"

#### Panier & Commande
- Vérification du stock en temps réel
- Calcul automatique TVA
- Génération de devis/facture
- Notification de rupture de stock

### 4. Synchronisation Stock

#### Règles de Synchronisation
1. **Stock disponible** = `Produit.quantite` - Réservations en cours
2. **Réservation automatique** lors de l'ajout au panier (durée limitée)
3. **Décrémentation stock** à la confirmation de commande
4. **Alerte automatique** si stock < seuil après vente

#### Flux de Commande
```
1. Client ajoute au panier → Réservation temporaire (30 min)
2. Validation commande → MouvementStock type "SORTIE_EMARKET"
3. Expédition → Mise à jour statut commande
4. Annulation → Libération stock (MouvementStock type "ANNULATION_EMARKET")
```

### 5. API Routes à Créer

```
POST   /api/emarket/articles           - Publier un produit
PUT    /api/emarket/articles/[id]      - Modifier article E-Market
DELETE /api/emarket/articles/[id]      - Retirer de E-Market
GET    /api/emarket/catalogue          - Liste publique des produits
GET    /api/emarket/produit/[id]       - Détail produit public
POST   /api/emarket/panier             - Gérer le panier
POST   /api/emarket/commande           - Créer commande
```

### 6. Composants UI à Créer

#### Admin
- `ArticleEmarketForm` - Formulaire de publication
- `PromoManager` - Gestion des promotions
- `StockSyncStatus` - Indicateur de synchronisation

#### E-Market Public
- `ProductCard` - Carte produit dans le catalogue
- `ProductDetail` - Page détail produit
- `CartDrawer` - Panier latéral
- `CheckoutForm` - Formulaire de commande

---

## Phases de Développement

### Phase 1 : Infrastructure (1-2 semaines)
- [ ] Créer le modèle `ArticleEmarket`
- [ ] Créer les API routes de base
- [ ] Interface admin de publication

### Phase 2 : Catalogue Public (1-2 semaines)
- [ ] Page catalogue E-Market
- [ ] Page détail produit
- [ ] Système de recherche/filtres

### Phase 3 : Panier & Commande (2-3 semaines)
- [ ] Gestion du panier
- [ ] Processus de commande
- [ ] Intégration avec Commande existante
- [ ] Synchronisation stock automatique

### Phase 4 : Optimisations (1 semaine)
- [ ] Promotions et prix spéciaux
- [ ] Statistiques de ventes
- [ ] Notifications stock
- [ ] Tests et ajustements

---

## Notes Techniques

### Gestion des Images
Les images sont déjà stockées dans `Produit.images` (JSON). Pour E-Market :
- Image principale = première image
- Galerie = toutes les images
- Possibilité d'ajouter des images spécifiques E-Market

### Sécurité
- Les prix internes (achat, revient) ne sont JAMAIS exposés
- Seul le prix de vente E-Market est visible publiquement
- Authentification requise pour les achats

### Performance
- Cache des produits publiés
- Pagination du catalogue
- Lazy loading des images

---

## Estimation Globale
**Durée totale estimée : 5-8 semaines**

Cette intégration permettra de :
1. Vendre les produits du stock directement en ligne
2. Gérer automatiquement les niveaux de stock
3. Offrir une expérience d'achat moderne aux clients
4. Centraliser la gestion stock/ventes dans une seule application

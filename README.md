# Gestion DCAT

Application ERP complète pour la gestion interne de DCAT - Administration, Stock, Projets, Interventions et Marketing.

## 🌐 Production URLs

| Service | URL |
|---------|-----|
| **Gestion App** | https://gestion.dcat.ci |
| **E-Market Store** | https://emarket.dcat.ci |

> 📚 **Full deployment documentation**: See [docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md) for server configs, Docker setup, environment variables, and deployment steps.

## 🚀 Fonctionnalités

- **Administration** : Gestion administrative, Finance & Comptabilité, Ressources Humaines
- **Calendrier** : Planning des réunions et programmes des équipes (style Google Calendar)
- **Gestion de Stock** : Mouvements de stock, produits, emplacements
- **Technique** : Gestion des projets (opérations, tâches, livrables), Interventions
- **Marketing & Commercial** : E-commerce (DCAT emarket), Statistiques
- **Paramètres** : Configuration des références, utilisateurs, options système

## 🛠️ Stack Technique

- **Framework** : Next.js 15 (App Router)
- **Base de données** : PostgreSQL 15
- **ORM** : Prisma
- **UI** : shadcn/ui + Tailwind CSS
- **Auth** : Custom auth system (TinyAuth style)
- **Déploiement** : Docker + Traefik

## 📋 Prérequis

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (ou via Docker)

## 🏃 Démarrage rapide

### 1. Cloner le repo

```bash
git clone https://github.com/bognini/gestion-dcat.git
cd gestion-dcat
```

### 2. Configuration

Copier le fichier d'environnement :

```bash
cp .env.example .env
```

Modifier les variables dans `.env` :

```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/gestion_dcat"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=gestion_dcat

# Auth
AUTH_SECRET=your_super_secret_key_min_32_chars

# SMTP (pour les emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASS=your_password
SMTP_FROM=noreply@dcat.ci

# App URL
NEXT_PUBLIC_APP_URL=https://gestion.dcat.ci
```

### 3. Installation locale

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma migrate dev

# Lancer en développement
npm run dev
```

L'application sera accessible sur http://localhost:3000

### 4. Déploiement avec Docker

```bash
# Build et démarrage
docker compose up -d --build

# Voir les logs
docker compose logs -f web
```

## 🔐 Authentification

### Première connexion

1. Accéder à l'application
2. Utiliser les identifiants par défaut : `admin` / `admin`
3. Créer votre compte administrateur sécurisé

### Exigences mot de passe

- Minimum 8 caractères
- Au moins une lettre minuscule
- Au moins une lettre majuscule
- Au moins un chiffre
- Au moins un caractère spécial

### Groupes d'utilisateurs

| Groupe | Accès |
|--------|-------|
| Administrateur | Accès complet |
| Technicien | Calendrier, Stock, Technique |
| Marketing | Calendrier, Stock (lecture), Technique (lecture), Marketing |
| Comptable | Calendrier, Administration (Finance - lecture) |

## 🌐 Configuration DNS

Les domaines `gestion.dcat.ci` et `emarket.dcat.ci` sont configurés via Nginx Proxy Manager. Voir [docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md) pour les détails.

## 📁 Structure du projet

```
gestion-dcat/
├── src/
│   ├── app/
│   │   ├── (app)/              # Routes protégées
│   │   │   ├── accueil/        # Dashboard principal
│   │   │   ├── administration/
│   │   │   ├── calendrier/
│   │   │   ├── stock/
│   │   │   ├── technique/
│   │   │   ├── marketing/
│   │   │   └── parametres/
│   │   ├── api/                # API Routes
│   │   └── page.tsx            # Page de connexion
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   └── providers/
│   ├── hooks/
│   └── lib/
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
└── Dockerfile
```

## 🐳 Docker

### Production avec Traefik

```bash
docker compose up -d
```

### Développement

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Commandes utiles

```bash
# Rebuild
docker compose up -d --build

# Logs
docker compose logs -f

# Shell dans le container
docker compose exec web sh

# Migrations Prisma
docker compose exec web npx prisma migrate deploy
```

## 📝 License

Propriétaire - DCAT © 2024

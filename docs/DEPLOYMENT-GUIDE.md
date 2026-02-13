# DCAT Gestion - Deployment Guide

This document contains all important configurations and deployment information for the DCAT Gestion application.

---

## 🌐 Production URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Gestion App** | https://gestion.dcat.ci | Management dashboard (login, inventory, invoices, etc.) |
| **E-Market Store** | https://emarket.dcat.ci | Online store (redirects to /boutique) |
| **Health Check** | https://gestion.dcat.ci/api/health | Monitoring endpoint |

---

## 🖥️ Server Information

### Proxmox VM
| Property | Value |
|----------|-------|
| **Public IP** | 160.155.113.10 |
| **Private IP** | 172.23.98.146 |
| **SSH User** | deploy |
| **SSH Password** | kindP@rrot59 |
| **OS** | Ubuntu 24.04.3 LTS |
| **App Directory** | ~/gestion-dcat |

### SSH Access
```bash
ssh deploy@172.23.98.146
# Password: kindP@rrot59
```

---

## 🐳 Docker Configuration

### Production Containers (on VM)
| Container | Image | Port | Restart Policy |
|-----------|-------|------|----------------|
| gestion_dcat_web | gestion-dcat-web | 3000 | unless-stopped |
| gestion_dcat_db | postgres:15-alpine | 5432 | always |

### Docker Commands (on VM)
```bash
# View running containers
docker ps

# View logs
docker logs gestion_dcat_web --tail 100
docker logs gestion_dcat_db --tail 100

# Restart containers
cd ~/gestion-dcat
docker compose -f docker-compose.prod.yml restart

# Rebuild and restart (after code changes)
cd ~/gestion-dcat
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker compose -f docker-compose.prod.yml exec -T web npx prisma migrate deploy
```

### Local Development with Docker
```bash
# Start local containers
docker compose up -d

# Or run the app container manually
docker run -d --name gestion_dcat_app \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://admindcatdb:REDACTED_PASSWORD@host.docker.internal:5432/gestion_dcat?schema=public" \
  -e AUTH_SECRET="REDACTED_SECRET" \
  -e NODE_ENV=production \
  gestion-dcat:latest
```

---

## 🔐 Environment Variables

### Production (.env on VM)
```env
# Database
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@db:5432/<DB_NAME>?schema=public"
POSTGRES_USER=<DB_USER>
POSTGRES_PASSWORD=<DB_PASSWORD>
POSTGRES_DB=<DB_NAME>

# Authentication
AUTH_SECRET=<GENERATE_A_STRONG_RANDOM_SECRET_64_CHARS_MIN>

# SMTP Configuration
SMTP_HOST=smtp.dcat.ci
SMTP_PORT=587
SMTP_USER=noreply@dcat.ci
SMTP_PASS=<SMTP_PASSWORD>
SMTP_FROM=noreply@dcat.ci

# Application
NEXT_PUBLIC_APP_URL=https://gestion.dcat.ci
NODE_ENV=production

# ACME Email for Let's Encrypt
ACME_EMAIL=admin@dcat.ci
```

> ⚠️ **IMPORTANT**: Never commit real credentials to this file or any tracked file.
> Store production secrets only in the `.env` file on the VM (which is `.gitignore`d).
> If credentials were previously committed, rotate them immediately on the production server.

---

## 🔄 Nginx Proxy Manager Configuration

Both domains point to the same backend (Option 1 setup):

### Proxy Host: gestion.dcat.ci
| Field | Value |
|-------|-------|
| Domain Names | gestion.dcat.ci |
| Scheme | http |
| Forward Hostname/IP | 172.23.98.146 |
| Forward Port | 3000 |
| Websockets Support | ✅ |
| SSL | Let's Encrypt, Force SSL, HTTP/2 |

### Proxy Host: emarket.dcat.ci
| Field | Value |
|-------|-------|
| Domain Names | emarket.dcat.ci |
| Scheme | http |
| Forward Hostname/IP | 172.23.98.146 |
| Forward Port | 3000 |
| Websockets Support | ✅ |
| SSL | Let's Encrypt, Force SSL, HTTP/2 |

**Custom Nginx Config for emarket.dcat.ci (Advanced tab):**
```nginx
location = / {
    return 301 /boutique;
}
```

---

## 📦 GitHub Repository

| Property | Value |
|----------|-------|
| **Repository** | https://github.com/bognini/gestion-dcat |
| **Branch** | main |
| **Username** | ja.bognini@gmail.com (bognini) |

### GitHub Actions Workflows
1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Runs on push/PR to main
   - Builds, type-checks, and creates Docker image
   - Pushes to GitHub Container Registry

2. **Deploy to Production** (`.github/workflows/deploy.yml`)
   - Manual trigger only (workflow_dispatch)
   - Requires secrets: SERVER_HOST, SERVER_USER, SERVER_SSH_KEY, SERVER_PORT
   - Note: Auto-deploy is disabled because VM is on private network

### Required GitHub Secrets (for manual deploy)
| Secret | Value |
|--------|-------|
| SERVER_HOST | 172.23.98.146 |
| SERVER_USER | deploy |
| SERVER_SSH_KEY | (SSH private key) |
| SERVER_PORT | 22 |

---

## 📊 Monitoring

### UptimeRobot
| Monitor | URL |
|---------|-----|
| DCAT Gestion | https://gestion.dcat.ci/api/health |
| DCAT E-Market | https://emarket.dcat.ci/boutique |

---

## 🔧 Manual Deployment Steps

When you need to deploy updates to the VM:

```bash
# 1. SSH into VM
ssh deploy@172.23.98.146

# 2. Navigate to app directory
cd ~/gestion-dcat

# 3. Pull latest changes
git pull origin main

# 4. Rebuild and restart containers
docker compose -f docker-compose.prod.yml up -d --build

# 5. Run migrations (if any)
docker compose -f docker-compose.prod.yml exec -T web npx prisma migrate deploy

# 6. Clean up old images
docker system prune -f

# 7. Verify deployment
curl -s https://gestion.dcat.ci/api/health
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for Next.js app |
| `docker-compose.yml` | Full setup with Traefik (local dev) |
| `docker-compose.prod.yml` | Production setup for VM (no Traefik) |
| `.env` | Environment variables (gitignored) |
| `.env.example` | Template for environment variables |
| `prisma/schema.prisma` | Database schema |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `.github/workflows/deploy.yml` | Manual deployment workflow |

---

## 📞 Contact Information (Store)

| Field | Value |
|-------|-------|
| Phone | +225 27 21 37 33 63 |
| WhatsApp | +225 07 09 02 96 25 |
| Email | info@dcat.ci, sales@dcat.ci |
| Address | Angré Château, Immeuble BATIM, 1er étage, Porte A108, Abidjan, Côte d'Ivoire |

---

## 🚨 Troubleshooting

### Container not starting
```bash
# Check logs
docker logs gestion_dcat_web

# Check if port is in use
sudo netstat -tlnp | grep 3000
```

### Database connection issues
```bash
# Check if db container is healthy
docker ps

# Access database directly
docker exec -it gestion_dcat_db psql -U admindcatdb -d gestion_dcat
```

### SSL certificate issues
- Check Nginx Proxy Manager dashboard
- Verify DNS points to correct public IP
- Try re-issuing certificate in NPM

---

*Last updated: January 2026*

# Deployment Guide - DCAT Gestion App

## Prerequisites

- Ubuntu 22.04+ VM on Proxmox
- Docker & Docker Compose installed
- Domain `gestion.dcat.ci` pointing to server IP
- SSH access configured

## Server Setup (One-time)

### 1. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/bognini/gestion-dcat.git
sudo chown -R $USER:$USER gestion-dcat
cd gestion-dcat
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with production values
nano .env
```

**Required environment variables:**

```env
# Database
DATABASE_URL="postgresql://admindcatdb:YOUR_SECURE_PASSWORD@db:5432/gestion_dcat?schema=public"
POSTGRES_USER=admindcatdb
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=gestion_dcat

# Authentication (generate with: openssl rand -base64 32)
AUTH_SECRET=YOUR_SECRET_KEY

# Application
NEXT_PUBLIC_APP_URL=https://gestion.dcat.ci

# SMTP (optional)
SMTP_HOST=smtp.dcat.ci
SMTP_PORT=587
SMTP_USER=noreply@dcat.ci
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@dcat.ci

# Let's Encrypt
ACME_EMAIL=admin@dcat.ci
```

### 4. Start Services

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f web
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://gestion.dcat.ci/api/health

# Check Traefik dashboard (remove in production)
# http://YOUR_SERVER_IP:8080
```

## Updating the Application

### Manual Update

```bash
cd /opt/gestion-dcat
git pull origin main
docker compose up -d --build
docker compose exec web npx prisma migrate deploy
docker system prune -f
```

### Automated Updates (via GitHub Actions)

Configure these secrets in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | Server IP or hostname |
| `SERVER_USER` | SSH username |
| `SERVER_SSH_KEY` | Private SSH key |
| `SERVER_PORT` | SSH port (default: 22) |

## Monitoring

### UptimeRobot Setup

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://gestion.dcat.ci/api/health`
   - **Interval:** 5 minutes
3. Configure alerts (email, Telegram, etc.)

### Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f web
docker compose logs -f db

# Restart services
docker compose restart

# Stop all services
docker compose down

# Full rebuild
docker compose down
docker compose up -d --build

# Database backup
docker compose exec db pg_dump -U admindcatdb gestion_dcat > backup_$(date +%Y%m%d).sql

# Database restore
cat backup.sql | docker compose exec -T db psql -U admindcatdb gestion_dcat
```

## Troubleshooting

### SSL Certificate Issues

```bash
# Check Traefik logs
docker compose logs traefik

# Verify domain DNS
dig gestion.dcat.ci
```

### Database Connection Issues

```bash
# Check database status
docker compose exec db pg_isready

# Connect to database
docker compose exec db psql -U admindcatdb gestion_dcat
```

### Application Not Starting

```bash
# Check web logs
docker compose logs web

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

## Security Checklist

- [ ] Change default database password
- [ ] Generate strong AUTH_SECRET
- [ ] Remove Traefik dashboard port (8080) in production
- [ ] Enable firewall (ufw)
- [ ] Set up fail2ban
- [ ] Configure automatic security updates

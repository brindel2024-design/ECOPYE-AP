#!/usr/bin/env bash
# ============================================================================
# ECOPYE — Install one-shot sur VPS Ubuntu 22.04+ (Hostinger KVM 2/4)
# ============================================================================
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/brindel2024-design/ECOPYE-AP/main/infrastructure/scripts/hostinger-vps-setup.sh | sudo bash -s -- <domaine-api> <domaine-web> <email-admin>
#
# Exemple:
#   sudo bash hostinger-vps-setup.sh api.ecopye.fr ecopye.fr admin@ecopye.fr
#
# Ce que le script fait:
#   1. Met à jour le système, installe Docker, Node 20, pnpm, pm2, nginx, certbot, ufw
#   2. Clone le repo dans /opt/ecopye/ECOPYE-AP
#   3. Génère un .env de production avec des secrets aléatoires solides
#   4. Démarre Postgres 16 + Redis 7 via docker compose (bind 127.0.0.1 uniquement)
#   5. Génère les clés JWT RS256 dans secrets/
#   6. Migre la DB, build API + Web, lance PM2
#   7. Configure nginx reverse proxy + certbot HTTPS
#   8. Ouvre ufw (22, 80, 443 uniquement)
#   9. Active pm2 startup systemd
# ============================================================================

set -euo pipefail

API_DOMAIN="${1:-}"
WEB_DOMAIN="${2:-}"
ADMIN_EMAIL="${3:-}"

if [[ -z "$API_DOMAIN" || -z "$WEB_DOMAIN" || -z "$ADMIN_EMAIL" ]]; then
  echo "Usage: $0 <api-domain> <web-domain> <admin-email>"
  echo "Exemple: $0 api.ecopye.fr ecopye.fr admin@ecopye.fr"
  exit 1
fi

REPO_URL="https://github.com/brindel2024-design/ECOPYE-AP.git"
INSTALL_DIR="/opt/ecopye"
APP_DIR="${INSTALL_DIR}/ECOPYE-AP"
APP_USER="ecopye"

log() { echo -e "\n\033[1;32m[+] $*\033[0m"; }
err() { echo -e "\n\033[1;31m[!] $*\033[0m" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Doit être lancé en root (sudo)."
  exit 1
fi

# ----------------------------------------------------------------------------
log "1/9  Mise à jour du système"
# ----------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  git ufw fail2ban \
  build-essential openssl \
  nginx certbot python3-certbot-nginx

# ----------------------------------------------------------------------------
log "2/9  Installation Docker + Compose"
# ----------------------------------------------------------------------------
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# ----------------------------------------------------------------------------
log "3/9  Installation Node 20 + pnpm + pm2"
# ----------------------------------------------------------------------------
if ! command -v node &>/dev/null || [[ "$(node -v | sed 's/v//;s/\..*//')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

corepack enable
corepack prepare pnpm@8.15.8 --activate

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

# ----------------------------------------------------------------------------
log "4/9  Utilisateur applicatif + clone du repo"
# ----------------------------------------------------------------------------
if ! id "$APP_USER" &>/dev/null; then
  useradd --system --create-home --shell /bin/bash "$APP_USER"
  usermod -aG docker "$APP_USER"
fi

mkdir -p "$INSTALL_DIR"
chown "$APP_USER":"$APP_USER" "$INSTALL_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  sudo -u "$APP_USER" git -C "$APP_DIR" pull --ff-only
fi

# ----------------------------------------------------------------------------
log "5/9  Génération des secrets + .env prod"
# ----------------------------------------------------------------------------
ENV_FILE="$APP_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  POSTGRES_PWD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
  REDIS_PWD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
  SESSION_SECRET=$(openssl rand -base64 48 | tr -d '\n')
  AES_KEY=$(openssl rand -hex 32)
  OTP_PEPPER=$(openssl rand -hex 32)

  cat >"$ENV_FILE" <<EOF
# ============================================================================
# ECOPYE production secrets — generated $(date -Iseconds)
# ============================================================================
NODE_ENV=production
API_PORT=3001
WEB_PORT=3000
API_URL=https://${API_DOMAIN}
WEB_URL=https://${WEB_DOMAIN}
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}/v1

# --- Database ---
POSTGRES_USER=ecopye
POSTGRES_PASSWORD=${POSTGRES_PWD}
POSTGRES_DB=ecopye
DATABASE_URL=postgresql://ecopye:${POSTGRES_PWD}@127.0.0.1:5432/ecopye?schema=public&connection_limit=20

# --- Redis ---
REDIS_PASSWORD=${REDIS_PWD}
REDIS_URL=redis://default:${REDIS_PWD}@127.0.0.1:6379

# --- Auth ---
JWT_ALGORITHM=RS256
JWT_PRIVATE_KEY_PATH=./secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt-public.pem
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
SESSION_SECRET=${SESSION_SECRET}
OTP_PEPPER=${OTP_PEPPER}

# --- Encryption ---
AES_GCM_KEY=${AES_KEY}

# --- Observability ---
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=

# --- 3rd parties (à remplir) ---
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
ONFIDO_API_TOKEN=
ONFIDO_WEBHOOK_TOKEN=
FCM_SERVER_KEY=
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=
S3_ENDPOINT=
S3_REGION=eu-west-3
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
SENTRY_DSN=
EOF

  chown "$APP_USER":"$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  log "  → .env généré avec secrets aléatoires. Édite-le pour Twilio/Onfido/FCM avant la vraie prod."
else
  log "  → .env déjà présent, non écrasé."
fi

# JWT RS256 keypair
mkdir -p "$APP_DIR/secrets"
if [[ ! -f "$APP_DIR/secrets/jwt-private.pem" ]]; then
  openssl genrsa -out "$APP_DIR/secrets/jwt-private.pem" 4096
  openssl rsa -in "$APP_DIR/secrets/jwt-private.pem" -pubout -out "$APP_DIR/secrets/jwt-public.pem"
  chmod 600 "$APP_DIR/secrets/jwt-private.pem"
  chmod 644 "$APP_DIR/secrets/jwt-public.pem"
fi
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/secrets"

# ----------------------------------------------------------------------------
log "6/9  Postgres + Redis via docker compose"
# ----------------------------------------------------------------------------
cd "$APP_DIR"
sudo -u "$APP_USER" env $(grep -v '^#' "$ENV_FILE" | xargs) \
  docker compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Attendre que Postgres soit prêt
for i in {1..30}; do
  if docker exec ecopye-postgres pg_isready -U ecopye &>/dev/null; then
    break
  fi
  sleep 2
done

# ----------------------------------------------------------------------------
log "7/9  Install deps, migrate, build, lancer PM2"
# ----------------------------------------------------------------------------
sudo -u "$APP_USER" bash <<EOF
set -euo pipefail
cd "$APP_DIR"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if [[ -f pnpm-lock.yaml ]]; then
  pnpm install --frozen-lockfile
else
  pnpm install --no-frozen-lockfile
fi
pnpm --filter @ecopye/database prisma generate
pnpm --filter @ecopye/database prisma migrate deploy
pnpm --filter @ecopye/web build

pm2 delete ecopye-api ecopye-web 2>/dev/null || true
pm2 start "pnpm --filter @ecopye/api start" --name ecopye-api --time --max-memory-restart 1G
pm2 start "pnpm --filter @ecopye/web start" --name ecopye-web --time --max-memory-restart 1G
pm2 save
EOF

# pm2 startup (root configure systemd pour $APP_USER)
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" || true

# ----------------------------------------------------------------------------
log "8/9  nginx reverse proxy + HTTPS Let's Encrypt"
# ----------------------------------------------------------------------------
cat >/etc/nginx/sites-available/ecopye-api.conf <<EOF
server {
  listen 80;
  server_name ${API_DOMAIN};

  client_max_body_size 20M;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 60s;
  }
}
EOF

cat >/etc/nginx/sites-available/ecopye-web.conf <<EOF
server {
  listen 80;
  server_name ${WEB_DOMAIN} www.${WEB_DOMAIN};

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
EOF

ln -sf /etc/nginx/sites-available/ecopye-api.conf /etc/nginx/sites-enabled/ecopye-api.conf
ln -sf /etc/nginx/sites-available/ecopye-web.conf /etc/nginx/sites-enabled/ecopye-web.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# Certbot — HTTPS auto
certbot --nginx --non-interactive --agree-tos --email "$ADMIN_EMAIL" \
  -d "$API_DOMAIN" \
  -d "$WEB_DOMAIN" -d "www.${WEB_DOMAIN}" \
  --redirect || err "Certbot a échoué — vérifie que les DNS pointent bien vers ce VPS."

# ----------------------------------------------------------------------------
log "9/9  Firewall + fail2ban"
# ----------------------------------------------------------------------------
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban

# ----------------------------------------------------------------------------
log "✅ Terminé"
# ----------------------------------------------------------------------------
cat <<EOF

ECOPYE est en ligne :
  API  : https://${API_DOMAIN}/v1/health
  Web  : https://${WEB_DOMAIN}

Commandes utiles :
  sudo -u ${APP_USER} pm2 status
  sudo -u ${APP_USER} pm2 logs ecopye-api
  sudo -u ${APP_USER} pm2 logs ecopye-web
  docker logs ecopye-postgres --tail 100
  docker logs ecopye-redis --tail 100

Pour redéployer après un push GitHub :
  cd ${APP_DIR}
  sudo -u ${APP_USER} git pull
  sudo -u ${APP_USER} pnpm install --frozen-lockfile
  sudo -u ${APP_USER} pnpm --filter @ecopye/database prisma migrate deploy
  sudo -u ${APP_USER} pnpm --filter @ecopye/web build
  sudo -u ${APP_USER} pm2 reload ecopye-api ecopye-web

Secrets à compléter dans ${ENV_FILE} :
  TWILIO_* (SMS OTP)
  ONFIDO_* (KYC)
  FCM_SERVER_KEY + APNS_* (push notif)
  S3_* (upload KYC documents)
  SENTRY_DSN (monitoring erreurs)
EOF

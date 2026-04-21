# Déploiement ECOPYE sur Hostinger VPS

## 1. Commander un VPS

Dans hpanel.hostinger.com → **VPS** → choisir :

| Plan | vCPU | RAM | Stockage | Prix indicatif | Recommandation |
|------|------|-----|----------|----------------|----------------|
| KVM 1 | 1 | 4 GB | 50 GB | ~5€/mois | Staging/demo uniquement |
| **KVM 2** | **2** | **8 GB** | **100 GB** | **~10€/mois** | **Prod MVP** |
| KVM 4 | 4 | 16 GB | 200 GB | ~18€/mois | Prod scalable |

OS : **Ubuntu 22.04 LTS** (pas 24.04 tant que certbot n'est pas stable dessus).

## 2. Pointer le DNS

Dans le registrar du domaine (Hostinger → **Domaines** → DNS) :

```
Type   Nom   Valeur             TTL
A      @     <ip.du.vps>        3600
A      www   <ip.du.vps>        3600
A      api   <ip.du.vps>        3600
```

Attendre la propagation (`nslookup api.ecopye.fr` doit retourner l'IP du VPS).

## 3. Lancer le script d'install

SSH sur le VPS en tant que root :

```bash
ssh root@<ip.du.vps>
```

Puis une seule commande :

```bash
curl -fsSL https://raw.githubusercontent.com/brindel2024-design/ECOPYE-AP/main/infrastructure/scripts/hostinger-vps-setup.sh \
  | bash -s -- api.ecopye.fr ecopye.fr admin@ecopye.fr
```

Remplace `api.ecopye.fr`, `ecopye.fr` et `admin@ecopye.fr` par tes vraies valeurs.

Le script fait, en ~10–15 minutes :

1. Update système + paquets (curl, git, ufw, fail2ban, nginx, certbot)
2. Install Docker + Docker Compose
3. Install Node 20 + pnpm + pm2
4. Crée un user système `ecopye`
5. Clone le repo dans `/opt/ecopye/ECOPYE-AP`
6. Génère un `.env` de prod avec secrets aléatoires solides (Postgres, Redis, JWT, AES-256, OTP pepper)
7. Génère la keypair JWT RS256 dans `secrets/`
8. Démarre Postgres 16 + Redis 7 via docker compose (bind 127.0.0.1 uniquement)
9. `prisma migrate deploy`, build API + Web
10. Lance API et Web via PM2 + persistance au reboot
11. nginx reverse proxy → certbot HTTPS Let's Encrypt
12. ufw : 22/80/443 only + fail2ban

## 4. Compléter les secrets tiers

Édite `/opt/ecopye/ECOPYE-AP/.env` pour remplir :

| Clé | Où l'obtenir |
|-----|--------------|
| `TWILIO_*` | console.twilio.com → Messaging → Services |
| `ONFIDO_API_TOKEN` | dashboard.onfido.com → Developers → API tokens |
| `FCM_SERVER_KEY` | console.firebase.google.com → Project settings → Cloud Messaging |
| `APNS_*` | developer.apple.com → Certificates → Keys |
| `S3_*` | AWS S3 / Scaleway / Wasabi (bucket chiffré SSE-S3 minimum) |
| `SENTRY_DSN` | sentry.io → Project → Client Keys |

Puis reload :

```bash
sudo -u ecopye pm2 reload ecopye-api
```

## 5. Redéployer après un git push

Un simple script à garder dans ton historique :

```bash
ssh root@<ip.du.vps> '
  cd /opt/ecopye/ECOPYE-AP &&
  sudo -u ecopye git pull &&
  sudo -u ecopye pnpm install --frozen-lockfile &&
  sudo -u ecopye pnpm --filter @ecopye/database prisma migrate deploy &&
  sudo -u ecopye pnpm --filter @ecopye/api build &&
  sudo -u ecopye pnpm --filter @ecopye/web build &&
  sudo -u ecopye pm2 reload ecopye-api ecopye-web
'
```

Plus tard : configurer un webhook GitHub ou une GitHub Action → SSH → deploy.

## 6. Vérifier que ça tourne

```bash
# Health API
curl https://api.ecopye.fr/v1/health

# Logs temps réel
sudo -u ecopye pm2 logs ecopye-api
sudo -u ecopye pm2 logs ecopye-web
docker logs ecopye-postgres --tail 50
docker logs ecopye-redis --tail 50

# Status global
sudo -u ecopye pm2 status
```

## 7. Backups Postgres (à faire dès J+1)

Ajouter un cron en root :

```bash
cat >/etc/cron.daily/ecopye-db-backup <<'EOF'
#!/bin/bash
set -e
BACKUP_DIR=/var/backups/ecopye
mkdir -p "$BACKUP_DIR"
docker exec ecopye-postgres pg_dump -U ecopye -d ecopye -Fc \
  >"$BACKUP_DIR/ecopye-$(date +%Y%m%d-%H%M%S).dump"
find "$BACKUP_DIR" -name 'ecopye-*.dump' -mtime +14 -delete
EOF
chmod +x /etc/cron.daily/ecopye-db-backup
```

Et synchroniser vers S3 / un VPS secondaire idéalement.

## 8. Sécurité au-delà du script

- [ ] Désactiver l'auth SSH par mot de passe (`PasswordAuthentication no` dans `/etc/ssh/sshd_config`)
- [ ] Ajouter une clé SSH publique pour root et `ecopye`
- [ ] Activer les mises à jour auto de sécurité : `apt install -y unattended-upgrades`
- [ ] Monitorer avec Uptime Kuma ou BetterStack sur `/v1/health`
- [ ] Régénérer tous les secrets tiers (Twilio, Onfido, JWT) avant de prendre les premiers vrais utilisateurs
- [ ] Scan externe : `testssl.sh https://api.ecopye.fr`

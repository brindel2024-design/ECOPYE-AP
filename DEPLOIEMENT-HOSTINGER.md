# Guide de déploiement EcoPye Pay sur Hostinger

## Prérequis Hostinger
- Plan **VPS KVM 2** minimum (2 vCPU, 8 Go RAM) — ~9€/mois
- OS : Ubuntu 22.04 LTS
- Nom de domaine pointé sur le VPS

---

## 1. Préparation du VPS

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin

# Installation Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation Nginx (reverse proxy)
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 2. Cloner et configurer le projet

```bash
git clone https://github.com/votre-repo/ecopye-pay.git
cd ecopye-pay

# Copier et éditer les variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Générer une clé JWT forte
openssl rand -base64 64
# Coller le résultat dans JWT_SECRET dans backend/.env

# Générer la clé de chiffrement faciale (AES-256 = 32 bytes = 64 hex)
openssl rand -hex 32
# Coller dans FACE_ENCRYPTION_KEY dans backend/.env
```

### Éditer `backend/.env` :
```env
NODE_ENV=production
DATABASE_URL="mysql://ecopye:MOTDEPASSE_FORT@localhost:3306/ecopye_pay"
JWT_SECRET=votre_jwt_secret_genere
FACE_ENCRYPTION_KEY=votre_cle_hex_64_chars
FRONTEND_URL=https://ecopye.fr
SMS_PROVIDER=infobip  # ou twilio
INFOBIP_BASE_URL=xxxxx.api.infobip.com
INFOBIP_API_KEY=votre_cle_infobip
```

### Éditer `frontend/.env` :
```env
NEXT_PUBLIC_API_URL=https://api.ecopye.fr
```

---

## 3. Déploiement avec Docker Compose

```bash
docker compose up -d --build

# Vérifier les logs
docker compose logs -f

# Migrer la base de données
docker compose exec backend npx prisma migrate deploy
```

---

## 4. Configuration Nginx (reverse proxy SSL)

```nginx
# /etc/nginx/sites-available/ecopye-api
server {
    server_name api.ecopye.fr;
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# /etc/nginx/sites-available/ecopye-app
server {
    server_name ecopye.fr www.ecopye.fr;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ecopye-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ecopye-app /etc/nginx/sites-enabled/

# SSL gratuit Let's Encrypt
sudo certbot --nginx -d ecopye.fr -d www.ecopye.fr -d api.ecopye.fr

sudo systemctl reload nginx
```

---

## 5. Modèles face-api.js

Télécharger les modèles TensorFlow.js et les placer dans `frontend/public/models/` :

```bash
cd frontend/public/models
# Télécharger depuis https://github.com/justadudewhohacks/face-api.js/tree/master/weights
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_recognition_model-weights_manifest.json
wget https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_recognition_model-shard1
```

---

## 6. Sécurité production

```bash
# Pare-feu UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban (protection brute force)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

---

## Architecture finale en production

```
Internet
    │
    ▼
Nginx (SSL/TLS)
    ├── ecopye.fr         → Next.js :3000 (PWA)
    └── api.ecopye.fr     → Express :4000 (API)
                                │
                            MySQL :3306
```

---

## Checklist avant lancement

- [ ] Variables d'environnement configurées
- [ ] JWT_SECRET et FACE_ENCRYPTION_KEY générés (forts)
- [ ] SSL activé sur les deux domaines
- [ ] Modèles face-api.js dans `public/models/`
- [ ] SMS provider configuré (Infobip recommandé pour l'Algérie)
- [ ] Compte Chargily Pay créé et clés API renseignées
- [ ] Autorisation GIE Monétique demandée (si opération directe)
- [ ] Backups MySQL automatisés activés

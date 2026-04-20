# Pousser ECOPYE-AP sur GitHub

Le repo local est prêt : git initialisé, commit initial fait, `.gitignore`
solide, aucun secret dans l'historique.

## Étapes (3 commandes)

Ouvre un terminal **Git Bash** dans `C:\Users\brindel2024\ecopye-v3\` puis :

```bash
# 1. Authentification (navigateur s'ouvre, choisir HTTPS)
gh auth login

# 2. Créer le repo public et pousser le commit initial
gh repo create ECOPYE-AP --public --source=. --remote=origin --push \
  --description "Plateforme de paiement mobile algérienne — P2P, QR marchand, factures, cagnottes"

# 3. Vérifier
gh repo view --web
```

## Alternative sans gh CLI

```bash
# 1. Crée le repo manuellement sur https://github.com/new
#    Nom: ECOPYE-AP · Visibilité: Public · Ne PAS cocher README/LICENSE/gitignore

# 2. Ajoute le remote et pousse (remplace <user> par ton nom GitHub)
git remote add origin https://github.com/<user>/ECOPYE-AP.git
git push -u origin main
```

## Ensuite — déploiement Hostinger

Hostinger Cloud (Node.js) ou VPS :

```bash
# Sur le serveur
git clone https://github.com/<user>/ECOPYE-AP.git
cd ECOPYE-AP
cp .env.example .env          # puis remplir les vrais secrets
pnpm install
pnpm --filter @ecopye/database prisma generate
pnpm --filter @ecopye/database prisma migrate deploy
pnpm --filter @ecopye/api build
pm2 start apps/api/dist/server.js --name ecopye-api
```

Web Next.js :

```bash
pnpm --filter @ecopye/web build
pm2 start "pnpm --filter @ecopye/web start" --name ecopye-web
```

## Vérifications sécurité

- [x] `.env` dans `.gitignore`
- [x] Pas de `*.pem` / `*.key` commit
- [x] Pas de clé API hardcodée
- [x] `SECURITY.md`, `LICENSE`, `CONTRIBUTING.md` présents
- [x] CI gitleaks active dans `.github/workflows/ci.yml`

Une fois poussé, **régénère tous les secrets** avant la production (JWT RS256,
clés chiffrement AES-256-GCM, tokens Twilio/Onfido).

# 🚀 Guide d'installation ECOPYE

## 1. Installer Node.js
Téléchargez et installez Node.js depuis : https://nodejs.org
Choisissez la version **LTS (20.x)** — cliquez sur le bouton vert.

## 2. Ouvrir un terminal dans le dossier ECOPYE
- Clic droit sur le dossier `ECOPYE`
- Sélectionner **"Ouvrir dans le terminal"**

## 3. Installer les dépendances
```bash
npm install
```

## 4. Initialiser la base de données
```bash
npx prisma db push
npx prisma db seed
```

## 5. Lancer l'application
```bash
npm run dev
```

## 6. Ouvrir dans le navigateur
👉 http://localhost:3000

---

## Compte de démonstration
| Téléphone | Mot de passe |
|-----------|--------------|
| +213555000001 | password123 |
| +213555000002 | password123 |

---

## Structure du projet
```
ECOPYE/
├── app/                  # Pages Next.js
│   ├── (auth)/           # Login, Register
│   ├── (dashboard)/      # Dashboard, Transfer, Pay, History, Profile
│   └── api/              # Routes API backend
├── components/           # Composants réutilisables
├── lib/                  # Utilitaires (db, auth, utils)
├── prisma/               # Schéma base de données
└── public/               # Fichiers statiques
```

## Fonctionnalités
- ✅ Portefeuille électronique en DZD
- ✅ Transfert d'argent entre utilisateurs
- ✅ Paiement marchands (Djezzy, Sonelgaz, etc.)
- ✅ Paiement par QR Code (simulé)
- ✅ Recharge via CIB / BaridiMob / Dahabia
- ✅ Historique complet des transactions
- ✅ Interface mobile-first (PWA installable)
- ✅ Sécurité JWT + bcrypt

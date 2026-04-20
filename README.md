# ECOPYE

Plateforme de paiement mobile algérienne — P2P, QR marchand, factures, cagnottes, transferts internationaux BEA.

## Stack

| Couche | Technologie |
|--------|-------------|
| Monorepo | Nx + pnpm |
| API | Fastify 4 · TypeScript strict · Prisma 5 · Zod |
| Auth | Argon2id · JWT RS256 · OTP SMS |
| DB | PostgreSQL 16 · Redis 7 |
| Web | Next.js 14 App Router · shadcn/ui · TanStack Query |
| Mobile | React Native 0.73 bare · React Navigation 6 · Reanimated |
| Infra | Docker · AWS ECS Fargate · Terraform · CloudFront |
| Observabilité | OpenTelemetry · Jaeger · Sentry · Pino |
| Tests | Jest · Playwright · Detox · k6 |

## Architecture

```
apps/
  web/              Next.js 14 (ecopye.fr)
  mobile/           React Native bare (iOS/Android)
  api/              Fastify API Gateway

packages/
  services/
    auth-service          Argon2id, JWT, OTP, refresh
    wallet-service        Soldes, plafonds, verrouillage optimiste
    transaction-service   Ledger double-entrée immuable
    kyc-service           Onfido, 3 niveaux, S3 chiffré
    payment-service       QR, factures, recharges mobile
    notification-service  Push (FCM/APNS), SMS, email
    merchant-service      Comptes pro, terminaux, settlement T+1
    agent-service         Réseau cash-in/cash-out
    compliance-service    Sanctions, vélocité, audit 10 ans
  shared/
    types · config · utils · constants · database (Prisma)
  ui/                     Composants shadcn partagés

infrastructure/
  docker/                 docker-compose dev
  terraform/              AWS IaC
  kubernetes/             manifestes (optionnel)
  scripts/                bootstrap, rotation de secrets

.github/workflows/        CI/CD (lint · test · build · deploy blue/green)
```

## Démarrage rapide

```bash
# 1. Dépendances
pnpm install

# 2. Stack locale (Postgres 16 + Redis 7 + MinIO + Mailhog + Jaeger)
pnpm docker:up

# 3. Secrets JWT (dev)
mkdir -p secrets
openssl genrsa -out secrets/jwt-private.pem 4096
openssl rsa -in secrets/jwt-private.pem -pubout -out secrets/jwt-public.pem

# 4. Env
cp .env.example .env

# 5. Schéma + seed
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 6. Tout le monde
pnpm dev
```

- API : http://localhost:3001/api/v1
- Web : http://localhost:3000
- Jaeger : http://localhost:16686
- MinIO console : http://localhost:9001
- Mailhog : http://localhost:8025

## Conformité

- **Loi 23-09** (Algérie) — protection des données et paiement électronique
- **RGPD** — pour les ressortissants UE
- **PCI-DSS SAQ-A** — aucun stockage de PAN / CVV
- **BEA** — mTLS + OAuth 2.0 pour transferts internationaux
- **Audit trail** — 10 ans minimum, append-only

## Tests

```bash
pnpm test                 # Unit (Jest)
pnpm test:e2e             # E2E web (Playwright)
pnpm --filter mobile e2e  # E2E mobile (Detox)
pnpm --filter api load    # Charge (k6)
```

Cible de couverture : **≥ 80 %** sur tout code nouveau.
Cible de performance API : **P99 < 300 ms**, **5000 TPS** soutenus.

## Statut du projet

> **⚠️ Work-in-progress** — ce dépôt contient le squelette complet (schéma
> Prisma, services, API gateway, apps web + mobile, CI/CD). Les intégrations
> tierces réelles (Onfido, Twilio, BEA, FCM) sont stubées côté providers et
> doivent être câblées via les variables d'environnement décrites dans
> [`.env.example`](.env.example).

## Sécurité

Pour signaler une vulnérabilité, voir [SECURITY.md](SECURITY.md).
Ne pas ouvrir d'issue publique pour les failles.

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md) et [CLAUDE.md](CLAUDE.md) pour les
règles strictes (TDD, double-entrée, idempotency, audit).

## Licence

[MIT](LICENSE) — © 2026 ECOPYE.

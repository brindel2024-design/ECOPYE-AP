# Contribuer à ECOPYE

Merci de votre intérêt ! Ce projet est une plateforme de paiement — la rigueur
sur la sécurité, la conformité et la clarté du code est non négociable.

## Prérequis

- Node.js 20.11+
- pnpm 8.15+
- Docker (Postgres 16 / Redis 7 via `docker compose`)

```bash
pnpm install
cp .env.example .env
docker compose -f infrastructure/docker/docker-compose.yml up -d
pnpm --filter @ecopye/database prisma migrate dev
pnpm --filter @ecopye/api dev
```

## Workflow

1. **Créer une branche** : `feat/<domaine>-<résumé>` ou `fix/<domaine>-<résumé>`
2. **Tests d'abord** (TDD) — couverture minimum 80 %
3. **Commits conventionnels** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `ci:`
4. **PR** avec la checklist du template remplie
5. **Revue** — au moins 1 approbation, 0 conflit, CI verte

## Règles dures

- Toute mutation de solde passe par `writeBalancedTransfer`
- Toute mutation financière exige un `Idempotency-Key`
- Les plafonds KYC sont appliqués via `assertWithinLimits`
- Les montants sont des `BigInt` en centimes, jamais des flottants
- Les actions admin / KYC / wallet sont tracées via `AuditLog`
- Zod à toutes les bornes (body, query, params)

## Style

- TypeScript strict partout
- Fichiers < 800 lignes, fonctions < 50 lignes
- Pas de `console.log` en code applicatif — utiliser `req.log` (pino)
- Pas de `any` implicite

## Tests

```bash
pnpm -r test           # tous les packages
pnpm --filter @ecopye/auth-service test
```

## Signaler une faille

Voir [SECURITY.md](SECURITY.md).

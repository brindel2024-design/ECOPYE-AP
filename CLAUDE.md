# CLAUDE.md — Gouvernance IA pour ECOPYE

> Instructions strictes pour toute contribution assistée par IA sur ce repo.
> Référence : Spec ECOPYE §11 « Instructions spéciales pour l'IA ».

## 1. Principes non négociables

1. **Sécurité d'abord.** Tout code touchant à l'authentification, aux paiements,
   au KYC, ou aux données personnelles doit être revu par `security-reviewer`
   avant merge.
2. **Idempotence systématique.** Chaque endpoint POST/PUT qui modifie un état
   monétaire DOIT accepter et valider un header `Idempotency-Key`.
3. **Argent en entier.** Toutes les sommes sont en **centimes** (`BigInt`).
   Jamais de `number`/`float` pour de la monnaie. Jamais d'arithmétique
   flottante.
4. **Ledger immuable.** `Transaction` et `LedgerEntry` sont append-only. Les
   changements d'état passent par `TransactionLog`. Aucun `UPDATE` autorisé.
5. **Envelope API unique.** Toute réponse suit
   `{ success, data, error: { code, message, details }, meta: { timestamp, requestId, pagination } }`.
6. **Double-entrée équilibrée.** Toute transaction produit au moins deux
   `LedgerEntry` dont la somme signée est zéro.
7. **Soft delete partout sauf ledger.** `deletedAt` sur les entités
   fonctionnelles ; les transactions et entrées de ledger ne se suppriment
   jamais.

## 2. Stack imposée

- **Backend** : Fastify 4 + TypeScript strict + Prisma 5 + Zod
- **Auth** : Argon2id (pas bcrypt), JWT RS256 (pas HS256)
- **Chiffrement** : AES-256-GCM, KMS en prod
- **DB** : PostgreSQL 16, Redis 7
- **Frontend** : Next.js 14 App Router + shadcn/ui
- **Mobile** : React Native 0.73+ bare (pas Expo managed)
- **Monorepo** : Nx + pnpm workspaces
- **Tests** : Jest (unit), Playwright (web E2E), Detox (mobile), k6 (charge)
- **Observabilité** : OpenTelemetry, logs JSON structurés, Sentry

## 3. Règles par domaine

### Auth & sessions
- PIN 6 chiffres minimum, hashé Argon2id (m=64MB, t=3, p=4)
- JWT access 15 min, refresh 30 j, rotation systématique
- `deviceFingerprint` obligatoire sur login/register
- OTP : 6 chiffres, TTL 5 min, 5 tentatives max, rate-limit 3/min/phone
- Jamais logger un PIN, OTP, token, clé privée, ou PII en clair

### Transactions
- Statuts : `PENDING → AUTHORIZED → PROCESSING → COMPLETED | FAILED | REVERSED`
- Un `Idempotency-Key` rejoue la même réponse pendant 24h
- Les plafonds (daily/monthly) sont vérifiés dans une transaction DB avec
  verrouillage optimiste (`version`)
- Tout refus doit retourner un code métier stable (`INSUFFICIENT_FUNDS`,
  `DAILY_LIMIT_EXCEEDED`, `KYC_INSUFFICIENT`, `SANCTIONED`, ...)

### KYC
- Niveaux : `LEVEL_0` (read-only) → `LEVEL_1` (phone+basic, 10k DZD)
  → `LEVEL_2` (ID+selfie, 200k) → `LEVEL_3` (full+proof, 1M+)
- Pas de téléversement documentaire en base : S3 chiffré + checksum en DB
- Webhook Onfido signé obligatoirement vérifié

### Compliance
- Screening sanctions (OFAC/UN/EU) sur toute transaction ≥ seuil ou
  internationale
- Règles de vélocité, smurfing, et patterns suspects en `compliance-service`
- Audit trail 10 ans minimum (Loi 23-09)

## 4. Workflow de contribution

1. **Plan** (`planner` agent) avant tout changement multi-fichier
2. **TDD** (`tdd-guide` agent) : test rouge → impl → vert → refactor
3. **Review** (`code-reviewer` + `security-reviewer`) avant merge
4. **Couverture ≥ 80 %** sur tout nouveau code
5. **Conventional commits** : `feat:`, `fix:`, `refactor:`, `chore:`, etc.

## 5. Interdictions

- ❌ `console.log` en prod (utiliser le logger Pino)
- ❌ Secrets hardcodés — tout via `.env` / KMS
- ❌ `any` en TypeScript sauf `// eslint-disable-next-line` justifié
- ❌ Désactiver la rate-limit, CORS, ou CSP « pour tester »
- ❌ Exécuter `prisma migrate reset` sur une base non-dev
- ❌ `git push --force` sur `main`
- ❌ Stocker PAN, CVV, ou numéro de compte bancaire complet (PCI-DSS)

## 6. Contacts

- **Product Owner** : Riad SayaH
- **Domaine** : ecopye.fr
- **Juridiction** : Algérie (Loi 23-09, RGPD applicable)

---

Toute contribution qui dévie de ces règles doit être **explicitement** justifiée
dans le PR et approuvée manuellement.

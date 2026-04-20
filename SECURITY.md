# Politique de sécurité

## Signaler une vulnérabilité

Merci de **ne pas ouvrir d'issue publique** pour les vulnérabilités.

Contactez-nous en privé via GitHub Security Advisories (onglet « Security » du
dépôt), ou par email à `security@ecopye.fr`.

Nous accusons réception sous 72 h et fournissons un correctif (ou un plan) sous
14 jours pour les failles critiques.

## Périmètre concerné

- API Gateway Fastify (`apps/api`)
- Services (auth, wallet, transaction, kyc, compliance, merchant, payment, agent, notification)
- Apps client (web Next.js, mobile React Native)
- Schéma Prisma et migrations

## Hors périmètre

- Dépendances tierces (ouvrir un ticket chez l'upstream)
- Ingénierie sociale ou attaques physiques
- Attaques DoS par volume

## Bonnes pratiques dépôt

- Jamais de secret en clair dans le code ou l'historique
- Tous les `.env` sont `.gitignore`
- Les mutations financières exigent `Idempotency-Key`
- Les soldes ne bougent qu'à travers `writeBalancedTransfer` (double-entrée)
- Tout accès admin/KYC est audité via `AuditLog`

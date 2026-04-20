# Pull Request

## Résumé
<!-- Qu'est-ce qui change et pourquoi (1-3 phrases). -->

## Type
- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] perf
- [ ] docs
- [ ] test
- [ ] chore

## Impact domaines
- [ ] Auth / KYC
- [ ] Wallet / Ledger
- [ ] Transactions (P2P / QR / Agent)
- [ ] Marchand
- [ ] Cagnotte / Factures
- [ ] Compliance / Audit
- [ ] API Gateway
- [ ] Web / Mobile
- [ ] Infra / CI

## Checklist sécurité & conformité
- [ ] Aucun secret en clair (clés, tokens, PEM)
- [ ] Validation Zod aux bornes
- [ ] Idempotency-Key exigée sur les mutations financières
- [ ] `writeBalancedTransfer` utilisé pour tout mouvement de solde
- [ ] Plafonds KYC appliqués (`assertWithinLimits`)
- [ ] Audit log écrit pour les actions sensibles
- [ ] Aucune rupture du contrat d'enveloppe API

## Tests
- [ ] Unitaires ajoutés / mis à jour
- [ ] Intégration (base de données réelle)
- [ ] Couverture ≥ 80 %

## Plan de vérification
<!-- Étapes manuelles / scénarios à tester en revue. -->

## Rollback
<!-- Comment revenir en arrière si l'incident se déclenche en prod. -->

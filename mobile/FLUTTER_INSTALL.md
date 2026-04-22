# 📱 ECOPYE — Application Flutter (Android/iOS)

## Installer Flutter

1. Téléchargez Flutter depuis : https://flutter.dev/docs/get-started/install/windows
2. Extrayez dans `C:\flutter`
3. Ajoutez `C:\flutter\bin` à votre PATH Windows
4. Vérifiez : `flutter doctor`

## Lancer l'app mobile

```bash
cd C:\Users\brindel2024\ECOPYE\mobile
flutter pub get
flutter run
```

## Prérequis

- Android Studio installé (pour l'émulateur Android)
- Ou connectez un vrai téléphone Android en mode développeur

## Important — URL de l'API

Dans `lib/services/api_service.dart`, l'URL par défaut est :
- `http://10.0.2.2:3000` → Pour l'émulateur Android (pointe vers localhost)
- `http://localhost:3000` → Pour l'émulateur iOS

Assurez-vous que l'app web ECOPYE tourne (`npm run dev`) avant de lancer Flutter.

## Structure

```
mobile/
├── lib/
│   ├── main.dart              # Point d'entrée
│   ├── theme/app_theme.dart   # Couleurs & styles
│   ├── screens/
│   │   ├── splash_screen.dart # Écran de démarrage
│   │   ├── login_screen.dart  # Connexion
│   │   ├── home_screen.dart   # Tableau de bord
│   │   ├── transfer_screen.dart
│   │   ├── pay_screen.dart    # Paiement + QR Code
│   │   ├── history_screen.dart
│   │   └── profile_screen.dart
│   ├── widgets/
│   │   ├── wallet_card.dart
│   │   ├── transaction_tile.dart
│   │   └── quick_action_btn.dart
│   └── services/
│       ├── api_service.dart   # Appels API
│       ├── auth_provider.dart
│       └── language_provider.dart
└── pubspec.yaml
```

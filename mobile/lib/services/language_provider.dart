import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  final SharedPreferences _prefs;
  String _locale = 'fr';

  LanguageProvider(this._prefs) {
    _locale = _prefs.getString('locale') ?? 'fr';
  }

  String get locale => _locale;
  bool get isArabic => _locale == 'ar';

  void setLocale(String locale) {
    _locale = locale;
    _prefs.setString('locale', locale);
    notifyListeners();
  }

  String t(String key) => _translations[_locale]?[key] ?? _translations['fr']?[key] ?? key;

  static const _translations = {
    'fr': {
      'app_name': 'ECOPYE',
      'balance': 'Solde disponible',
      'send': 'Envoyer',
      'scan': 'Scanner',
      'topup': 'Recharger',
      'bills': 'Factures',
      'history': 'Historique',
      'profile': 'Profil',
      'home': 'Accueil',
      'transfer': 'Transfert',
      'pay': 'Payer',
      'recent': 'Transactions récentes',
      'phone': 'Numéro de téléphone',
      'password': 'Mot de passe',
      'login': 'Se connecter',
      'amount': 'Montant',
      'confirm': 'Confirmer',
      'cancel': 'Annuler',
      'success': 'Succès',
      'error': 'Erreur',
      'enter_pin': 'Entrez votre PIN',
      'logout': 'Déconnexion',
      'special_offer': 'Offre spéciale',
      'free_transfer': '0% de frais ce mois-ci !',
      'merchant': 'Marchand',
      'qr': 'QR Code',
      'recipient': 'Bénéficiaire',
    },
    'ar': {
      'app_name': 'إيكوباي',
      'balance': 'الرصيد المتاح',
      'send': 'إرسال',
      'scan': 'مسح',
      'topup': 'شحن',
      'bills': 'فواتير',
      'history': 'السجل',
      'profile': 'الملف',
      'home': 'الرئيسية',
      'transfer': 'تحويل',
      'pay': 'دفع',
      'recent': 'آخر المعاملات',
      'phone': 'رقم الهاتف',
      'password': 'كلمة المرور',
      'login': 'تسجيل الدخول',
      'amount': 'المبلغ',
      'confirm': 'تأكيد',
      'cancel': 'إلغاء',
      'success': 'نجاح',
      'error': 'خطأ',
      'enter_pin': 'أدخل رمز PIN',
      'logout': 'تسجيل الخروج',
      'special_offer': 'عرض خاص',
      'free_transfer': 'تحويل مجاني هذا الشهر!',
      'merchant': 'تاجر',
      'qr': 'رمز QR',
      'recipient': 'المستفيد',
    },
  };
}

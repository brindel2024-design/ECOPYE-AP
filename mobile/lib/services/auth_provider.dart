import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  final SharedPreferences _prefs;
  Map<String, dynamic>? _user;
  String? _token;
  bool _loading = false;

  AuthProvider(this._prefs) {
    _loadFromStorage();
  }

  bool get isAuthenticated => _token != null;
  bool get loading => _loading;
  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  double get balance => (_user?['wallet']?['balance'] ?? 0).toDouble();
  String get fullName => _user?['fullName'] ?? '';
  String get phone => _user?['phone'] ?? '';

  void _loadFromStorage() {
    final token = _prefs.getString('auth_token');
    final userData = _prefs.getString('user_data');
    if (token != null && userData != null) {
      _token = token;
      _user = jsonDecode(userData);
    }
  }

  Future<Map<String, dynamic>> login(String phone, String password) async {
    _loading = true;
    notifyListeners();
    try {
      final api = ApiService();
      final result = await api.login(phone, password);
      if (result['success'] == true) {
        _token = result['token'];
        _user  = result['user'];
        await _prefs.setString('auth_token', _token!);
        await _prefs.setString('user_data', jsonEncode(_user));
      }
      return result;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _token = null;
    _user  = null;
    await _prefs.remove('auth_token');
    await _prefs.remove('user_data');
    notifyListeners();
  }

  Future<void> refreshBalance() async {
    if (_token == null) return;
    try {
      final api = ApiService(token: _token);
      final wallet = await api.getWallet();
      if (_user != null) {
        _user!['wallet'] = wallet;
        await _prefs.setString('user_data', jsonEncode(_user));
        notifyListeners();
      }
    } catch (_) {}
  }
}

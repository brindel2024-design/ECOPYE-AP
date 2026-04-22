import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Changez cette URL en production
  static const String baseUrl = 'http://10.0.2.2:3000'; // Android emulator → localhost
  // static const String baseUrl = 'http://localhost:3000'; // iOS simulator

  final String? token;
  ApiService({this.token});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  // Connexion
  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/signin'),
      headers: _headers,
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    return jsonDecode(res.body);
  }

  // Solde du portefeuille
  Future<Map<String, dynamic>> getWallet() async {
    final res = await http.get(Uri.parse('$baseUrl/api/wallet'), headers: _headers);
    return jsonDecode(res.body);
  }

  // Transactions
  Future<List<dynamic>> getTransactions() async {
    final res = await http.get(Uri.parse('$baseUrl/api/transactions'), headers: _headers);
    final data = jsonDecode(res.body);
    return data['transactions'] ?? [];
  }

  // Rechercher un utilisateur par téléphone
  Future<Map<String, dynamic>> lookupUser(String phone) async {
    final res = await http.get(
      Uri.parse('$baseUrl/api/users/lookup?phone=${Uri.encodeComponent(phone)}'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    throw Exception(jsonDecode(res.body)['error'] ?? 'Utilisateur introuvable');
  }

  // Transfert d'argent
  Future<Map<String, dynamic>> transfer({
    required String recipientPhone,
    required double amount,
    String? description,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/transfer'),
      headers: _headers,
      body: jsonEncode({'recipientPhone': recipientPhone, 'amount': amount, 'description': description}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(data['error'] ?? 'Transfert échoué');
    return data;
  }

  // Paiement marchand
  Future<Map<String, dynamic>> payment({
    required String merchantName,
    String? merchantId,
    required double amount,
    String? description,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/payment'),
      headers: _headers,
      body: jsonEncode({'merchantName': merchantName, 'merchantId': merchantId, 'amount': amount, 'description': description}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(data['error'] ?? 'Paiement échoué');
    return data;
  }

  // Recharge portefeuille
  Future<Map<String, dynamic>> topup(double amount, String method) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/wallet'),
      headers: _headers,
      body: jsonEncode({'amount': amount, 'method': method}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode != 200) throw Exception(data['error'] ?? 'Recharge échouée');
    return data;
  }

  // Vérifier PIN
  Future<bool> verifyPin(String pin) async {
    final res = await http.put(
      Uri.parse('$baseUrl/api/pin'),
      headers: _headers,
      body: jsonEncode({'pin': pin}),
    );
    return res.statusCode == 200;
  }
}

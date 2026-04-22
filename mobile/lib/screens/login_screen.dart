import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword  = false;
  String _error = '';

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() => _error = '');
    final auth = context.read<AuthProvider>();
    final result = await auth.login(_phoneCtrl.text.trim(), _passwordCtrl.text);
    if (!mounted) return;

    if (result['success'] == true || auth.isAuthenticated) {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const HomeScreen()));
    } else {
      setState(() => _error = result['error'] ?? 'Numéro ou mot de passe incorrect');
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang    = context.watch<LanguageProvider>();
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Logo
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.gradientStart, AppColors.gradientEnd]),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: const Icon(Icons.account_balance_wallet, color: Colors.white, size: 40),
              ),
              const SizedBox(height: 24),
              const Text('ECOPYE', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: 2)),
              const SizedBox(height: 6),
              Text(lang.t('balance'), style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 40),

              // Card formulaire
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 20, offset: const Offset(0, 4))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Téléphone
                    TextField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: lang.t('phone'),
                        prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.primary),
                        hintText: '+213 555 000 000',
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Mot de passe
                    TextField(
                      controller: _passwordCtrl,
                      obscureText: !_showPassword,
                      decoration: InputDecoration(
                        labelText: lang.t('password'),
                        prefixIcon: const Icon(Icons.lock_outline, color: AppColors.primary),
                        suffixIcon: IconButton(
                          icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, color: AppColors.textHint),
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                        ),
                      ),
                    ),

                    if (_error.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_error, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // Bouton connexion
                    ElevatedButton(
                      onPressed: loading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(lang.t('login'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                    ),
                  ],
                ),
              ),

              // Compte de démo
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('💡 Compte démo', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                    SizedBox(height: 4),
                    Text('+213555000001', style: TextStyle(color: Color(0xFF78350F), fontSize: 13)),
                    Text('password123', style: TextStyle(color: Color(0xFF78350F), fontSize: 13)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

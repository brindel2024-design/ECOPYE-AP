import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../services/language_provider.dart';
import '../theme/app_theme.dart';

class TransferScreen extends StatefulWidget {
  const TransferScreen({super.key});
  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen> {
  final _phoneCtrl  = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _descCtrl   = TextEditingController();

  bool _loading = false;
  String _error = '';
  Map<String, dynamic>? _recipient;
  bool _success = false;
  String _txRef = '';

  Future<void> _lookup() async {
    setState(() { _loading = true; _error = ''; _recipient = null; });
    try {
      final auth = context.read<AuthProvider>();
      final api  = ApiService(token: auth.token);
      final user = await api.lookupUser(_phoneCtrl.text.trim());
      setState(() => _recipient = user);
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _transfer() async {
    final amount = double.tryParse(_amountCtrl.text);
    if (amount == null || amount < 100) {
      setState(() => _error = 'Montant minimum: 100 DZD');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      final auth = context.read<AuthProvider>();
      final api  = ApiService(token: auth.token);
      final result = await api.transfer(
        recipientPhone: _phoneCtrl.text.trim(),
        amount: amount,
        description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      );
      await auth.refreshBalance();
      setState(() { _success = true; _txRef = result['reference'] ?? ''; });
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _reset() {
    setState(() {
      _success = false; _recipient = null; _error = '';
      _phoneCtrl.clear(); _amountCtrl.clear(); _descCtrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('transfer'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: _success ? _buildSuccess(lang) : _buildForm(lang),
        ),
      ),
    );
  }

  Widget _buildForm(LanguageProvider lang) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Champ téléphone
        TextField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          decoration: InputDecoration(
            labelText: lang.t('recipient'),
            prefixIcon: const Icon(Icons.phone_outlined),
            hintText: '+213 555 000 000',
          ),
        ),
        const SizedBox(height: 12),
        ElevatedButton(
          onPressed: _loading ? null : _lookup,
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.secondary),
          child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Rechercher'),
        ),

        // Destinataire trouvé
        if (_recipient != null) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.05),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                CircleAvatar(backgroundColor: AppColors.primary, child: Text((_recipient!['fullName'] as String).substring(0, 1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(_recipient!['fullName'], style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(_recipient!['phone'], style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  const Text('✓ Compte ECOPYE vérifié', style: TextStyle(color: AppColors.success, fontSize: 11)),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _amountCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            decoration: const InputDecoration(labelText: 'Montant (DZD)', hintText: '0'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Motif (optionnel)')),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loading ? null : _transfer,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(lang.t('confirm')),
          ),
        ],

        if (_error.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.error.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Text(_error, style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ],
    );
  }

  Widget _buildSuccess(LanguageProvider lang) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 40),
        Container(
          width: 90, height: 90,
          decoration: BoxDecoration(color: AppColors.success.withOpacity(0.1), shape: BoxShape.circle),
          child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 52),
        ),
        const SizedBox(height: 24),
        Text(lang.t('success'), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Text('Transfert envoyé à ${_recipient?['fullName'] ?? ''}',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 15), textAlign: TextAlign.center),
        if (_txRef.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text('Réf: $_txRef', style: const TextStyle(color: AppColors.textHint, fontSize: 12, fontFamily: 'monospace')),
        ],
        const SizedBox(height: 32),
        ElevatedButton(onPressed: _reset, child: const Text('Nouveau transfert')),
      ],
    );
  }
}
